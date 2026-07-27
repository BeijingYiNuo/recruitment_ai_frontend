import { ref } from 'vue'

type TtsStatus = 'idle' | 'connecting' | 'connected' | 'speaking' | 'error'

export function useTts() {
  const enabled = ref(true)       // TTS 总开关（由 config 控制初始值）
  const status = ref<TtsStatus>('idle')
  const speaking = ref(false)     // 是否正在播报
  const volume = ref(0.8)         // 音量 0-1

  let ws: WebSocket | null = null
  let audioContext: AudioContext | null = null
  let gainNode: GainNode | null = null
  let currentSourceNode: AudioBufferSourceNode | null = null

  // ---- 文本聚合 ----
  let textBuffer = ''
  let aggregationTimer: ReturnType<typeof setTimeout> | null = null
  const SENTENCE_END = /[。！？\n.!?]/
  const AGGREGATION_TIMEOUT = 500 // ms

  // ---- 句子队列（等待发送到 TTS WS）----
  let sentenceQueue: string[] = []
  let isSynthesizing = false

  // ---- 音频播放队列 ----
  const audioBufferQueue: AudioBuffer[] = []
  let isPlaying = false

  // ---- Session 信息 ----
  let currentSessionId = ''
  let currentRoundId = ''

  // ==================== 文本聚合 ====================

  /**
   * 将 LLM 流式文本块送入聚合器。
   * 聚合完成后（标点断句 或 超时），送入句子队列等待合成。
   */
  function feedText(chunk: string) {
    if (!enabled.value || !ws || ws.readyState !== WebSocket.OPEN) return
    textBuffer += chunk

    // 检查是否有句子结束标点
    const match = textBuffer.match(SENTENCE_END)
    if (match) {
      const endIndex = match.index! + 1
      const sentence = textBuffer.substring(0, endIndex).trim()
      textBuffer = textBuffer.substring(endIndex)

      if (sentence.length >= 2) {
        enqueueSentence(sentence)
      }
    }

    resetAggregationTimer()
  }

  function resetAggregationTimer() {
    if (aggregationTimer) clearTimeout(aggregationTimer)
    aggregationTimer = setTimeout(() => {
      if (textBuffer.trim().length >= 2) {
        enqueueSentence(textBuffer.trim())
        textBuffer = ''
      }
    }, AGGREGATION_TIMEOUT)
  }

  // ==================== 句子队列 ====================

  function enqueueSentence(sentence: string) {
    sentenceQueue.push(sentence)
    processSentenceQueue()
  }

  function processSentenceQueue() {
    if (isSynthesizing || sentenceQueue.length === 0 || !ws || ws.readyState !== WebSocket.OPEN) return

    isSynthesizing = true
    const sentence = sentenceQueue.shift()!
    ws.send(JSON.stringify({ type: 'text', text: sentence }))
  }

  // ==================== WebSocket 连接管理 ====================

  function connect(sessionId: string, roundId: string) {
    if (!enabled.value) return

    // 关闭旧连接（防止重复调用）
    if (ws) {
      ws.onclose = null
      ws.close()
      ws = null
    }

    currentSessionId = sessionId
    currentRoundId = roundId

    const token = localStorage.getItem('token')
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${wsProtocol}//${window.location.host}/api/tts/stream/${sessionId}/${roundId}?token=${token}`

    status.value = 'connecting'
    ws = new WebSocket(url)
    ws.binaryType = 'arraybuffer'

    ws.onopen = () => {
      status.value = 'connected'
      ws!.send(JSON.stringify({ type: 'start' }))
    }

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        // 二进制 PCM 音频数据
        playPcmData(new Uint8Array(event.data))
      } else {
        try {
          const msg = JSON.parse(event.data)
          handleControlMessage(msg)
        } catch (e) {
          console.warn('[TTS] 消息解析失败:', event.data)
        }
      }
    }

    ws.onclose = () => {
      status.value = 'idle'
      speaking.value = false
      ws = null
    }

    ws.onerror = () => {
      status.value = 'error'
      console.error('[TTS] WebSocket 错误')
    }
  }

  function handleControlMessage(msg: any) {
    switch (msg.type) {
      case 'started':
        status.value = 'connected'
        break

      case 'audio_start':
        // TTS 开始合成
        status.value = 'speaking'
        break

      case 'audio_end':
        // 这一句合成结束 → 处理下一句
        isSynthesizing = false
        processSentenceQueue()
        break

      case 'error':
        status.value = 'error'
        console.error('[TTS] 错误:', msg.message)
        // 错误时释放合成锁，继续处理下一句
        isSynthesizing = false
        processSentenceQueue()
        break

      case 'stopped':
        status.value = 'idle'
        speaking.value = false
        break
    }
  }

  // ==================== 音频播放（Web Audio API）====================

  async function initAudioContext() {
    if (!audioContext) {
      audioContext = new AudioContext({ sampleRate: 24000 })
      gainNode = audioContext.createGain()
      gainNode.gain.value = volume.value
      gainNode.connect(audioContext.destination)
    }
    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }
  }

  async function playPcmData(pcmData: Uint8Array) {
    try {
      await initAudioContext()

      // PCM Int16 → Float32
      const pcmInt16 = new Int16Array(pcmData.buffer, pcmData.byteOffset, pcmData.byteLength / 2)
      const floatData = new Float32Array(pcmInt16.length)
      for (let i = 0; i < pcmInt16.length; i++) {
        floatData[i] = pcmInt16[i] / 32768.0
      }

      const buffer = audioContext!.createBuffer(1, floatData.length, audioContext!.sampleRate)
      buffer.getChannelData(0).set(floatData)

      audioBufferQueue.push(buffer)
      playNextInQueue()
    } catch (e) {
      console.error('[TTS] 播放 PCM 失败:', e)
    }
  }

  function playNextInQueue() {
    if (isPlaying || audioBufferQueue.length === 0 || !audioContext || !gainNode) {
      if (audioBufferQueue.length === 0 && !isSynthesizing && sentenceQueue.length === 0) {
        speaking.value = false
      }
      return
    }

    isPlaying = true
    speaking.value = true

    const buffer = audioBufferQueue.shift()!
    const source = audioContext.createBufferSource()
    source.buffer = buffer
    source.connect(gainNode!)
    currentSourceNode = source

    source.onended = () => {
      isPlaying = false
      currentSourceNode = null
      playNextInQueue()
    }

    source.start(0)
  }

  // ==================== 对外接口 ====================

  /** 开启 TTS（跟随 ASR 启动） */
  function start(sessionId: string, roundId: string) {
    enabled.value = true
    connect(sessionId, roundId)
  }

  /** 停止 TTS（跟随 ASR 停止，不清除播放中的音频，播完即止） */
  function stop() {
    enabled.value = false
    if (ws) {
      ws.send(JSON.stringify({ type: 'stop' }))
      ws.close()
      ws = null
    }
    // 不再接收新的文本，但已有队列继续播放
    isSynthesizing = false
    sentenceQueue = []
    clearAggregationBuffer()
    status.value = 'idle'
  }

  /** 结束面试 — 立即打断所有播放 */
  function terminate() {
    enabled.value = false

    // 清除所有队列
    clearAggregationBuffer()
    sentenceQueue = []
    audioBufferQueue.length = 0
    isSynthesizing = false
    isPlaying = false

    // 停止当前播放
    stopCurrentAudio()

    // 关闭 WS
    if (ws) {
      ws.send(JSON.stringify({ type: 'stop' }))
      ws.close()
      ws = null
    }

    status.value = 'idle'
    speaking.value = false
  }

  /** 切换面试阶段 — 丢弃当前聚合的碎片文本，已有队列继续播放 */
  function onStageChange() {
    // 不清除 sentenceQueue / audioBufferQueue（继续播完当前阶段的内容）
    // 但丢弃当前未聚合完成的碎片文本
    clearAggregationBuffer()
  }

  /** 设置启用/禁用 */
  function setEnabled(val: boolean) {
    enabled.value = val
    if (!val) {
      // 关闭时：停止播放、清空队列，但保持 WS 连接可恢复
      clearAggregationBuffer()
      sentenceQueue = []
      audioBufferQueue.length = 0
      stopCurrentAudio()
      isSynthesizing = false
      isPlaying = false
      speaking.value = false
    }
  }

  /** 设置音量 */
  function setVolume(v: number) {
    volume.value = v
    if (gainNode) {
      gainNode.gain.value = v
    }
  }

  /** 清理资源（组件卸载时） */
  function dispose() {
    terminate()
    if (audioContext) {
      audioContext.close()
      audioContext = null
      gainNode = null
    }
  }

  // ==================== 内部辅助 ====================

  function clearAggregationBuffer() {
    textBuffer = ''
    if (aggregationTimer) {
      clearTimeout(aggregationTimer)
      aggregationTimer = null
    }
  }

  function stopCurrentAudio() {
    if (currentSourceNode) {
      try {
        currentSourceNode.stop()
      } catch (_) {}
      currentSourceNode = null
    }
  }

  return {
    // 状态
    enabled,
    status,
    speaking,
    volume,

    // 方法
    start,
    stop,
    terminate,
    onStageChange,
    feedText,
    setEnabled,
    setVolume,
    dispose,
  }
}

/**
 * 实时音频采集：把浏览器麦克风转换为 PCM16 (16000Hz 单声道)，
 * 按 480 采样点（960 字节，30ms）分块回调，供 AI 面试 WebSocket 上行。
 * 不依赖旧 TTS / ASR 管线。
 */

const CHUNK_SAMPLES = 480 // 30ms @ 16kHz

function convertFloat32ToInt16(buffer: Float32Array): ArrayBuffer {
  const length = buffer.length
  const buf = new Int16Array(length)
  for (let i = 0; i < length; i++) {
    const s = Math.max(-1, Math.min(1, buffer[i]))
    buf[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return buf.buffer
}

export type AudioChunkHandler = (pcm: ArrayBuffer) => void

export function useRealtimeAudioCapture() {
  let mediaStream: MediaStream | null = null
  let audioContext: AudioContext | null = null
  let source: MediaStreamAudioSourceNode | null = null
  let processor: ScriptProcessorNode | null = null
  let gainNode: GainNode | null = null
  let audioDataQueue: number[] = []
  let onAudioChunk: AudioChunkHandler | null = null
  let running = false
  let paused = false

  async function start(cb: AudioChunkHandler): Promise<void> {
    if (running) return
    onAudioChunk = cb
    running = true
    audioDataQueue = []

    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    audioContext = new AudioCtx({ sampleRate: 16000 })
    source = audioContext.createMediaStreamSource(mediaStream)
    processor = audioContext.createScriptProcessor(1024, 1, 1)
    gainNode = audioContext.createGain()
    gainNode.gain.value = 0

    processor.onaudioprocess = (e: AudioProcessingEvent) => {
      if (paused || !running) return
      const inputData = e.inputBuffer.getChannelData(0)
      for (let i = 0; i < inputData.length; i++) {
        audioDataQueue.push(inputData[i])
      }
      while (audioDataQueue.length >= CHUNK_SAMPLES) {
        const slice = audioDataQueue.splice(0, CHUNK_SAMPLES)
        const pcm = convertFloat32ToInt16(new Float32Array(slice))
        onAudioChunk?.(pcm)
      }
    }

    source.connect(processor)
    processor.connect(gainNode)
    gainNode.connect(audioContext.destination)
  }

  function pause(): void {
    paused = true
    if (audioContext && audioContext.state === 'running') {
      audioContext.suspend()
    }
  }

  function resume(): void {
    paused = false
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume()
    }
  }

  async function stop(): Promise<void> {
    running = false
    paused = false
    if (processor) {
      processor.disconnect()
      processor = null
    }
    if (source) {
      source.disconnect()
      source = null
    }
    if (gainNode) {
      gainNode.disconnect()
      gainNode = null
    }
    if (audioContext && audioContext.state !== 'closed') {
      await audioContext.close()
    }
    audioContext = null
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop())
      mediaStream = null
    }
    audioDataQueue = []
    onAudioChunk = null
  }

  return { start, stop, pause, resume }
}

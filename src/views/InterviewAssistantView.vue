<template>
  <div class="interview-assistant-page">
    <InterviewHeader
      :info="interviewInfo"
      :isAsrActive="isAsrActive"
      :isRecording="isRecording"
      :isPaused="isPaused"
      @goBack="goBack"
      @startAsr="onStartAsr"
      @stopAsr="onStopAsr"
      @startRecording="onStartRecording"
      @stopRecording="onStopRecording"
      @pauseInterview="onPauseInterview"
      @resumeInterview="onResumeInterview"
      @manualFollowUp="onManualFollowUp"
      @endInterview="onEndInterview"
    />


    <div class="page-content">
      <section class="left-column">
        <ResumePreviewPanel 
          :url="resumePreviewUrl" 
          :loading="isResumeLoading"
        />
      </section>

      <section class="center-column">
        <TranscriptPanel
          :conversation="transcriptConversation"
          :currentRound="interviewInfo.currentRound"
          :liveText="currentAsrText"
          :liveSpeakerId="currentSpeakerId"
          :isListening="isAsrActive"
          :asrSegments="asrSegments"
        />
      </section>

      <section class="right-column">
        <FollowUpPanel :suggestions="computedFollowUpQuestions" @generateMore="onGenerateMoreSuggestions" />
        <EvaluationPanel :evaluation="computedEvaluation" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import InterviewHeader from '../components/interview/InterviewHeader.vue'
import TranscriptPanel from '../components/interview/TranscriptPanel.vue'
import ResumePreviewPanel from '../components/interview/ResumePreviewPanel.vue'
import FollowUpPanel from '../components/interview/FollowUpPanel.vue'
import EvaluationPanel from '../components/interview/EvaluationPanel.vue'
import { interviewApi } from '../api/interview'
import { fileApi } from '../api/file'
import { resumeApi } from '../api/resume'
import { startMockAsr, type MockAsrHandle } from '../utils/mockAsrWs'

const route = useRoute()
const router = useRouter()
const sessionId = route.params.id as string
const isAsrActive = ref(false)
const isPaused = ref(false)
let socket: WebSocket | null = null
let mediaStream: MediaStream | null = null
let audioContext: any = null
let processor: ScriptProcessorNode | null = null
let gainNode: GainNode | null = null
let audioDataQueue: number[] = [] // 音频样本队列，用于缓冲并对齐 480 采样点 (30ms)
let frameCount = 0 // 音频帧发送计数器
let timerInterval: any = null
let secondsElapsed = 0

// ========== 录音逻辑变量 ==========
const isRecording = ref(false)
const isUploadingRecording = ref(false)
let mediaRecorder: MediaRecorder | null = null
let recordedChunks: Blob[] = []

// ========== ASR 实时转写数据（新版：支持说话人识别） ==========
type AsrSegment = {
  text: string
  speakerId: string | null
  timestamp: string // 该段话确认时的时间戳 HH:MM:SS
}

// 获取当前时间 HH:MM:SS 格式
const getNowTimeStr = (): string => {
  const now = new Date()
  return [
    now.getHours().toString().padStart(2, '0'),
    now.getMinutes().toString().padStart(2, '0'),
    now.getSeconds().toString().padStart(2, '0'),
  ].join(':')
}
const currentAsrText = ref('')
const currentSpeakerId = ref<string | null>(null)
const asrSegments = ref<AsrSegment[]>([]) // 已确认段落

// Mock 模式控制
let mockHandle: MockAsrHandle | null = null
const USE_MOCK = false// 设为 true 启用 Mock 模式，后端可用时改为 false

// ========== 简历预览数据 ==========
const resumePreviewUrl = ref<string | null>(null)
const isResumeLoading = ref(false)
const resumeId = ref<number | null>(null)

// ========== LLM streaming 流式输出缓冲 ==========
// 按 index 组织，每个 index 代表一次 LLM 输出
const streamingAdviceMap = ref<Record<number, string>>({})
const streamingEvaluationMap = ref<Record<number, string>>({})

// ========== 将 streaming 数据映射为子组件 props ==========

// FollowUpPanel 所需的 suggestions 数组
const computedFollowUpQuestions = computed(() => {
  const entries = Object.entries(streamingAdviceMap.value)
  if (entries.length === 0) return followUpQuestions.value
  return entries.map(([idx, text]) => ({
    id: `advice-${idx}`,
    priority: '高优先级',
    title: `AI 追问建议`,
    description: text.trimStart(),
    tags: ['AI 生成', '实时']
  }))
})

// EvaluationPanel 所需的 evaluation 对象
const computedEvaluation = computed(() => {
  const entries = Object.entries(streamingEvaluationMap.value)
  if (entries.length === 0) {
    return {
      score: evaluationSummary.value.score,
      summary: evaluationSummary.value.summary,
      summaries: [],
      metrics: evaluationSummary.value.metrics
    }
  }
  
  const summaries = entries.map(([, text], i) => ({
    index: i + 1,
    text: text.trimStart()
  }))
  
  return {
    score: evaluationSummary.value.score,
    summary: summaries.map(s => s.text).join('\n\n'),
    summaries: summaries,
    metrics: evaluationSummary.value.metrics
  }
})

// ========== Float32 → Int16 PCM 转换 ==========
const convertFloat32ToInt16 = (buffer: Float32Array) => {
  let l = buffer.length
  let buf = new Int16Array(l)
  while (l--) {
    let s = Math.max(-1, Math.min(1, buffer[l]))
    buf[l] = s < 0 ? s * 0x8000 : s * 0x7FFF
  }
  return buf.buffer
}

// ========== 浏览器音频采集 ==========
const startAudioCapture = async () => {
  console.log('[Audio Debug] v3.0 - Starting capture (16kHz, mono, 480 samples/frame)')
  if (!mediaStream) {
    ElMessage.error('尚未获取麦克风流，请等待权限获取成功')
    return
  }

  // 初始化缓冲区
  audioDataQueue = []
  frameCount = 0

  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
  // 采样率 16000 Hz
  audioContext = new AudioCtx({ sampleRate: 16000 })
  console.log('[Audio Debug] AudioContext created with SampleRate:', audioContext.sampleRate)
  const source = audioContext.createMediaStreamSource(mediaStream)

  // 参数：缓冲大小 1024，输入通道数 1，输出通道数 1
  processor = audioContext.createScriptProcessor(1024, 1, 1)

  // 避免输出的声音回声，静音处理
  gainNode = audioContext.createGain()
  gainNode.gain.value = 0

  processor.onaudioprocess = (e: any) => {
    // 1. 获取单声道数据 (Float32Array)
    const inputData = e.inputBuffer.getChannelData(0)

    // 2. 将新样本推入队列
    for (let i = 0; i < inputData.length; i++) {
      audioDataQueue.push(inputData[i])
    }

    // 3. 当队列中的样本数超过 480 (30ms@16kHz) 时，切片并发送
    while (audioDataQueue.length >= 480) {
      const slice = audioDataQueue.splice(0, 480)
      
      if (isPaused.value) {
        continue
      }

      const pcm16Data = convertFloat32ToInt16(new Float32Array(slice))

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(pcm16Data)
        frameCount++
        // 每发送 50 帧打印一次（约 1.5 秒一次）
        if (frameCount % 50 === 1) {
          // 计算 RMS 音量，用于判断麦克风是否真正采集到声音
          const rms = Math.sqrt(slice.reduce((sum, s) => sum + s * s, 0) / slice.length)
          console.log(`[Audio] 帧 #${frameCount} | ${pcm16Data.byteLength} bytes | RMS 音量: ${rms.toFixed(4)} | WS状态: ${socket.readyState}`)
        }
      } else {
        // WebSocket 不在 OPEN 状态时打印警告（每 100 帧仅警告一次避免刷屏）
        frameCount++
        if (frameCount % 100 === 1) {
          console.warn(`[Audio] WebSocket 未就绪 (readyState=${socket?.readyState}), 帧 #${frameCount} 被丢弃`)
        }
      }
    }
  }

  source.connect(processor)
  processor.connect(gainNode)
  gainNode.connect(audioContext.destination)
}

const stopAudioCapture = () => {
  if (processor && gainNode && audioContext) {
    processor.disconnect()
    gainNode.disconnect()
    if (audioContext.state !== 'closed') {
      audioContext.close()
    }
    processor = null
    gainNode = null
    audioContext = null
  }
}

// ========== 计时器逻辑 ==========
const startTimer = (resume = false) => {
  if (timerInterval) clearInterval(timerInterval)
  if (!resume) {
    secondsElapsed = 0
    interviewInfo.value.timer = '00:00'
  }
  
  timerInterval = setInterval(() => {
    secondsElapsed++
    const mins = Math.floor(secondsElapsed / 60).toString().padStart(2, '0')
    const secs = (secondsElapsed % 60).toString().padStart(2, '0')
    interviewInfo.value.timer = `${mins}:${secs}`
  }, 1000)
}

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

// ========== 录音控制逻辑 ==========
const onStartRecording = () => {
  if (!mediaStream) {
    ElMessage.error('无法录音：未获取到音频流')
    return
  }

  recordedChunks = []
  try {
    // 优先使用 mp4/webm 等现代编码
    const options = { mimeType: 'audio/webm;codecs=opus' }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.warn('webm/opus 不支持，尝试默认类型')
      mediaRecorder = new MediaRecorder(mediaStream)
    } else {
      mediaRecorder = new MediaRecorder(mediaStream, options)
    }

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data)
      }
    }

    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordedChunks, { type: mediaRecorder?.mimeType || 'audio/webm' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const timestamp = new Date().toLocaleString().replace(/[\/\\:\*\?\"<>\|]/g, '-')
      const fileName = `面试录音_${interviewInfo.value.candidateName}_${timestamp}.webm`
      
      // 1. 发起本地下载
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
      ElMessage.success('录音文件已生成并开始本地下载')

      // 2. 自动上传至 TOS 文件系统
      isUploadingRecording.value = true
      const formData = new FormData()
      formData.append('file', blob, fileName)
      formData.append('file_type', 'voice') // 明确标注为音频文件

      try {
        console.log('[Upload] Starting automatic upload for:', fileName)
        await fileApi.uploadFile(formData)
        ElMessage.success('录音已同步保存至云端文件系统')
      } catch (err: any) {
        console.error('[Upload] Automatic upload failed:', err)
        ElMessage.error(`录音云端同步失败: ${err.message || '网络异常'}`)
      } finally {
        isUploadingRecording.value = false
      }
    }

    mediaRecorder.start()
    isRecording.value = true
    ElMessage.success('本地录音已开始')
  } catch (err) {
    console.error('Failed to start recording:', err)
    ElMessage.error('启动录音失败')
  }
}

const onStopRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  isRecording.value = false
}

const interviewInfo = ref({
  status: '服务初始化中...',
  statusColor: '#e6a23c', // 默认黄色等待态
  timer: '00:00',
  candidateName: '候选人数据获取中',
  candidateTitle: '',
  currentRound: 1
})

const transcriptConversation = ref([])
const followUpQuestions = ref([])
const evaluationSummary = ref({
  score: 0.0,
  summary: '暂无大模型分析结论',
  metrics: []
})

// ========== 麦克风权限申请 ==========
const requestMicPermission = async (): Promise<boolean> => {
  // 检查浏览器 API 可用性（非 HTTPS 或老旧浏览器会缺失）
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    ElMessage.error('当前浏览器不支持麦克风功能，请使用 Chrome/Edge 并确保为 HTTPS 环境')
    return false
  }

  try {
    await ElMessageBox.confirm(
      '为了进行语音识别，面试助手需要开启麦克风权限。是否现在开启？',
      '权限申请',
      {
        confirmButtonText: '开启',
        cancelButtonText: '暂不开启',
        type: 'info'
      }
    )
  } catch {
    // 用户点取消 / ESC / 遮罩层关闭，静默返回
    return false
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    console.log('Microphone permission granted')
    ElMessage.success('麦克风权限已获取')
    return true
  } catch (err: any) {
    // 根据具体错误类型给出针对性提示
    const errorMap: Record<string, string> = {
      NotAllowedError: '麦克风权限被拒绝，请在浏览器地址栏左侧点击锁形图标手动开启',
      NotFoundError: '未检测到麦克风设备，请检查是否正确连接',
      NotReadableError: '麦克风被其他程序占用，请关闭其他录音软件后重试',
      OverconstrainedError: '麦克风不满足音频约束条件',
    }
    ElMessage.error(errorMap[err.name] || `麦克风获取失败: ${err.message}`)
    console.error('Mic error:', err)
    return false
  }
}

const fetchInterviewDetails = async () => {
  try {
    const res = await interviewApi.getReserveSession(sessionId)
    if (res) {
      interviewInfo.value.candidateName = res.candidate_name
      interviewInfo.value.status = '准备就绪'
      interviewInfo.value.statusColor = '#67c23a'
      
      // 记录 resume_id 并获取预览
      if (res.resume_id) {
        resumeId.value = res.resume_id
        fetchResumePreview(res.resume_id)
      }
    }
  } catch (err) {
    console.error('Failed to fetch interview details:', err)
  }
}

const fetchResumePreview = async (id: number) => {
  isResumeLoading.value = true
  try {
    const blob = await resumeApi.downloadResume(id)
    const pdfBlob = new Blob([blob], { type: 'application/pdf' })
    if (resumePreviewUrl.value) {
      URL.revokeObjectURL(resumePreviewUrl.value)
    }
    resumePreviewUrl.value = URL.createObjectURL(pdfBlob)
  } catch (err) {
    console.error('Failed to fetch resume preview:', err)
    ElMessage.error('简历预览加载失败')
  } finally {
    isResumeLoading.value = false
  }
}

onMounted(() => {
  requestMicPermission()
  fetchInterviewDetails()
})

onBeforeUnmount(() => {
  stopAudioCapture()
  stopTimer()
  if (socket) {
    socket.close()
    socket = null
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }
  // 清理预览 URL
  if (resumePreviewUrl.value) {
    URL.revokeObjectURL(resumePreviewUrl.value)
    resumePreviewUrl.value = null
  }
})

// ========== WebSocket 消息处理（核心改造：支持 speaker_id + definite） ==========
const handleWsMessage = (event: MessageEvent | { data: string }) => {
  if (isPaused.value) return
  try {
    const raw = typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data as ArrayBuffer)
    console.log('[WS Raw] Received:', raw.slice(0, 50) + (raw.length > 50 ? '...' : ''))
    const msg = JSON.parse(raw)

    if (msg.type === 'asr') {
      const asrData = msg.data
      let text: string
      let speakerId: string | null = null
      let definite = false

      if (typeof asrData === 'string') {
        // 兼容旧格式：data 为纯字符串
        text = asrData
      } else {
        // 新格式：data 为对象
        text = asrData.text || ''
        speakerId = asrData.speaker_id ?? null
        // 兼容多种 definite 格式：布尔 true、字符串 "True"/"true"、数字 1
        definite = msg.definite === true || msg.definite === 'True' || msg.definite === 'true' || msg.definite === 1
      }

      console.log(`[ASR] definite=${msg.definite}(${typeof msg.definite}) → ${definite}, speaker=${speakerId}, text="${text.slice(0, 30)}..."`)

      // ---- 说话人切换时：先把之前的实时文本归档 ----
      if (currentAsrText.value && currentSpeakerId.value !== null && currentSpeakerId.value !== speakerId) {
        const lastSeg = asrSegments.value[asrSegments.value.length - 1]
        if (lastSeg && lastSeg.speakerId === currentSpeakerId.value) {
          lastSeg.text += currentAsrText.value
        } else {
          asrSegments.value.push({ text: currentAsrText.value, speakerId: currentSpeakerId.value, timestamp: getNowTimeStr() })
        }
        currentAsrText.value = ''
        currentSpeakerId.value = null
        // 强制触发 Vue 响应式
        asrSegments.value = [...asrSegments.value]
      }

      if (definite) {
        // 已确认为一句完整的话 → 归档到段落历史
        const lastSeg = asrSegments.value[asrSegments.value.length - 1]
        if (lastSeg && lastSeg.speakerId === speakerId) {
          lastSeg.text += text
        } else {
          asrSegments.value.push({ text, speakerId, timestamp: getNowTimeStr() })
        }
        currentAsrText.value = ''
        currentSpeakerId.value = null
        // 强制触发 Vue 响应式
        asrSegments.value = [...asrSegments.value]
      } else {
        // 还在识别中 → 更新实时显示（允许覆盖，因为 ASR 中间结果本身就是不断修正的）
        currentAsrText.value = text
        currentSpeakerId.value = speakerId
      }
    } else if (msg.type === 'streaming') {
      // type: "streaming" → data 是 LLM 流式输出对象
      const payload = msg.data
      console.log('--- [LLM Streaming Message] ---', payload)
      const { response_type, index, content } = payload

      if (response_type === 'advice') {
        console.log(`[Advice Chunk] index: ${index}, length: ${content?.length}, content: ${content?.slice(0, 20)}...`)
        if (!streamingAdviceMap.value[index]) {
          streamingAdviceMap.value[index] = ''
        }
        streamingAdviceMap.value[index] += content
        streamingAdviceMap.value = { ...streamingAdviceMap.value }
      } else if (response_type === 'evaluation') {
        console.log(`[Evaluation Chunk] index: ${index}, length: ${content?.length}, content: ${content?.slice(0, 20)}...`)
        if (!streamingEvaluationMap.value[index]) {
          streamingEvaluationMap.value[index] = ''
        }
        streamingEvaluationMap.value[index] += content
        streamingEvaluationMap.value = { ...streamingEvaluationMap.value }
      } else if (response_type === 'done') {
        console.log(`[LLM Done] 本轮输出完成, index: ${index}`)
      }
    } else {
      console.warn('[WS Unknown Type] 收到未知类型的消息:', msg.type, msg)
    }
  } catch (e) {
    const dataPreview = typeof event.data === 'string' ? event.data.slice(0, 100) : 'Binary Data'
    console.error('[WS Message Error] 解析失败:', e)
    console.error('[WS Error Detail] 原始数据预览:', dataPreview)
  }
}

// ========== 启动 ASR ==========
const onStartAsr = async () => {
  try {
    // 如果尚未获取麦克风权限，先重新请求
    if (!mediaStream) {
      const granted = await requestMicPermission()
      if (!granted) {
        ElMessage.warning('需要麦克风权限才能启动语音识别')
        return
      }
    }

    const token = localStorage.getItem('token')
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    // 使用当前宿主机的 host，让其经过 vite proxy 统一转发
    const wsUrl = `${wsProtocol}//${window.location.host}/api/asr/stream/${sessionId}?token=${token}`

    // 重置流式缓冲数据
    currentAsrText.value = ''
    currentSpeakerId.value = null
    asrSegments.value = []
    streamingAdviceMap.value = {}
    streamingEvaluationMap.value = {}

    isAsrActive.value = true
    isPaused.value = false
    interviewInfo.value.status = 'ASR 服务初始化中...'
    interviewInfo.value.statusColor = '#409eff'

    // ===== Mock 模式：跳过真实 WebSocket，使用模拟数据 =====
    if (USE_MOCK) {
      console.log('[ASR] 进入 Mock 模式，模拟 WebSocket 数据推送')
      interviewInfo.value.status = '模拟识别中（Mock）'
      interviewInfo.value.statusColor = '#67c23a'
      startTimer()
      mockHandle = startMockAsr(handleWsMessage)
      ElMessage.success('Mock ASR 已启动')
      return
    }

    // ===== 真实模式 =====
    // 必须先通过 HTTP 调用后端初始化 ASR 服务，否则 WebSocket 会被 1008 拒绝
    try {
      await interviewApi.startASR(sessionId, {})
      console.log('[ASR] HTTP startASR 初始化成功')
    } catch (err) {
      console.error('[ASR] HTTP startASR 初始化失败:', err)
      ElMessage.error('ASR 服务初始化失败，请检查后端服务')
      isAsrActive.value = false
      return
    }

    interviewInfo.value.status = '连接建立中...'
    socket = new WebSocket(wsUrl)
    socket.binaryType = 'arraybuffer' // 强制指定二进制类型为 ArrayBuffer

    socket.onopen = () => {
      console.log('ASR WebSocket connected')
      interviewInfo.value.status = '持续听写中...'
      interviewInfo.value.statusColor = '#67c23a'
      // 连接成功后启动音频采集并发送
      startAudioCapture()
      startTimer()
      ElMessage.success('ASR 识别通道已打通')
    }

    socket.onmessage = handleWsMessage

    socket.onclose = (ev) => {
      console.log(`ASR WebSocket closed | code: ${ev.code} | reason: "${ev.reason}" | wasClean: ${ev.wasClean}`)
      isAsrActive.value = false
      stopAudioCapture()
      interviewInfo.value.status = '等待连接'
      interviewInfo.value.statusColor = '#909399'
    }

    socket.onerror = (err) => {
      console.error('ASR WebSocket error:', err)
      ElMessage.error('WebSocket 存在连接异常')
      isAsrActive.value = false
    }

  } catch (err: any) {
    ElMessage.error('启动 ASR 失败: ' + (err.message || '未知错误'))
    isAsrActive.value = false
  }
}

// ========== 停止 ASR ==========
const onStopAsr = async () => {
  try {
    // 停止 Mock 模式
    if (mockHandle) {
      mockHandle.stop()
      mockHandle = null
    }

    stopAudioCapture()
    if (socket) {
      socket.close()
      socket = null
    }
    stopTimer()
    
    // 如果正在录音，联动停止
    if (isRecording.value) {
      onStopRecording()
    }

    // 释放麦克风轨道
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop())
      mediaStream = null
    }
    // 通知后端停止 ASR 服务（失败不阻塞前端清理）
    if (!USE_MOCK) {
      interviewApi.stopASR(sessionId).catch(err => {
        console.warn('[ASR] HTTP stopASR 请求异常:', err)
      })
    }
    isAsrActive.value = false
    isPaused.value = false
    interviewInfo.value.status = '识别已停止'
    interviewInfo.value.statusColor = '#909399'
    ElMessage.success('ASR 识别已停止')
  } catch (err: any) {
    ElMessage.error('停止 ASR 失败: ' + (err.message || '未知错误'))
  }
}

const onPauseInterview = () => {
  isPaused.value = true
  interviewInfo.value.status = '面试已暂停'
  interviewInfo.value.statusColor = '#e6a23c'
  stopTimer()
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.pause()
  }
  ElMessage.warning('面试已暂停')
}

const onResumeInterview = () => {
  isPaused.value = false
  interviewInfo.value.status = '持续听写中...'
  interviewInfo.value.statusColor = '#67c23a'
  startTimer(true)
  if (mediaRecorder && mediaRecorder.state === 'paused') {
    mediaRecorder.resume()
  }
  ElMessage.success('面试已恢复')
}

function onManualFollowUp() {
  // TODO: 接入真正的大模型追问请求
}

function onEndInterview() {
  // 结束面试时也要清理 ASR 资源
  if (isAsrActive.value) {
    onStopAsr()
  }
  interviewInfo.value.status = '通话已结束'
  interviewInfo.value.statusColor = '#909399'
  // TODO: 触发结束动作
}

function onGenerateMoreSuggestions() {
  // TODO: 通过后端要求大模型根据当前上下文产出下一批发问题库
}

function goBack() {
  router.back()
}
</script>

<style lang="scss" scoped>
.interview-assistant-page {
  height: 100vh;
  box-sizing: border-box;
  padding: 20px;
  background: #f4f6fb;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-content {
  display: grid;
  grid-template-columns: 1.2fr 1.3fr 1fr;
  gap: 18px;
  margin-top: 16px;
  flex: 1;
  min-height: 0;
}

.left-column,
.center-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
}

@media (max-width: 1200px) {
  .page-content {
    grid-template-columns: 1fr;
  }
}
</style>

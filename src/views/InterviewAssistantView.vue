<template>
  <div class="interview-assistant-page">
    <div style="display:flex;align-items:center;padding:8px 20px;gap:8px;">
      <span style="font-size:13px;color:#94a3b8;">AI 面试辅助分析</span>
      <FeatureGuideBtn :steps="assistantGuideSteps" title="功能引导" label="引导" />
    </div>
    <InterviewHeader
      :info="interviewInfo"
      :stageInfo="stageInfo"
      :isAsrActive="isAsrActive"
      :isPaused="isPaused"
      :isSysAudioActive="isSysAudioActive"
      :manualAnalysisLoading="manualAnalysisLoading"
      @goBack="goBack"
      @startAsr="onStartAsr"
      @stopAsr="onStopAsr"
      @pauseInterview="onPauseInterview"
      @resumeInterview="onResumeInterview"
      @manualFollowUp="onManualFollowUp"
      @endInterview="onEndInterview"
      @stageChange="onStageChange"
      @toggleSysAudio="toggleSysAudio"
    />

    <div class="page-content">
      <section class="left-column">
        <ResumePreviewPanel
          :resume-id="resumeId"
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

    <InterviewQuestionsFloat
      :resume-id="resumeId"
      :candidate-name="interviewInfo.candidateName"
    />

    <!-- 面试结束结果选择弹窗 -->
    <el-dialog v-model="resultDialogVisible" title="面试结束" width="400px" :close-on-click-modal="false" :show-close="false">
      <div style="text-align: center; padding: 20px 0;">
        <p style="font-size: 15px; color: #1f2329; margin: 0 0 20px;">请选择该轮次面试结果</p>
        <div style="display: flex; justify-content: center; gap: 16px;">
          <el-button type="success" size="large" style="width: 100px;" @click="handleResultConfirm('pass')">通过</el-button>
          <el-button type="danger" size="large" style="width: 100px;" @click="handleResultConfirm('fail')">不通过</el-button>
          <el-button size="large" style="width: 100px;" @click="handleResultConfirm('pending_review')">待定</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import InterviewHeader from '../components/interview/InterviewHeader.vue'
import TranscriptPanel from '../components/interview/TranscriptPanel.vue'
import ResumePreviewPanel from '../components/interview/ResumePreviewPanel.vue'
import FollowUpPanel from '../components/interview/FollowUpPanel.vue'
import EvaluationPanel from '../components/interview/EvaluationPanel.vue'
import InterviewQuestionsFloat from '../components/InterviewQuestionsFloat.vue'
import FeatureGuideBtn from '../components/FeatureGuideBtn.vue'
import { interviewApi } from '../api/interview'
import { resumeApi } from '../api/resume'
import { startMockAsr, type MockAsrHandle } from '../utils/mockAsrWs'

const route = useRoute()
const router = useRouter()

const assistantGuideSteps = [
  { element: '.left-column', popover: { title: '候选人简历', description: '左侧展示当前候选人的简历预览，方便面试过程中随时查阅教育背景、工作经历等关键信息。', side: 'right', align: 'start' } },
  { element: '.center-column', popover: { title: '实时转写', description: '中间为对话转录面板，实时展示 ASR 语音识别结果。按发言人区分显示，支持查看历史对话片段。', side: 'top', align: 'start' } },
  { element: '.right-column', popover: { title: 'AI 辅助', description: '右侧上方为 AI 生成的追问建议，下方为实时评价分析。面试过程中持续更新，辅助面试官做出更精准的判断。', side: 'left', align: 'start' } },
  { element: '.stage-bar', popover: { title: '面试阶段', description: '面试分为 7 个阶段：开场介绍→自我介绍→项目深挖→技术理论→文化匹配→候选人提问→结束总结。点击圆点可跳转任意阶段，左侧箭头可逐一前进/后退。不同阶段 AI 提供针对性的辅助分析。', side: 'bottom', align: 'center' } },
  { element: '.actions', popover: { title: '面试操作', description: '【开始面试】启动 AI 录音和分析；【系统音频】采集线上会议中候选人的声音；【暂停/恢复】临时中断或继续面试；【AI 分析】手动触发一次评估；【结束面试】后弹出结果选择（通过/不通过/待定）。', side: 'bottom', align: 'end' } },
]
const sessionId = route.params.sessionId as string
const roundId = route.params.roundId as string
const isAsrActive = ref(false)
const isPaused = ref(false)
const isSysAudioActive = ref(false) // 系统音频共享状态
let socket: WebSocket | null = null
let mediaStream: MediaStream | null = null
let sysStream: MediaStream | null = null  // 腾讯会议等系统音频（getDisplayMedia）
let audioContext: any = null
let processor: ScriptProcessorNode | null = null
let gainNode: GainNode | null = null
let mixerDest: MediaStreamAudioDestinationNode | null = null  // 混音目标
let sysAudioSourceNode: AudioNode | null = null  // 系统音频源节点（动态连接/断开）
let audioDataQueue: number[] = [] // 音频样本队列，用于缓冲并对齐 480 采样点 (30ms)
let frameCount = 0 // 音频帧发送计数器
let timerInterval: any = null
let secondsElapsed = 0

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
const isResumeLoading = ref(false)
const resumeId = ref<number | null>(null)

// ========== 面试阶段数据 ==========
const ALL_STAGES = [
  { key: 'welcome', name: '开场介绍' },
  { key: 'self_intro', name: '自我介绍' },
  { key: 'project', name: '项目深挖' },
  { key: 'theory', name: '技术理论' },
  { key: 'culture', name: '文化匹配' },
  { key: 'candidate_qa', name: '候选人提问' },
  { key: 'closing', name: '结束总结' },
]

const stageInfo = ref({
  stages: ALL_STAGES,
  currentIndex: 0,
  displayName: ALL_STAGES[0].name,
  description: '',
})

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

  // ---- 混合麦克风 + 系统音频（腾讯会议中候选人声音）到一路 MediaStream ----
  mixerDest = audioContext.createMediaStreamDestination()

  // 连接麦克风（面试官声音）
  const micSource = audioContext.createMediaStreamSource(mediaStream)
  micSource.connect(mixerDest)

  // 如果已提前通过 toggleSysAudio 开启了系统音频，直接接入混音
  if (sysStream && sysStream.getAudioTracks().length > 0) {
    sysAudioSourceNode = audioContext.createMediaStreamSource(sysStream)
    sysAudioSourceNode.connect(mixerDest)
    console.log('[Audio] ✅ 系统音频已加入混音（双路采集）')
  } else {
    console.log('[Audio] ℹ️ 仅麦克风单路采集')
  }

  // 读取混音后的流
  const mixedSource = audioContext.createMediaStreamSource(mixerDest.stream)

  // 参数：缓冲大小 1024，输入通道数 2（兼容双路混音），输出通道数 1
  processor = audioContext.createScriptProcessor(1024, 2, 1)

  // 避免输出的声音回声，静音处理
  gainNode = audioContext.createGain()
  gainNode.gain.value = 0

  processor.onaudioprocess = (e: any) => {
    // 取两路通道并混为单声道
    const ch0 = e.inputBuffer.getChannelData(0)
    const ch1 = e.inputBuffer.getChannelData(1)

    // 2ch → 单声道求和: mic(可能ch0+ch1) + sys(可能ch0+ch1)
    for (let i = 0; i < ch0.length; i++) {
      audioDataQueue.push(ch0[i] + ch1[i])
    }

    // 当队列中的样本数超过 480 (30ms@16kHz) 时，切片并发送
    while (audioDataQueue.length >= 480) {
      const slice = audioDataQueue.splice(0, 480)

      if (isPaused.value) {
        // 暂停时发送静默 PCM 数据（全 0），保持 ASR 管线活跃不休眠
        const silentPcm = new Int16Array(480).buffer
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(silentPcm)
        }
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

  mixedSource.connect(processor)
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
    mixerDest = null
    sysAudioSourceNode = null
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

const manualAnalysisLoading = ref(false)
const resultDialogVisible = ref(false)

// ========== 麦克风权限申请 ==========
const requestMicPermission = async (): Promise<boolean> => {
  // 检查浏览器 API 可用性（非 HTTPS 或老旧浏览器会缺失）
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    ElMessage.error('当前浏览器不支持麦克风功能，请使用 Chrome/Edge 并确保为 HTTPS 环境')
    return false
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    console.log('Microphone permission granted')
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

// ========== 系统音频采集（getDisplayMedia 采集腾讯会议等桌面应用的声音）==========
const requestSystemAudio = async (silent = false): Promise<boolean> => {
  if (!navigator.mediaDevices.getDisplayMedia) {
    if (!silent) {
      ElMessage.info('当前浏览器不支持系统音频采集，候选人声音将仅从麦克风拾取。推荐使用 Chrome/Edge')
    }
    return false
  }

  try {
    // 弹出使用说明，引导用户选择窗口而非"整个屏幕"（自动模式跳过此弹窗）
    if (!silent) {
      await ElMessageBox.alert(
        '请在弹出对话框中选择共享窗口或共享屏幕。\n\n' +
        '这样只会采集候选人的声音，避免背景音乐等杂音干扰识别。',
        '系统音频采集说明',
        {
          confirmButtonText: '知道了',
          type: 'info',
          dangerouslyUseHTMLString: false,
        }
      )
    }

    // getDisplayMedia 只采音频，不录屏
    // 某些浏览器不支持 video:false，先尝试纯音频，失败后回退到最小 video 约束
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: false,
        audio: {
          suppressLocalAudioPlayback: false, // 不要过滤本地播放音（避免腾讯会议声音被消除）
          echoCancellation: false,
          noiseSuppression: false,
        },
      })
    } catch (firstErr: any) {
      // 部分浏览器不支持 video:false，回退为最小 1x1 视频（仍不录屏）
      console.warn('getDisplayMedia({video:false}) 失败，尝试最小视频约束:', firstErr.message)
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 1, height: 1 },
        audio: {
          suppressLocalAudioPlayback: false,
          echoCancellation: false,
          noiseSuppression: false,
        },
      })
    }

    sysStream = stream

    // 监听用户中途关闭共享 → 自动降级为仅麦克风
    const audioTrack = stream.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.onended = () => {
        ElMessage.warning('系统音频共享已中断，候选人声音将仅从麦克风拾取')
        sysStream = null
      }
    }

    if (!silent) {
      ElMessage.success('系统音频采集已开启（仅采集所选窗口的声音）')
    }
    return true
  } catch (err: any) {
    if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
      // 用户点了"取消"或关闭对话框，静默模式不提示
      if (!silent) {
        ElMessage.info('已跳过系统音频采集，仅使用麦克风')
      }
    } else if (err.name === 'NotSupportedError' || err.name === 'NotFoundError') {
      if (!silent) {
        ElMessage.warning('当前浏览器不支持系统音频采集，候选人声音将仅通过麦克风拾取。推荐使用 Chrome')
      }
    } else {
      console.error('System audio capture error:', err)
      if (!silent) {
        ElMessage.warning(`系统音频采集失败，将仅使用麦克风`)
      }
    }
    return false
  }
}

// ========== 手动开关系统音频共享（独立于 ASR 启停，可随时操作）==========
const toggleSysAudio = async () => {
  if (isSysAudioActive.value) {
    // 停止共享
    if (sysAudioSourceNode && audioContext) {
      try { sysAudioSourceNode.disconnect() } catch {}
      sysAudioSourceNode = null
    }
    if (sysStream) {
      sysStream.getTracks().forEach(t => t.stop())
      sysStream = null
    }
    isSysAudioActive.value = false
    ElMessage.info('系统音频共享已停止')
  } else {
    // 开启共享
    const ok = await requestSystemAudio()
    if (!ok) return

    isSysAudioActive.value = true

    // 如果音频管道已在运行，动态接入混音
    if (mixerDest && audioContext && sysStream) {
      sysAudioSourceNode = audioContext.createMediaStreamSource(sysStream)
      sysAudioSourceNode.connect(mixerDest)
      console.log('[Audio] 系统音频已动态接入混音')
    }
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
    resumeId.value = id
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
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  stopAudioCapture()
  stopTimer()
  if (socket) {
    socket.onclose = null
    socket.close()
    socket = null
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }
  if (sysStream) {
    sysStream.getTracks().forEach(track => track.stop())
    sysStream = null
  }
  // 仅在 ASR 会话仍活跃时清理后端
  if (isAsrActive.value) {
    interviewApi.stopASR(sessionId, roundId).catch(() => {})
  }
  window.removeEventListener('beforeunload', handleBeforeUnload)
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
      } else if (response_type === 'stage_info') {
        console.log('[Stage Info]', payload)
        stageInfo.value = {
          stages: ALL_STAGES,
          currentIndex: payload.stage_index,
          displayName: payload.display_name,
          description: payload.description || '',
        }
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
    const wsUrl = `${wsProtocol}//${window.location.host}/api/asr/stream/${sessionId}/${roundId}?token=${token}`

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
    // 如需采集腾讯会议中的候选人声音，请先点击页面上方的"共享系统音频"按钮
    // 然后再启动 ASR。支持在 ASR 运行期间随时开启/关闭。

    // 必须先通过 HTTP 调用后端初始化 ASR 服务，否则 WebSocket 会被 1008 拒绝
    try {
      await interviewApi.startASR(sessionId, roundId, {})
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
      interviewInfo.value.status = '持续录音中'
      interviewInfo.value.statusColor = '#67c23a'
      // 连接成功后启动音频采集并发送
      startAudioCapture()
      startTimer()

      // 自动尝试共享系统音频（静默模式，跳过说明弹窗）
      requestSystemAudio(true).then((ok) => {
        if (ok) {
          isSysAudioActive.value = true
          // 动态接入混音（startAudioCapture 已创建 mixerDest）
          if (mixerDest && audioContext && sysStream) {
            sysAudioSourceNode = audioContext.createMediaStreamSource(sysStream)
            sysAudioSourceNode.connect(mixerDest)
            console.log('[Audio] 系统音频已自动接入混音')
          }
          ElNotification({
            title: '系统音频已共享',
            message: '已共享本屏幕的系统音频，若要切换音频可点击"系统音频"按钮',
            type: 'info',
            duration: 5000,
          })
        }
      })

      ElMessage.success('ASR 识别通道已打通')
    }

    socket.onmessage = handleWsMessage

    socket.onclose = (ev) => {
      console.log(`ASR WebSocket closed | code: ${ev.code} | reason: "${ev.reason}" | wasClean: ${ev.wasClean}`)
      isAsrActive.value = false
      stopAudioCapture()
      // 连接意外断开时释放系统音频共享，下次重新请求
      if (sysStream) {
        sysStream.getTracks().forEach(t => t.stop())
        sysStream = null
      }
      isSysAudioActive.value = false
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
    
    // 释放麦克风轨道
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop())
      mediaStream = null
    }
    // 释放系统音频轨道（getDisplayMedia 获取的共享流）
    if (sysStream) {
      sysStream.getTracks().forEach(track => track.stop())
      sysStream = null
    }
    isSysAudioActive.value = false
    // 通知后端停止 ASR 服务（失败不阻塞前端清理）
    if (!USE_MOCK) {
      interviewApi.stopASR(sessionId, roundId).catch(err => {
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
  interviewInfo.value.status = '录音已暂停'
  interviewInfo.value.statusColor = '#e6a23c'
  stopTimer()
  ElMessage.warning('录音已暂停')
}

const resumeAsrConnection = async () => {
  ElMessage.info('ASR 连接已断开，正在重新连接...')
  try {
    // 确保麦克风可用
    if (!mediaStream) {
      const granted = await requestMicPermission()
      if (!granted) {
        ElMessage.warning('需要麦克风权限才能恢复面试')
        return
      }
    }

    // 系统音频共享状态不受断连影响，如有需要请重新点击"共享系统音频"按钮

    // 必须在 startASR 之前将旧 socket 的 onclose 置空
    // 因为 startASR 内部会通过 stop_asr 关闭旧 WebSocket，触发 onclose 导致 isAsrActive 被置为 false
    if (socket) {
      socket.onclose = null
    }

    // 重新初始化后端 ASR 服务
    await interviewApi.startASR(sessionId, roundId, {})
    // 关闭旧的音频采集
    stopAudioCapture()
    audioDataQueue = []
    frameCount = 0
    // 关闭旧 socket
    if (socket) {
      socket.close()
      socket = null
    }
    // 建立新 WebSocket 连接
    const token = localStorage.getItem('token')
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${wsProtocol}//${window.location.host}/api/asr/stream/${sessionId}/${roundId}?token=${token}`
    socket = new WebSocket(wsUrl)
    socket.binaryType = 'arraybuffer'
    socket.onopen = () => {
      isAsrActive.value = true
      startAudioCapture()
      startTimer(true)
      interviewInfo.value.status = '持续录音中'
      interviewInfo.value.statusColor = '#67c23a'
      ElMessage.success('ASR 连接已恢复')
    }
    socket.onmessage = handleWsMessage
    socket.onclose = (ev) => {
      console.log(`ASR WebSocket closed | code: ${ev.code} | reason: "${ev.reason}"`)
      isAsrActive.value = false
      stopAudioCapture()
      // 连接意外断开时释放系统音频共享
      if (sysStream) {
        sysStream.getTracks().forEach(t => t.stop())
        sysStream = null
      }
      isSysAudioActive.value = false
      interviewInfo.value.status = '等待连接'
      interviewInfo.value.statusColor = '#909399'
    }
    socket.onerror = (err) => {
      console.error('ASR WebSocket reconnect error:', err)
      ElMessage.error('ASR 重连失败')
      isAsrActive.value = false
    }
  } catch (err) {
    ElMessage.error('ASR 重连初始化失败: ' + (err.message || '未知错误'))
    isAsrActive.value = false
  }
}

const onResumeInterview = () => {
  isPaused.value = false
  startTimer(true)
  interviewInfo.value.status = '持续录音中'
  interviewInfo.value.statusColor = '#67c23a'
}

async function onManualFollowUp() {
  if (manualAnalysisLoading.value) return
  manualAnalysisLoading.value = true
  try {
    await interviewApi.manualTriggerAnalysis(sessionId, roundId)
    ElMessage.success('AI 分析已触发，结果将通过 WebSocket 推送')
  } catch (err: any) {
    console.error('[Manual Analysis] Failed:', err)
    ElMessage.error('AI 分析触发失败: ' + (err.message || '请求异常'))
  } finally {
    // 延迟重置加载状态，给后端充分的处理时间
    setTimeout(() => { manualAnalysisLoading.value = false }, 3000)
  }
}

async function onStageChange(stageKey: string) {
  console.log('[Stage Change] Requested:', stageKey)

  if (!isAsrActive.value) {
    ElMessage.warning('请先开始面试')
    return
  }

  try {
    const payload: Record<string, string> = {}

    if (stageKey === 'next' || stageKey === 'prev') {
      payload.direction = stageKey
    } else {
      payload.target_stage = stageKey
    }

    await interviewApi.manualStageTransition(sessionId, roundId, payload)
  } catch (err: any) {
    console.error('[Stage Change] Failed:', err)
    ElMessage.error('阶段切换失败: ' + (err.message || '请求异常'))
  }
}

async function onEndInterview() {
  // 结束面试时先清理 ASR 资源
  if (isAsrActive.value) {
    await onStopAsr()
  }
  interviewInfo.value.status = '通话已结束'
  interviewInfo.value.statusColor = '#909399'

  // 弹出面试结果选择框
  resultDialogVisible.value = true
}

async function handleResultConfirm(result: string) {
  resultDialogVisible.value = false
  try {
    // 更新轮次状态
    await interviewApi.updateSessionRound(sessionId, roundId, { status: result })
    // 同步更新面试计划状态
    const statusMap: Record<string, string> = { pass: 'passed', fail: 'failed', pending_review: 'pending' }
    await interviewApi.updateReserveSession(Number(sessionId), { status: statusMap[result] })
    const labelMap: Record<string, string> = { pass: '通过', fail: '不通过', pending_review: '待定' }
    ElMessage.success('面试结果: ' + labelMap[result])

    // 自动触发报告生成（携带 round_id，不等待完成）
    interviewApi.generateReport(Number(sessionId), { round_id: Number(roundId) }).catch(() => {})

    // 跳转至面试报告/候选人页面
    router.push(`/dashboard/report-generate?candidate=${encodeURIComponent(interviewInfo.value.candidateName)}`)
  } catch (err: any) {
    ElMessage.error('操作失败: ' + (err?.detail || err?.message || '网络连接异常'))
  }
}

function onGenerateMoreSuggestions() {
  // TODO: 通过后端要求大模型根据当前上下文产出下一批发问题库
}

async function goBack() {
  // 如果 ASR 正在运行，等同于结束面试：停 ASR + 弹出评估框
  if (isAsrActive.value) {
    await onStopAsr()
    interviewInfo.value.status = '通话已结束'
    interviewInfo.value.statusColor = '#909399'
    resultDialogVisible.value = true
    return
  }
  router.back()
}

/**
 * 处理浏览器/标签页关闭等突发情况
 */
const handleBeforeUnload = () => {
  if (isAsrActive.value) {
    const token = localStorage.getItem('token')
    fetch(`/api/asr/stop/${sessionId}/${roundId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      keepalive: true
    }).catch(() => {})
  }
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

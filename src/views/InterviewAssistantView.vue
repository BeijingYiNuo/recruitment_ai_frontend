<template>
  <div class="interview-assistant-page">
    <InterviewHeader
      :info="interviewInfo"
      @manualFollowUp="onManualFollowUp"
      @endInterview="onEndInterview"
    />

    <div class="asr-controls">
      <button class="feishu-btn primary" @click="onStartAsr" :disabled="isAsrActive">创建 ASR</button>
      <button class="feishu-btn danger" @click="onStopAsr" :disabled="!isAsrActive">停止 ASR</button>
    </div>

    <div class="page-content">
      <section class="left-column">
        <TranscriptPanel :conversation="transcriptConversation" :currentRound="interviewInfo.currentRound" />
      </section>

      <section class="right-column">
        <FollowUpPanel :suggestions="followUpQuestions" @generateMore="onGenerateMoreSuggestions" />
        <EvaluationPanel :evaluation="evaluationSummary" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import InterviewHeader from '../components/interview/InterviewHeader.vue'
import TranscriptPanel from '../components/interview/TranscriptPanel.vue'
import FollowUpPanel from '../components/interview/FollowUpPanel.vue'
import EvaluationPanel from '../components/interview/EvaluationPanel.vue'
import { interviewApi } from '../api/interview'

const route = useRoute()
const sessionId = route.params.id as string
const isAsrActive = ref(false)
let socket: WebSocket | null = null
let mediaStream: MediaStream | null = null
let audioContext: any = null
let processor: ScriptProcessorNode | null = null
let gainNode: GainNode | null = null

const convertFloat32ToInt16 = (buffer: Float32Array) => {
  let l = buffer.length
  let buf = new Int16Array(l)
  while (l--) {
    let s = Math.max(-1, Math.min(1, buffer[l]))
    buf[l] = s < 0 ? s * 0x8000 : s * 0x7FFF
  }
  return buf.buffer
}

const startAudioCapture = () => {
  if (!mediaStream) {
    ElMessage.error('尚未获取麦克风流，请等待权限获取成功')
    return
  }
  
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
  // 采样率 16000 Hz
  audioContext = new AudioCtx({ sampleRate: 16000 })
  const source = audioContext.createMediaStreamSource(mediaStream)
  
  // 参数：缓冲大小 4096，输入通道数 1，输出通道数 1
  processor = audioContext.createScriptProcessor(4096, 1, 1)
  
  // 避免输出的声音回声，静音处理
  gainNode = audioContext.createGain()
  gainNode.gain.value = 0
  
  processor.onaudioprocess = (e: any) => {
    // 获取单声道数据
    const inputData = e.inputBuffer.getChannelData(0)
    // 转换为 16 位位深度的 PCM 数据
    const pcm16Data = convertFloat32ToInt16(inputData)
    // 发送二进制的PCM数据给 WebSocket
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(pcm16Data)
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

const requestMicPermission = async () => {
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
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    console.log('Microphone permission granted')
    ElMessage.success('麦克风权限已获取')
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('无法获取麦克风权限，请检查浏览器设置')
      console.error('Mic error:', err)
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
    }
  } catch (err) {
    console.error('Failed to fetch interview details:', err)
  }
}

onMounted(() => {
  requestMicPermission()
  fetchInterviewDetails()
})

onBeforeUnmount(() => {
  stopAudioCapture()
  if (socket) {
    socket.close()
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
  }
})

const onStartAsr = async () => {
  try {
    const token = localStorage.getItem('token')
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    // 使用当前宿主机的 host，让其经过 vite proxy 统一转发，免除 8001 硬编码导致的连接拒绝
    const wsUrl = `${wsProtocol}//${window.location.host}/api/asr/stream/${sessionId}?token=${token}`
    
    isAsrActive.value = true
    interviewInfo.value.status = '连接建立中...'
    interviewInfo.value.statusColor = '#409eff'

    // 根据您的要求：点击后同时请求后端接口并建立 websocket 连接 (不再用 await 阻塞)
    interviewApi.startASR(sessionId, {}).catch(err => {
      // 若 HTTP 层触发失败仅打印，因为主要交互靠 WS
      console.error('HTTP startASR 请求异常:', err)
    })

    socket = new WebSocket(wsUrl)
    
    socket.onopen = () => {
      console.log('ASR WebSocket connected')
      interviewInfo.value.status = '持续听写中...'
      // 连接成功后启动音频采集并发送
      startAudioCapture()
      ElMessage.success('ASR 识别通道已打通')
    }
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('====== 收到后端 WebSocket 流式数据 ======')
        console.log('原始数据对象:', data)
        
        // 下面是为您初步搭好的数据分流排线架子，您可以根据后端实际返回的字段名去对号入座：
        // 假设一般流式返回带一个 "type" 字段来区分是 ASR 还是大模型推流
        if (data.type === 'asr_partial') {
            console.log('🗣️ [ASR 实时推演 (候选人说)]:', data.text || data.content)
        } else if (data.type === 'asr_final') {
            console.log('✅ [ASR 截断定句 (候选人说)]:', data.text || data.content)
        } else if (data.type === 'llm_partial') {
            console.log('🤖 [LLM 逐字生成 (面试官想)]:', data.delta || data.content)
        } else if (data.type === 'llm_final') {
            console.log('🎯 [LLM 最终成句 (面试官想)]:', data.text || data.content)
        } else if (data.type === 'error') {
            console.error('❌ [服务端异常]:', data.message)
        } else {
            console.log('📡 [未知类型通道数据]:', data)
        }
      } catch (e) {
        // 若后端传的是纯 String （非JSON），走这条降级打印
        console.log('📡 [收到纯文本字符流]:', event.data)
      }
    }
    
    socket.onclose = () => {
      console.log('ASR WebSocket closed')
      isAsrActive.value = false
      interviewInfo.value.status = '等待连接'
      interviewInfo.value.statusColor = '#909399'
    }
    
    socket.onerror = (err) => {
      console.error('ASR WebSocket error:', err)
      ElMessage.error('WebSocket 存在连接异常')
      // 如果 WS 断了，为了防范后端进入僵尸态导致按钮互锁，自动替您调一次 stop 接口止损
      interviewApi.stopASR(sessionId).catch(() => {})
      isAsrActive.value = false
    }
    
  } catch (err: any) {
    ElMessage.error('启动 ASR 失败: ' + (err.message || '未知错误'))
    isAsrActive.value = false
  }
}

const onStopAsr = async () => {
  try {
    await interviewApi.stopASR(sessionId)
    stopAudioCapture()
    if (socket) {
      socket.close()
      socket = null
    }
    isAsrActive.value = false
    interviewInfo.value.status = '识别已停止'
    interviewInfo.value.statusColor = '#909399'
    ElMessage.success('ASR 识别已停止')
  } catch (err: any) {
    ElMessage.error('停止 ASR 失败: ' + (err.message || '未知错误'))
  }
}

function onManualFollowUp() {
  // TODO: 接入真正的大模型追问请求
}

function onEndInterview() {
  interviewInfo.value.status = '通话已结束'
  interviewInfo.value.statusColor = '#909399'
  // TODO: 触发结束动作
}

function onGenerateMoreSuggestions() {
  // TODO: 通过后端要求大模型根据当前上下文产出下一批发问题库
}
</script>

<style lang="scss" scoped>
.interview-assistant-page {
  min-height: 100vh;
  padding: 20px;
  background: #f4f6fb;
}

.asr-controls {
  margin-top: 16px;
  display: flex;
  gap: 12px;
}

.feishu-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 7px 16px;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  background-color: #fff;
  border-color: #dee0e3;
  color: #1f2329;
}

.feishu-btn:hover {
  background-color: #f5f6f7;
  border-color: #d0d3d6;
}

.feishu-btn:active {
  background-color: #eff0f1;
}

.feishu-btn.primary {
  background-color: #3370ff;
  border-color: #3370ff;
  color: #fff;
}

.feishu-btn.primary:hover {
  background-color: #4e83fd;
  border-color: #4e83fd;
}

.feishu-btn.primary:active {
  background-color: #2b5fe8;
  border-color: #2b5fe8;
}

.feishu-btn.danger {
  background-color: #f54a45;
  border-color: #f54a45;
  color: #fff;
}

.feishu-btn.danger:hover {
  background-color: #ff6b66;
  border-color: #ff6b66;
}

.feishu-btn.danger:active {
  background-color: #e53935;
  border-color: #e53935;
}

.page-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 18px;
  margin-top: 16px;
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 1200px) {
  .page-content {
    grid-template-columns: 1fr;
  }
}
</style>

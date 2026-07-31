<template>
  <div class="candidate-page">
    <!-- 已完成（禁止重复开始） -->
    <div v-if="pageStatus === 'waiting' && roundCompleted" class="waiting-room">
      <div class="waiting-card">
        <div class="ai-avatar">
          <div class="avatar-ring"></div>
          <div class="avatar-inner">
            <svg viewBox="0 0 80 80" width="80" height="80">
              <circle cx="40" cy="30" r="14" fill="#e8f4fd"/>
              <circle cx="40" cy="30" r="10" fill="#3370ff" opacity="0.3"/>
              <circle cx="40" cy="30" r="8" fill="#3370ff"/>
              <rect x="25" y="48" width="30" height="20" rx="10" fill="#e8f4fd"/>
              <rect x="28" y="50" width="24" height="16" rx="8" fill="#3370ff" opacity="0.15"/>
            </svg>
          </div>
        </div>
        <h2 class="waiting-title">该轮次已完成面试</h2>
        <p class="waiting-desc">本次 AI 面试已结束，无法重复开始。感谢您的参与！</p>
      </div>
    </div>

    <!-- 等候 / 启动中 -->
    <div v-else-if="pageStatus === 'waiting' || pageStatus === 'starting'" class="waiting-room">
      <div class="waiting-card">
        <div class="ai-avatar">
          <div class="avatar-ring"></div>
          <div class="avatar-inner">
            <svg viewBox="0 0 80 80" width="80" height="80">
              <circle cx="40" cy="30" r="14" fill="#e8f4fd"/>
              <circle cx="40" cy="30" r="10" fill="#3370ff" opacity="0.3"/>
              <circle cx="40" cy="30" r="8" fill="#3370ff"/>
              <rect x="25" y="48" width="30" height="20" rx="10" fill="#e8f4fd"/>
              <rect x="28" y="50" width="24" height="16" rx="8" fill="#3370ff" opacity="0.15"/>
            </svg>
          </div>
        </div>
        <h2 class="waiting-title">AI 面试</h2>
        <p class="waiting-position" v-if="interviewInfo.position_name">{{ interviewInfo.position_name }}</p>
        <p class="waiting-candidate" v-if="interviewInfo.candidate_name">
          候选人：{{ interviewInfo.candidate_name }}
        </p>
        <p class="waiting-desc">
          请确保您处于安静的环境，网络连接畅通。
          点击下方按钮后，将开始实时 AI 面试，您的语音与 AI 面试官的回复会实时显示。
        </p>

        <div class="device-check">
          <div class="check-item" :class="{ passed: micChecked }">
            <span class="check-icon">{{ micChecked ? '✅' : '⏳' }}</span>
            <span>麦克风检测</span>
          </div>
        </div>

        <button class="start-btn" :disabled="pageStatus === 'starting'" @click="handleStartInterview">
          {{ pageStatus === 'starting' ? '正在准备面试...' : '开始 AI 面试' }}
        </button>
      </div>
    </div>

    <!-- 面试进行中 -->
    <div v-else-if="pageStatus === 'interviewing' || pageStatus === 'ending'" class="interview-room">
      <div class="interview-header">
        <div class="header-left">
          <span class="header-title">AI 面试</span>
          <span class="header-pos" v-if="interviewInfo.position_name">{{ interviewInfo.position_name }}</span>
        </div>
        <div class="header-center">
          <InterviewConnectionStatus :status="connStatus" :text="connText" />
          <span class="timer">{{ timer }}</span>
        </div>
        <div class="header-right">
          <button class="pause-btn" :disabled="pageStatus === 'ending'" @click="handlePauseResume">
            {{ isPaused ? '恢复面试' : '暂停面试' }}
          </button>
          <button class="end-btn" :disabled="pageStatus === 'ending'" @click="handleEndInterview">
            {{ pageStatus === 'ending' ? '正在结束...' : '结束面试' }}
          </button>
        </div>
      </div>

      <!-- 对话区（流式实时渲染） -->
      <RealtimeConversation :messages="messages" />

      <!-- 底部状态 -->
      <div class="bottom-status">
        <div class="voice-indicator" :class="{ listening: isListening }">
          <span class="indicator-dot"></span>
          <span>{{ isListening ? '正在聆听...' : (isPaused ? '已暂停' : connText) }}</span>
        </div>
      </div>
    </div>

    <!-- 异常状态 -->
    <div v-else-if="pageStatus === 'error'" class="waiting-room">
      <div class="waiting-card">
        <h2 class="waiting-title">面试启动失败</h2>
        <p class="waiting-desc">请检查网络后重试。</p>
        <button class="start-btn" @click="resetToWaiting">返回重试</button>
      </div>
    </div>

    <!-- 面试结束弹窗 -->
    <el-dialog v-model="endDialogVisible" title="面试结束" width="400px" :close-on-click-modal="false" :show-close="false">
      <div style="text-align: center; padding: 20px 0;">
        <p style="font-size: 16px; color: #1f2329; margin: 0 0 8px;">AI 面试已结束</p>
        <p style="font-size: 14px; color: #8f959e; margin: 0;">感谢您的参与！</p>
      </div>
      <template #footer>
        <el-button type="primary" @click="handleClose">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { interviewApi } from '../../api/interview'
import { useAIInterviewRealtime } from '../../composables/useAIInterviewRealtime'
import { useRealtimeAudioCapture } from '../../composables/useRealtimeAudioCapture'
import { useRealtimeAudioPlayer } from '../../composables/useRealtimeAudioPlayer'
import RealtimeConversation from '../../components/interview/RealtimeConversation.vue'
import InterviewConnectionStatus from '../../components/interview/InterviewConnectionStatus.vue'
import type { InterviewMessage } from '../../components/interview/StreamingMessageBubble.vue'

const route = useRoute()
const token = route.params.token as string

// ========== 页面状态机 ==========
const pageStatus = ref<'waiting' | 'starting' | 'interviewing' | 'ending' | 'ended' | 'error'>('waiting')
const connStatus = ref<'idle' | 'connecting' | 'connected' | 'reconnecting' | 'ended' | 'error'>('idle')
const timer = ref('00:00')
let timerInterval: ReturnType<typeof setInterval> | null = null
let secondsElapsed = 0

const interviewInfo = ref({
  position_name: '',
  candidate_name: '',
  session_id: null as number | null,
  round_id: null as number | null,
})

const messages = ref<InterviewMessage[]>([])
const runtimeSessionId = ref('')
const candidateToken = ref('')

const endDialogVisible = ref(false)

const micChecked = ref(false)

const isPaused = ref(false)

const roundCompleted = ref(false)

// ========== 状态文本 ==========
const connText = computed(() => {
  if (connStatus.value === 'connected') return '连接正常'
  if (connStatus.value === 'connecting') return '连接中...'
  if (connStatus.value === 'reconnecting') return '连接断开，正在重连...'
  if (connStatus.value === 'error') return '连接异常'
  if (connStatus.value === 'ended') return '面试已结束'
  return '准备就绪'
})

const isListening = computed(() => {
  return connStatus.value === 'connected' && (pageStatus.value === 'interviewing') && !isPaused.value
})

// ========== composables ==========
const realtime = useAIInterviewRealtime()
const audioCapture = useRealtimeAudioCapture()
const audioPlayer = useRealtimeAudioPlayer()

// ========== 麦克风检测 ==========
async function checkMicrophone(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach((t) => t.stop())
    micChecked.value = true
    return true
  } catch {
    ElMessage.error('麦克风权限被拒绝，请在浏览器设置中允许麦克风访问')
    return false
  }
}

// ========== 统一事件处理 ==========
function applyMessage(msg: Record<string, any>) {
  const type = msg.type

  if (type === 'candidate.transcript.delta') {
    const existing = messages.value.find((m) => m.id === msg.message_id)
    if (existing) {
      // ASR interim 事件携带的是当前整段候选文本（非增量），需整体替换而非追加，避免重复
      existing.text = msg.delta
    } else {
      messages.value.push({
        id: msg.message_id,
        turnId: msg.turn_id,
        role: 'candidate',
        text: msg.delta,
        status: 'streaming',
        seqStart: msg.seq,
      })
    }
  } else if (type === 'candidate.transcript.final') {
    const existing = messages.value.find((m) => m.id === msg.message_id)
    if (existing) {
      existing.text = msg.text
      existing.status = 'completed'
      existing.seqEnd = msg.seq
    } else {
      messages.value.push({
        id: msg.message_id,
        turnId: msg.turn_id,
        role: 'candidate',
        text: msg.text,
        status: 'completed',
        seqStart: msg.seq,
        seqEnd: msg.seq,
      })
    }
  } else if (type === 'assistant.message.started') {
    messages.value.push({
      id: msg.message_id,
      turnId: msg.turn_id,
      role: 'assistant',
      text: '',
      status: 'streaming',
      seqStart: msg.seq,
    })
  } else if (type === 'assistant.text.delta') {
    const existing = messages.value.find((m) => m.id === msg.message_id)
    if (existing) {
      existing.text += msg.delta
    }
  } else if (type === 'assistant.text.done') {
    const existing = messages.value.find((m) => m.id === msg.message_id)
    if (existing) {
      existing.text = msg.text
      existing.status = 'completed'
      existing.seqEnd = msg.seq
    } else {
      messages.value.push({
        id: msg.message_id,
        turnId: msg.turn_id,
        role: 'assistant',
        text: msg.text,
        status: 'completed',
        seqStart: msg.seq,
        seqEnd: msg.seq,
      })
    }
  } else if (type === 'assistant.audio.delta') {
    // AI 面试官语音：流式播放 24kHz PCM
    audioPlayer.pushChunk(msg.delta)
  } else if (type === 'candidate.speech.started') {
    // 候选人开口，立即停掉 AI 当前语音
    audioPlayer.interrupt()
  } else if (type === 'session.ended') {
    connStatus.value = 'ended'
    pageStatus.value = 'ended'
    stopTimer()
    audioPlayer.stop()
    endDialogVisible.value = true
  } else if (type === 'error') {
    ElMessage.error(msg.message || '连接异常')
    connStatus.value = 'error'
  }
}

// ========== 开始面试 ==========
const handleStartInterview = async () => {
  if (pageStatus.value !== 'waiting') return
  pageStatus.value = 'starting'

  try {
    const micOk = await checkMicrophone()
    if (!micOk) {
      pageStatus.value = 'waiting'
      return
    }

    const joinRes = await interviewApi.candidateJoinInterview(token)
    candidateToken.value = joinRes.token
    localStorage.setItem('candidate_token', joinRes.token)
    interviewInfo.value.session_id = joinRes.session_id
    interviewInfo.value.round_id = joinRes.round_id

    const startRes = await interviewApi.aiInterviewStart(joinRes.session_id, joinRes.token)
    runtimeSessionId.value = startRes.runtime_session_id

    // 刷新复用场景：先恢复历史消息，再建立实时连接
    try {
      const hist = await interviewApi.aiInterviewMessages(
        startRes.runtime_session_id,
        startRes.message_after_seq || 0,
        joinRes.token,
      )
      messages.value = (hist.messages || []).map((m: any) => ({
        id: m.id,
        turnId: m.turn_id,
        role: m.role === 'assistant' ? 'assistant' : 'candidate',
        text: m.content || '',
        status: m.status,
        seqStart: m.seq_start,
        seqEnd: m.seq_end,
      }))
    } catch {
      // 历史拉取失败不阻塞开始
    }

    pageStatus.value = 'interviewing'
    connStatus.value = 'connecting'

    startRealtime(joinRes.token, startRes.runtime_session_id)
    await audioCapture.start((pcm) => realtime.sendAudioDelta(pcm))
    await audioPlayer.start()
    startTimer()
  } catch (e: any) {
    const detail = String(e?.detail || '')
    if (detail.includes('已完成') || detail.includes('已结束')) {
      // 该轮次已完成面试，禁止重复开始
      roundCompleted.value = true
      pageStatus.value = 'waiting'
      ElMessage.warning('该轮次已完成面试，不能重复开始')
    } else {
      pageStatus.value = 'error'
      ElMessage.error('开始面试失败: ' + (e?.detail || e?.message || '未知错误'))
    }
  }
}

function startRealtime(candidateTokenValue: string, runtimeSessionIdValue: string) {
  realtime.connect(runtimeSessionIdValue, candidateTokenValue, {
    onOpen: () => {
      connStatus.value = 'connected'
    },
    onReconnecting: () => {
      connStatus.value = 'reconnecting'
    },
    onMessage: applyMessage,
    onClose: () => {
      if (pageStatus.value !== 'ending' && pageStatus.value !== 'ended') {
        connStatus.value = 'error'
      }
    },
    onError: () => {
      connStatus.value = 'error'
    },
  })
}

// ========== 暂停 / 恢复 ==========
const handlePauseResume = async () => {
  if (pageStatus.value !== 'interviewing') return

  if (isPaused.value) {
    // 恢复
    isPaused.value = false
    await audioCapture.resume()
    audioPlayer.resume()
    try {
      await interviewApi.aiInterviewResume(runtimeSessionId.value, candidateToken.value)
    } catch {
      // 兜底失败不阻塞
    }
  } else {
    // 暂停
    isPaused.value = true
    await audioCapture.pause()
    audioPlayer.pause()
    try {
      await interviewApi.aiInterviewPause(runtimeSessionId.value, candidateToken.value)
    } catch {
      // 兜底失败不阻塞
    }
  }
}

// ========== 结束面试 ==========
const handleEndInterview = async () => {
  if (pageStatus.value !== 'interviewing') return
  pageStatus.value = 'ending'

  let confirmed = false
  try {
    await ElMessageBox.confirm('确定要结束面试吗？', '结束确认', {
      confirmButtonText: '结束面试',
      cancelButtonText: '取消',
      type: 'warning',
    })
    confirmed = true
  } catch {
    // 用户取消
  }
  if (!confirmed) {
    pageStatus.value = 'interviewing'
    return
  }

  // 停止麦克风采集与语音播放
  await audioCapture.stop()
  audioPlayer.stop()
  stopTimer()

  // 通过 WS 通知（尽力），再用 end 接口兜底关闭连接并落库
  realtime.sendEnd('candidate_submit')
  try {
    await interviewApi.aiInterviewEnd(runtimeSessionId.value, candidateToken.value)
  } catch {
    // 兜底失败不阻塞结束
  }
  realtime.close()

  pageStatus.value = 'ended'
  connStatus.value = 'ended'
  endDialogVisible.value = true
}

const handleClose = () => {
  endDialogVisible.value = false
  window.close()
}

const resetToWaiting = () => {
  pageStatus.value = 'waiting'
  connStatus.value = 'idle'
  runtimeSessionId.value = ''
}

// ========== 计时器 ==========
const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval)
  secondsElapsed = 0
  timer.value = '00:00'
  timerInterval = setInterval(() => {
    secondsElapsed++
    const mins = Math.floor(secondsElapsed / 60).toString().padStart(2, '0')
    const secs = (secondsElapsed % 60).toString().padStart(2, '0')
    timer.value = `${mins}:${secs}`
  }, 1000)
}

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

// ========== 初始化 ==========
onMounted(async () => {
  try {
    const info = await interviewApi.getCandidateInterviewInfo(token)
    interviewInfo.value.position_name = info.position_name
    interviewInfo.value.candidate_name = info.candidate_name
    interviewInfo.value.session_id = info.session_id
    interviewInfo.value.round_id = info.round_id
    roundCompleted.value = !!info.round_completed
  } catch {
    ElMessage.error('链接已失效或已过期')
  }
})

onBeforeUnmount(() => {
  audioCapture.stop()
  audioPlayer.stop()
  realtime.close()
  stopTimer()
})
</script>

<style scoped>
.candidate-page {
  height: 100vh;
  background: #f0f2f5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ===== 等候页 ===== */
.waiting-room {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
}

.waiting-card {
  background: #fff;
  border-radius: 16px;
  padding: 48px 40px;
  text-align: center;
  max-width: 440px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.ai-avatar {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid #e1eaff;
  animation: ring-pulse 3s ease-in-out infinite;
}

@keyframes ring-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.08); opacity: 0.6; }
}

.avatar-inner {
  position: relative;
  z-index: 1;
}

.waiting-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2329;
  margin: 0 0 8px;
}

.waiting-position {
  font-size: 16px;
  color: #3370ff;
  margin: 0 0 4px;
  font-weight: 500;
}

.waiting-candidate {
  font-size: 14px;
  color: #646a73;
  margin: 0 0 16px;
}

.waiting-desc {
  font-size: 13px;
  color: #8f959e;
  margin: 0 0 24px;
  line-height: 1.6;
}

.device-check {
  margin-bottom: 24px;
}

.check-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: #f5f6f7;
  border-radius: 20px;
  font-size: 13px;
  color: #646a73;
}

.check-item.passed {
  background: #e4f7eb;
  color: #13a248;
}

.start-btn {
  display: block;
  width: 100%;
  padding: 14px;
  background: #3370ff;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.start-btn:hover:not(:disabled) {
  background: #2458d9;
}

.start-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ===== 面试页 ===== */
.interview-room {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.interview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: #fff;
  border-bottom: 1px solid #dee0e3;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  display: flex;
  align-items: center;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2329;
}

.header-pos {
  font-size: 13px;
  color: #8f959e;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 12px;
}

.timer {
  font-size: 14px;
  color: #1f2329;
  font-variant-numeric: tabular-nums;
}

.pause-btn {
  padding: 6px 16px;
  background: #f0f1f5;
  color: #646a73;
  border: 1px solid #dee0e3;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  margin-right: 8px;
}

.pause-btn:hover:not(:disabled) {
  background: #e5e6eb;
}

.pause-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.end-btn {
  padding: 6px 16px;
  background: #f53f3f;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.end-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== 底部状态 ===== */
.bottom-status {
  flex-shrink: 0;
  padding: 12px 24px;
  display: flex;
  justify-content: center;
  background: #fff;
  border-top: 1px solid #dee0e3;
}

.voice-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  color: #8f959e;
}

.voice-indicator.listening {
  color: #3370ff;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #c0c4cc;
}

.voice-indicator.listening .indicator-dot {
  background: #3370ff;
  animation: pulse-dot 1.5s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}
</style>

<template>
  <div class="iq-float-container"
    :style="{ left: posX + 'px', top: posY + 'px' }"
  >
    <!-- 可拖拽浮动按钮 -->
    <div
      class="iq-float-btn"
      :class="{ loading: interviewQuestionsLoading || isStreamActive, active: panelOpen }"
      @mousedown="onDragStart"
      @touchstart.prevent="onTouchStart"
      @click="togglePanel"
    >
      <el-icon v-if="interviewQuestionsLoading || isStreamActive" class="is-loading"><Loading /></el-icon>
      <el-icon v-else><ChatDotSquare /></el-icon>
    </div>
    <!-- 浮动面板 -->
    <transition name="iq-slide">
      <div v-if="panelOpen" class="iq-float-panel" @click.stop @mousedown.stop>
        <div class="iq-panel-header">
          <span class="iq-panel-title">面试提问建议 - {{ candidateName }}</span>
          <div class="iq-panel-actions">
            <template v-if="isStreamActive">
              <el-button v-if="!isStreamPaused" text size="small" @click="pauseStreaming">
                <el-icon><VideoPause /></el-icon> 暂停
              </el-button>
              <el-button v-else text size="small" @click="resumeStreaming">
                <el-icon><VideoPlay /></el-icon> 继续
              </el-button>
            </template>
            <el-button v-else-if="questionsData.length" text size="small" @click="copyAll">全部复制</el-button>
            <el-icon class="iq-panel-close" @click="closePanel"><Close /></el-icon>
          </div>
        </div>
        <div class="iq-panel-body">
          <div v-if="interviewQuestionsLoading && !isStreamActive" class="iq-stream-init">
            <span class="iq-stream-label">正在启动生成...</span>
          </div>
          <div v-else-if="isStreamActive || (streamingText && !questionsData.length)" class="iq-stream-area">
            <div class="iq-stream-text" :class="{ paused: isStreamPaused }">
              {{ streamingText }}<span v-if="isStreamActive && !streamingDone" class="iq-cursor">|</span>
            </div>
          </div>
          <div v-else-if="questionsData.length" class="iq-questions-area">
            <div v-for="(item, idx) in questionsData" :key="idx" class="iq-section">
              <div class="iq-project">{{ item.project }}</div>
              <div v-for="(q, qi) in item.questions" :key="qi" class="iq-item" @click="copyText(q)">
                <span class="iq-num">{{ qi + 1 }}.</span>
                <span class="iq-text">{{ q }}</span>
                <el-icon class="iq-copy"><CopyDocument /></el-icon>
              </div>
            </div>
          </div>
          <div v-else-if="streamingDone && !questionsData.length" class="iq-empty">
            <p>暂无项目数据，无法生成面试问题</p>
          </div>
        </div>
        <div class="iq-panel-input">
          <el-input
            v-model="instruction"
            placeholder="输入额外要求后重新生成，如：侧重系统设计..."
            :disabled="isStreamActive || interviewQuestionsLoading"
            @keyup.enter="regenerate"
          >
            <template #append>
              <el-button :loading="isStreamActive" @click="regenerate">生成</el-button>
            </template>
          </el-input>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { resumeApi } from '../api/resume'
import { Close, ChatDotSquare, CopyDocument, Loading, VideoPause, VideoPlay } from '@element-plus/icons-vue'

const props = defineProps({
  resumeId: { type: [Number, String], default: null },
  candidateName: { type: String, default: '' },
})

const panelOpen = ref(false)
const interviewQuestionsLoading = ref(false)
const isStreamActive = ref(false)
const isStreamPaused = ref(false)
const streamingText = ref('')
const streamingDone = ref(false)
const questionsData = ref([])
const instruction = ref('')
const streamId = ref(null)
let abortController = null

// ========== 拖拽逻辑 ==========
const posX = ref(24)
const posY = ref(24)
let dragging = false
let dragStartX = 0
let dragStartY = 0
let originX = 0
let originY = 0

const onDragStart = (e) => {
  dragging = false
  dragStartX = e.clientX
  dragStartY = e.clientY
  originX = posX.value
  originY = posY.value
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}

const onDragMove = (e) => {
  const dx = e.clientX - dragStartX
  const dy = e.clientY - dragStartY
  if (Math.sqrt(dx * dx + dy * dy) > 5) {
    dragging = true
  }
  if (!dragging) return
  posX.value = Math.max(0, originX + dx)
  posY.value = Math.max(0, originY + dy)
}

const onDragEnd = () => {
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
}

const onTouchStart = (e) => {
  const touch = e.touches[0]
  if (!touch) return
  dragging = false
  dragStartX = touch.clientX
  dragStartY = touch.clientY
  originX = posX.value
  originY = posY.value
  document.addEventListener('touchmove', onTouchMove)
  document.addEventListener('touchend', onTouchEnd)
}

const onTouchMove = (e) => {
  const touch = e.touches[0]
  if (!touch) return
  const dx = touch.clientX - dragStartX
  const dy = touch.clientY - dragStartY
  if (Math.sqrt(dx * dx + dy * dy) > 5) {
    dragging = true
  }
  if (!dragging) return
  posX.value = Math.max(0, originX + dx)
  posY.value = Math.max(0, originY + dy)
}

const onTouchEnd = () => {
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onTouchEnd)
}

function wasDragged() {
  const d = dragging
  dragging = false
  return d
}

async function togglePanel() {
  if (wasDragged()) return
  if (isStreamActive.value || interviewQuestionsLoading.value) return
  if (!panelOpen.value) {
    if (!props.resumeId) {
      ElMessage.warning('未关联简历，无法生成面试题')
      return
    }
    if (!questionsData.value.length && !streamingDone.value) {
      const cached = await loadCachedQuestions()
      if (cached) {
        // 已有缓存，直接显示
      } else {
        startStreaming(props.resumeId, '')
      }
    }
  }
  panelOpen.value = !panelOpen.value
}

// ========== 流式逻辑 ==========
async function loadCachedQuestions() {
  if (!props.resumeId || questionsData.value.length) return
  try {
    const res = await resumeApi.getCachedInterviewQuestions(props.resumeId)
    if (res?.questions?.length) {
      questionsData.value = res.questions
      streamingDone.value = true
      return true
    }
  } catch (e) {
    // 无缓存，忽略
  }
  return false
}

function cancelStream() {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
  if (streamId.value) {
    resumeApi.cancelStream(streamId.value).catch(() => {})
    streamId.value = null
  }
}

function resetState() {
  interviewQuestionsLoading.value = false
  isStreamActive.value = false
  isStreamPaused.value = false
  streamingText.value = ''
  streamingDone.value = false
}

function startSseConnection(sid) {
  const token = localStorage.getItem('token')
  abortController = new AbortController()

  let textBuffer = ''
  let rafScheduled = false

  function flushTextBuffer() {
    if (textBuffer) {
      streamingText.value += textBuffer
      textBuffer = ''
    }
    rafScheduled = false
  }

  fetchEventSource(`/api/stream/${sid}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'text/event-stream'
    },
    signal: abortController.signal,
    openWhenHidden: true,
    onmessage(event) {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'token') {
          textBuffer += data.content
          if (!rafScheduled) {
            rafScheduled = true
            requestAnimationFrame(flushTextBuffer)
          }
        } else if (data.type === 'done') {
          streamingDone.value = true
          isStreamActive.value = false
          interviewQuestionsLoading.value = false
          if (data.result?.questions) {
            questionsData.value = data.result.questions
          }
          streamId.value = null
          abortController = null
        } else if (data.type === 'error') {
          ElMessage.error('生成失败: ' + (data.message || ''))
          isStreamActive.value = false
          interviewQuestionsLoading.value = false
          streamingDone.value = true
        }
      } catch (e) { /* ignore parse errors */ }
    },
    onerror() {
      if (!streamingDone.value) {
        ElMessage.error('流式连接中断')
      }
      isStreamActive.value = false
      interviewQuestionsLoading.value = false
      streamId.value = null
      abortController = null
    }
  })
}

async function startStreaming(rid, instr) {
  cancelStream()
  resetState()
  interviewQuestionsLoading.value = true
  try {
    const res = await resumeApi.startInterviewQuestionsStream(rid, instr)
    streamId.value = res.stream_id
    interviewQuestionsLoading.value = false
    isStreamActive.value = true
    startSseConnection(res.stream_id)
  } catch (e) {
    ElMessage.error('生成面试题失败')
    interviewQuestionsLoading.value = false
    streamingDone.value = true
  }
}

function closePanel() {
  cancelStream()
  resetState()
  panelOpen.value = false
}

function regenerate() {
  if (isStreamActive.value || !props.resumeId) return
  questionsData.value = []
  streamingDone.value = false
  startStreaming(props.resumeId, instruction.value)
}

async function pauseStreaming() {
  if (!streamId.value) return
  try {
    await resumeApi.pauseStream(streamId.value)
    isStreamPaused.value = true
  } catch (e) {
    ElMessage.error('暂停失败')
  }
}

async function resumeStreaming() {
  if (!streamId.value) return
  try {
    await resumeApi.resumeStream(streamId.value)
    isStreamPaused.value = false
  } catch (e) {
    ElMessage.error('恢复失败')
  }
}

function copyText(text) {
  navigator.clipboard.writeText(text)
  ElMessage.success('已复制')
}

function copyAll() {
  const text = questionsData.value
    .map(item => '【' + item.project + '】\n' + item.questions.map((q, i) => (i + 1) + '. ' + q).join('\n'))
    .join('\n\n')
  navigator.clipboard.writeText(text)
  ElMessage.success('已全部复制')
}

onBeforeUnmount(() => {
  cancelStream()
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onTouchEnd)
})
</script>

<style scoped>
.iq-float-container {
  position: fixed;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  pointer-events: none;
}
.iq-float-container > * {
  pointer-events: auto;
}
.iq-float-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #3370ff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  box-shadow: 0 4px 14px rgba(51,112,255,.35);
  transition: all .25s ease;
  position: relative;
  user-select: none;
}
.iq-float-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 20px rgba(51,112,255,.45);
}
.iq-float-btn:active {
  cursor: grabbing;
}
.iq-float-btn.loading {
  animation: iq-pulse 1.5s ease infinite;
}
.iq-float-btn.active {
  background: #2b5cdb;
}
.iq-float-btn .el-icon {
  font-size: 22px;
}
.iq-float-btn .is-loading {
  animation: rotating 1s linear infinite;
}
@keyframes iq-pulse {
  0%, 100% { box-shadow: 0 4px 14px rgba(51,112,255,.35); }
  50% { box-shadow: 0 4px 24px rgba(51,112,255,.55); }
}
@keyframes rotating {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.iq-float-panel {
  position: absolute;
  bottom: 60px;
  right: 0;
  width: 420px;
  max-height: 500px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.iq-slide-enter-active,
.iq-slide-leave-active {
  transition: all .25s ease;
}
.iq-slide-enter-from,
.iq-slide-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(.96);
}

.iq-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.iq-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2329;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.iq-panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.iq-panel-close {
  font-size: 16px;
  color: #8f959e;
  cursor: pointer;
  transition: color .15s;
}
.iq-panel-close:hover {
  color: #1f2329;
}

.iq-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  min-height: 80px;
}
.iq-empty {
  text-align: center;
  padding: 32px 0;
  color: #8f959e;
  font-size: 14px;
}

.iq-section {
  margin-bottom: 16px;
}
.iq-section:last-child { margin-bottom: 0; }
.iq-project {
  font-size: 14px;
  font-weight: 600;
  color: #1f2329;
  padding: 6px 0 4px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 6px;
}
.iq-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}
.iq-item:hover { background: #f5f7ff; }
.iq-item:hover .iq-copy { opacity: 1; }
.iq-num {
  flex-shrink: 0;
  font-size: 13px;
  color: #3370ff;
  font-weight: 500;
}
.iq-text {
  flex: 1;
  font-size: 14px;
  color: #1f2329;
  line-height: 1.5;
}
.iq-copy {
  flex-shrink: 0;
  font-size: 14px;
  color: #8f959e;
  opacity: 0;
  transition: opacity 0.15s;
}

.iq-panel-input {
  flex-shrink: 0;
  border-top: 1px solid #f0f0f0;
  padding: 8px 12px;
  background: #fafafa;
}

.iq-stream-init {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
}
.iq-stream-label {
  font-size: 14px;
  color: #8f959e;
}
.iq-stream-area {
  padding: 8px 0;
}
.iq-stream-text {
  font-size: 14px;
  line-height: 1.8;
  color: #1f2329;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  max-height: 340px;
  overflow-y: auto;
}
.iq-stream-text.paused {
  opacity: 0.6;
}
.iq-cursor {
  display: inline-block;
  color: #3370ff;
  font-weight: bold;
  animation: iq-blink 0.8s step-end infinite;
}
@keyframes iq-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>

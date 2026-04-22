<template>
  <div class="transcript-card">
    <div class="card-header">
      <h2>实时语音转文本</h2>
      <div class="header-right">
        <span v-if="isListening" class="listening-indicator">
          <span class="live-dot active"></span>
          <span>识别中</span>
        </span>
        <span class="round-tag">第 {{ currentRound }} 轮提问</span>
      </div>
    </div>

    <div class="asr-text-box" ref="transcriptBodyRef">
      <p class="asr-text-content">{{ fullAsrText }}<span v-if="isListening" class="typing-cursor"></span></p>
      <p v-if="!fullAsrText && !isListening" class="asr-placeholder">暂无语音转写内容</p>
      <p v-if="!fullAsrText && isListening" class="asr-placeholder">等待语音输入...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

type TranscriptItem = {
  id: string
  label: string
  question: string
  questionAt: string
  answer: string
  answerAt: string
}

const props = defineProps<{
  conversation: TranscriptItem[]
  currentRound: number
  liveText?: string
  isListening?: boolean
  asrHistory?: string[]
}>()

// 将所有历史句子 + 当前实时文本拼接为一段连续文本
const fullAsrText = computed(() => {
  const parts: string[] = []
  if (props.asrHistory && props.asrHistory.length > 0) {
    parts.push(...props.asrHistory)
  }
  if (props.liveText) {
    parts.push(props.liveText)
  }
  return parts.join('')
})

// 自动滚动到底部
const transcriptBodyRef = ref<HTMLElement | null>(null)
const scrollToBottom = () => {
  nextTick(() => {
    if (transcriptBodyRef.value) {
      transcriptBodyRef.value.scrollTop = transcriptBodyRef.value.scrollHeight
    }
  })
}

watch(() => props.liveText, scrollToBottom)
watch(() => props.conversation.length, scrollToBottom)
watch(() => props.asrHistory?.length, scrollToBottom)
</script>

<style lang="scss" scoped>
.transcript-card {
  background: #ffffff;
  border: 1px solid #e4e9f5;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(17, 29, 63, 0.07);
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.card-header h2 {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.listening-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #f54a45;
  font-weight: 500;
}

.round-tag {
  font-size: 13px;
  color: #475467;
  padding: 4px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 9999px;
  background: #f8fafc;
}

.asr-text-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px 18px;
  flex: 1;
  min-height: 120px;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.asr-text-content {
  margin: 0;
  font-size: 15px;
  line-height: 1.8;
  color: #1e293b;
  word-break: break-word;
  white-space: pre-wrap;
}

.asr-placeholder {
  margin: 0;
  font-size: 14px;
  color: #94a3b8;
  text-align: center;
  padding: 32px 0;
}

/* ========== 指示器动效 ========== */
.live-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #909399;
  flex-shrink: 0;
}

.live-dot.active {
  background: #f54a45;
  animation: pulse-dot 1.4s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 74, 69, 0.5); }
  50% { box-shadow: 0 0 0 6px rgba(245, 74, 69, 0); }
}

.typing-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: #3370ff;
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: blink-cursor 0.8s step-end infinite;
}

@keyframes blink-cursor {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>


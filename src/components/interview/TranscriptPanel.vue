<template>
  <div class="transcript-card">
    <div class="card-header">
      <h2>实时语音转文本</h2>
      <div class="header-right">
        <span v-if="isListening" class="listening-indicator">
          <span class="live-dot active"></span>
          <span>识别中</span>
        </span>
        <!-- <span class="round-tag">第 {{ currentRound }} 轮提问</span> -->
      </div>
    </div>

    <div class="asr-text-box" ref="transcriptBodyRef">
      <!-- 已确认的历史段落 -->
      <div
        v-for="(segment, idx) in asrSegments"
        :key="idx"
        class="segment-block"
        :class="getSpeakerClass(segment.speakerId)"
      >
        <div class="speaker-label-row">
          <span class="speaker-label">{{ getSpeakerName(segment.speakerId) }}</span>
          <span class="segment-timestamp" v-if="segment.timestamp">{{ segment.timestamp }}</span>
        </div>
        <p class="segment-text">{{ segment.text }}</p>
      </div>

      <!-- 当前实时输入中的文本 -->
      <div
        v-if="liveText"
        class="segment-block live"
        :class="getSpeakerClass(liveSpeakerId)"
      >
        <div class="speaker-label-row">
          <span class="speaker-label">{{ getSpeakerName(liveSpeakerId) }}</span>
          <span class="segment-timestamp live-timestamp">now</span>
        </div>
        <p class="segment-text">{{ liveText }}<span v-if="isListening" class="typing-cursor"></span></p>
      </div>

      <!-- 空状态 -->
      <p v-if="!hasContent && !isListening" class="asr-placeholder">暂无语音转写内容</p>
      <p v-if="!hasContent && isListening" class="asr-placeholder">等待语音输入...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useScrollToBottom } from '../../composables/useScrollToBottom'

export type AsrSegment = {
  text: string
  speakerId: string | null
  timestamp?: string
}

const props = defineProps<{
  conversation: any[]
  currentRound: number
  liveText?: string
  liveSpeakerId?: string | null
  isListening?: boolean
  asrSegments?: AsrSegment[]
}>()

const hasContent = computed(() => {
  return (props.asrSegments && props.asrSegments.length > 0) || !!props.liveText
})

// 说话人颜色映射
const speakerColors: Record<string, string> = {
  '0': 'speaker-interviewer',
  '1': 'speaker-candidate',
}

const getSpeakerClass = (speakerId: string | null | undefined) => {
  if (speakerId === null || speakerId === undefined) return 'speaker-unknown'
  return speakerColors[speakerId] || 'speaker-other'
}

const getSpeakerName = (speakerId: string | null | undefined) => {
  if (speakerId === null || speakerId === undefined) return '未知'
  const num = parseInt(speakerId)
  if (num === 0) return '说话人 1'
  if (num === 1) return '说话人 2'
  return `说话人 ${num + 1}`
}

// 自动滚动到底部
const transcriptBodyRef = ref<HTMLElement | null>(null)
const { scrollToBottom } = useScrollToBottom(transcriptBodyRef)

watch(() => props.liveText, scrollToBottom)
watch(() => props.asrSegments?.length, scrollToBottom)
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
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ========== 说话人分段 ========== */
.segment-block {
  border-radius: 10px;
  padding: 10px 14px;
  transition: opacity 0.2s;
}

.segment-block.live {
  opacity: 0.85;
}

.speaker-label-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.speaker-label {
  font-size: 12px;
  font-weight: 600;
}

.segment-timestamp {
  font-size: 11px;
  font-weight: 400;
  color: #94a3b8;
  letter-spacing: 0.3px;
}

.segment-timestamp.live-timestamp {
  color: #f54a45;
  font-style: italic;
}

.segment-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: #1e293b;
  word-break: break-word;
  white-space: pre-wrap;
}

/* 说话人 1（面试官/说话人 0） */
.speaker-interviewer {
  background: #eff6ff;
  border-left: 3px solid #3b82f6;

  .speaker-label {
    color: #2563eb;
  }
}

/* 说话人 2（候选人/说话人 1） */
.speaker-candidate {
  background: #f0fdf4;
  border-left: 3px solid #22c55e;

  .speaker-label {
    color: #16a34a;
  }
}

/* 其他说话人 */
.speaker-other {
  background: #fefce8;
  border-left: 3px solid #eab308;

  .speaker-label {
    color: #ca8a04;
  }
}

/* 未知说话人 */
.speaker-unknown {
  background: #f1f5f9;
  border-left: 3px solid #94a3b8;

  .speaker-label {
    color: #64748b;
  }
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

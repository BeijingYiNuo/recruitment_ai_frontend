<template>
  <div :class="['stream-msg', message.role]">
    <div class="stream-msg-avatar">
      <img v-if="message.role === 'assistant'" src="/favicon.png" alt="AI 面试官" />
      <span v-else>👤</span>
    </div>
    <div class="stream-msg-body">
      <div class="stream-msg-label">
        {{ message.role === 'assistant' ? 'AI 面试官' : '面试者' }}
      </div>
      <div class="stream-msg-bubble">
        <div class="stream-msg-text">
          {{ message.text }}
          <span v-if="message.status === 'streaming'" class="cursor-blink">|</span>
        </div>
        <div v-if="message.status === 'interrupted'" class="stream-msg-tag">（已打断）</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface InterviewMessage {
  id: string
  turnId: string
  role: 'candidate' | 'assistant'
  text: string
  status: 'streaming' | 'completed' | 'interrupted' | 'failed'
  seqStart?: number
  seqEnd?: number
}

defineProps<{ message: InterviewMessage }>()
</script>

<style scoped>
.stream-msg {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  animation: fade-in 0.3s ease;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.stream-msg-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  background: #f0f2f5;
  overflow: hidden;
}

.stream-msg-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.stream-msg-body {
  max-width: 75%;
  min-width: 0;
}

.stream-msg-label {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
  padding-left: 4px;
}

.stream-msg.candidate .stream-msg-label {
  color: #16a34a;
}

.stream-msg.assistant .stream-msg-label {
  color: #2563eb;
}

.stream-msg-bubble {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #1f2329;
}

/* 配色与"实时语音转文本"框内分段一致：面试官蓝、候选人绿 */
.stream-msg.candidate .stream-msg-bubble {
  background: #f0fdf4;
  border-left: 3px solid #22c55e;
  border-bottom-left-radius: 4px;
}

.stream-msg.assistant .stream-msg-bubble {
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
  border-bottom-left-radius: 4px;
}

.stream-msg-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.cursor-blink {
  animation: blink 1s step-end infinite;
  color: #3370ff;
}

@keyframes blink {
  50% { opacity: 0; }
}

.stream-msg-tag {
  margin-top: 4px;
  font-size: 12px;
  color: #8f959e;
}
</style>

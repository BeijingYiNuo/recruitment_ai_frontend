<template>
  <div class="transcript-card">
    <div class="card-header">
      <h2>实时对话转写</h2>
      <span class="round-tag">第 {{ currentRound }} 轮提问</span>
    </div>

    <div class="transcript-body">
      <div v-for="item in conversation" :key="item.id" class="qa-block">
        <div class="question-row">
          <span class="question-label">{{ item.label }}</span>
          <span class="question-timestamp">{{ item.questionAt }}</span>
        </div>
        <div class="bubble question-bubble">{{ item.question }}</div>

        <div class="answer-row">
          <span class="speaker">候选人</span>
          <span class="answer-timestamp">{{ item.answerAt }}</span>
        </div>
        <div class="bubble answer-bubble">{{ item.answer }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type TranscriptItem = {
  id: string
  label: string
  question: string
  questionAt: string
  answer: string
  answerAt: string
}

defineProps<{ conversation: TranscriptItem[]; currentRound: number }>()
</script>

<style lang="scss" scoped>
.transcript-card {
  background: #ffffff;
  border: 1px solid #e4e9f5;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(17, 29, 63, 0.07);
  padding: 16px;
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

.round-tag {
  font-size: 13px;
  color: #475467;
  padding: 4px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 9999px;
  background: #f8fafc;
}

.transcript-body {
  max-height: 68vh;
  overflow-y: auto;
  padding-right: 10px;
}

.qa-block {
  margin-bottom: 18px;
}

.question-row,
.answer-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  color: #667085;
  font-size: 13px;
}

.question-label {
  background: #e0e8ff;
  color: #1d4ed8;
  border-radius: 8px;
  padding: 1px 8px;
  font-size: 12px;
  font-weight: 600;
}

.bubble {
  border-radius: 12px;
  padding: 12px 14px;
  line-height: 1.6;
  font-size: 14px;
  color: #102a43;
  border: 1px solid #dbe6f2;
}

.question-bubble {
  background: #f8fbff;
  border-color: #d9e8ff;
}

.answer-bubble {
  background: #f5f7ff;
  border-color: #d6e2ff;
}

.speaker {
  font-weight: 600;
  color: #0f172a;
}

.answer-timestamp,
.question-timestamp {
  font-size: 12px;
  color: #94a3b8;
}
</style>

<template>
  <div class="interview-assistant-page">
    <InterviewHeader
      :info="interviewInfo"
      @manualFollowUp="onManualFollowUp"
      @endInterview="onEndInterview"
    />

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
import { ref } from 'vue'
import InterviewHeader from '../components/interview/InterviewHeader.vue'
import TranscriptPanel from '../components/interview/TranscriptPanel.vue'
import FollowUpPanel from '../components/interview/FollowUpPanel.vue'
import EvaluationPanel from '../components/interview/EvaluationPanel.vue'
import { interviewInfo as mockInterviewInfo, transcriptConversation as mockTranscript, followUpQuestions as mockFollowUp, evaluationSummary as mockEvaluation } from '../data/mockInterview'

const interviewInfo = ref(mockInterviewInfo)
const transcriptConversation = ref(mockTranscript)
const followUpQuestions = ref(mockFollowUp)
const evaluationSummary = ref(mockEvaluation)

function onManualFollowUp() {
  // 触发实时追问逻辑（mock）
  followUpQuestions.value = [
    {
      id: Date.now().toString(),
      priority: '高优先级',
      title: '请你补充一下当前架构的性能监控方案。',
      description: '重点关注端到端应答时延、错误率以及实时告警策略。',
      tags: ['系统架构', '性能监控']
    },
    ...followUpQuestions.value
  ]
}

function onEndInterview() {
  interviewInfo.value.status = '已结束'
  interviewInfo.value.statusColor = '#C0C4CC'
}

function onGenerateMoreSuggestions() {
  const nextId = followUpQuestions.value.length + 1
  followUpQuestions.value = [
    ...followUpQuestions.value,
    {
      id: `sug-${nextId}`,
      priority: nextId % 2 === 0 ? '中优先级' : '高优先级',
      title: `补充问题 ${nextId}：请说明团队协作过程中的冲突解决方法。`,
      description: '可参考具体场景，并给出你的分析步骤。',
      tags: ['协作能力', '沟通技巧']
    }
  ]
}
</script>

<style lang="scss" scoped>
.interview-assistant-page {
  min-height: 100vh;
  padding: 20px;
  background: #f4f6fb;
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

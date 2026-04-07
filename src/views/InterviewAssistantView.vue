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

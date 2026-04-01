<template>
  <div class="interview-header-wrapper">
    <div class="title-block">
      <h1>AI 面试辅助分析</h1>
      <div class="status-area">
        <span class="status-dot" :style="{ backgroundColor: info.statusColor }"></span>
        <span class="status-text">{{ info.status }}</span>
        <span class="pipe">|</span>
        <span>{{ info.timer }}</span>
      </div>
      <div class="candidate-text">{{ info.candidateName }} - {{ info.candidateTitle }}</div>
    </div>

    <div class="actions">
      <el-button size="medium" type="default" class="manual-btn" @click="$emit('manualFollowUp')">手动追问</el-button>
      <el-button size="medium" type="danger" class="end-btn" @click="$emit('endInterview')">结束面试</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
type InterviewStatus = {
  status: string
  statusColor: string
  timer: string
  candidateName: string
  candidateTitle: string
}

defineProps<{ info: InterviewStatus }>()
</script>

<style lang="scss" scoped>
.interview-header-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #dce2ed;
  padding: 16px 18px;
  box-shadow: 0 2px 10px rgba(17, 29, 63, 0.07);
}

.title-block h1 {
  font-size: 24px;
  font-weight: 700;
  color: #101828;
  margin-bottom: 8px;
}

.status-area {
  margin-bottom: 4px;
  color: #475467;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.pipe {
  color: #bfc9d9;
}

.candidate-text {
  color: #667085;
  font-size: 14px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.manual-btn {
  color: #1d4ed8;
  border-color: #dbeafe;
  background: #eff6ff;
}

.end-btn {
  background: #ff4d4f;
  border-color: #ff4d4f;
  color: #ffffff;
}
</style>

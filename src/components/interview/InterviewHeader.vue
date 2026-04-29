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
      <el-button size="medium" @click="$emit('goBack')">返回</el-button>
      <el-button size="medium" type="primary" @click="$emit('startAsr')" :disabled="isAsrActive">开始面试</el-button>
      
      <el-button 
        v-if="isAsrActive && !isPaused"
        size="medium" 
        type="warning" 
        @click="$emit('pauseInterview')"
      >暂停面试</el-button>

      <el-button 
        v-if="isAsrActive && isPaused"
        size="medium" 
        type="success" 
        @click="$emit('resumeInterview')"
      >恢复面试</el-button>
      
      <el-button 
        v-if="!isRecording"
        size="medium" 
        type="warning" 
        @click="$emit('startRecording')" 
        :disabled="!isAsrActive"
        class="record-btn"
      >
        <i class="el-icon-video-camera"></i> 开始录音
      </el-button>
      <el-button 
        v-else
        size="medium" 
        type="danger" 
        @click="$emit('stopRecording')"
        class="record-btn is-recording"
      >
        <span class="record-dot"></span> 停止录音并下载
      </el-button>

      <el-button size="medium" type="danger" @click="$emit('stopAsr')" :disabled="!isAsrActive">停止面试</el-button>

      <!-- <el-button size="medium" type="default" class="manual-btn" @click="$emit('manualFollowUp')">手动追问</el-button>
      <el-button size="medium" type="danger" class="end-btn" @click="$emit('endInterview')">结束面试</el-button> -->
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

defineProps<{
  info: InterviewStatus
  isAsrActive?: boolean
  isRecording?: boolean
  isPaused?: boolean
}>()
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

.record-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 100px;
}

.is-recording {
  animation: pulse-border 2s infinite;
}

.record-dot {
  width: 8px;
  height: 8px;
  background-color: #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
}

@keyframes pulse-border {
  0% { box-shadow: 0 0 0 0 rgba(245, 63, 63, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(245, 63, 63, 0); }
  100% { box-shadow: 0 0 0 0 rgba(245, 63, 63, 0); }
}
</style>

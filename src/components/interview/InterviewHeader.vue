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

    <!-- 面试阶段进度条 -->
    <div class="stage-bar" v-if="stageInfo && stageInfo.currentIndex >= 0">
      <div class="stage-label">
        <span class="stage-current">{{ stageInfo.displayName }}</span>
        <span class="stage-progress">阶段 {{ stageInfo.currentIndex + 1 }} / {{ stageInfo.stages.length }}</span>
      </div>
      <div class="stage-steps">
        <div
          v-for="(s, i) in stageInfo.stages"
          :key="s.key"
          class="stage-step"
          :class="{
            done: i < stageInfo.currentIndex,
            current: i === stageInfo.currentIndex,
            clickable: isAsrActive
          }"
          @click="isAsrActive && $emit('stageChange', s.key)"
        >
          <div class="connector" v-if="i > 0"></div>
          <div class="stage-dot">{{ i < stageInfo.currentIndex ? '✓' : i === stageInfo.currentIndex ? '●' : '○' }}</div>
          <div class="stage-name">{{ s.name }}</div>
        </div>
      </div>
    </div>
    <!-- 阶段导航按钮 -->
    <div class="stage-nav" v-if="stageInfo && stageInfo.currentIndex >= 0 && isAsrActive">
      <el-button
        size="small"
        circle
        @click="$emit('stageChange', 'prev')"
        :disabled="stageInfo.currentIndex <= 0"
        title="上一阶段"
      >&larr;</el-button>
      <el-button
        size="small"
        circle
        @click="$emit('stageChange', 'next')"
        :disabled="stageInfo.currentIndex >= stageInfo.stages.length - 1"
        title="下一阶段"
      >&rarr;</el-button>
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

      <el-button size="medium" type="danger" @click="$emit('endInterview')" :disabled="!isAsrActive">结束面试</el-button>

      <el-button size="medium" type="default" class="manual-btn" @click="$emit('manualFollowUp')" :disabled="!isAsrActive || manualAnalysisLoading">
        <span v-if="manualAnalysisLoading" class="loading-spinner"></span>
        AI 分析
      </el-button>
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

type StageItem = {
  key: string
  name: string
}

type StageInfo = {
  stages: StageItem[]
  currentIndex: number
  displayName: string
  description: string
}

const props = defineProps<{
  info: InterviewStatus
  isAsrActive?: boolean
  isRecording?: boolean
  isPaused?: boolean
  stageInfo?: StageInfo
  meetingMode?: boolean
  manualAnalysisLoading?: boolean
}>()

defineEmits<{
  (e: 'update:meetingMode', val: boolean): void
  (e: 'stageChange', stageKey: string): void
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
  flex-wrap: wrap;
  gap: 12px;
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

.meeting-mode-toggle {
  display: flex;
  align-items: center;
  padding: 0 8px;
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

/* 阶段进度条 */
.stage-bar {
  flex: 1;
  min-width: 300px;
  max-width: 600px;
  padding: 8px 12px;
  background: #f8faff;
  border-radius: 8px;
  border: 1px solid #dbe5ff;
}

.stage-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.stage-current {
  font-weight: 600;
  font-size: 13px;
  color: #1d4ed8;
}

.stage-progress {
  font-size: 11px;
  color: #94a3b8;
}

.stage-steps {
  display: flex;
  align-items: center;
  gap: 0;
}

.stage-step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  position: relative;
}

.stage-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  background: #e2e8f0;
  color: #94a3b8;
  position: relative;
  z-index: 1;
  border: 2px solid #e2e8f0;
  transition: all 0.3s;
}

.stage-step.done .stage-dot {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.stage-step.current .stage-dot {
  background: #1d4ed8;
  color: white;
  border-color: #1d4ed8;
  box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.2);
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.2); }
  50% { box-shadow: 0 0 0 6px rgba(29, 78, 216, 0.1); }
}

.connector {
  position: absolute;
  top: 11px;
  right: 50%;
  width: 100%;
  height: 2px;
  background: #e2e8f0;
  z-index: 0;
}

.stage-step.done .connector {
  background: #10b981;
}

.stage-step.clickable {
  cursor: pointer;
}

.stage-step.clickable:hover .stage-dot {
  transform: scale(1.2);
  box-shadow: 0 0 0 4px rgba(29, 78, 216, 0.15);
}

.stage-step.clickable:hover .stage-name {
  color: #1d4ed8;
}

.stage-step:first-child .connector {
  display: none;
}

.stage-name {
  font-size: 10px;
  color: #94a3b8;
  text-align: center;
  white-space: nowrap;
}

.stage-step.current .stage-name {
  color: #1d4ed8;
  font-weight: 500;
}

.stage-step.done .stage-name {
  color: #10b981;
}

.stage-nav {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 4px;
}

.loading-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid #dbeafe;
  border-top-color: #1d4ed8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 4px;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

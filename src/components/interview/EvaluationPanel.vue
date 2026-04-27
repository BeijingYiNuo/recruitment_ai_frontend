<template>
  <div class="evaluation-card">
    <div class="card-header">
      <h2>AI 实时评价</h2>
      <p class="subtitle">对本轮回答的维度智能分析</p>
    </div>

    <div class="evaluation-body" ref="evaluationBodyRef">
      <div class="score-block">
        <!-- <div class="score-meter">
          <div class="meter-filled" :style="{ width: `${Math.min(evaluation.score * 10, 100)}%` }"></div>
        </div> -->
        
        <div v-if="evaluation.summaries && evaluation.summaries.length > 0" class="summary-list">
          <div v-for="item in evaluation.summaries" :key="item.index" class="summary-item">
            <div class="summary-content">
              <h3 class="summary-title">
                <span class="index-badge">{{ item.index }}</span>AI 评价意见
              </h3>
              <p class="score-summary">{{ item.text }}</p>
            </div>
          </div>
        </div>
        <p v-else class="score-summary">{{ evaluation.summary || '暂无大模型分析结论' }}</p>
      </div>

      <div class="metric-list">
        <div v-for="item in evaluation.metrics" :key="item.title" class="metric-row">
          <div class="metric-info">
            <span class="metric-title">{{ item.title }}</span>
            <span class="metric-text">{{ item.text }}</span>
          </div>
          <i v-if="item.level === '优秀'" class="el-icon-circle-check success"></i>
          <i v-else-if="item.level === '良好'" class="el-icon-warning-outline warning"></i>
          <i v-else class="el-icon-circle-close danger"></i>
          <span class="metric-level" :class="item.level.toLowerCase()">{{ item.level }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useScrollToBottom } from '../../composables/useScrollToBottom'

type MetricItem = {
  title: string
  text: string
  level: '优秀' | '良好' | '待提升'
}

type Evaluation = {
  score: number
  summary: string
  summaries?: { index: number; text: string }[]
  metrics: MetricItem[]
}

const props = defineProps<{ evaluation: Evaluation }>()

const evaluationBodyRef = ref<HTMLElement | null>(null)
const { scrollToBottom } = useScrollToBottom(evaluationBodyRef)

// 监听 summary 的变化，自动滚动到底部
watch(() => props.evaluation.summary, scrollToBottom)
</script>

<style lang="scss" scoped>
.evaluation-card {
  background: #ffffff;
  border: 1px solid #dbe5ff; // 同步 FollowUpPanel 边框色
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(17, 29, 63, 0.07);
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  box-sizing: border-box;
}

.card-header h2 {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
}

.subtitle {
  color: #667085;
  font-size: 13px;
  margin-bottom: 12px; // 14px -> 12px
}

.evaluation-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  // padding-right: 8px;
  scroll-behavior: smooth;
}

.score-block {
  // border: 1px solid #e2f0ff;
  // border-radius: 10px;
  // background: #f8fbff;
  // padding: 14px;
  margin-bottom: 14px;
}

// .score-meter {
//   width: 100%;
//   height: 8px;
//   background: #dbeafe;
//   border-radius: 9999px;
//   overflow: hidden;
//   margin-bottom: 16px; // 增加间距
// }

.meter-filled {
  height: 100%;
  background: linear-gradient(90deg, #22c55e 0%, #10b981 100%);
  border-radius: 9999px;
}

.summary-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  // margin-top: 12px; // 移除多余边距以对齐 FollowUpPanel
}

.summary-item {
  border: 1px solid #d6e1ff; // 同步 FollowUpPanel
  border-radius: 10px;
  padding: 12px;
  background: #f8faff; // 同步 FollowUpPanel
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.index-badge {
  display: inline-flex;
  width: 20px;
  height: 20px;
  background: #e0e8ff; // 同步 FollowUpPanel
  color: #1d4ed8; // 同步 FollowUpPanel
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 11px;
  margin-right: 8px;
  position: relative;
  top: -1px;
}

.summary-content {
  flex: 1;
  min-width: 0;
}

.summary-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px;
  line-height: 1.6;
}

.score-summary {
  color: #475467; // 同步 FollowUpPanel (#355e7d -> #475467)
  font-size: 13px;
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.6;
}

.metric-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.metric-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid #e8eff9;
  border-radius: 8px;
  padding: 10px;
  background: #ffffff;
}

.metric-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-title {
  font-weight: 600;
  color: #1e293b;
}

.metric-text {
  font-size: 12px;
  color: #64748b;
}

.metric-level {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 6px;
  margin-left: 6px;
}

.metric-level.优秀 {
  color: #047857;
  background: #d1fae5;
}

.metric-level.良好 {
  color: #b45309;
  background: #fef3c7;
}

.metric-level.待提升 {
  color: #b91c1c;
  background: #fee2e2;
}

.el-icon-circle-check.success {
  color: #16a34a;
}

.el-icon-warning-outline.warning {
  color: #d97706;
}

.el-icon-circle-close.danger {
  color: #dc2626;
}
</style>

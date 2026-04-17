<template>
  <div class="evaluation-card">
    <div class="card-header">
      <h2>AI 实时评价</h2>
      <p class="subtitle">对本轮回答的维度智能分析</p>
    </div>

    <div class="evaluation-body" ref="evaluationBodyRef">
      <div class="score-block">
        <div class="score-meter">
          <div class="meter-filled" :style="{ width: `${Math.min(evaluation.score * 10, 100)}%` }"></div>
        </div>
        
        <div v-if="evaluation.summaries && evaluation.summaries.length > 0" class="summary-list">
          <div v-for="item in evaluation.summaries" :key="item.index" class="summary-item">
            <p class="score-summary">
              <span class="index-badge">{{ item.index }}</span>{{ item.text }}
            </p>
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
import { ref, watch, nextTick } from 'vue'

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
const scrollToBottom = () => {
  nextTick(() => {
    if (evaluationBodyRef.value) {
      evaluationBodyRef.value.scrollTop = evaluationBodyRef.value.scrollHeight
    }
  })
}

// 监听 summary 的变化，自动滚动到底部
watch(() => props.evaluation.summary, scrollToBottom)
</script>

<style lang="scss" scoped>
.evaluation-card {
  background: #ffffff;
  border: 1px solid #d9e8f8;
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
  margin-bottom: 14px;
}

.evaluation-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 8px;
  scroll-behavior: smooth;
}

.score-block {
  border: 1px solid #e2f0ff;
  border-radius: 10px;
  background: #f8fbff;
  padding: 14px;
  margin-bottom: 14px;
}

.score-label {
  color: #0f172a;
  font-weight: 600;
  margin-bottom: 6px;
}

.score-value {
  font-size: 36px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
}

.score-meter {
  width: 100%;
  height: 8px;
  background: #dbeafe;
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 8px;
}

.meter-filled {
  height: 100%;
  background: linear-gradient(90deg, #22c55e 0%, #10b981 100%);
  border-radius: 9999px;
}

.summary-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.summary-item {
  margin-bottom: 12px;
}

.index-badge {
  display: inline-flex;
  width: 20px;
  height: 20px;
  background: #e2f0ff;
  color: #0369a1;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 11px;
  margin-right: 8px;
  position: relative;
  top: -1px; /* 视觉微调实现与文字中线绝对重合 */
}

.score-summary {
  color: #355e7d;
  font-size: 13px;
  margin: 0;
  white-space: pre-wrap; /* 支持换行符及连续空白 */
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

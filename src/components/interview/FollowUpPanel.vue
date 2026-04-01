<template>
  <div class="followup-card">
    <div class="card-header">
      <h2>AI 建议追问</h2>
      <p class="subtitle">基于候选人回答生成的深度提问建议</p>
    </div>

    <div class="suggestion-list">
      <div v-for="item in suggestions" :key="item.id" class="suggestion-item">
        <div class="tag-row">
          <span class="priority-chip" :class="{'high': item.priority === '高优先级', 'mid': item.priority === '中优先级'}">{{ item.priority }}</span>
        </div>
        <h3 class="suggestion-title">{{ item.title }}</h3>
        <p class="suggestion-desc">{{ item.description }}</p>
        <div class="meta-tags">
          <span v-for="t in item.tags" :key="t" class="meta-tag">{{ t }}</span>
        </div>
      </div>
    </div>

    <div class="card-footer">
      <el-button size="small" type="primary" @click="$emit('generateMore')">+ 生成更多建议</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
type Suggestion = {
  id: string
  priority: string
  title: string
  description: string
  tags: string[]
}

defineProps<{ suggestions: Suggestion[] }>()
</script>

<style lang="scss" scoped>
.followup-card {
  background: #ffffff;
  border: 1px solid #dbe5ff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(17, 29, 63, 0.07);
  padding: 16px;
}

.card-header h2 {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 13px;
  color: #667085;
  margin-bottom: 12px;
}

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 25vh;
  overflow-y: auto;
  margin-bottom: 16px;
}

.suggestion-item {
  border: 1px solid #d6e1ff;
  border-radius: 10px;
  padding: 10px;
  background: #f8faff;
}

.tag-row {
  margin-bottom: 6px;
}

.priority-chip {
  font-size: 12px;
  color: #075985;
  border-radius: 8px;
  padding: 2px 8px;
  border: 1px solid #bae6fd;
  background: #eff6ff;
}

.priority-chip.high {
  color: #0f766e;
  background: #ccfbf1;
  border-color: #2dd4bf;
}

.priority-chip.mid {
  color: #92400e;
  background: #fef3c7;
  border-color: #f59e0b;
}

.suggestion-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px;
}

.suggestion-desc {
  color: #475467;
  font-size: 13px;
  margin: 0 0 8px;
}

.meta-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.meta-tag {
  font-size: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #f8fafc;
  color: #334155;
  padding: 2px 8px;
}

.card-footer {
  text-align: center;
}
</style>

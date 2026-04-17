<template>
  <div class="followup-card">
    <div class="card-header">
      <h2>AI 建议追问</h2>
      <p class="subtitle">基于候选人回答生成的深度提问建议</p>
    </div>

    <div class="suggestion-list">
      <div v-for="(item, index) in suggestions" :key="item.id" class="suggestion-item">
        <div class="suggestion-content">
          <h3 class="suggestion-title">
            <span class="index-badge">{{ index + 1 }}</span>{{ item.title }}
          </h3>
          <p class="suggestion-desc">{{ item.description }}</p>
        </div>
      </div>
    </div>

    <!-- <div class="card-footer">
      <el-button size="small" type="primary" @click="$emit('generateMore')">+ 生成更多建议</el-button>
    </div> -->
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
  font-size: 13px;
  color: #667085;
  margin-bottom: 12px;
}

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  margin-bottom: 16px;
}

.suggestion-item {
  border: 1px solid #d6e1ff;
  border-radius: 10px;
  padding: 12px;
  background: #f8faff;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.item-left {
  flex-shrink: 0;
}

.index-badge {
  display: inline-flex;
  width: 20px;
  height: 20px;
  background: #e0e8ff;
  color: #1d4ed8;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 11px;
  margin-right: 8px;
  position: relative;
  top: -1px; /* 视觉微调实现与文字中线绝对重合 */
}

.suggestion-content {
  flex: 1;
  min-width: 0;
}

.suggestion-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px;
  line-height: 1.6;
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

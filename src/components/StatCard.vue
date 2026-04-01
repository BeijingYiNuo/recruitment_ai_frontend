<template>
  <el-card class="stat-card" shadow="never">
    <div class="stat-content">
      <div class="stat-info">
        <div class="stat-title">{{ title }}</div>
        <div class="stat-value">{{ value }}</div>
        <div class="stat-change" :class="trend">
          <span class="trend-icon">
            <el-icon v-if="trend === 'up'"><TopRight /></el-icon>
            <el-icon v-else><BottomRight /></el-icon>
          </span>
          {{ change }} <span class="compare-text">较昨日</span>
        </div>
      </div>
      <div class="stat-icon-wrapper" :style="{ backgroundColor: bgColor, color: iconColor }">
        <el-icon><component :is="icon" /></el-icon>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { TopRight, BottomRight } from '@element-plus/icons-vue'

defineProps({
  title: { type: String, required: true },
  value: { type: [String, Number], required: true },
  change: { type: String, default: '' },
  trend: { type: String, default: 'up' },
  icon: { type: [String, Object], default: 'Document' },
  bgColor: { type: String, default: '#e6f4ff' },
  iconColor: { type: String, default: '#1677ff' }
})
</script>

<style scoped lang="scss">
.stat-card {
  border-radius: 8px;
  border: none;
  height: 100%;
  box-shadow: 0 1px 2px -2px rgba(0,0,0,0.08), 0 3px 6px 0 rgba(0,0,0,0.04), 0 5px 12px 4px rgba(0,0,0,0.02);

  :deep(.el-card__body) {
    padding: 20px 24px;
  }

  .stat-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .stat-info {
    .stat-title {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 12px;
    }
    .stat-value {
      font-size: 32px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 12px;
      line-height: 1;
    }
    .stat-change {
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 2px;
      font-weight: 500;

      .trend-icon {
        display: inline-flex;
        align-items: center;
        margin-right: 2px;
      }
      .compare-text {
        color: #9ca3af;
        font-weight: normal;
        margin-left: 4px;
      }
      &.up { color: #52c41a; }
      &.down { color: #ff4d4f; }
    }
  }

  .stat-icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 24px;
  }
}
</style>

<template>
  <div class="resume-preview-card">
    <div class="card-header">
      <div class="header-left">
        <el-icon><Document /></el-icon>
        <h2>候选人简历预览</h2>
      </div>
      <div class="header-right">
        <el-button 
          v-if="url" 
          type="primary" 
          link 
          @click="openInNewTab"
          title="在新标签页打开"
        >
          <el-icon><TopRight /></el-icon>
        </el-button>
      </div>
    </div>

    <div class="preview-body" v-loading="loading">
      <iframe
        v-if="url"
        :src="url"
        class="resume-iframe"
        frameborder="0"
      ></iframe>
      
      <div v-else-if="!loading" class="empty-state">
        <el-icon :size="48" color="#94a3b8"><DocumentDelete /></el-icon>
        <p>暂无关联简历或预览不可用</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Document, DocumentDelete, TopRight } from '@element-plus/icons-vue'

const props = defineProps<{
  url: string | null
  loading: boolean
}>()

const openInNewTab = () => {
  if (props.url) {
    window.open(props.url, '_blank')
  }
}
</script>

<style lang="scss" scoped>
.resume-preview-card {
  background: #ffffff;
  border: 1px solid #e4e9f5;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(17, 29, 63, 0.07);
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  flex-shrink: 0;

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .el-icon {
      font-size: 20px;
      color: #3370ff;
    }
    
    h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
    }
  }
}

.preview-body {
  flex: 1;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  min-height: 200px;
}

.resume-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #64748b;
  
  p {
    margin: 0;
    font-size: 14px;
  }
}
</style>

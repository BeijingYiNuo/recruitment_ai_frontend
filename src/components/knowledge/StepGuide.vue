<template>
  <div class="step-guide-container">
    <div class="step-header">
      <el-button link class="collapse-btn">
        收起教程 <el-icon class="el-icon--right"><ArrowUp /></el-icon>
      </el-button>
    </div>
    <div class="step-list">
      <!-- Step 1 -->
      <div class="step-card active">
        <div class="step-content">
          <div class="step-num">第 1 步</div>
          <div class="step-title">创建知识库</div>
          <div class="step-desc">按特定场景/领域管理知识库，支持结构化和非结构化类型知识库</div>
        </div>
        <div class="step-bg-icon">
          <div class="mock-bg-blocks">
             <!-- mock background decoration -->
             <div class="block-l"></div>
             <div class="block-r"></div>
          </div>
        </div>
      </div>
      
      <!-- Step 2 -->
      <div class="step-card">
        <div class="step-content">
          <div class="step-num">第 2 步</div>
          <div class="step-title">上传文档</div>
          <div class="step-desc">Excel、Pdf、飞书文档等多种文档格式，支持图片 OCR</div>
        </div>
      </div>

      <!-- Step 3 -->
      <div class="step-card">
        <div class="step-content">
          <div class="step-num">第 3 步</div>
          <div class="step-title">检索问答</div>
          <div class="step-desc">基于知识库，通过切片检索及大模型问答，调试检查回答效果</div>
        </div>
      </div>

      <!-- Step 4 -->
      <div class="step-card">
        <div class="step-content">
          <div class="step-num">第 4 步</div>
          <div class="step-title">API 调用</div>
          <div class="step-desc">调用 API 集成到你的生产业务，实现端到端知识问答</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowUp } from '@element-plus/icons-vue'
</script>

<style lang="scss" scoped>
.step-guide-container {
  background-color: #f7f9fc;
  border: 1px solid #e5e8ef;
  border-radius: 8px;
  padding: 16px 24px 24px;
  margin-bottom: 24px;
}

.step-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
  
  .collapse-btn {
    font-size: 13px;
    color: #4e5969;
    
    &:hover {
      color: #165dff;
    }
  }
}

.step-list {
  display: flex;
  gap: 20px;
}

.step-card {
  flex: 1;
  background-color: #ffffff;
  border-radius: 6px;
  padding: 16px;
  position: relative;
  overflow: hidden;
  border: 1px solid #f0f0f0;
  min-height: 110px;
  
  &.active {
    border-color: transparent;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    background-color: #ffffff;
  }
}

.step-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.step-num {
  font-size: 13px;
  color: #86909c;
  margin-bottom: 8px;
}

.step-title {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 8px;
}

.step-desc {
  font-size: 12px;
  color: #4e5969;
  line-height: 1.6;
  flex: 1;
}

.step-bg-icon {
  position: absolute;
  right: -10px;
  bottom: -10px;
  z-index: 1;
  width: 80px;
  height: 80px;
  background: rgba(22, 93, 255, 0.05);
  border-radius: 8px;
  transform: rotate(-10deg);
  display: flex;
  justify-content: center;
  align-items: center;
  
  .mock-bg-blocks {
    display: flex;
    gap: 4px;
    opacity: 0.2;
    .block-l {
      width: 12px;
      height: 24px;
      background: #165dff;
      border-radius: 2px;
    }
    .block-r {
      width: 24px;
      height: 24px;
      background: #165dff;
      border-radius: 2px;
    }
  }
}
</style>

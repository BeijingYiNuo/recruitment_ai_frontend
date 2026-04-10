<template>
  <div class="header-bar">
    <div class="header-top">
      <div class="header-left">
        <el-icon class="back-icon"><ArrowLeft /></el-icon>
        <span class="title">知识库</span>
      </div>
      <div class="header-right">
        <el-button link class="action-btn">
          <el-icon><Monitor /></el-icon> 监控
        </el-button>
        <el-button link class="action-btn">
          <el-icon><Key /></el-icon> API Key
        </el-button>
        <el-dropdown trigger="click">
          <el-button link class="action-btn dropdown-btn">
            账单与退订 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>查看账单</el-dropdown-item>
              <el-dropdown-item>服务退订</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    <div class="header-desc">
      知识库是火山引擎推出的检索增强生成 (RAG) 服务，支持全模态数据：富文本、表格、图片、视频等，通过向量化检索实现跨模态精准召回。结合大模型推理，为企业客户提供更准确、专业、丰富的问答效果。
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, Monitor, Key, ArrowDown } from '@element-plus/icons-vue'
</script>

<style lang="scss" scoped>
.header-bar {
  background-color: transparent;
  margin-bottom: 24px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .back-icon {
    font-size: 16px;
    color: #4e5969;
    cursor: pointer;
    font-weight: bold;
    
    &:hover {
      color: #1d2129;
    }
  }

  .title {
    font-size: 20px;
    font-weight: 600;
    color: #1d2129;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;

  .action-btn {
    color: #4e5969;
    font-size: 14px;
    
    // reset el-button link padding
    padding: 4px 8px;
    height: auto;
    
    &:hover {
      color: #165dff;
    }
    
    .el-icon {
      margin-right: 4px;
      font-size: 16px;
    }
  }
  
  .dropdown-btn {
    .el-icon--right {
      margin-right: 0;
      margin-left: 4px;
      font-size: 12px;
    }
  }
}

.header-desc {
  font-size: 13px;
  color: #86909c;
  line-height: 1.6;
  max-width: 90%;
}
</style>

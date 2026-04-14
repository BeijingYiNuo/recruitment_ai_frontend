<template>
  <div class="detail-header-container">
    <!-- Breadcrumb -->
    <div class="breadcrumb" @click="goBack">
      <el-icon><ArrowLeft /></el-icon>
      <span>返回知识库列表</span>
    </div>

    <!-- Main Header -->
    <div class="main-header">
      <div class="header-content">
        <!-- Title Row -->
        <div class="title-row">
          <div class="kb-icon">
            <el-icon><Document /></el-icon>
          </div>
          <h1 class="kb-title">{{ info?.name || '未命名知识库' }}</h1>
          <div class="status-tag" v-if="info?.enabled !== false">
            <span class="dot"></span>
            已启用
          </div>
          <div class="status-tag disabled" v-else>
            <span class="dot bg-gray"></span>
            未启用
          </div>
        </div>

        <!-- Meta Info Row -->
        <div class="meta-row">
          <div class="meta-item">
            <span class="label">ID:</span>
            <span class="value">{{ info?.id }}</span>
            <el-icon class="copy-icon"><CopyDocument /></el-icon>
          </div>
          <div class="divider"></div>
          <div class="meta-item">
            <span class="label">角色:</span>
            <span class="value fw-500">{{ info?.role || '无' }}</span>
          </div>
          <div class="divider"></div>
          <div class="meta-item">
            <span class="label">User_ID:</span>
            <span class="value">{{ info?.user_id }}</span>
          </div>
          <div class="divider"></div>
          <div class="meta-item">
            <span class="label">更新时间:</span>
            <span class="value">{{ info?.updated_at ? info.updated_at.replace('T', ' ') : '-' }}</span>
          </div>
          <div class="divider"></div>
          <div class="meta-item">
            <span class="label">切片策略:</span>
            <span class="value fw-500">{{ info?.chunking_strategy || '-' }}</span>
          </div>
          <div class="divider"></div>
          <div class="meta-item">
            <span class="label">描述:</span>
            <span class="value">{{ info?.description || '-' }}</span>
          </div>
          <div class="divider"></div>
          <div class="meta-item">
            <span class="label">版本:</span>
            <span class="value fw-500">v{{ info?.version || '1' }}</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <!-- <div class="header-actions">
        <el-button class="icon-btn"><el-icon><MoreFilled /></el-icon></el-button>
        <el-button class="service-btn">服务管理</el-button>
      </div> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft, Document, CopyDocument, EditPen, MoreFilled } from '@element-plus/icons-vue'

const props = defineProps<{
  info: any
}>()

const router = useRouter()

const goBack = () => {
  router.push('/dashboard/knowledge-base')
}
</script>

<style lang="scss" scoped>
.detail-header-container {
  background-color: #ffffff;
  padding: 16px 24px;
}

.breadcrumb {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #86909c;
  cursor: pointer;
  margin-bottom: 20px;
  
  &:hover {
    color: #165dff;
  }
  
  .el-icon {
    font-size: 12px;
  }
}

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .kb-icon {
    width: 32px;
    height: 32px;
    background-color: #165dff;
    border-radius: 6px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #ffffff;
    font-size: 18px;
  }
  
  .kb-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #1d2129;
  }
  
  .status-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 8px;
    background-color: #e8f7e8;
    color: #00b42a;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    
    .dot {
      width: 6px;
      height: 6px;
      background-color: #00b42a;
      border-radius: 50%;
      
      &.bg-gray {
        background-color: #86909c;
      }
    }
  }
  
  .status-tag.disabled {
    color: #86909c;
    background-color: #f2f3f5;
  }
}

.meta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  
  .meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #4e5969;
    
    .label {
      color: #86909c;
    }
    
    .value {
      color: #1d2129;
      &.fw-500 {
        font-weight: 500;
      }
    }
    
    .copy-icon, .edit-icon {
      color: #86909c;
      cursor: pointer;
      font-size: 14px;
      margin-left: 2px;
      
      &:hover {
        color: #165dff;
      }
    }
  }
  
  .divider {
    width: 1px;
    height: 12px;
    background-color: #e5e6eb;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .icon-btn {
    padding: 8px;
    border-color: #e5e6eb;
    color: #4e5969;
    
    &:hover {
      border-color: #165dff;
      color: #165dff;
    }
  }
  
  .service-btn {
    background-color: #f2f3f5;
    border: none;
    color: #1d2129;
    font-weight: 500;
    
    &:hover {
      background-color: #e5e6eb;
    }
  }
}
</style>

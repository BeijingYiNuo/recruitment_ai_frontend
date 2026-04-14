<template>
  <div class="knowledge-card" @click="goToDetail">
    <div class="card-header">
      <div class="header-main">
        <div class="kb-icon">
          <el-icon><Document /></el-icon>
        </div>
        <div class="kb-info">
          <div class="kb-title">{{ kb.name }}</div>
          <div class="kb-subinfo">
            <span class="kb-id" :title="kb.creator || kb.id">{{ kb.creator || kb.id }}</span>
            <span class="divider">于</span>
            <span class="kb-time">{{ kb.createTime }}</span>
          </div>
        </div>
      </div>
      <div class="header-tags">
        <!-- <div class="tag-free-days">
          <el-icon><Lightning /></el-icon> 免费剩余 28 天
        </div> -->
        <el-button type="primary" link @click.stop="handleEdit" class="edit-btn" style="margin-left: 8px; font-size: 16px;">
          <el-icon><EditPen /></el-icon>
        </el-button>
        <el-button type="danger" link @click.stop="handleDelete" class="delete-btn" style="margin-left: 4px; font-size: 16px;">
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </div>

    <div class="card-stats">
      <div class="stat-item">
        <div class="stat-value">免费版</div>
        <div class="stat-label">知识库类型</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ kb.docs || 0 }}</div>
        <div class="stat-label">文档数量</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ kb.segments || 0 }}</div>
        <div class="stat-label">切片数量</div>
      </div>
    </div>

    <!-- <div class="card-footer">
      <div class="footer-action">
        <el-icon><Lock /></el-icon> 共享设置：免费版无需计费
      </div>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { Document, Lightning, Lock, Delete, EditPen } from '@element-plus/icons-vue'

import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { knowledgeApi } from '../../api/knowledge.js'

const emit = defineEmits(['deleted', 'updated'])

interface KBProps {
  id: string
  name: string
  creator?: string
  createTime?: string
  docs?: number
  segments?: number
  [key: string]: any
}

const props = defineProps<{
  kb: KBProps
}>()

const router = useRouter()

const goToDetail = () => {
  if (props.kb?.name) {
    router.push({ name: 'knowledgeBaseDetail', params: { id: props.kb.name } })
  }
}

const handleEdit = () => {
  ElMessageBox.prompt('请输入新的知识库描述', '修改知识库描述', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: props.kb.description || ''
  }).then(async ({ value }) => {
    try {
      await knowledgeApi.updateCollection(props.kb.name, value)
      ElMessage.success('更新成功')
      emit('updated')
    } catch (error) {
      if (error.response?.data?.message) {
        ElMessage.error(error.response.data.message)
      } else {
        ElMessage.error(error.message || '更新失败')
      }
    }
  }).catch(() => {})
}

const handleDelete = () => {
  ElMessageBox.confirm('确定要删除知识库 ' + props.kb.name + ' 吗？', '删除知识库', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await knowledgeApi.deleteCollection(props.kb.name)
      ElMessage.success('已删除知识库')
      emit('deleted')
    } catch (error) {
      if (error.response?.data?.message) {
        ElMessage.error(error.response.data.message)
      } else {
        ElMessage.error(error.message || '删除失败')
      }
    }
  }).catch(() => {})
}
</script>

<style lang="scss" scoped>
.knowledge-card {
  background: #ffffff;
  border: 1px solid #e5e8ef;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    border-color: #165dff;
    box-shadow: 0 4px 16px rgba(22, 93, 255, 0.1);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.kb-icon {
  width: 44px;
  height: 44px;
  background: #165dff;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  font-size: 24px;
}

.kb-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kb-title {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
}

.kb-subinfo {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #86909c;
  
  .kb-id {
    max-width: 120px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .divider {
    margin: 0 6px;
    color: #c9cdd4;
  }
}

.header-tags {
  .tag-free-days {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background-color: #e8f7e8;
    color: #00b42a;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }
}

.card-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  
  .stat-value {
    font-size: 16px;
    font-weight: 600;
    color: #1d2129;
  }
  
  .stat-label {
    font-size: 12px;
    color: #86909c;
  }
}

.card-footer {
  border-top: 1px dashed #e5e8ef;
  padding-top: 16px;
  
  .footer-action {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #86909c;
    
    .el-icon {
      font-size: 14px;
    }
  }
}
</style>

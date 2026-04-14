<template>
  <div class="knowledge-base-page">
    <HeaderBar />
    
    <StepGuide />
    
    <div class="main-content">
      <div class="toolbar">
        <div class="toolbar-left">
          <CreateButton @create="showCreateDialog" />
          <span class="count-text">共 {{ filteredList.length }} 个知识库</span>
        </div>
        
        <!-- <div class="toolbar-right">
          <el-input 
            v-model="searchKeyword" 
            placeholder="搜索知识库名称" 
            clearable 
            class="search-input"
            :prefix-icon="Search"
          />
        </div> -->
      </div>
      
      <KnowledgeList 
        :list="filteredList" 
        :loading="loading" 
        @deleted="loadKnowledgeBaseList"
        @updated="loadKnowledgeBaseList"
      />
    </div>

    <!-- Create Knowledge Base Dialog -->
    <CreateKnowledgeBaseDialog ref="createDialogRef" @success="handleCreateSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { knowledgeApi } from '../../api/knowledge.js'

// Import newly split components
import HeaderBar from '../../components/knowledge/HeaderBar.vue'
import StepGuide from '../../components/knowledge/StepGuide.vue'
import CreateButton from '../../components/knowledge/CreateButton.vue'
import KnowledgeList from '../../components/knowledge/KnowledgeList.vue'
import CreateKnowledgeBaseDialog from '../../components/knowledge/CreateKnowledgeBaseDialog.vue'

const createDialogRef = ref(null)
const searchKeyword = ref('')
const loading = ref(false)

const kbList = ref<any[]>([])

const filteredList = computed(() => {
  if (!searchKeyword.value) {
    return kbList.value
  }
  const q = searchKeyword.value.toLowerCase()
  return kbList.value.filter(kb => kb.name.toLowerCase().includes(q))
})

// 加载知识库列表
const loadKnowledgeBaseList = async () => {
  try {
    loading.value = true
    const response = await knowledgeApi.getCollections()
    let collections: any[] = []

    if (response) {
      if (response.data) {
        collections = Array.isArray(response.data) ? response.data : [response.data]
      } else if (Array.isArray(response)) {
        collections = response
      } else {
        collections = [response]
      }
    }

    // 映射数据到组件需要的格式
    kbList.value = collections.map(item => ({
      ...item,
      id: item.id,
      name: item.name,
      description: item.description,
      status: item.enabled ? '已启用' : '已禁用',
      docs: 0, // 默认值，后端可补充
      segments: 0, // 默认值，后端可补充
      appType: item.project || 'default',
      createTime: item.created_at || '2026-04-08 09:26:00', // Mock data fallback
      updateTime: item.updated_at,
      storage: '0 MB', 
      creator: item.user_id || 'root/5722手机用户',
      enabled: item.enabled,
    }))
  } catch (error) {
    console.error('加载知识库列表失败:', error)
    ElMessage.error('加载知识库列表失败')
    kbList.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadKnowledgeBaseList()
})

const showCreateDialog = () => {
  createDialogRef.value?.openDialog()
}

const handleCreateSuccess = () => {
  ElMessage.success('知识库创建成功！待更新列表...')
  loadKnowledgeBaseList()
}
</script>

<style lang="scss" scoped>
.knowledge-base-page {
  min-height: 100vh;
  background-color: #ffffff;
  padding: 24px;
}

.main-content {
  margin-top: 24px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .count-text {
      font-size: 14px;
      color: #1d2129;
    }
  }
  
  .toolbar-right {
    .search-input {
      width: 260px;
      
      :deep(.el-input__wrapper) {
        background-color: #f2f3f5;
        border-radius: 6px;
        box-shadow: none;
        
        &.is-focus {
          box-shadow: 0 0 0 1px #165dff inset;
          background-color: #ffffff;
        }
      }
    }
  }
}
</style>

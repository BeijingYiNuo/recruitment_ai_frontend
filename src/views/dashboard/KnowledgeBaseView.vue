<template>
  <div class="knowledge-base-page feishu-page">
    <div class="card-container">
      <div class="header-area">
        <div class="header-top">
          <div class="title-area">
            <h1>知识库</h1>
          </div>
          <div class="action-btn-group">
            <CreateButton @create="showCreateDialog" />
          </div>
        </div>
      </div>
      
      <div class="list-area" style="padding: 24px; flex: 1;">
        <StepGuide />
        
        <div style="margin: 16px 0;">
          <span class="count-text" style="color: #646a73; font-size: 14px; font-weight: 500;">共 {{ filteredList.length }} 个知识库</span>
        </div>
        
        <KnowledgeList 
          :list="filteredList" 
          :loading="loading" 
          @deleted="loadKnowledgeBaseList"
          @updated="loadKnowledgeBaseList"
        />
      </div>
    </div>

    <!-- Create Knowledge Base Dialog -->
    <CreateKnowledgeBaseDialog ref="createDialogRef" @success="handleCreateSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { knowledgeApi } from '../../api/knowledge.js'

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



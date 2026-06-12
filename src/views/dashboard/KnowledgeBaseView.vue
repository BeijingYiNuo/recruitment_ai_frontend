<template>
  <div class="knowledge-base-page feishu-page">
    <div class="card-container">
      <div class="header-area">
        <div class="header-top">
          <div class="title-area">
            <h1>知识库</h1>
            <span class="badge" v-if="filteredList.length > 0">{{ filteredList.length }}</span>
          </div>
          <div class="action-btn-group">
            <CreateButton @create="showCreateDialog" />
          </div>
        </div>
      </div>
      
      <div class="list-area" style="padding: 24px; flex: 1;">
        <StepGuide />
        
        <KnowledgeList
          :list="filteredList"
          :loading="loading"
          @deleted="handleDeleted"
          @updated="handleUpdated"
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
import { useKnowledgeStore } from '../../stores/knowledgeStore.js'

const knowledgeStore = useKnowledgeStore()

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

// 将原始知识库数据转换为组件所需格式
const formatCollections = (raw) => {
  const collections = raw.data ? (Array.isArray(raw.data) ? raw.data : [raw.data])
    : Array.isArray(raw) ? raw : [raw]

  collections.sort((a, b) => {
    return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
  })

  return collections.map(item => ({
    ...item,
    id: item.id,
    name: item.name,
    description: item.description,
    status: item.enabled ? '已启用' : '已禁用',
    docs: 0,
    segments: 0,
    appType: item.project || 'default',
    createTime: (item.created_at || '').replace('T', ' ').split('.')[0],
    updateTime: (item.updated_at || '').replace('T', ' ').split('.')[0],
    storage: '0 MB',
    creator: item.user_id || 'root/5722手机用户',
    enabled: item.enabled,
  }))
}

// 加载知识库列表
const loadKnowledgeBaseList = async () => {
  try {
    loading.value = true
    await knowledgeStore.getCachedCollections(async () => {
      const response = await knowledgeApi.getCollections()
      kbList.value = formatCollections(response)
      return kbList.value
    })
    // 缓存命中时从 store 恢复
    if (kbList.value.length === 0 && knowledgeStore.collections.length > 0) {
      kbList.value = knowledgeStore.collections
    }
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

const handleDeleted = () => {
  knowledgeStore.invalidateCache()
  loadKnowledgeBaseList()
}

const handleUpdated = () => {
  knowledgeStore.invalidateCache()
  loadKnowledgeBaseList()
}

const handleCreateSuccess = () => {
  knowledgeStore.invalidateCache()
  ElMessage.success('知识库创建成功！待更新列表...')
  loadKnowledgeBaseList()
}
</script>



<template>
  <div class="kb-detail-page">
    <div v-if="!kbInfo" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>

    <template v-else>
      <DetailHeader :info="kbInfo" />

      <!-- Tabs Navigation -->
      <div class="tabs-container">
        <el-tabs v-model="activeTab" class="custom-tabs">
          <el-tab-pane label="原始文档" name="original_docs" />
          <el-tab-pane label="切片详情" name="slice_details" />
          <el-tab-pane label="知识检索" name="search" />
          <el-tab-pane label="知识问答" name="qa" />
        </el-tabs>
      </div>

      <!-- Active Tab Content Area -->
      <div class="tab-content-area" :class="{ 'no-padding': activeTab === 'search' || activeTab === 'qa' }">
        <TabOriginalDocs v-if="activeTab === 'original_docs'" :knowledge-id="kbInfo.id" @viewSlices="handleViewSlices" />
        <TabSliceDetails v-if="activeTab === 'slice_details'" :collection-name="String(route.params.id)" :filter-doc-id="selectedDocId" />
        <TabKnowledgeSearch v-if="activeTab === 'search'" />
        <TabKnowledgeQA v-if="activeTab === 'qa'" />
      </div>

    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { knowledgeApi } from '../../api/knowledge.js'

import DetailHeader from '../../components/knowledge/detail/DetailHeader.vue'
import TabOriginalDocs from '../../components/knowledge/detail/TabOriginalDocs.vue'
import TabSliceDetails from '../../components/knowledge/detail/TabSliceDetails.vue'
import TabKnowledgeSearch from '../../components/knowledge/detail/TabKnowledgeSearch.vue'
import TabKnowledgeQA from '../../components/knowledge/detail/TabKnowledgeQA.vue'

const activeTab = ref('original_docs')
const kbInfo = ref<any>(null)
const route = useRoute()
const selectedDocId = ref('')

const handleViewSlices = (item: any) => {
  selectedDocId.value = item.id
  activeTab.value = 'slice_details'
}

import { watch } from 'vue'
watch(activeTab, (newVal) => {
  // 如果切出切片详情页，则重置文档过滤器，保证下次手动点击 Tab 时展示所有切片
  if (newVal !== 'slice_details') {
    selectedDocId.value = ''
  }
})

onMounted(async () => {
  try {
    const kbName = route.params.id
    const res = await knowledgeApi.getCollectionInfo(kbName as string)
    // 根据请求拦截器结构兼容返回字段
    kbInfo.value = res.data || res
  } catch (e) {
    console.error('获取知识库详情失败:', e)
  }
})
</script>

<style lang="scss" scoped>
.kb-detail-page {
  min-height: 100vh;
  background-color: #f7f8fa; // 极浅的灰色背景
  position: relative;
  overflow: hidden;
}

.tabs-container {
  background-color: #ffffff;
  padding: 0 24px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  
  .custom-tabs {
    :deep(.el-tabs__nav-wrap::after) {
      height: 0; // 隐藏默认底部细线
    }
    
    :deep(.el-tabs__item) {
      font-size: 14px;
      color: #4e5969;
      padding: 0 20px;
      height: 48px;
      line-height: 48px;
      
      &:hover {
        color: #165dff;
      }
      
      &.is-active {
        color: #165dff;
        font-weight: 500;
      }
    }
    
    :deep(.el-tabs__active-bar) {
      background-color: #165dff;
      height: 2px;
      border-radius: 1px;
    }
  }
}

.tab-content-area {
  padding: 24px 0;
  
  &.no-padding {
    padding: 0; // 搜索和问答拥有通栏布局
  }
}
</style>

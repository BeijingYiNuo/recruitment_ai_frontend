<template>
  <div class="knowledge-list-wrapper">
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="3" animated />
    </div>
    
    <div v-else-if="list.length === 0" class="empty-state">
      <el-empty description="暂无知识库，点击上面按钮开始创建" />
    </div>

    <div v-else class="kb-grid">
      <KnowledgeCard 
        v-for="kb in list" 
        :key="kb.id" 
        :kb="kb" 
        @deleted="$emit('deleted')"
        @updated="$emit('updated')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import KnowledgeCard from './KnowledgeCard.vue'

const emit = defineEmits(['deleted', 'updated'])

defineProps<{
  list: any[]
  loading?: boolean
}>()
</script>

<style lang="scss" scoped>
.knowledge-list-wrapper {
  margin-top: 16px;
}

.kb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

.empty-state {
  background: #ffffff;
  border-radius: 12px;
  padding: 40px;
  border: 1px dashed #e5e8ef;
}
</style>

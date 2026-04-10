<template>
  <el-button type="primary" class="create-btn" @click="emit('create')">
    创建知识库
  </el-button>
</template>

<script setup lang="ts">
const emit = defineEmits(['create'])
</script>

<style lang="scss" scoped>
.create-btn {
  background-color: #165dff;
  border-color: #165dff;
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 500;
  
  &:hover {
    background-color: #4080ff;
    border-color: #4080ff;
    box-shadow: 0 4px 10px rgba(22, 93, 255, 0.2);
  }
}
</style>

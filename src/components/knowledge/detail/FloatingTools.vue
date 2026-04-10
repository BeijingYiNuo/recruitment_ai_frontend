<template>
  <div class="floating-tools">
    <div class="tool-btn magic-btn" title="AI助手">
      <el-icon><MagicStick /></el-icon>
    </div>
    <div class="tool-btn" title="历史记录">
      <el-icon><Clock /></el-icon>
    </div>
    <div class="tool-btn" title="帮助文档">
      <el-icon><Reading /></el-icon>
    </div>
    <div class="tool-btn" title="回到顶部" @click="scrollToTop">
      <el-icon><ArrowUp /></el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MagicStick, Clock, Reading, ArrowUp } from '@element-plus/icons-vue'

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}
</script>

<style lang="scss" scoped>
.floating-tools {
  position: fixed;
  right: 24px;
  bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 1000;
}

.tool-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #ffffff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #4e5969;
  font-size: 18px;
  transition: all 0.3s ease;
  border: 1px solid #e5e6eb;

  &:hover {
    color: #165dff;
    border-color: #165dff;
    box-shadow: 0 6px 16px rgba(22, 93, 255, 0.15);
  }

  &.magic-btn {
    background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
    color: #ffffff;
    border: none;
    
    &:hover {
      box-shadow: 0 6px 16px rgba(124, 58, 237, 0.3);
      filter: brightness(1.1);
    }
  }
}
</style>

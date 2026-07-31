<template>
  <button class="feature-guide-btn" @click.stop="startGuide" :title="title || '点击查看功能引导'">
    <svg class="guide-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
    <span class="guide-label" v-if="label">{{ label }}</span>
  </button>
</template>

<script setup>
import { driver } from 'driver.js'

const props = defineProps({
  steps: { type: Array, required: true },
  title: { type: String, default: '' },
  label: { type: String, default: '引导' },
})

function startGuide() {
  const tour = driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    doneBtnText: '知道了',
    closeBtnText: '跳过',
    nextBtnText: '下一步',
    prevBtnText: '上一步',
    progressText: '{{current}} / {{total}}',
    steps: props.steps,
  })
  tour.drive()
}
</script>

<style scoped>
.feature-guide-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 14px;
  border: none;
  border-radius: 20px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.25s;
  flex-shrink: 0;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.35);
  animation: guidePulse 2.5s ease-in-out infinite;
}
.feature-guide-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
  animation: none;
}
.feature-guide-btn:active {
  transform: scale(0.96);
}
@keyframes guidePulse {
  0%, 100% { box-shadow: 0 2px 8px rgba(99, 102, 241, 0.35); }
  50% { box-shadow: 0 4px 20px rgba(139, 92, 246, 0.55), 0 0 0 4px rgba(99, 102, 241, 0.12); }
}
</style>

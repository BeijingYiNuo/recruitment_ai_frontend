<template>
  <span :class="['conn-status', tone]">
    <span class="conn-dot"></span>
    <span>{{ text }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: 'connecting' | 'connected' | 'reconnecting' | 'ended' | 'error' | 'idle'
  text: string
}>()

const tone = computed(() => {
  if (props.status === 'connected') return 'tone-active'
  if (props.status === 'error') return 'tone-error'
  if (props.status === 'ended') return 'tone-idle'
  return 'tone-idle'
})
</script>

<style scoped>
.conn-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  background: #f0f1f5;
  color: #646a73;
}

.conn-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #c0c4cc;
}

.tone-active {
  background: #e4f7eb;
  color: #13a248;
}

.tone-active .conn-dot {
  background: #13a248;
  animation: pulse 1.5s ease-in-out infinite;
}

.tone-error {
  background: #fde8e8;
  color: #f53f3f;
}

.tone-error .conn-dot {
  background: #f53f3f;
}

.tone-idle .conn-dot {
  background: #c0c4cc;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}
</style>

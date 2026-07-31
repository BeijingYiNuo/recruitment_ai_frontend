<template>
  <div ref="container" class="realtime-conv">
    <div class="realtime-conv-inner">
      <StreamingMessageBubble
        v-for="msg in messages"
        :key="msg.id"
        :message="msg"
      />
      <div v-if="messages.length === 0" class="realtime-conv-empty">
        面试开始后，对话将实时显示在这里
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import StreamingMessageBubble, { type InterviewMessage } from './StreamingMessageBubble.vue'

const props = defineProps<{ messages: InterviewMessage[] }>()

const container = ref<HTMLElement | null>(null)

watch(
  () => props.messages,
  () => {
    nextTick(() => {
      if (container.value) {
        container.value.scrollTop = container.value.scrollHeight
      }
    })
  },
  { deep: true },
)
</script>

<style scoped>
.realtime-conv {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.realtime-conv-inner {
  max-width: 640px;
  margin: 0 auto;
}

.realtime-conv-empty {
  text-align: center;
  color: #c0c4cc;
  font-size: 14px;
  padding: 60px 0;
}
</style>

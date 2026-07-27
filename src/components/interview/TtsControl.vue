<template>
  <div class="tts-control">
    <el-switch
      v-model="ttsEnabled"
      active-text="TTS 外放"
      inactive-text="TTS 关闭"
      @change="onToggle"
    />
    <span v-if="ttsEnabled && speaking" class="speaking-indicator">
      <span class="speaking-dot"></span> 播报中
    </span>
    <el-tooltip content="音量" placement="top">
      <el-slider
        v-if="ttsEnabled"
        v-model="ttsVolume"
        :min="0"
        :max="100"
        :step="1"
        class="volume-slider"
        @input="onVolumeChange"
      />
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  enabled: boolean
  speaking: boolean
  volume: number
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'volumeChange', vol: number): void
}>()

const ttsEnabled = ref(props.enabled)
const ttsVolume = ref(props.volume * 100)
const speaking = ref(props.speaking)

watch(() => props.enabled, (v) => { ttsEnabled.value = v })
watch(() => props.speaking, (v) => { speaking.value = v })
watch(() => props.volume, (v) => { ttsVolume.value = v * 100 })

function onToggle() {
  emit('toggle')
}

function onVolumeChange(val: number) {
  emit('volumeChange', val / 100)
}
</script>

<style scoped>
.tts-control {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 8px;
}

.speaking-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #10b981;
}

.speaking-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse-tts 1s ease-in-out infinite;
}

@keyframes pulse-tts {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}

.volume-slider {
  width: 80px;
}
</style>

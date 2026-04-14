<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="title"
    width="80%"
    top="5vh"
    destroy-on-close
    class="preview-dialog"
    @close="$emit('close')"
  >
    <div class="preview-container" v-loading="loading">
      <!-- PDF 预览 -->
      <iframe
        v-if="type === 'pdf' && url"
        :src="url"
        class="preview-iframe"
      />
      <!-- 图像预览 -->
      <div v-else-if="isImage && url" class="preview-image-wrapper">
        <img :src="url" alt="预览图" class="preview-img" />
      </div>
      <!-- 降级提示 -->
      <div v-else class="preview-fallback">
        <el-icon :size="64" color="#8F959E"><Document /></el-icon>
        <h3>该文件类型暂不支持在线预览</h3>
        <p>当前仅支持 PDF 和常用图片（PNG, JPG, GIF）的在线预览。其他文件请下载后查看。</p>
        <div class="fallback-actions">
          <el-button type="primary" class="lark-btn-primary" @click="$emit('download')">
            <el-icon style="margin-right: 6px;"><Download/></el-icon> 下载文件查看
          </el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { Document, Download } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '文件预览' },
  url: { type: String, default: '' },
  type: { type: String, default: '' },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'close', 'download'])

const isImage = computed(() => {
  return ['png', 'jpg', 'jpeg', 'gif'].includes(props.type.toLowerCase())
})
</script>

<style scoped>
/* 预览弹窗样式 */
:deep(.preview-dialog .el-dialog__body) {
  padding: 0;
  height: 80vh;
}

.preview-container {
  height: 80vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #F5F6F7;
}

.preview-iframe {
  border: none;
  width: 100%;
  height: 100%;
  flex: 1;
}

.preview-image-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 24px;
  overflow: auto;
}

.preview-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  background-color: #fff;
  border-radius: 4px;
}

.preview-fallback {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px;
  gap: 16px;
}

.preview-fallback h3 {
  margin: 0;
  font-size: 18px;
  color: #1F2329;
  font-weight: 600;
}

.preview-fallback p {
  font-size: 14px;
  color: #646A73;
  margin: 0;
  max-width: 400px;
  line-height: 1.6;
}

.fallback-actions {
  margin-top: 8px;
}

.lark-btn-primary {
  background-color: #3370FF;
  border-color: #3370FF;
  color: white;
  border-radius: 6px;
  padding: 8px 20px;
}
.lark-btn-primary:hover {
  background-color: #2458D9;
}
</style>

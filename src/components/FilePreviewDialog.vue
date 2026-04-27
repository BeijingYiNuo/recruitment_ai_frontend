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
      <!-- Markdown 预览 -->
      <div v-else-if="type === 'md' && url" class="preview-markdown" v-html="renderedMarkdown"></div>
      <!-- 降级提示 -->
      <div v-else class="preview-fallback">
        <el-icon :size="64" color="#8F959E"><Document /></el-icon>
        <h3>该文件类型暂不支持在线预览</h3>
        <p>当前仅支持 PDF、常用图片以及 Markdown 的在线预览。其他文件请下载后查看。</p>
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
import { computed, ref, watch } from 'vue'
import { Document, Download } from '@element-plus/icons-vue'
import MarkdownIt from 'markdown-it'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '文件预览' },
  url: { type: String, default: '' },
  type: { type: String, default: '' },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'close', 'download'])

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})
const renderedMarkdown = ref('')

const isImage = computed(() => {
  return ['png', 'jpg', 'jpeg', 'gif'].includes(props.type.toLowerCase())
})

// 监听 URL 变化，如果是 MD 文件则获取内容并渲染
watch(() => props.url, async (newUrl) => {
  if (props.type === 'md' && newUrl) {
    try {
      const response = await fetch(newUrl)
      const text = await response.text()
      renderedMarkdown.value = md.render(text)
    } catch (err) {
      console.error('Markdown render error:', err)
      renderedMarkdown.value = '<p style="color: red;">Markdown 解析失败</p>'
    }
  } else {
    renderedMarkdown.value = ''
  }
}, { immediate: true })
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

.preview-markdown {
  flex: 1;
  padding: 40px;
  background-color: #fff;
  overflow-y: auto;
  line-height: 1.8;
  color: #1F2329;
  font-size: 15px;
  
  :deep(h1) { font-size: 2.2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; margin-top: 1em; }
  :deep(h2) { font-size: 1.8em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; margin-top: 1em; }
  :deep(h3) { font-size: 1.5em; margin-top: 0.8em; }
  :deep(code) { background-color: #f3f4f6; padding: 2px 4px; border-radius: 4px; font-family: monospace; }
  :deep(pre) { background-color: #f8f9fa; padding: 16px; border-radius: 8px; overflow-x: auto; border: 1px solid #e5e6eb; }
  :deep(blockquote) { border-left: 4px solid #3370ff; background: #f0f4ff; margin: 0; padding: 8px 20px; color: #646a73; }
  :deep(table) { border-collapse: collapse; width: 100%; margin: 16px 0; }
  :deep(th), :deep(td) { border: 1px solid #dee0e3; padding: 8px 12px; text-align: left; }
  :deep(th) { background-color: #f5f6f7; }
  :deep(img) { max-width: 100%; border-radius: 4px; }
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

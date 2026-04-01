<template>
  <div class="modal-overlay" v-if="resume" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>简历预览: {{ resume.file_name }}</h3>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="preview-container" v-if="resume.preview_url">
          <iframe
            v-if="resume.file_type === 'pdf'"
            :src="resume.preview_url"
            class="pdf-viewer">
          </iframe>
          <div v-else class="empty-state doc-preview-notice">
            * 由于浏览器安全限制，暂不支持内联预览 Word 格式文档 ({{ resume.file_type.toUpperCase() }})。
          </div>
        </div>
        <div class="meta-data-section">
          <div class="detail-row"><span class="label">简历ID:</span> <span class="value">{{ resume.id }}</span></div>
          <div class="detail-row"><span class="label">存储路径:</span> <span class="value">{{ resume.file_path }}</span></div>
          <div class="detail-row">
            <span class="label">当前状态:</span>
            <span class="value status-badge">{{ resume.status }}</span>
          </div>
          <div class="detail-row"><span class="label">上传时间:</span> <span class="value">{{ resume.created_at }}</span></div>
        </div>
      </div>
      <div class="modal-footer">
        <el-button @click="$emit('close')">关闭</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  resume: { type: Object, default: null }
})

defineEmits(['close'])
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.65);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.15s ease-out;
}

.modal-content {
  background-color: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fafafa;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 26px;
  color: #999;
  cursor: pointer;
  transition: color 0.3s;
}
.close-btn:hover {
  color: #f44336;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex-grow: 1;
}

.preview-container {
  margin-bottom: 20px;
}

.pdf-viewer {
  width: 100%;
  height: 50vh;
  min-height: 400px;
  border: 1px solid #eee;
  border-radius: 6px;
  background: #f8f9fa;
}

.doc-preview-notice {
  background: #f8f9fa;
  padding: 40px 20px;
  text-align: center;
  border-radius: 6px;
  border: 1px dashed #ddd;
}

.meta-data-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  background: #fcfcfc;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.detail-row {
  display: flex;
  align-items: center;
}
.detail-row .label {
  font-weight: 500;
  color: #888;
  width: 70px;
  flex-shrink: 0;
  font-size: 13px;
}
.detail-row .value {
  color: #333;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  background-color: #fafafa;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>

<template>
  <div class="file-manager feishu-page">
    <div class="card-container">
      
      <!-- 标准顶部操作栏 -->
      <div class="header-area">
        <div class="header-top">
          <div class="title-area">
            <h1>文件管理</h1>
            <span class="badge" v-if="files.length > 0">{{ files.length }}</span>
          </div>
          <div class="action-btn-group">
            <el-button type="primary" class="lark-btn-primary" @click="uploadDialogVisible = true">上传文件</el-button>
          </div>
        </div>
      </div>

      <!-- 标准列表区 -->
      <div class="list-area">
        <div v-if="files.length === 0" class="empty-state">
          <div class="empty-icon-wrapper">
            <el-icon class="empty-icon"><FolderOpened /></el-icon>
          </div>
          <p class="empty-title">文件夹为空</p>
          <p class="empty-subtitle">点击左上角“上传文件”按钮添加</p>
        </div>

        <template v-else>
          <!-- 表头 -->
          <div class="list-header-row">
            <div class="col-name">文件名</div>
            <div class="col-owner">所有者</div>
            <div class="col-time">更新时间</div>
            <div class="col-size">大小</div>
          </div>

          <!-- 列表内容 -->
          <div class="list-body" style="overflow-y: auto;">
            <div 
              v-for="file in files" 
              :key="file.id"
              class="list-row file-row"
            >
              <!-- 文件名 & 图标 -->
              <div class="col-name">
                <div class="file-icon-wrapper" :style="{ color: file.iconColor }">
                  <el-icon><component :is="file.icon" /></el-icon>
                </div>
                <span class="file-name-text">{{ file.name }}</span>
              </div>
              
              <!-- 所有者 -->
              <div class="col-owner">
                <div class="owner-info">
                  <div class="owner-avatar">{{ file.owner.charAt(0) }}</div>
                  <span class="owner-name">{{ file.owner }}</span>
                </div>
              </div>

              <!-- 更新时间 -->
              <div class="col-time">{{ file.updateTime }}</div>

              <!-- 大小 & 快捷操作栏 (Hover展现) -->
              <div class="col-size has-actions">
                <span class="size-text">{{ file.size }}</span>
                
                <!-- Hover 出现的按钮组 -->
                <div class="quick-actions">
                  <button class="action-btn preview-btn" title="预览" @click.stop="handlePreview(file)">
                    <el-icon><View /></el-icon>
                  </button>
                  <button class="action-btn download-btn" title="下载" @click.stop="handleDownload(file)">
                    <el-icon><Download /></el-icon>
                  </button>
                  <button class="action-btn delete-btn" title="删除" @click.stop="deleteFile(file.id)">
                    <el-icon><Delete /></el-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 上传文件弹窗 -->
    <el-dialog v-model="uploadDialogVisible" title="新建与上传" width="480px" destroy-on-close>
      <el-form :model="uploadForm" label-position="top">
        <el-form-item label="文件类别 (file_type)" required>
          <el-select v-model="uploadForm.file_type" placeholder="请选择类别" style="width: 100%">
            <el-option label="简历 (resume)" value="resume" />
            <el-option label="语音 (voice)" value="voice" />
            <el-option label="对话 (dialogue)" value="dialogue" />
          </el-select>
        </el-form-item>
        <el-form-item label="文件" required>
          <el-upload
            class="upload-demo"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :limit="1"
            style="width: 100%"
          >
            <el-icon class="el-icon--upload"><Document /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或 <em>点击上传</em>
            </div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="isUploading" @click="submitUpload">
            确认上传
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 文件预览弹窗 -->
    <FilePreviewDialog
      v-model="previewDialogVisible"
      :title="previewTitle"
      :url="previewUrl"
      :type="previewType"
      :loading="previewLoading"
      @close="onPreviewClose"
      @download="handleDownload(previewFileData)"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, Delete,
  Document, Picture, FolderOpened, Close, MoreFilled, Download, View
} from '@element-plus/icons-vue'
import { fileApi } from '../../api/file'
import FilePreviewDialog from '../../components/FilePreviewDialog.vue'

// --- 独立组件逻辑 ---

// 1. 导航与视图状态管理
// --- 预览相关 ---
const previewDialogVisible = ref(false)
const previewLoading = ref(false)
const previewUrl = ref('')
const previewType = ref('')
const previewTitle = ref('文件预览')
const previewFileData = ref(null)



// 3. 真实拉取文件列表数据
const files = ref([])

const fetchFileList = async () => {
  try {
    const res = await fileApi.getFileList()
    const list = res.data || [] 
    
    files.value = list.map(item => {
      const ext = item.file_name?.split('.').pop()?.toLowerCase() || ''
      let fileIcon = Document
      let fileColor = '#3370FF'
      
      if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) {
        fileIcon = Picture
        fileColor = '#8F959E'
      } else if (['xls', 'xlsx', 'csv'].includes(ext)) {
        fileColor = '#10B981'
      } else if (['ppt', 'pptx'].includes(ext)) {
        fileColor = '#F59E0B'
      } else if (['pdf'].includes(ext) || item.file_type === 'resume') {
        fileColor = '#EF4444'
      }

      // 格式化文件大小
      const sizeBytes = item.file_size || 0
      const kb = sizeBytes / 1024
      const mb = kb / 1024
      const sizeStr = mb > 1 ? mb.toFixed(2) + ' MB' : kb.toFixed(2) + ' KB'
      
      // 格式化日期并且简单把 T 替换掉看着舒服些
      const timeStr = item.updated_at ? item.updated_at.replace('T', ' ') : '未知'

      return {
        id: item.id,
        name: item.file_name,
        owner: '用户 ' + (item.user_id || '-'),
        updateTime: timeStr,
        size: sizeStr,
        icon: fileIcon,
        iconColor: fileColor
      }
    })
  } catch (error) {
    console.error('获取文件列表失败:', error)
    ElMessage.error(error.message || '获取文件列表失败')
  }
}

onMounted(() => {
  fetchFileList()
})

// --- 4. 上传文件逻辑 ---
const uploadDialogVisible = ref(false)
const isUploading = ref(false)
const uploadForm = ref({
  file_type: 'resume',
  file: null
})

const handleFileChange = (uploadFile) => {
  uploadForm.value.file = uploadFile.raw
}

const handleFileRemove = () => {
  uploadForm.value.file = null
}

const submitUpload = async () => {
  if (!uploadForm.value.file) {
    ElMessage.warning('请选择需要上传的文件')
    return
  }
  if (!uploadForm.value.file_type) {
    ElMessage.warning('请选择文件类别')
    return
  }

  const formData = new FormData()
  formData.append('file', uploadForm.value.file)
  formData.append('file_type', uploadForm.value.file_type)

  isUploading.value = true
  try {
    await fileApi.uploadFile(formData)
    ElMessage.success('上传成功')
    
    uploadDialogVisible.value = false
    uploadForm.value = { file_type: 'resume', file: null }
    // 刷新列表以显示刚刚上传的文件
    fetchFileList()
  } catch (error) {
    console.error('Upload Error:', error)
    ElMessage.error(error.message || '接口调用失败，请检查后端状态')
  } finally {
    isUploading.value = false
  }
}

// --- 5. 删除文件逻辑 ---
const deleteFile = async (fileId) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该文件吗？删除后将无法恢复。',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await fileApi.deleteFile(fileId)
    ElMessage.success('删除成功')
    
    fetchFileList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error(error.message || '删除失败，请稍后重试')
    }
  }
}

const handleDownload = async (file) => {
  try {
    const response = await fileApi.downloadFile(file.id)
    
    // 创建 blob 链接并下载
    const url = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', file.name)
    document.body.appendChild(link)
    link.click()
    
    // 清理
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('开始下载')
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败，请稍后重试')
  }
}

// --- 6. 预览文件逻辑 ---
const handlePreview = async (file) => {
  if (!file) return

  previewFileData.value = file
  previewTitle.value = `${file.name || '文件'} - 预览`
  previewType.value = (file.name?.split('.').pop() || '').toLowerCase()
  previewDialogVisible.value = true
  
  // 设置一个初始 URL 防止残留
  previewUrl.value = ''

  // 图像和 PDF 支持 Blob 预览
  const supportBlobPreview = ['pdf', 'png', 'jpg', 'jpeg', 'gif'].includes(previewType.value)
  
  if (supportBlobPreview) {
    previewLoading.value = true
    try {
      const response = await fileApi.downloadFile(file.id)
      
      let mimeType = 'application/octet-stream'
      if (previewType.value === 'pdf') mimeType = 'application/pdf'
      else if (['png', 'jpg', 'jpeg', 'gif'].includes(previewType.value)) mimeType = `image/${previewType.value === 'jpg' ? 'jpeg' : previewType.value}`

      const blob = new Blob([response], { type: mimeType })
      previewUrl.value = URL.createObjectURL(blob)
    } catch (error) {
      console.error('预览加载失败:', error)
      ElMessage.error('预览加载失败，请重试')
      previewDialogVisible.value = false
    } finally {
      previewLoading.value = false
    }
  }
}

const onPreviewClose = () => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
  previewFileData.value = null
}
</script>

<style scoped lang="scss">
/* 列定义（仅负责布局） */
.col-name { flex: 2; min-width: 200px; display: flex; align-items: center; padding-right: 16px; }
.col-owner { flex: 1; min-width: 100px; display: flex; align-items: center; }
.col-time { flex: 1.5; min-width: 140px; display: flex; align-items: center; }
.col-size { flex: 1; min-width: 120px; position: relative; display: flex; align-items: center; justify-content: space-between; }

/* 数据行列内容样式定制 */
.list-row.file-row {
  cursor: pointer;
  position: relative;
  
  &:hover {
    .size-text {
      opacity: 0;
    }
    .quick-actions {
      opacity: 1;
      pointer-events: auto;
    }
  }

  .file-icon-wrapper {
    font-size: 22px;
    margin-right: 12px;
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
  
  .file-name-text {
    font-size: 14px;
    font-weight: 500;
    color: #1f2329;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .owner-info {
    display: flex;
    align-items: center;
    
    .owner-avatar {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background-color: #3370ff;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      margin-right: 8px;
      flex-shrink: 0;
    }
    .owner-name {
      font-size: 14px;
      color: #1f2329;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .col-time, .size-text {
    font-size: 14px;
    color: #646a73;
    white-space: nowrap;
  }
  .size-text {
    transition: opacity 0.2s;
  }

  /* 操作组样式 */
  .quick-actions {
    position: absolute;
    right: 24px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    gap: 4px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
    background-color: #F0F4FF; /* 和 hover 的背景色保持一致 */
    padding: 0;
    border-radius: 6px;
    
    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      border-radius: 4px;
      color: #3370ff;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 16px;
      
      &:hover { background-color: #e1eaff; }
      &.delete-btn { color: #f56c6c; }
      &.delete-btn:hover { background-color: #fef0f0; }
    }
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  
  .empty-icon-wrapper {
    width: 160px;
    height: 160px;
    background-color: #F8F9FA;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    
    .empty-icon {
      font-size: 64px;
      color: #dee1e5;
    }
  }
  
  .empty-title {
    font-size: 16px;
    font-weight: 500;
    color: #1f2329;
    margin: 0 0 6px 0;
  }
  
  .empty-subtitle {
    font-size: 14px;
    color: #8f959e;
    margin: 0;
  }
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #dee1e5;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #8f959e;
}
</style>

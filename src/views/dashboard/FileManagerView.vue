<template>
  <div class="file-manager feishu-page">
    <div class="card-container">
      
      <!-- 标准顶部操作栏 -->
      <div class="header-area">
        <div class="header-top">
          <div class="title-area">
            <!-- 子页面时显示返回按钮 -->
            <el-button v-if="currentSessionId" class="back-btn" @click="goBackToRoot" :icon="ArrowLeft" circle size="small" />
            <h1>{{ currentSessionId ? currentSessionName : '文件管理' }}</h1>
            <span class="badge" v-if="displayFiles.length > 0">{{ displayFiles.length }}</span>
          </div>
          <div class="action-btn-group">
          </div>
        </div>
        <!-- 面包屑导航 -->
        <div v-if="currentSessionId" class="breadcrumb-bar">
          <span class="breadcrumb-item clickable" @click="goBackToRoot">文件管理</span>
          <span class="breadcrumb-sep">/</span>
          <span class="breadcrumb-item current">{{ currentSessionName }}</span>
        </div>
      </div>

      <!-- 标准列表区 -->
      <div class="list-area">
        <div v-if="files.length === 0" class="empty-state">
          <div class="empty-icon-wrapper">
            <el-icon class="empty-icon"><FolderOpened /></el-icon>
          </div>
          <p class="empty-title">文件夹为空</p>
          <p class="empty-subtitle">暂无文件</p>
        </div>

        <template v-else>
          <!-- 表头 -->
          <div class="list-header-row">
            <div class="col-name">文件名</div>
            <div class="col-type">类型</div>
            <div class="col-owner">所有者</div>
            <div class="col-time">更新时间</div>
            <div class="col-size">大小</div>
          </div>

          <!-- 列表内容 -->
          <div class="list-body" style="overflow-y: auto;">

            <!-- ====== 根视图：会话目录 + 独立文件 ====== -->
            <template v-if="!currentSessionId">
              <!-- 会话目录行 -->
              <div
                v-for="folder in sessionFolders"
                :key="'folder-' + folder.sessionId"
                class="list-row folder-row"
                @click="enterSession(folder.sessionId)"
              >
                <div class="col-name">
                  <div class="file-icon-wrapper" style="color: #3370FF;">
                    <el-icon><Folder /></el-icon>
                  </div>
                  <span class="file-name-text">{{ folder.sessionName }}</span>
                </div>
                <div class="col-type">
                  <span class="folder-file-count">{{ folder.fileCount }} 个文件</span>
                </div>
                <div class="col-owner">
                  <div class="owner-info">
                    <div class="owner-avatar">{{ folder.owner.charAt(0) }}</div>
                    <span class="owner-name">{{ folder.owner }}</span>
                  </div>
                </div>
                <div class="col-time">{{ folder.latestTime }}</div>
                <div class="col-size has-actions">
                  <span class="size-text">{{ folder.totalSize }}</span>
                  <div class="quick-actions">
                    <button class="action-btn delete-btn" title="删除文件夹" @click.stop="deleteFolder(folder.sessionId)"><el-icon><Delete /></el-icon></button>
                  </div>
                </div>
              </div>

              <!-- 独立文件（session_id 为 0 或空） -->
              <div
                v-for="file in independentFiles"
                :key="file.id"
                class="list-row file-row"
              >
                <div class="col-name">
                  <div class="file-icon-wrapper" :style="{ color: file.iconColor }">
                    <el-icon><component :is="file.icon" /></el-icon>
                  </div>
                  <span class="file-name-text">{{ file.name }}</span>
                </div>
                <div class="col-type">
                  <span class="file-type-tag" :class="'type-' + file.fileType">{{ file.fileTypeLabel }}</span>
                </div>
                <div class="col-owner">
                  <div class="owner-info">
                    <div class="owner-avatar">{{ file.owner.charAt(0) }}</div>
                    <span class="owner-name">{{ file.owner }}</span>
                  </div>
                </div>
                <div class="col-time">{{ file.updateTime }}</div>
                <div class="col-size has-actions">
                  <span class="size-text">{{ file.size }}</span>
                  <div class="quick-actions">
                    <button class="action-btn preview-btn" title="预览" @click.stop="handlePreview(file)"><el-icon><View /></el-icon></button>
                    <button class="action-btn download-btn" title="下载" @click.stop="handleDownload(file)"><el-icon><Download /></el-icon></button>
                    <button class="action-btn delete-btn" title="删除" @click.stop="deleteFile(file.id)"><el-icon><Delete /></el-icon></button>
                  </div>
                </div>
              </div>
            </template>

            <!-- ====== 子页面视图：某个会话内的文件列表 ====== -->
            <template v-else>
              <div
                v-for="file in sessionFiles"
                :key="file.id"
                class="list-row file-row"
              >
                <div class="col-name">
                  <div class="file-icon-wrapper" :style="{ color: file.iconColor }">
                    <el-icon><component :is="file.icon" /></el-icon>
                  </div>
                  <span class="file-name-text">{{ file.name }}</span>
                </div>
                <div class="col-type">
                  <span class="file-type-tag" :class="'type-' + file.fileType">{{ file.fileTypeLabel }}</span>
                </div>
                <div class="col-owner">
                  <div class="owner-info">
                    <div class="owner-avatar">{{ file.owner.charAt(0) }}</div>
                    <span class="owner-name">{{ file.owner }}</span>
                  </div>
                </div>
                <div class="col-time">{{ file.updateTime }}</div>
                <div class="col-size has-actions">
                  <span class="size-text">{{ file.size }}</span>
                  <div class="quick-actions">
                    <button class="action-btn preview-btn" title="预览" @click.stop="handlePreview(file)"><el-icon><View /></el-icon></button>
                    <button class="action-btn download-btn" title="下载" @click.stop="handleDownload(file)"><el-icon><Download /></el-icon></button>
                    <button class="action-btn delete-btn" title="删除" @click.stop="deleteFile(file.id)"><el-icon><Delete /></el-icon></button>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </template>
      </div>
    </div>

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
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Delete,
  Document, Picture, FolderOpened, Folder, Close, Download, View, ArrowLeft
} from '@element-plus/icons-vue'
import { fileApi } from '../../api/file'
import FilePreviewDialog from '../../components/FilePreviewDialog.vue'

// --- 预览相关 ---
const previewDialogVisible = ref(false)
const previewLoading = ref(false)
const previewUrl = ref('')
const previewType = ref('')
const previewTitle = ref('文件预览')
const previewFileData = ref(null)

// --- 视图导航状态 ---
const currentSessionId = ref(null) // null = 根视图，有值 = 会话子页面

const enterSession = (sessionId) => {
  currentSessionId.value = sessionId
}

const goBackToRoot = () => {
  currentSessionId.value = null
}

// --- 文件列表数据 ---
const files = ref([])

const fetchFileList = async () => {
  try {
    const res = await fileApi.getFileList({ skip: 0, limit: 9999, file_type: 'voice,dialogue' })
    let list = res.data || []
    
    // 按更新时间降序排列，最新的在最上面
    list.sort((a, b) => {
      const timeA = new Date(a.updated_at || 0).getTime()
      const timeB = new Date(b.updated_at || 0).getTime()
      return timeB - timeA
    })

    // 文件类型中文映射
    const fileTypeMap = {
      resume: '简历',
      voice: '语音',
      dialogue: '对话',
    }

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
      
      // 格式化日期
      const timeStr = item.updated_at ? item.updated_at.replace('T', ' ') : '未知'

      const ft = item.file_type || ''

      return {
        id: item.id,
        name: item.file_name,
        sessionId: item.session_id,
        sessionName: item.session_name,
        sizeBytes: sizeBytes,
        fileType: ft,
        fileTypeLabel: fileTypeMap[ft] || ft || '未知',
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

// --- 计算属性：分离会话目录和独立文件 ---

// 判断是否为独立文件（session_id 为 0、null、undefined、空字符串）
const isIndependent = (file) => {
  return !file.sessionId || file.sessionId === '0' || file.sessionId === 0
}

// 独立文件列表（session_id 为 0 或空）
const independentFiles = computed(() => {
  return files.value.filter(f => isIndependent(f))
})

// 当前会话名称（用于页面标题和面包屑）
const currentSessionName = computed(() => {
  if (!currentSessionId.value) return ''
  const folder = sessionFolders.value.find(f => f.sessionId === currentSessionId.value)
  return folder ? folder.sessionName : `会话 ${currentSessionId.value}`
})

// 会话目录列表
const sessionFolders = computed(() => {
  const map = {}
  files.value.forEach(file => {
    if (isIndependent(file)) return
    const sid = file.sessionId
    if (!map[sid]) {
      map[sid] = {
        sessionId: sid,
        sessionName: file.sessionName || `会话 ${sid}`,
        fileCount: 0,
        totalSizeBytes: 0,
        latestTime: file.updateTime,
        owner: file.owner,
        files: []
      }
    }
    map[sid].fileCount++
    map[sid].totalSizeBytes += (file.sizeBytes || 0)
  })

  return Object.values(map).map(folder => {
    const kb = folder.totalSizeBytes / 1024
    const mb = kb / 1024
    return {
      ...folder,
      totalSize: mb > 1 ? mb.toFixed(2) + ' MB' : kb.toFixed(2) + ' KB'
    }
  })
})

// 当前会话子页面的文件列表
const sessionFiles = computed(() => {
  if (!currentSessionId.value) return []
  return files.value.filter(f => f.sessionId === currentSessionId.value)
})

// 用于 badge 显示的文件数
const displayFiles = computed(() => {
  if (currentSessionId.value) return sessionFiles.value
  return files.value
})

onMounted(() => {
  fetchFileList()
})

// --- 删除文件逻辑 ---
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

  // --- 删除文件夹逻辑 ---
  const deleteFolder = async (sessionId) => {
    try {
      await ElMessageBox.confirm(
        '确定要删除该文件夹及其所有文件吗？删除后将无法恢复。',
        '删除文件夹确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )

      await fileApi.deleteBySession(sessionId)
      ElMessage.success('文件夹删除成功')

      fetchFileList()
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除文件夹失败:', error)
        ElMessage.error(error.message || '删除文件夹失败，请稍后重试')
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

// --- 预览文件逻辑 ---
const handlePreview = async (file) => {
  if (!file) return

  previewFileData.value = file
  previewTitle.value = `${file.name || '文件'} - 预览`
  previewType.value = (file.name?.split('.').pop() || '').toLowerCase()
  previewDialogVisible.value = true
  
  previewUrl.value = ''

  const supportBlobPreview = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'md'].includes(previewType.value)
  
  if (supportBlobPreview) {
    previewLoading.value = true
    try {
      const response = await fileApi.downloadFile(file.id)
      
      let mimeType = 'application/octet-stream'
      if (previewType.value === 'pdf') mimeType = 'application/pdf'
      else if (['png', 'jpg', 'jpeg', 'gif'].includes(previewType.value)) mimeType = `image/${previewType.value === 'jpg' ? 'jpeg' : previewType.value}`
      else if (previewType.value === 'md') mimeType = 'text/markdown'

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
.col-type { flex: 0.6; min-width: 80px; display: flex; align-items: center; }
.col-owner { flex: 1; min-width: 100px; display: flex; align-items: center; }
.col-time { flex: 1.5; min-width: 140px; display: flex; align-items: center; }
.col-size { flex: 1; min-width: 120px; position: relative; display: flex; align-items: center; justify-content: space-between; }

/* 返回按钮 */
.back-btn {
  margin-right: 12px;
  border-color: #DEE0E3 !important;
  color: #1F2329 !important;
  &:hover {
    border-color: #3370FF !important;
    color: #3370FF !important;
  }
}

/* 面包屑 */
.breadcrumb-bar {
  margin-top: 8px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.breadcrumb-item {
  color: #8F959E;
  &.clickable {
    cursor: pointer;
    &:hover { color: #3370FF; }
  }
  &.current {
    color: #1F2329;
    font-weight: 500;
  }
}
.breadcrumb-sep {
  color: #C4C6CC;
}

/* 文件类型标签 */
.file-type-tag {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 4px;
  line-height: 20px;
  white-space: nowrap;
  background-color: #f0f1f5;
  color: #646a73;

  &.type-resume { background-color: #e8f3ff; color: #3370ff; }
  &.type-voice { background-color: #e8faf0; color: #10b981; }
  &.type-dialogue { background-color: #fff5e6; color: #f59e0b; }
}

/* 目录行样式 */
.list-row.folder-row {
  cursor: pointer;
  position: relative;

  .file-icon-wrapper {
    font-size: 24px;
    margin-right: 12px;
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .file-name-text {
    font-size: 14px;
    font-weight: 600;
    color: #1f2329;
  }

  .folder-file-count {
    font-size: 12px;
    color: #8F959E;
    background: #F0F1F5;
    padding: 2px 8px;
    border-radius: 4px;
  }

  &:hover {
    background-color: #EDF4FF;
    .file-name-text { color: #3370FF; }
    .size-text { opacity: 0; }
    .quick-actions { opacity: 1; pointer-events: auto; }
  }
}

/* 数据行列内容样式定制 */
.list-row.file-row {
  cursor: pointer;
  position: relative;
  
  &:hover {
    .size-text { opacity: 0; }
    .quick-actions { opacity: 1; pointer-events: auto; }
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
      width: 22px; height: 22px;
      border-radius: 50%;
      background-color: #3370ff;
      color: #ffffff;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px;
      margin-right: 8px;
      flex-shrink: 0;
    }
    .owner-name {
      font-size: 14px; color: #1f2329;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
  }

  .col-time, .size-text { font-size: 14px; color: #646a73; white-space: nowrap; }
  .size-text { transition: opacity 0.2s; }

  .quick-actions {
    position: absolute;
    right: 24px; top: 50%; transform: translateY(-50%);
    display: flex; gap: 4px;
    opacity: 0; pointer-events: none;
    transition: opacity 0.2s;
    background-color: #F0F4FF;
    padding: 0; border-radius: 6px;
    
    .action-btn {
      display: flex; align-items: center; justify-content: center;
      width: 28px; height: 28px;
      border: none; background: transparent;
      border-radius: 4px; color: #3370ff;
      cursor: pointer; transition: all 0.2s; font-size: 16px;
      
      &:hover { background-color: #e1eaff; }
      &.delete-btn { color: #f56c6c; }
      &.delete-btn:hover { background-color: #fef0f0; }
    }
  }
}

/* 目录行也需要 owner 样式 */
.list-row.folder-row .owner-info {
  display: flex;
  align-items: center;
  .owner-avatar {
    width: 22px; height: 22px;
    border-radius: 50%;
    background-color: #3370ff;
    color: #ffffff;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; margin-right: 8px; flex-shrink: 0;
  }
  .owner-name {
    font-size: 14px; color: #1f2329;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
}
.list-row.folder-row .col-time,
.list-row.folder-row .size-text {
  font-size: 14px; color: #646a73; white-space: nowrap;
}
.list-row.folder-row .size-text {
  transition: opacity 0.2s;
}
.list-row.folder-row .quick-actions {
  position: absolute;
  right: 24px; top: 50%; transform: translateY(-50%);
  display: flex; gap: 4px;
  opacity: 0; pointer-events: none;
  transition: opacity 0.2s;
  background-color: #F0F4FF;
  padding: 0; border-radius: 6px;

  .action-btn {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px;
    border: none; background: transparent;
    border-radius: 4px; color: #3370ff;
    cursor: pointer; transition: all 0.2s; font-size: 16px;

    &:hover { background-color: #e1eaff; }
    &.delete-btn { color: #f56c6c; }
    &.delete-btn:hover { background-color: #fef0f0; }
  }
}

/* 空状态 */
.empty-state {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; height: 100%;
  
  .empty-icon-wrapper {
    width: 160px; height: 160px;
    background-color: #F8F9FA; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 16px;
    .empty-icon { font-size: 64px; color: #dee1e5; }
  }
  .empty-title { font-size: 16px; font-weight: 500; color: #1f2329; margin: 0 0 6px 0; }
  .empty-subtitle { font-size: 14px; color: #8f959e; margin: 0; }
}

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #dee1e5; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #8f959e; }
</style>

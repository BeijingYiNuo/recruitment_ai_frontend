<template>
  <div class="tab-original-docs">
    <!-- Action Bar -->
    <div class="action-bar">
      <el-button type="primary" class="import-btn" @click="openImportDialog">
        <el-icon><Plus /></el-icon> 导入文档
      </el-button>
      
      <!-- <div class="search-combo">
        <el-select v-model="searchType" class="combo-select">
          <el-option label="名称" value="name" />
          <el-option label="ID" value="id" />
        </el-select>
        <el-input 
          v-model="searchKeyword" 
          placeholder="搜索文档名称" 
          class="combo-input"
        />
      </div> -->
    </div>

    <!-- Data Table -->
    <div class="table-container" v-loading="listLoading">
      <el-empty v-if="tableData.length === 0 && !listLoading" description="该知识库暂无可展示的相关文档记录" />
      <table class="custom-table" v-else>
        <thead>
          <tr>
            <th width="25%">文档名称 / ID</th>
            <th width="15%">文档状态</th>
            <th width="10%">切片数</th>
            <th width="12%">导入方式</th>
            <th width="15%">上传时间</th>
            <th width="15%">更新时间</th>
            <th style="min-width: 120px; width: 120px;" class="text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in tableData" :key="item.id">
            <td>
              <div class="file-name-col">
                <el-icon class="file-icon" :class="item.type">
                  <Document v-if="item.type === 'pdf' || item.type === 'doc' || item.type === 'docx'" />
                </el-icon>
                <div class="file-info">
                  <div class="name">{{ item.name }}</div>
                  <!-- <div class="id">文档 ID <el-icon><CopyDocument /></el-icon></div> -->
                </div>
              </div>
            </td>
            <td>
              <div class="status-tag">
                <span class="dot"></span>
                处理完成
              </div>
            </td>
            <td>{{ item.slices }}</td>
            <td>{{ item.method }}</td>
            <td>{{ item.uploadTime }}</td>
            <td>{{ item.updateTime }}</td>
            <td class="text-right">
              <div class="row-actions">
                <span class="action-link">切片详情</span>
                <span class="action-link" style="color: #f53f3f;" @click="handleDelete(item)">删除</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination-footer">
      <span class="total-text">共 {{ tableData.length }} 条</span>
      <el-pagination
        layout="prev, pager, next"
        :total="tableData.length"
        :page-size="10"
        class="custom-pagination"
      />
    </div>

    <!-- 导入文档弹窗 -->
    <el-dialog v-model="importDialogVisible" title="导入知识库文档" width="450px" destroy-on-close>
      <el-form label-position="top" @submit.prevent>
        <el-form-item label="请选择已上传的文件" required>
          <el-select v-model="importFileId" placeholder="正在拉取文件列表..." style="width: 100%" :loading="isLoadingFiles">
            <el-option
              v-for="file in availableFiles"
              :key="file.id"
              :label="file.file_name"
              :value="file.id"
            >
              <span style="float: left">{{ file.file_name }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">ID: {{ file.id }}</span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="文档展示名称 (doc_name)" required>
          <el-input v-model="importDocName" placeholder="建议输入清晰易读的文档名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="isImporting" @click="submitImport">导入</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Plus, Document, CopyDocument } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../../../utils/request'

const props = defineProps({
  knowledgeId: {
    type: Number,
    required: true
  }
})

const route = useRoute()
const searchType = ref('name')
const searchKeyword = ref('')

const tableData = ref([])
const listLoading = ref(false)

const formatUnixTime = (timestamp) => {
  if (!timestamp) return '-'
  // Convert 10-digit unix timestamp to Javascript Date
  const date = new Date(timestamp * 1000)
  const Y = date.getFullYear()
  const M = String(date.getMonth() + 1).padStart(2, '0')
  const D = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${Y}-${M}-${D} ${h}:${m}:${s}`
}

const fetchDocuments = async () => {
  listLoading.value = true
  try {
    const res = await request.get('/knowledge/document/list', {
      params: {
        collection_name: route.params.id
      }
    })
    
    // 解析知识库引擎内的列表信息
    const responseData = res.data || res || {}
    const rawList = responseData.doc_list || []
    
    tableData.value = rawList.map(item => {
      let fileType = 'unknown'
      const typeStr = (item.doc_type || '').toLowerCase()
      if (typeStr.includes('pdf')) fileType = 'pdf'
      else if (typeStr.includes('doc') || typeStr.includes('docx')) fileType = 'doc'
      else fileType = 'other'

      return {
        id: item.doc_id || '-',
        name: item.title || item.doc_name || '未命名文档',
        type: fileType,
        slices: item.point_num || 0,
        method: item.add_type === 'tos' ? '对象存储' : (item.add_type || '系统导入'),
        uploadTime: formatUnixTime(item.create_time),
        updateTime: formatUnixTime(item.update_time),
        raw: item
      }
    })
  } catch (error) {
    console.error('获取知识库文档失败:', error)
    ElMessage.error('无法提取真实列表: ' + (error.message || '未知异常'))
  } finally {
    listLoading.value = false
  }
}

onMounted(() => {
  fetchDocuments()
})

const importDialogVisible = ref(false)
const importFileId = ref(null)
const importDocName = ref('')
const isImporting = ref(false)
const availableFiles = ref([])
const isLoadingFiles = ref(false)

const openImportDialog = async () => {
  importDialogVisible.value = true
  isLoadingFiles.value = true
  try {
    const res = await request.get('/file/list')
    availableFiles.value = res.data || []
  } catch (err) {
    console.error('Fetch files err', err)
    ElMessage.error('无法获取已上传文件列表')
  } finally {
    isLoadingFiles.value = false
  }
}

// 选中文件时，自动用原本的文件名作为展示名称进行填充，增强交互体验
watch(importFileId, (newId) => {
  if (newId && !importDocName.value) {
    const matched = availableFiles.value.find(f => f.id === newId)
    if (matched) {
      importDocName.value = matched.file_name
    }
  }
})

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要将文档 "${row.name}" 从当前知识库中移除吗？`, '删除警告', {
      confirmButtonText: '果断删除',
      cancelButtonText: '保留',
      type: 'warning'
    })
    
    listLoading.value = true
    await request.delete('/knowledge/document/delete', {
      params: { document_id: row.id }
    })
    
    ElMessage.success('文档删除成功！')
    fetchDocuments() // 刷新列表以呈现最新状态
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('无法删除文档: ' + (error?.message || '服务器连接异常'))
      listLoading.value = false
    }
  }
}

const submitImport = async () => {
  if (!importFileId.value) {
    ElMessage.warning('请在下拉列表中选择待导入的文件')
    return
  }
  if (!importDocName.value) {
    ElMessage.warning('请输入文档名称')
    return
  }

  isImporting.value = true
  try {
    // 这里将 query 参数放在 params 里，后端会解析出 ?file_id=x&knowledge_id=y&doc_name=z
    await request.post('/knowledge/document/add', null, {
      params: {
        file_id: importFileId.value,
        knowledge_id: props.knowledgeId,
        doc_name: importDocName.value
      }
    })
    
    ElMessage.success('文档导入成功！')
    importDialogVisible.value = false
    importFileId.value = null
    importDocName.value = ''
    fetchDocuments() // 导入完毕后刷新最新视图
    
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error(error.message || '导入失败，请检查请求参数或后端状态')
  } finally {
    isImporting.value = false
  }
}
</script>

<style lang="scss" scoped>
.tab-original-docs {
  padding: 16px 24px;
  background-color: #ffffff;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.import-btn {
  background-color: #165dff;
  border-color: #165dff;
  font-weight: 500;
  
  &:hover {
    background-color: #4080ff;
    border-color: #4080ff;
  }
}

.search-combo {
  display: flex;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  overflow: hidden;
  width: 320px;
  transition: border-color 0.3s;
  
  &:hover, &:focus-within {
    border-color: #165dff;
  }
  
  .combo-select {
    width: 90px;
    
    :deep(.el-input__wrapper) {
      box-shadow: none !important;
      background-color: #f2f3f5;
      border-radius: 0;
    }
  }
  
  .combo-input {
    flex: 1;
    
    :deep(.el-input__wrapper) {
      box-shadow: none !important;
      border-left: 1px solid #e5e6eb;
      border-radius: 0;
    }
  }
}

.table-container {
  overflow-x: auto;
}

.custom-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  
  th, td {
    padding: 14px 16px;
    border-bottom: 1px solid #f0f0f0;
    text-align: left;
    color: #1d2129;
  }
  
  th {
    background-color: #f7f8fa;
    color: #4e5969;
    font-weight: 500;
  }
  
  .text-right {
    text-align: right;
  }
  
  tbody tr {
    transition: background-color 0.2s;
    &:hover {
      background-color: #f9fafb;
    }
  }
}

.file-name-col {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .file-icon {
    font-size: 20px;
    &.pdf { color: #f53f3f; }
    &.doc, &.docx { color: #165dff; }
  }
  
  .file-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    
    .name {
      font-weight: 500;
      color: #1d2129;
    }
    
    .id {
      font-size: 12px;
      color: #86909c;
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      
      &:hover {
        color: #165dff;
      }
    }
  }
}

.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #00b42a;
  
  .dot {
    width: 6px;
    height: 6px;
    background-color: #00b42a;
    border-radius: 50%;
  }
}

.row-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  flex-wrap: nowrap;
  white-space: nowrap;
  
  .action-link {
    color: #165dff;
    cursor: pointer;
    font-size: 13px;
    
    &:hover {
      color: #4080ff;
    }
  }
}

.pagination-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  
  .total-text {
    font-size: 13px;
    color: #4e5969;
  }
  
  .custom-pagination {
    --el-pagination-button-bg-color: #f2f3f5;
  }
}
</style>

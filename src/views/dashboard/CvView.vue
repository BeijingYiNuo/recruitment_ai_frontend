<template>
  <div class="cv-manage">
    <el-card class="list-card" shadow="never">
      <template #header>
        <div class="list-header">
          <span>简历管理</span>
          <el-upload
            class="upload-demo"
            :show-file-list="false"
            :http-request="customUpload"
            accept=".pdf,.doc,.docx"
            action=""
          >
            <el-button type="primary" size="small">上传新简历</el-button>
          </el-upload>
        </div>
      </template>

      <el-empty v-if="resumeStore.resumes.length === 0 && !listLoading" description="暂无简历，请点击上方按钮上传" />

      <el-table
        v-else
        v-loading="listLoading"
        :data="resumeStore.resumes"
        style="width: 100%"
        :header-cell-style="{ background: '#f5f6f7', color: '#646a73', fontWeight: 500, borderBottom: '1px solid #dee0e3' }"
      >
        <el-table-column prop="file_name" label="文件名称" min-width="150" show-overflow-tooltip></el-table-column>
        <el-table-column prop="file_type" label="格式" width="100">
          <template #default="scope">
            {{ scope.row.file_type.toUpperCase() }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="解析状态" width="120">
          <template #default="scope">
            <el-tag size="small" type="success" class="status-tag status-success">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="上传时间" width="180"></el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button type="primary" link size="small" @click="resumeStore.selectResume(scope.row)">查看</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 简历详情弹窗 -->
    <ResumeDetailModal
      :resume="resumeStore.selectedResume"
      @close="resumeStore.clearSelection()"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getCurrentUser } from '../../services/authService'
import { useResumeStore } from '../../stores/resumeStore'
import ResumeDetailModal from '../../components/ResumeDetailModal.vue'
import { resumeApi } from '../../api/resume'

const resumeStore = useResumeStore()
const currentUser = ref(getCurrentUser() || { id: 1, username: '管理员' })
const listLoading = ref(false)

const fetchResumes = async () => {
  listLoading.value = true
  try {
    const data = await resumeApi.getResumes()
    const list = Array.isArray(data) ? data : (data.items || data.data || [])
    resumeStore.setResumes(list)
  } catch (error) {
    ElMessage.error('获取简历列表失败: ' + (error?.detail || error?.message || '未知错误'))
  } finally {
    listLoading.value = false
  }
}

onMounted(() => {
  fetchResumes()
})

const customUpload = async (options) => {
  const file = options.file
  if (!file) return

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]

  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
    ElMessage.error('只支持 PDF 或 Word 格式的简历文件')
    return false
  }

  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('简历文件大小不能超过 5MB')
    return false
  }

  ElMessage.info('正在解析并上传简历...')

  try {
    const response = await resumeApi.uploadResume(currentUser.value.id, file)
    
    const blobUrl = URL.createObjectURL(file)
    const newResume = Object.assign({
      id: Date.now(),
      user_id: currentUser.value.id,
      file_name: file.name,
      file_path: '',
      file_type: file.name.split('.').pop().toLowerCase(),
      status: 'uploaded',
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    }, response)
    
    newResume.preview_url = blobUrl

    resumeStore.addResume(newResume)
    ElMessage.success(`简历 ${file.name} 上传成功！`)
  } catch (error) {
    if (Array.isArray(error?.detail)) {
      const msgs = error.detail.map(e => e.msg).join('; ')
      ElMessage.error(`上传失败: ${msgs}`)
    } else {
      ElMessage.error('上传失败: ' + (error?.detail || error?.message || '未知错误'))
    }
  }
}

const handleDelete = (id) => {
  if (window.confirm('确定要删除这份简历吗？该操作不可恢复。')) {
    resumeStore.deleteResume(id)
    ElMessage.success('简历删除成功')
  }
}
</script>

<style scoped lang="scss">
.cv-manage {
  .list-card {
    border-radius: 12px;
    border: 1px solid #dee0e3;
    box-shadow: 0 4px 12px rgba(31, 35, 41, 0.04);

    :deep(.el-card__header) {
      padding: 16px 24px;
      border-bottom: 1px solid #dee0e3;
    }

    :deep(.el-card__body) {
      padding: 24px;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 16px;
      font-weight: 600;
      color: #1f2329;
    }
  }

  .status-tag {
    border: none;
    font-weight: 500;
    &.status-success {
      background-color: #eaf8f1;
      color: #17a05d;
    }
  }
}
</style>

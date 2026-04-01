<template>
  <div class="cv-manage">
    <el-card class="list-card" shadow="never">
      <template #header>
        <div class="list-header">
          <span>简历管理</span>
          <el-button type="primary" size="small" @click="triggerResumeUpload">上传新简历</el-button>
        </div>
      </template>

      <el-empty v-if="resumeStore.resumes.length === 0" description="暂无简历，请点击上方按钮上传" />

      <el-table
        v-else
        :data="resumeStore.resumes"
        style="width: 100%"
        :header-cell-style="{ background: '#fafafa', color: '#606266', fontWeight: 500, borderBottom: '1px solid #ebeef5' }"
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

    <!-- 隐藏的文件上传 -->
    <input type="file" ref="resumeInput" style="display: none" accept=".pdf,.doc,.docx" @change="handleResumeUpload" />

    <!-- 简历详情弹窗 -->
    <ResumeDetailModal
      :resume="resumeStore.selectedResume"
      @close="resumeStore.clearSelection()"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getCurrentUser } from '../../services/authService'
import { useResumeStore } from '../../stores/resumeStore'
import ResumeDetailModal from '../../components/ResumeDetailModal.vue'

const resumeStore = useResumeStore()
const currentUser = ref(getCurrentUser() || { id: 1, username: '管理员' })
const resumeInput = ref(null)

const triggerResumeUpload = () => {
  resumeInput.value.click()
}

const handleResumeUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]

  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
    ElMessage.error('只支持 PDF 或 Word 格式的简历文件')
    event.target.value = ''
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('简历文件大小不能超过 5MB')
    event.target.value = ''
    return
  }

  ElMessage.info('正在解析并上传简历...')

  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const fileExt = file.name.split('.').pop().toLowerCase()
    const mockId = Date.now()
    const blobUrl = URL.createObjectURL(file)

    resumeStore.addResume({
      id: mockId,
      user_id: currentUser.value.id,
      file_name: file.name,
      file_path: '/mock/resumes/' + mockId + '_' + file.name,
      file_type: fileExt,
      status: 'uploaded',
      content: '暂无提取内容...',
      created_at: nowStr,
      updated_at: nowStr,
      extracted_at: null,
      preview_url: blobUrl
    })
    ElMessage.success(`简历 ${file.name} 上传成功！`)
  } catch (error) {
    ElMessage.error('上传失败: ' + (error.detail || error.message))
  } finally {
    event.target.value = ''
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
    border-radius: 8px;
    border: none;
    box-shadow: 0 1px 2px -2px rgba(0,0,0,0.08), 0 3px 6px 0 rgba(0,0,0,0.04), 0 5px 12px 4px rgba(0,0,0,0.02);

    :deep(.el-card__header) {
      padding: 16px 24px;
      border-bottom: 1px solid #f0f0f0;
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
      color: #1f2937;
    }
  }

  .status-tag {
    border: none;
    font-weight: normal;
    &.status-success {
      background-color: #f6ffed;
      color: #52c41a;
    }
  }
}
</style>

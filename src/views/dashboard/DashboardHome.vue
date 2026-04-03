<template>
  <div class="dashboard-home">
    <!-- 欢迎卡片 -->
    <el-card class="welcome-card" shadow="never">
      <div class="card-content">
        <div class="welcome-left">
          <h2>欢迎回来，{{ currentUser?.username || '管理员' }}</h2>
          <p>招聘管理系统 — 快速入口</p>
        </div>
        <div class="welcome-right">
          <el-button @click="triggerResumeUpload">上传简历</el-button>
          <el-button type="primary" @click="interviewStore.openModal('online')">新增线上面试</el-button>
          <el-button @click="interviewStore.openModal('offline')">新增线下面试</el-button>
          <el-button @click="router.push('/profile')">进入个人中心</el-button>
          <input type="file" ref="resumeInput" style="display: none" accept=".pdf,.doc,.docx" @change="handleResumeUpload" />
        </div>
      </div>
    </el-card>

    <!-- 面试表单弹窗 -->
    <InterviewFormDialog
      v-model:visible="interviewStore.showModal"
      :is-edit-mode="interviewStore.isEditMode"
      :form="interviewStore.interviewForm"
      :resumes="resumeStore.resumes"
      @save="handleSaveInterview"
    />

    <!-- 简历详情弹窗 -->
    <ResumeDetailModal
      :resume="resumeStore.selectedResume"
      @close="resumeStore.clearSelection()"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCurrentUser } from '../../services/authService'
import { useResumeStore } from '../../stores/resumeStore'
import { useInterviewStore } from '../../stores/interviewStore'
import InterviewFormDialog from '../../components/InterviewFormDialog.vue'
import ResumeDetailModal from '../../components/ResumeDetailModal.vue'

const router = useRouter()
const currentUser = ref(getCurrentUser() || { id: 1, username: '管理员' })
const resumeInput = ref(null)
const resumeStore = useResumeStore()
const interviewStore = useInterviewStore()

// 简历上传
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

// 保存面试
const handleSaveInterview = () => {
  const form = interviewStore.interviewForm
  if (!form.candidate_id) {
    ElMessage.warning('请填写候选人 ID')
    return
  }
  if (!form.scheduled_at) {
    ElMessage.warning('请选择面试时间')
    return
  }
  if (!form.extra_info) {
    ElMessage.warning(form.session_type === 'online' ? '会议链接不能为空' : '面试地点不能为空')
    return
  }
  interviewStore.saveInterview(currentUser.value.id)
  ElMessage.success(interviewStore.isEditMode ? '面试信息修改成功！' : '面试会话创建成功！')
}
</script>

<style scoped lang="scss">
.dashboard-home {
  .welcome-card {
    border-radius: 12px;
    border: 1px solid #dee0e3;
    margin-bottom: 24px;
    box-shadow: 0 4px 12px rgba(31, 35, 41, 0.04);

    :deep(.el-card__body) {
      padding: 0;
    }

    .card-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
    }

    .welcome-left {
      h2 {
        margin: 0 0 8px 0;
        font-size: 20px;
        color: #1f2937;
        font-weight: 600;
      }
      p {
        margin: 0;
        font-size: 14px;
        color: #6b7280;
      }
    }

    .welcome-right {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
  }
}
</style>

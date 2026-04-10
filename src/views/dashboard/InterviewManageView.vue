<template>
  <div class="interview-manage">
    <el-card class="list-card" shadow="never">
      <template #header>
        <div class="list-header">
          <span>面试管理</span>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="interviewStore.openModal('online')">新增线上面试</el-button>
            <el-button size="small" @click="interviewStore.openModal('offline')">新增线下面试</el-button>
          </div>
        </div>
      </template>

      <el-empty v-if="interviewStore.interviews.length === 0 && !listLoading" description="暂无面试安排，请点击上方按钮创建" />

      <ul v-else v-loading="listLoading" class="session-list">
        <li v-for="item in interviewStore.interviews" :key="item.id" class="session-item">
          <div class="resume-info">
            <div>
              <span class="status-badge" :style="{
                backgroundColor: item.session_type === 'online' ? '#eef2fe' : '#f5f6f7',
                color: item.session_type === 'online' ? '#3370ff' : '#646a73'
              }">
                {{ item.session_type === 'online' ? '线上面试' : '线下面试' }}
              </span>
              <span style="margin-left:8px; font-weight: bold;">候选人名称: {{ item.candidate_name }}</span>
              <span style="margin-left:8px; color: #666; font-size: 13px;" v-if="item.resume_id">
                (已关联简历 ID: {{ item.resume_id }})
              </span>
            </div>
            <div style="font-size: 13px; color: #555; margin-top: 4px;">
              预定时间段: {{ interviewStore.formatTime(item.scheduled_start_at) }}  至  {{ interviewStore.formatTime(item.scheduled_end_at) }}
            </div>
            <div style="font-size: 13px; color: #555; margin-top: 4px;" v-if="item.notes">
              面试备注: 
              <span style="font-family: monospace; background: #f0f0f0; padding: 2px 4px; border-radius: 4px;">{{ item.notes }}</span>
            </div>
          </div>
          <div class="actions">
            <el-button type="info" link size="small" @click="handleViewDetail(item.id)">详情</el-button>
            <el-button type="primary" link size="small" v-if="!item.session_id" @click="handleCreateSession(item)">创建 ASR</el-button>
            <el-button type="success" link size="small" v-if="item.session_id" @click="handleStartASR(item)">启动 ASR</el-button>
            <el-button type="primary" text size="small" @click="interviewStore.editInterview(item)">编辑信息</el-button>
            <el-button type="danger" text size="small" @click="handleDelete(item.id)">取消/删除</el-button>
          </div>
        </li>
      </ul>
    </el-card>

    <!-- 面试表单弹窗 -->
    <InterviewFormDialog
      v-model:visible="interviewStore.showModal"
      :is-edit-mode="interviewStore.isEditMode"
      :form="interviewStore.interviewForm"
      :resumes="resumeStore.resumes"
      :all-interviews="interviewStore.interviews"
      @save="handleSave"
    />

    <!-- 面试详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="面试预约详细信息" width="550px">
      <el-descriptions border :column="1" size="small" v-if="sessionDetail">
        <el-descriptions-item label="面试 ID">{{ sessionDetail.id }}</el-descriptions-item>
        <el-descriptions-item label="候选人">{{ sessionDetail.candidate_name }}</el-descriptions-item>
        <el-descriptions-item label="计划状态">
          <el-tag size="small" :type="sessionDetail.status === 'scheduled' ? 'warning' : 'info'">{{ sessionDetail.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="会议类型">{{ sessionDetail.session_type === 'online' ? '线上面试' : '线下面试' }}</el-descriptions-item>
        <el-descriptions-item label="预定时间">
          {{ interviewStore.formatTime(sessionDetail.scheduled_start_at) }} 至 {{ interviewStore.formatTime(sessionDetail.scheduled_end_at) }}
        </el-descriptions-item>
        <el-descriptions-item label="实际起止">
          {{ sessionDetail.started_at ? interviewStore.formatTime(sessionDetail.started_at) : '尚未开始' }}
          -
          {{ sessionDetail.ended_at ? interviewStore.formatTime(sessionDetail.ended_at) : '尚未结束' }}
        </el-descriptions-item>
        <el-descriptions-item label="面试备注">{{ sessionDetail.notes || '无' }}</el-descriptions-item>
        <el-descriptions-item label="招聘官 ID">{{ sessionDetail.recruiter_id }}</el-descriptions-item>
        <el-descriptions-item label="关联简历 ID">{{ sessionDetail.resume_id || '无' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ interviewStore.formatTime(sessionDetail.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="最后更新">{{ interviewStore.formatTime(sessionDetail.updated_at) }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" @click="detailDialogVisible = false">关闭预览</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import { getCurrentUser } from '../../services/authService'
import { interviewApi } from '../../api/interview'
import { resumeApi } from '../../api/resume'
import { useInterviewStore } from '../../stores/interviewStore'
import { useResumeStore } from '../../stores/resumeStore'
import InterviewFormDialog from '../../components/InterviewFormDialog.vue'

const interviewStore = useInterviewStore()
const resumeStore = useResumeStore()
const currentUser = ref(getCurrentUser() || { id: 1, username: '管理员' })
const router = useRouter()
const listLoading = ref(false)

const fetchInterviews = async () => {
  listLoading.value = true
  try {
    const data = await interviewApi.getUserInterviewSessions(currentUser.value.id)
    interviewStore.interviews = Array.isArray(data) ? data : (data.items || data.data || [])
  } catch (error) {
    ElMessage.error('获取面试列表失败: ' + (error?.detail || error?.message || '未知错误'))
  } finally {
    listLoading.value = false
  }
}

const fetchResumesSilent = async () => {
  try {
    const data = await resumeApi.getResumes()
    const list = Array.isArray(data) ? data : (data.items || data.data || [])
    resumeStore.setResumes(list)
  } catch (e) {
    console.warn('获取关联简历数据失败', e)
  }
}

onMounted(() => {
  fetchInterviews()
  fetchResumesSilent()
})

const handleSave = async () => {
  const form = interviewStore.interviewForm
  if (!form.candidate_name) {
    ElMessage.warning('请填写候选人姓名')
    return
  }
  if (!form.scheduled_start_at || !form.scheduled_end_at) {
    ElMessage.warning('请选择完整的面试起止时间')
    return
  }

  const now = new Date()
  // 替换横杠兼容特定浏览器 Date 解析
  const startTime = new Date(form.scheduled_start_at.replace(/-/g, '/'))
  const endTime = new Date(form.scheduled_end_at.replace(/-/g, '/'))

  if (startTime <= now) {
    ElMessage.warning('面试开始时间必须在当前系统时间之后')
    return
  }
  
  if (endTime <= startTime) {
    ElMessage.warning('面试结束时间必须晚于面试开始时间')
    return
  }

  const loading = ElLoading.service({ lock: true, text: interviewStore.isEditMode ? '提交修改中...' : '提交新建中...' })
  try {
    if (interviewStore.isEditMode) {
      // 编辑接口专属精简载荷
      const editPayload = {
        candidate_name: form.candidate_name,
        resume_id: form.resume_id || 0,
        session_type: form.session_type || 'online',
        scheduled_start_at: form.scheduled_start_at,
        scheduled_end_at: form.scheduled_end_at,
        notes: form.notes || ''
      }
      await interviewApi.updateReserveSession(form.id, editPayload)
      ElMessage.success('面试安排修改成功！')
    } else {
      // 新建接口载荷（含 recruiter_id）
      const createPayload = {
        candidate_name: form.candidate_name,
        recruiter_id: currentUser.value.id,
        resume_id: form.resume_id || 0,
        session_type: form.session_type || 'online',
        scheduled_start_at: form.scheduled_start_at,
        scheduled_end_at: form.scheduled_end_at,
        notes: form.notes || ''
      }
      await interviewApi.reserveSession(createPayload)
      ElMessage.success('面试安排预定成功！')
    }
    
    interviewStore.showModal = false
    fetchInterviews() // 无论增改，重新拉取列表同步最新后台视图
  } catch (error) {
    if (Array.isArray(error?.detail)) {
        const msgs = error.detail.map(e => e.msg).join('; ')
        ElMessage.error(`创建失败: ${msgs}`)
    } else {
        ElMessage.error('创建面试失败: ' + (error?.detail || error?.message || '未知异常'))
    }
  } finally {
    loading.close()
  }
}

const detailDialogVisible = ref(false)
const sessionDetail = ref(null)

const handleViewDetail = async (id) => {
  const loading = ElLoading.service({ lock: true, text: '正在拉取预约详情...' })
  try {
    const res = await interviewApi.getReserveSession(id)
    sessionDetail.value = res
    detailDialogVisible.value = true
  } catch (err) {
    ElMessage.error('获取详情失败: ' + (err?.detail || err?.message || '网络错误'))
  } finally {
    loading.close()
  }
}

const handleDelete = (id) => {
  ElMessageBox.confirm(
    '是否确定要永久取消并销毁该面试会话记录？',
    '撤销警告',
    {
      confirmButtonText: '果断删除',
      cancelButtonText: '保留',
      type: 'warning'
    }
  ).then(async () => {
    const loading = ElLoading.service({ lock: true, text: '正在进行数据销毁...' })
    try {
      await interviewApi.deleteReserveSession(id)
      ElMessage.success('面试安排删除成功！')
      fetchInterviews()
    } catch (err) {
      ElMessage.error('无法删除此面试安排: ' + (err?.detail || err?.message || '网络连接异常'))
    } finally {
      loading.close()
    }
  }).catch(() => {})
}

const handleCreateSession = (item) => {
  router.push(`/interview-assistant/${item.id}`)
}

const handleStartASR = (item) => {
  if (!item.session_id) {
    ElMessage.warning('请先创建面试会话')
    return
  }
  router.push(`/interview/${item.session_id}`)
}
</script>

<style scoped lang="scss">
.interview-manage {
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

      .header-actions {
        display: flex;
        gap: 8px;
      }
    }
  }

  .session-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .session-item {
    padding: 16px 0;
    border-bottom: 1px solid #dee0e3;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;

    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
  }

  .resume-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
  }

  .status-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }
}
</style>

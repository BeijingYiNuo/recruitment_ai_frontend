<template>
  <div class="feishu-page">
    <div class="card-container">
      
      <!-- Header Area -->
      <div class="header-area">
        <div class="header-top">
          <div class="title-area">
            <h1>面试管理</h1>
            <span class="badge">{{ interviewStore.interviews?.length || 0 }}</span>
          </div>
          <div class="action-btn-group">
            <el-button type="primary" class="lark-btn-primary" @click="interviewStore.openModal('online')">新增线上面试</el-button>
            <el-button class="lark-btn-ghost" @click="interviewStore.openModal('offline')">新增线下面试</el-button>
          </div>
        </div>
      </div>

      <!-- Main List Area -->
      <div class="list-area" v-loading="listLoading">
        <div class="list-header-row">
          <div class="col-candidate">候选人</div>
          <div class="col-time">预约面试时间</div>
          <div class="col-status">计划状态</div>
          <div class="col-type">会议类型</div>
          <div class="col-action">操作</div>
        </div>
        
        <div class="list-body">
          <el-empty 
            v-if="interviewStore.interviews.length === 0 && !listLoading" 
            description="暂无面试安排，请点击上方按钮创建" 
            style="padding: 60px 0"
          />
          
          <div 
            v-else
            class="list-row"
            v-for="item in interviewStore.interviews" 
            :key="item.id"
            @click="handleViewDetail(item.id)"
          >
            <div class="col-candidate">
              <el-avatar :size="32" class="lark-avatar">{{ item.candidate_name?.charAt(0) || 'U' }}</el-avatar>
              <div class="candidate-detail">
                <span class="name-text">{{ item.candidate_name }}</span>
              </div>
            </div>
            
            <div class="col-time">
              <div class="time-range">
                <span class="main-time">{{ interviewStore.formatTime(item.scheduled_start_at) }}</span>
                <span class="time-sep">至</span>
                <span class="main-time">{{ interviewStore.formatTime(item.scheduled_end_at) }}</span>
              </div>
            </div>
            
            <div class="col-status">
              <span class="lark-tag" :class="'tag-' + getStatusType(item.status)">
                {{ getStatusLabel(item.status) }}
              </span>
            </div>

            <div class="col-type">
              <span class="lark-tag" :class="item.session_type === 'online' ? 'tag-primary' : 'tag-gray'">
                {{ item.session_type === 'online' ? '线上面试' : '线下面试' }}
              </span>
            </div>
            
            <div class="col-action">
              <el-button type="primary" link size="small" v-if="!item.session_id && item.status !== 'completed' && item.status !== 'cancelled'" @click.stop="handleCreateSession(item)">开始面试</el-button>
              <el-button type="success" link size="small" v-if="item.session_id && item.status !== 'completed' && item.status !== 'cancelled'" @click.stop="handleStartASR(item)">启动 ASR</el-button>
              <el-button type="primary" link size="small" v-if="item.status === 'completed'" @click.stop="handleViewReport(item)">查看面试报告</el-button>
              <el-button type="primary" link size="small" v-if="item.status !== 'completed' && item.status !== 'cancelled'" @click.stop="interviewStore.editInterview(item)">编辑</el-button>
              <el-button type="danger" link size="small" @click.stop="handleDelete(item.id)">删除</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 面试表单弹窗 -->
    <InterviewFormDialog
      v-model:visible="interviewStore.showModal"
      :is-edit-mode="interviewStore.isEditMode"
      :form="interviewStore.interviewForm"
      :resumes="resumeStore.resumes"
      :knowledge-bases="knowledgeBases"
      :all-interviews="interviewStore.interviews"
      @save="handleSave"
    />

    <!-- 面试详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="面试预约详细信息" width="550px" class="lark-dialog">
      <el-descriptions border :column="1" size="small" v-if="sessionDetail" class="lark-descriptions">
        <el-descriptions-item label="面试 ID">{{ sessionDetail.id }}</el-descriptions-item>
        <el-descriptions-item label="候选人">{{ sessionDetail.candidate_name }}</el-descriptions-item>
        <el-descriptions-item label="计划状态">
          <span class="lark-tag" :class="'tag-' + getStatusType(sessionDetail.status)">
            {{ getStatusLabel(sessionDetail.status) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="会议类型">
          <span class="lark-tag" :class="sessionDetail.session_type === 'online' ? 'tag-primary' : 'tag-gray'">
            {{ sessionDetail.session_type === 'online' ? '线上面试' : '线下面试' }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="预定时间">
          {{ interviewStore.formatTime(sessionDetail.scheduled_start_at) }} 至 {{ interviewStore.formatTime(sessionDetail.scheduled_end_at) }}
        </el-descriptions-item>
        <el-descriptions-item label="实际起止">
          <span :class="sessionDetail.started_at ? '' : 'text-placeholder'">
            {{ sessionDetail.started_at ? interviewStore.formatTime(sessionDetail.started_at) : '尚未开始' }}
          </span>
          <span class="mx-2">-</span>
          <span :class="sessionDetail.ended_at ? '' : 'text-placeholder'">
            {{ sessionDetail.ended_at ? interviewStore.formatTime(sessionDetail.ended_at) : '尚未结束' }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="面试备注">{{ sessionDetail.notes || '无' }}</el-descriptions-item>
        <el-descriptions-item label="招聘官 ID">{{ sessionDetail.recruiter_id }}</el-descriptions-item>
        <el-descriptions-item label="关联简历 ID">{{ sessionDetail.resume_id || '无' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ interviewStore.formatTime(sessionDetail.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="最后更新">{{ interviewStore.formatTime(sessionDetail.updated_at) }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" class="lark-btn-primary" @click="detailDialogVisible = false">关闭预览</el-button>
        </div>
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
import { knowledgeApi } from '../../api/knowledge'
import { useInterviewStore } from '../../stores/interviewStore'
import { useResumeStore } from '../../stores/resumeStore'
import InterviewFormDialog from '../../components/InterviewFormDialog.vue'

const interviewStore = useInterviewStore()
const resumeStore = useResumeStore()
const currentUser = ref(getCurrentUser() || { id: 1, username: '管理员' })
const router = useRouter()
const listLoading = ref(false)
const knowledgeBases = ref([])

const getStatusLabel = (status) => {
  const map = {
    'scheduled': '已预约',
    'ongoing': '进行中',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return map[status] || status
}

const getStatusType = (status) => {
  const map = {
    'scheduled': 'warning',
    'ongoing': 'success',
    'completed': 'info',
    'cancelled': 'danger'
  }
  return map[status] || 'info'
}

const fetchInterviews = async () => {
  listLoading.value = true
  try {
    const data = await interviewApi.getUserInterviewSessions(currentUser.value.id)
    let list = Array.isArray(data) ? data : (data.items || data.data || [])
    
    // 按创建时间降序排列，最新的在最上面
    list.sort((a, b) => {
      const timeA = new Date(a.created_at || 0).getTime()
      const timeB = new Date(b.created_at || 0).getTime()
      return timeB - timeA
    })

    interviewStore.interviews = list
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

const fetchKnowledgeBasesSilent = async () => {
  try {
    const data = await knowledgeApi.getCollections()
    knowledgeBases.value = Array.isArray(data) ? data : (data.items || data.data || [])
  } catch (e) {
    console.warn('获取关联知识库数据失败', e)
  }
}

onMounted(() => {
  fetchInterviews()
  fetchResumesSilent()
  fetchKnowledgeBasesSilent()
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
        knowledge_id: form.knowledge_id || 0,
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
        knowledge_id: form.knowledge_id || 0,
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
    '是否确定要永久删除该面试记录？删除后将无法恢复。',
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
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

const handleViewReport = (item) => {
  // 跳转到报告生成页面
  router.push('/dashboard/report-generate')
}
</script>

<style scoped lang="scss">
/* 核心设计令牌 (Lark Design Tokens) */
.feishu-page {
  background-color: #F5F6F7;
  padding: 16px 24px;
  min-height: calc(100vh - 60px);
  font-family: "Lark Sans", "Lark Unicode", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

.card-container {
  background-color: #FFFFFF;
  border-radius: 8px;
  border: 1px solid #DEE0E3;
  min-height: 80vh;
  box-shadow: 0 2px 8px rgba(31, 35, 41, 0.04);
  display: flex;
  flex-direction: column;
}

/* 顶部配置与筛选控制流 */
.header-area {
  padding: 20px 24px;
  border-bottom: 1px solid #DEE0E3;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-area {
  display: flex;
  align-items: center;
}

.title-area h1 {
  font-size: 20px;
  font-weight: 600;
  color: #1F2329;
  margin: 0;
}

.badge {
  background-color: #E1EAFF;
  color: #3370FF;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  margin-left: 12px;
}

.action-btn-group {
  display: flex;
  gap: 12px;
}

/* 按钮规范 */
.lark-btn-primary {
  background-color: #3370FF;
  border-color: #3370FF;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.2s;
  &:hover { background-color: #2458D9; border-color: #2458D9; }
}

.lark-btn-ghost {
  border: 1px solid #DEE1E5;
  color: #1F2329;
  background: transparent;
  border-radius: 4px;
  font-weight: 500;
  &:hover { background: #F5F6F7; color: #3370FF; border-color: #3370FF; }
}

/* 列表渲染 */
.list-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.list-header-row {
  display: flex;
  align-items: center;
  padding: 0 24px;
  height: 44px;
  color: #646A73;
  font-size: 14px;
  font-weight: 500;
  border-bottom: 1px solid #DEE0E3;
  background-color: #FFFFFF;
}

.list-body {
  flex: 1;
}

.list-row {
  display: flex;
  align-items: center;
  padding: 0 24px;
  height: 72px;
  border-bottom: 1px solid #F5F6F7;
  cursor: pointer;
  transition: background-color 0.2s;
  &:hover { background-color: #F0F4FF; }
}

/* 列定义 */
.col-candidate { flex: 1.5; min-width: 180px; display: flex; align-items: center; }
.col-time { flex: 2; min-width: 320px; display: flex; align-items: center; }
.col-status { flex: 1; min-width: 100px; display: flex; align-items: center; }
.col-type { flex: 1; min-width: 110px; display: flex; align-items: center; }
.col-action { flex: 1.5; min-width: 220px; display: flex; gap: 4px; justify-content: flex-end; align-items: center; }

/* 候选人信息 */
.candidate-detail {
  margin-left: 12px;
  display: flex;
  flex-direction: column;
}

.name-text {
  font-size: 14px;
  font-weight: 500;
  color: #1F2329;
  letter-spacing: -0.2px;
}

.resume-id {
  font-size: 12px;
  color: #8F959E;
  margin-top: 2px;
}

.lark-avatar {
  background-color: #3370FF;
  color: #FFF;
  font-weight: 600;
}

/* 时间显示 */
.time-range {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1F2329;
  font-size: 13px;
}

.main-time {
  background: #F5F6F7;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 400;
  letter-spacing: 0.2px;
}

.time-sep {
  color: #8F959E;
}

/* 标签域 (浅色背景 + 深色文字) */
.lark-tag {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.tag-primary { background: #E1EAFF; color: #3370FF; }
.tag-warning { background: #FFF4E5; color: #FF8800; }
.tag-success { background: #E4F7EB; color: #13A248; }
.tag-danger  { background: #FFE4E2; color: #F53F3F; }
.tag-info    { background: #F0F1F5; color: #646A73; }
.tag-gray    { background: #F5F6F7; color: #646A73; }

/* 弹窗与描述 */
.lark-dialog {
  :deep(.el-dialog__header) {
    padding: 20px 24px;
    margin-right: 0;
    border-bottom: 1px solid #DEE1E5;
    .el-dialog__title { font-size: 16px; font-weight: 600; color: #1F2329; }
  }
  :deep(.el-dialog__body) { padding: 24px; }
  :deep(.el-dialog__footer) { padding: 12px 24px 20px; border-top: 1px solid #DEE1E5; }
}

.lark-descriptions {
  :deep(.el-descriptions__label) {
    background-color: #F5F6F7 !important;
    color: #646A73;
    font-weight: 500;
    width: 120px;
  }
  :deep(.el-descriptions__content) {
    color: #1F2329;
  }
}

.text-placeholder {
  color: #8F959E;
  font-style: italic;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.mx-2 { margin: 0 8px; }
</style>

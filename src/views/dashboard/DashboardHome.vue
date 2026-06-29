<template>
  <div class="dashboard-home">
    <!-- Stats Cards -->
    <div class="stats-grid" v-loading="statsLoading">
      <div class="stat-card clickable" @click="router.push('/dashboard/cv')">
        <div class="stat-icon total"><el-icon><Document /></el-icon></div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.totalResumes }}</span>
          <span class="stat-label">总体简历数</span>
        </div>
      </div>
      <div class="stat-card clickable" @click="router.push('/dashboard/resume-review')">
        <div class="stat-icon pending-review"><el-icon><Edit /></el-icon></div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.pendingReview }}</span>
          <span class="stat-label">待审阅简历</span>
        </div>
      </div>
      <div class="stat-card clickable" @click="router.push('/dashboard/interview-manage')">
        <div class="stat-icon pending-interview"><el-icon><Timer /></el-icon></div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.pendingInterview }}</span>
          <span class="stat-label">待面试人数</span>
        </div>
      </div>
      <div class="stat-card clickable" @click="router.push('/dashboard/resume-review?filter=PENDING')">
        <div class="stat-icon pending-decision"><el-icon><QuestionFilled /></el-icon></div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.pendingDecision }}</span>
          <span class="stat-label">待决策人数</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon today"><el-icon><Calendar /></el-icon></div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.todayInterviews }}</span>
          <span class="stat-label">今日面试</span>
        </div>
      </div>
      <div class="stat-card clickable" @click="router.push('/dashboard/positions')">
        <div class="stat-icon completed"><el-icon><CircleCheck /></el-icon></div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.totalPositions }}</span>
          <span class="stat-label">岗位数量</span>
        </div>
      </div>
    </div>

    <!-- Calendar Section -->
    <el-card class="calendar-card" shadow="never">
      <div class="calendar-header">
        <h3>约见安排</h3>
        <span class="header-tip">点击面试安排可跳转详情 · 右键可取消面试</span>
      </div>
      <div v-loading="calendarLoading" class="calendar-body">
        <el-empty v-if="!calendarLoading && interviewList.length === 0" description="暂无已预约面试安排" style="padding: 40px 0" />
        <div v-else class="calendar-grid-wrapper">
          <InterviewCalendar
            :interviews="interviewList"
            :read-only="true"
            :disable-past-selection="false"
            :hour-height="45"
            @interview-click="handleInterviewClick"
            @interview-contextmenu="handleInterviewContextMenu"
          />
        </div>
      </div>
    </el-card>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenuVisible"
      class="context-menu"
      :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
    >
      <div v-if="contextMenuInterview?.status === 'scheduled' || contextMenuInterview?.status === 'ongoing'" class="context-menu-item" @click="handleCancelInterview">
        <el-icon><CircleClose /></el-icon>
        <span>取消面试</span>
      </div>
      <div v-else-if="contextMenuInterview?.status === 'cancelled'" class="context-menu-item context-menu-item-restore" @click="handleRestoreInterview">
        <el-icon><CircleCheck /></el-icon>
        <span>恢复预约</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { resumeApi } from '../../api/resume'
import { interviewApi } from '../../api/interview'
import { positionApi } from '../../api/position'
import InterviewCalendar from '../../components/calendar/InterviewCalendar.vue'
import {
  Document, Edit, Timer, QuestionFilled, Calendar, CircleCheck, CircleClose
} from '@element-plus/icons-vue'

const router = useRouter()
const statsLoading = ref(false)
const calendarLoading = ref(false)
const interviewList = ref([])

// 右键菜单状态
const contextMenuVisible = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuInterview = ref(null)

// 关闭右键菜单
function closeContextMenu() {
  contextMenuVisible.value = false
  contextMenuInterview.value = null
}

function handleInterviewClick(evt) {
  closeContextMenu()
  router.push('/dashboard/interview-manage?highlight=' + evt.id)
}

function handleInterviewContextMenu({ event, interview }) {
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY
  contextMenuInterview.value = interview
  contextMenuVisible.value = true
}

async function handleCancelInterview() {
  const interview = contextMenuInterview.value
  if (!interview) return
  closeContextMenu()
  if (interview.status === 'cancelled') {
    ElMessage.info('该面试已取消')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定要取消「${interview.candidate_name}」的面试安排吗？`,
      '取消面试确认',
      { confirmButtonText: '确定取消', cancelButtonText: '暂不', type: 'warning' }
    )
    await interviewApi.updateReserveSession(interview.id, { status: 'cancelled' })
    ElMessage.success('已取消面试安排')
    // 刷新数据
    fetchInterviewSchedules()
    fetchStats()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('取消失败: ' + (e?.detail || e?.message || '网络连接异常'))
    }
  }
}

async function handleRestoreInterview() {
  const interview = contextMenuInterview.value
  if (!interview) return
  closeContextMenu()
  try {
    await ElMessageBox.confirm(
      `确定要将「${interview.candidate_name}」恢复为已预约状态吗？`,
      '恢复预约确认',
      { confirmButtonText: '确定恢复', cancelButtonText: '暂不', type: 'info' }
    )
    await interviewApi.updateReserveSession(interview.id, { status: 'scheduled' })
    ElMessage.success('已恢复预约')
    // 刷新数据
    fetchInterviewSchedules()
    fetchStats()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('恢复失败: ' + (e?.detail || e?.message || '网络连接异常'))
    }
  }
}

// 点击页面空白处关闭右键菜单
function onDocumentClick() {
  closeContextMenu()
}

const stats = reactive({
  totalResumes: 0,
  pendingReview: 0,
  pendingInterview: 0,
  pendingDecision: 0,
  todayInterviews: 0,
  totalPositions: 0
})

async function fetchStats() {
  statsLoading.value = true
  try {
    // 合并请求：获取简历、面试列表、岗位列表
    const [resumesResult, sessions, positions] = await Promise.all([
      resumeApi.getResumes(0, 10000).catch(() => null),
      interviewApi.getUserInterviewSessions({}).catch(() => null),
      positionApi.list().catch(() => null),
    ])

    const allList = Array.isArray(resumesResult) ? resumesResult : (resumesResult?.items || [])
    const sessionList = Array.isArray(sessions) ? sessions : (sessions?.items || [])

    // 客户端侧按 review_status 分类统计
    stats.totalResumes = allList.length
    stats.pendingReview = allList.filter(r => !r.review_status || r.review_status === '').length
    stats.pendingDecision = allList.filter(r => r.review_status === 'PENDING').length

    // 统计面试数据
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 86400000)

    let pendingInterview = 0
    let todayCount = 0

    for (const s of sessionList) {
      if (s.status === 'scheduled') {
        pendingInterview++
        const startTime = new Date(s.scheduled_start_at?.replace('T', ' ') || s.scheduled_start_at)
        if (startTime >= todayStart && startTime < todayEnd) {
          todayCount++
        }
      }
    }

    stats.pendingInterview = pendingInterview
    stats.todayInterviews = todayCount
    stats.totalPositions = Array.isArray(positions) ? positions.length : (positions?.total || 0)
  } catch (e) {
    console.error('Failed to fetch stats:', e)
  } finally {
    statsLoading.value = false
  }
}

async function fetchInterviewSchedules() {
  calendarLoading.value = true
  try {
    const data = await interviewApi.getUserInterviewSessions({})
    interviewList.value = Array.isArray(data) ? data : (data.items || [])
  } catch (error) {
    console.error('Failed to fetch schedules:', error)
  } finally {
    calendarLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchStats(), fetchInterviewSchedules()])
  document.addEventListener('click', onDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})
</script>

<style scoped lang="scss">
.dashboard-home {
  max-width: 1400px;
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.stat-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #dee0e3;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(31, 35, 41, 0.04);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(31, 35, 41, 0.08);
  }
  &.clickable {
    cursor: pointer;
    &:hover {
      border-color: #3370ff;
    }
  }
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .el-icon { font-size: 24px; }

  &.total { background: #eef2fe; color: #3370ff; }
  &.pending-review { background: #fff7e6; color: #faad14; }
  &.pending-interview { background: #e8f8e8; color: #52c41a; }
  &.pending-decision { background: #fce8e6; color: #ff4d4f; }
  &.today { background: #f0f4ff; color: #3370ff; }
  &.completed { background: #e8f8e8; color: #13a248; }
}

.stat-info {
  display: flex;
  flex-direction: column;

  .stat-value {
    font-size: 26px;
    font-weight: 700;
    color: #1f2329;
    line-height: 1.2;
  }

  .stat-label {
    font-size: 13px;
    color: #8f959e;
    margin-top: 2px;
  }
}

/* Calendar Card */
.calendar-card {
  border-radius: 12px;
  border: 1px solid #dee0e3;
  box-shadow: 0 4px 12px rgba(31, 35, 41, 0.04);
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  :deep(.el-card__body) {
    padding: 0;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }

  .calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 24px;
    border-bottom: 1px solid #dee0e3;
    flex-shrink: 0;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #1f2329;
    }

    .header-tip {
      font-size: 13px;
      color: #8f959e;
    }
  }

  .calendar-body {
    padding: 0;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .calendar-grid-wrapper {
    flex: 1;
    min-height: 0;
  }
}

// Responsive: 3-col on smaller screens
@media (max-width: 1200px) {
  .stats-grid { grid-template-columns: repeat(3, 1fr); }
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  z-index: 9999;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,.15);
  padding: 4px 0;
  min-width: 140px;
}
.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 13px;
  color: #1f2329;
  cursor: pointer;
  transition: background 0.15s;
}
.context-menu-item:hover {
  background: #f5f6f8;
}
.context-menu-item .el-icon {
  font-size: 16px;
  color: #f56c6c;
}
.context-menu-item-restore .el-icon {
  color: #13a248;
}
</style>

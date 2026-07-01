<template>
  <div class="dashboard-home">
    <!-- ====== 顶部数据统计卡片 ====== -->
    <div class="stats-grid" v-loading="statsLoading" element-loading-text="加载统计数据...">
      <div
        v-for="card in STAT_CARDS"
        :key="card.key"
        class="stat-card"
        :class="{ 'is-clickable': !!card.path }"
        @click="card.path && router.push(card.path)"
      >
        <el-tooltip :content="card.tooltip" placement="top" :show-after="400">
          <div class="stat-card-body">
            <div class="stat-icon" :class="'stat-icon--' + card.key">
              <el-icon :size="22"><component :is="card.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats[card.key] }}</span>
              <span class="stat-label">{{ card.label }}</span>
            </div>
          </div>
        </el-tooltip>
      </div>
    </div>

    <!-- ====== 主体区域：左侧日历 + 右侧日程 ====== -->
    <div class="dashboard-body">
      <!-- ===== 左侧迷你日历面板 ===== -->
      <div class="left-calendar-panel">
        <div class="mini-cal">
          <!-- 标题 + 翻页 -->
          <div class="mini-cal-header">
            <span class="mini-cal-title">{{ miniCalTitle }}</span>
            <div class="mini-cal-nav">
              <button class="mini-cal-nav-btn" @click="prevMonth">‹</button>
              <button class="mini-cal-nav-btn" @click="nextMonth">›</button>
            </div>
          </div>
          <!-- 快捷切换 -->
          <div class="mini-cal-quick">
            <button class="mini-cal-qbtn" :class="{ active: quickActive === 'week' }" @click="goThisWeek">本周</button>
            <button class="mini-cal-qbtn" :class="{ active: quickActive === 'month' }" @click="goThisMonth">本月</button>
          </div>
          <!-- 星期行 -->
          <div class="mini-cal-weekdays">
            <span v-for="w in MINI_WEEK_LABELS" :key="w">{{ w }}</span>
          </div>
          <!-- 日期网格 -->
          <div class="mini-cal-grid">
            <div
              v-for="(cell, idx) in miniCalCells"
              :key="idx"
              class="mini-cal-cell"
              :class="{
                'is-other-month': cell.isOtherMonth,
                'is-weekend': cell.isWeekend,
                'is-today': cell.isToday,
                'is-selected': cell.dateStr === selectedDate,
                'is-in-month': !cell.isOtherMonth,
              }"
              @click="onMiniDateClick(cell)"
            >
              {{ cell.day }}
              <span v-if="cell.hasEvent && !cell.isToday" class="event-dot"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 右侧约见安排日程模块 ===== -->
      <div class="right-schedule-panel">
        <!-- 标题栏 -->
        <div class="schedule-topbar">
          <div class="schedule-topbar-left">
            <h3 class="schedule-title">约见安排</h3>
            <span class="schedule-hint">点击可跳转详情 · 右键可操作</span>
          </div>
          <el-button size="small" class="btn-new-interview" @click="handleNewInterview">
            <el-icon><Plus /></el-icon> 新建面试
          </el-button>
        </div>

        <!-- 日期工具栏 -->
        <div class="schedule-toolbar">
          <div class="schedule-toolbar-left">
            <button class="btn-today" @click="goToday">今天</button>
            <button class="schedule-nav-btn" @click="prevWeek">‹</button>
            <button class="schedule-nav-btn" @click="nextWeek">›</button>
            <span class="schedule-week-title">{{ scheduleTitle }}</span>
          </div>
        </div>

        <!-- 日程主体（时间轴 + 网格） -->
        <div class="schedule-body">
          <div class="schedule-scroll-wrap" ref="gridScrollRef" v-loading="calendarLoading">
            <!-- 整体空态 -->
            <div v-if="!calendarLoading && interviewList.length === 0" class="schedule-empty-all">
              <el-empty description="暂无已预约面试安排" :image-size="80" />
            </div>
            <div v-else class="schedule-grid">
              <!-- 固定日期头（粘性顶部，随水平滚动，垂直固定） -->
              <div class="schedule-header-sticky">
                <div class="schedule-gutter-spacer"></div>
                <div
                  v-for="day in weekDays"
                  :key="day.dateStr"
                  class="schedule-col-header"
                  :class="{ 'is-today': day.isToday }"
                >
                  <span class="sched-day-name">{{ day.name }}</span>
                  <span class="sched-day-num">{{ day.number }}</span>
                </div>
              </div>
              <!-- 时间轴 + 列体 -->
              <div class="schedule-body-row" :style="{ height: totalGridHeight + 'px' }">
                <div class="schedule-time-gutter">
                  <div
                    v-for="hour in visibleHours"
                    :key="hour"
                    class="schedule-time-label"
                    :style="{ top: (hour - startHour) * hourHeight + 'px' }"
                  >
                    {{ formatHour(hour) }}
                  </div>
                </div>
                <div class="schedule-columns">
                  <div
                    v-for="day in weekDays"
                    :key="day.dateStr"
                    class="schedule-column"
                    :class="{ 'is-today': day.isToday, 'is-selected': day.dateStr === selectedDate }"
                  >
                    <div
                      v-for="hour in visibleHours"
                      :key="hour"
                      class="schedule-hour-line"
                      :style="{ top: (hour - startHour) * hourHeight + 'px' }"
                    ></div>

                    <div
                      v-for="evt in getEventsForDay(day.dateStr)"
                      :key="evt.id"
                      class="schedule-event"
                      :class="'status-' + (evt.status || 'scheduled')"
                      :style="getEventStyle(evt)"
                      @click="handleEventClick(evt)"
                      @contextmenu.prevent="handleContextMenu($event, evt)"
                    >
                      <div class="sched-ev-title">{{ evt.candidate_name || '未命名面试' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ====== 右键菜单（teleport 到 body 避免裁剪） ====== -->
    <div
      v-if="contextMenuVisible"
      class="context-menu"
      :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
    >
      <div
        v-if="contextInterview?.status === 'scheduled' || contextInterview?.status === 'ongoing'"
        class="context-menu-item context-menu-item-danger"
        @click="handleContextAction('cancel')"
      >
        <el-icon><CircleClose /></el-icon><span>取消面试</span>
      </div>
      <div
        v-else-if="contextInterview?.status === 'cancelled'"
        class="context-menu-item context-menu-item-success"
        @click="handleContextAction('restore')"
      >
        <el-icon><CircleCheck /></el-icon><span>恢复预约</span>
      </div>
      <div class="context-menu-item" @click="handleContextAction('view-resume')">
        <el-icon><Document /></el-icon><span>查看简历</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { resumeApi } from '../../api/resume'
import { interviewApi } from '../../api/interview'
import { positionApi } from '../../api/position'
import { useInterviewStore } from '../../stores/interviewStore'
import {
  Document, Edit, Timer, QuestionFilled, Calendar, Briefcase,
  CircleCheck, CircleClose, Plus
} from '@element-plus/icons-vue'

const router = useRouter()
const interviewStore = useInterviewStore()

// ============================================================
//  常量 / 配置
// ============================================================
const STAT_CARDS = [
  { key: 'totalResumes',    label: '总体简历数',   icon: Document,       tooltip: '系统内所有简历的总数',              path: '/dashboard/cv' },
  { key: 'pendingReview',   label: '待审阅简历',   icon: Edit,           tooltip: '尚未进行审核的简历数量，请及时处理',  path: '/dashboard/resume-review' },
  { key: 'pendingInterview', label: '待面试人数',  icon: Timer,          tooltip: '已通过审核、等待安排面试的候选人数量', path: '/dashboard/interview-manage' },
  { key: 'pendingDecision', label: '待决策人数',   icon: QuestionFilled,  tooltip: '面试完成后等待最终决策的候选人数量',  path: '/dashboard/resume-review?filter=PENDING' },
  { key: 'todayInterviews', label: '今日面试',     icon: Calendar,       tooltip: '今日安排的面试总场次',                 path: '/dashboard/interview-manage' },
  { key: 'totalPositions',  label: '岗位数量',     icon: Briefcase,      tooltip: '系统中已发布的招聘岗位总数',          path: '/dashboard/positions' },
]

const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const MINI_WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六']

// ============================================================
//  时间网格常量
// ============================================================
const startHour = 8
const endHour = 20
const hourHeight = 60 // px

// ============================================================
//  数据状态
// ============================================================
const statsLoading = ref(false)
const calendarLoading = ref(false)
const stats = reactive({
  totalResumes: 0,
  pendingReview: 0,
  pendingInterview: 0,
  pendingDecision: 0,
  todayInterviews: 0,
  totalPositions: 0,
})

const interviewList = ref([])

// ============================================================
//  日历状态
// ============================================================
const miniCalYear = ref(new Date().getFullYear())
const miniCalMonth = ref(new Date().getMonth())
const selectedDate = ref(formatDateStr(new Date()))
const currentWeekStart = ref(getWeekStart(new Date()))
const quickActive = ref('') // 'week' | 'month' | ''

// ============================================================
//  右键菜单状态
// ============================================================
const contextMenuVisible = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextInterview = ref(null)

// ============================================================
//  refs
// ============================================================
const gridScrollRef = ref(null)

// ============================================================
//  计算属性
// ============================================================
const miniCalTitle = computed(() => `${miniCalYear.value}年${miniCalMonth.value + 1}月`)

const miniCalCells = computed(() => {
  const year = miniCalYear.value
  const month = miniCalMonth.value
  const firstDay = new Date(year, month, 1)
  const startDow = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()
  const todayStr = formatDateStr(new Date())
  // 构建有面试安排的日期集合
  const eventDates = new Set()
  for (const evt of interviewList.value) {
    if (evt?.scheduled_start_at) {
      eventDates.add(evt.scheduled_start_at.slice(0, 10))
    }
  }
  const cells = []

  // 上月填充
  for (let i = startDow - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthDays - i)
    const dateStr = formatDateStr(date)
    cells.push({
      day: date.getDate(),
      dateStr,
      isOtherMonth: true,
      isWeekend: [0, 6].includes(date.getDay()),
      isToday: dateStr === todayStr,
      hasEvent: eventDates.has(dateStr),
    })
  }
  // 本月
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const dateStr = formatDateStr(date)
    cells.push({
      day: d,
      dateStr,
      isOtherMonth: false,
      isWeekend: [0, 6].includes(date.getDay()),
      isToday: dateStr === todayStr,
      hasEvent: eventDates.has(dateStr),
    })
  }
  // 下月填充
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d)
    const dateStr = formatDateStr(date)
    cells.push({
      day: d,
      dateStr,
      isOtherMonth: true,
      isWeekend: [0, 6].includes(date.getDay()),
      isToday: dateStr === todayStr,
      hasEvent: eventDates.has(dateStr),
    })
  }
  return cells
})

const weekDays = computed(() => {
  const days = []
  const todayStr = formatDateStr(new Date())
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentWeekStart.value)
    date.setDate(date.getDate() + i)
    const dateStr = formatDateStr(date)
    days.push({
      date,
      dateStr,
      name: DAY_NAMES[date.getDay()],
      number: date.getDate(),
      isToday: dateStr === todayStr,
    })
  }
  return days
})

const visibleHours = computed(() => {
  const hours = []
  for (let h = startHour; h <= endHour; h++) hours.push(h)
  return hours
})

const totalGridHeight = computed(() => (endHour - startHour) * hourHeight + 30)

const scheduleTitle = computed(() => {
  const start = currentWeekStart.value
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const sy = start.getFullYear()
  const sm = start.getMonth() + 1
  const ey = end.getFullYear()
  const em = end.getMonth() + 1
  if (sy === ey && sm === em) return `${sy}年${sm}月`
  if (sy === ey) return `${sy}年${sm}月 - ${em}月`
  return `${sy}年${sm}月 - ${ey}年${em}月`
})

// ============================================================
//  迷你日历操作
// ============================================================
function prevMonth() {
  if (miniCalMonth.value === 0) { miniCalMonth.value = 11; miniCalYear.value-- }
  else { miniCalMonth.value-- }
  quickActive.value = ''
}

function nextMonth() {
  if (miniCalMonth.value === 11) { miniCalMonth.value = 0; miniCalYear.value++ }
  else { miniCalMonth.value++ }
  quickActive.value = ''
}

function onMiniDateClick(cell) {
  quickActive.value = ''
  selectedDate.value = cell.dateStr
  const [y, m, d] = cell.dateStr.split('-').map(Number)
  currentWeekStart.value = getWeekStart(new Date(y, m - 1, d))
  scrollToSelectedDate()
}

function goThisWeek() {
  quickActive.value = 'week'
  const today = new Date()
  miniCalYear.value = today.getFullYear()
  miniCalMonth.value = today.getMonth()
  currentWeekStart.value = getWeekStart(today)
  selectedDate.value = formatDateStr(today)
  scrollToSelectedDate()
}

function goThisMonth() {
  quickActive.value = 'month'
  const today = new Date()
  miniCalYear.value = today.getFullYear()
  miniCalMonth.value = today.getMonth()
  currentWeekStart.value = getWeekStart(today)
  selectedDate.value = formatDateStr(today)
  scrollToSelectedDate()
}

// 根据周变化同步迷你日历月份
watch(currentWeekStart, (val) => {
  if (quickActive.value) return // 快捷按钮状态下不自动切换
  const middle = new Date(val)
  middle.setDate(middle.getDate() + 3)
  miniCalYear.value = middle.getFullYear()
  miniCalMonth.value = middle.getMonth()
})

// ============================================================
//  日程操作
// ============================================================
function goToday() {
  quickActive.value = ''
  const today = new Date()
  currentWeekStart.value = getWeekStart(today)
  selectedDate.value = formatDateStr(today)
  scrollToSelectedDate()
}

function prevWeek() {
  const date = new Date(currentWeekStart.value)
  date.setDate(date.getDate() - 7)
  currentWeekStart.value = date
  quickActive.value = ''
  scrollToSelectedDate()
}

function nextWeek() {
  const date = new Date(currentWeekStart.value)
  date.setDate(date.getDate() + 7)
  currentWeekStart.value = date
  quickActive.value = ''
  scrollToSelectedDate()
}

function scrollToSelectedDate() {
  nextTick(() => {
    if (!gridScrollRef.value) return
    const cols = gridScrollRef.value.querySelectorAll('.schedule-column')
    const idx = weekDays.value.findIndex(d => d.dateStr === selectedDate.value)
    if (idx >= 0 && cols[idx]) {
      cols[idx].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  })
}

function handleNewInterview() {
  router.push('/dashboard/interview-manage')
}

// ============================================================
//  面试事件渲染（时间轴布局）
// ============================================================
function getMinuteOfDay(dateStr) {
  if (!dateStr) return 0
  const d = new Date(dateStr.replace('T', ' '))
  return d.getHours() * 60 + d.getMinutes()
}

/**
 * 为一天内的事件分配列布局，解决重叠事件文字堆叠问题
 * 使用贪心算法：按开始时间排序，依次分配到第一个可用列
 */
function assignEventLayout(events) {
  if (events.length <= 1) {
    return events.map(evt => ({ ...evt, _col: 0, _totalCols: 1 }))
  }

  const sorted = events
    .map(evt => ({
      ...evt,
      _startMin: getMinuteOfDay(evt.scheduled_start_at),
      _endMin: getMinuteOfDay(evt.scheduled_end_at),
    }))
    .sort((a, b) => a._startMin - b._startMin || a._endMin - b._endMin)

  const columns = []
  for (const evt of sorted) {
    let placed = false
    for (let c = 0; c < columns.length; c++) {
      if (evt._startMin >= columns[c]) {
        columns[c] = evt._endMin
        evt._col = c
        placed = true
        break
      }
    }
    if (!placed) {
      evt._col = columns.length
      columns.push(evt._endMin)
    }
  }

  const totalCols = columns.length
  for (const evt of sorted) {
    evt._totalCols = totalCols
  }

  return sorted
}

function getEventStyle(evt) {
  const startMin = getMinuteOfDay(evt.scheduled_start_at)
  const endMin = getMinuteOfDay(evt.scheduled_end_at)
  const topPx = ((startMin - startHour * 60) / 60) * hourHeight
  const rawHeight = Math.max(((endMin - startMin) / 60) * hourHeight, 22)
  const height = rawHeight - 2

  evt._height = height

  const col = evt._col || 0
  const totalCols = evt._totalCols || 1
  const colWidth = (100 - 2) / totalCols
  const left = col * colWidth + 1
  const width = colWidth - 1

  return {
    top: `${topPx}px`,
    height: `${height}px`,
    left: `${left}%`,
    width: `${width}%`,
  }
}

function formatHour(hour) {
  return `${String(hour).padStart(2, '0')}:00`
}

function getEventsForDay(dateStr) {
  const events = interviewList.value.filter(
    evt => evt?.scheduled_start_at?.slice(0, 10) === dateStr
  )
  return assignEventLayout(events)
}

function handleEventClick(evt) {
  closeContextMenu()
  router.push('/dashboard/interview-manage?highlight=' + evt.id)
}

// ============================================================
//  右键菜单
// ============================================================
function handleContextMenu(event, interview) {
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY
  contextInterview.value = interview
  contextMenuVisible.value = true
}

function closeContextMenu() {
  contextMenuVisible.value = false
  contextInterview.value = null
}

function onDocClick() {
  closeContextMenu()
}

async function handleContextAction(action) {
  const interview = contextInterview.value
  if (!interview) return
  closeContextMenu()

  switch (action) {
    case 'cancel':
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
        interviewStore.invalidateSessionCache()
        fetchInterviewSchedules()
        fetchStats()
      } catch (e) {
        if (e !== 'cancel') {
          ElMessage.error('取消失败: ' + (e?.detail || e?.message || '网络连接异常'))
        }
      }
      break
    case 'restore':
      try {
        await ElMessageBox.confirm(
          `确定要将「${interview.candidate_name}」恢复为已预约状态吗？`,
          '恢复预约确认',
          { confirmButtonText: '确定恢复', cancelButtonText: '暂不', type: 'info' }
        )
        await interviewApi.updateReserveSession(interview.id, { status: 'scheduled' })
        ElMessage.success('已恢复预约')
        interviewStore.invalidateSessionCache()
        fetchInterviewSchedules()
        fetchStats()
      } catch (e) {
        if (e !== 'cancel') {
          ElMessage.error('恢复失败: ' + (e?.detail || e?.message || '网络连接异常'))
        }
      }
      break
    case 'view-resume':
      router.push('/dashboard/cv?highlight=' + interview.id)
      break
  }
}

// ============================================================
//  数据请求
// ============================================================
async function fetchStats() {
  statsLoading.value = true
  try {
    const [resumesResult, sessions, positions] = await Promise.all([
      resumeApi.getResumes(0, 10000).catch(() => null),
      interviewApi.getUserInterviewSessions({}).catch(() => null),
      positionApi.list().catch(() => null),
    ])
    const allList = Array.isArray(resumesResult) ? resumesResult : (resumesResult?.items || [])
    const sessionList = Array.isArray(sessions) ? sessions : (sessions?.items || [])

    stats.totalResumes = allList.length
    stats.pendingReview = allList.filter(r => !r.review_status || r.review_status === '').length
    stats.pendingDecision = allList.filter(r => r.review_status === 'PENDING').length

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 86400000)

    let pendingInterview = 0
    let todayCount = 0
    for (const s of sessionList) {
      if (s.status === 'scheduled') {
        pendingInterview++
        const st = new Date(s.scheduled_start_at?.replace('T', ' ') || s.scheduled_start_at)
        if (st >= todayStart && st < todayEnd) todayCount++
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

// ============================================================
//  工具函数
// ============================================================
function getWeekStart(date) {
  const result = new Date(date)
  const day = result.getDay()
  result.setDate(result.getDate() - day)
  result.setHours(0, 0, 0, 0)
  return result
}

function formatDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ============================================================
//  生命周期
// ============================================================
onMounted(async () => {
  await Promise.all([fetchStats(), fetchInterviewSchedules()])
  document.addEventListener('click', onDocClick)
  scrollToSelectedDate()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
})
</script>

<style scoped lang="scss">
// ============================================================
//  Variables
// ============================================================
$primary: #3370ff;
$primary-hover: #2458d9;
$text-main: #1f2329;
$text-secondary: #646a73;
$text-tertiary: #8f959e;
$border: #dee0e3;
$bg-body: #f5f6f7;
$radius: 12px;

// ============================================================
//  Layout
// ============================================================
.dashboard-home {
  max-width: 1400px;
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dashboard-body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 16px;
  overflow: hidden;
}

// ============================================================
//  数据统计卡片
// ============================================================
.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
  flex-shrink: 0;
}

.stat-card {
  background: #fff;
  border-radius: $radius;
  border: 1px solid $border;
  display: flex;
  flex-direction: column;
  padding: 18px 20px 14px;
  box-shadow: 0 1px 4px rgba(31, 35, 41, 0.04);
  transition: box-shadow 0.25s, background-color 0.25s, transform 0.2s;
  min-height: 100px;

  &.is-clickable {
    cursor: pointer;
  }

  &:hover {
    background-color: #f9fafb;
    box-shadow: 0 4px 16px rgba(31, 35, 41, 0.08);
    transform: translateY(-1px);
  }
}

.stat-card-body {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.stat-icon--totalResumes     { background: #eef2fe; color: $primary; }
  &.stat-icon--pendingReview    { background: #fff4e5; color: #ff8800; }
  &.stat-icon--pendingInterview { background: #e4f7eb; color: #13a248; }
  &.stat-icon--pendingDecision  { background: #fce8e6; color: #f53f3f; }
  &.stat-icon--todayInterviews  { background: #f0f4ff; color: $primary; }
  &.stat-icon--totalPositions   { background: #f3e8ff; color: #9333ea; }
}

.stat-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: $text-main;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: $text-tertiary;
}

// ============================================================
//  左侧迷你日历面板
// ============================================================
.left-calendar-panel {
  width: 235px;
  min-width: 235px;
  background: #fff;
  border-radius: $radius;
  border: 1px solid $border;
  padding: 20px 16px;
  flex-shrink: 0;
  overflow: hidden;
  box-sizing: border-box;
}

.mini-cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.mini-cal-title {
  font-size: 15px;
  font-weight: 600;
  color: $text-main;
}

.mini-cal-nav {
  display: flex;
  gap: 2px;
}

.mini-cal-nav-btn {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 15px;
  color: $text-secondary;
  transition: all 0.15s;

  &:hover {
    background: #f0f1f5;
    color: $primary;
  }
}

// 快捷按钮
.mini-cal-quick {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}

.mini-cal-qbtn {
  flex: 1;
  height: 26px;
  border-radius: 4px;
  border: 1px solid $border;
  background: #fff;
  font-size: 12px;
  color: $text-secondary;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: $primary;
    color: $primary;
  }

  &.active {
    background: $primary;
    border-color: $primary;
    color: #fff;
  }
}

.mini-cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 2px;

  span {
    font-size: 12px;
    color: $text-tertiary;
    height: 24px;
    line-height: 24px;
  }
}

.mini-cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.mini-cal-cell {
  height: 26px;
  line-height: 26px;
  text-align: center;
  font-size: 13px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.12s;
  color: $text-main;
  position: relative;

  &:hover {
    background: #f0f1f5;
  }

  &.is-other-month {
    color: #c0c4cc;
  }

  &.is-weekend:not(.is-other-month) {
    color: #a8abb3;
  }

  // 今日蓝色圆点
  &.is-today {
    font-weight: 600;
    color: $primary;

    &::after {
      content: '';
      position: absolute;
      bottom: 1px;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: $primary;
    }
  }

  &.is-selected {
    background: $primary;
    color: #fff;
    font-weight: 600;
    border-radius: 50%;

    &::after { display: none; }
    &:hover { background: $primary-hover; }
  }
}

// 面试安排标记点（橙色圆点，不被今天蓝点覆盖）
.event-dot {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #ff8800;
  z-index: 1;
}

// ============================================================
//  右侧日程面板
// ============================================================
.right-schedule-panel {
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: $radius;
  border: 1px solid $border;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// ---- 标题栏 ----
.schedule-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px 10px;
  border-bottom: 1px solid $border;
  flex-shrink: 0;
}

.schedule-topbar-left {
  display: flex;
  align-items: baseline;
  gap: 14px;
}

.schedule-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: $text-main;
}

.schedule-hint {
  font-size: 12px;
  color: $text-tertiary;
}

.btn-new-interview {
  font-size: 12px;
}

// ---- 日期工具栏 ----
.schedule-toolbar {
  padding: 8px 20px 6px;
  flex-shrink: 0;
}

.schedule-toolbar-left {
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-today {
  height: 28px;
  padding: 0 14px;
  border-radius: 6px;
  border: 1px solid $primary;
  background: $primary;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  margin-right: 6px;

  &:hover {
    background: $primary-hover;
    border-color: $primary-hover;
  }
}

.schedule-nav-btn {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid $border;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: $text-secondary;
  transition: all 0.15s;

  &:hover {
    border-color: $primary;
    color: $primary;
  }
}

.schedule-week-title {
  font-size: 15px;
  font-weight: 700;
  color: $text-main;
  margin-left: 12px;
}

// ---- 日程主体 ----
.schedule-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

// ---- 滚动容器 ----
.schedule-scroll-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;

  &::-webkit-scrollbar { width: 5px; height: 5px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: rgba(144, 147, 153, 0.2);
    border-radius: 3px;
    &:hover { background: rgba(144, 147, 153, 0.4); }
  }
}

// ---- 时间轴网格 ----
.schedule-grid {
  display: flex;
  flex-direction: column;
  min-width: min-content;
  position: relative;
}

// 粘性日期头
.schedule-header-sticky {
  display: flex;
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
  flex-shrink: 0;
  border-bottom: 1px solid $border;
}

.schedule-gutter-spacer {
  width: 48px;
  flex-shrink: 0;
}

.schedule-col-header {
  flex: 1;
  min-width: 150px;
  max-width: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0 10px;
  gap: 2px;

  .sched-day-name {
    font-size: 12px;
    color: $text-tertiary;
  }

  .sched-day-num {
    font-size: 18px;
    font-weight: 500;
    width: 30px;
    height: 30px;
    line-height: 30px;
    text-align: center;
    border-radius: 50%;
    color: $text-main;
  }

  &.is-today {
    .sched-day-name { color: $primary; font-weight: 500; }
    .sched-day-num { background: $primary; color: #fff; font-weight: 600; }
  }
}

// 主体行（时间 gutter + 列）
.schedule-body-row {
  display: flex;
  position: relative;
}

// 时间轴刻度
.schedule-time-gutter {
  position: sticky;
  left: 0;
  z-index: 5;
  width: 48px;
  flex-shrink: 0;
  background: #fff;
}

.schedule-time-label {
  position: absolute;
  left: 0;
  right: 4px;
  text-align: right;
  font-size: 11px;
  color: $text-tertiary;
  transform: translateY(-50%);
  line-height: 1;
  pointer-events: none;
}

// 列容器
.schedule-columns {
  display: flex;
  flex: 1;
}

.schedule-column {
  flex: 1;
  min-width: 150px;
  max-width: 220px;
  position: relative;
  border-left: 1px solid #eef0f3;

  &:last-child { border-right: 1px solid #eef0f3; }

  &.is-today {
    background: rgba(51, 112, 255, 0.04);
  }

  &.is-selected {
    background: rgba(51, 112, 255, 0.06);
  }
}

// 整点刻度线
.schedule-hour-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: #f0f1f5;
  pointer-events: none;
}

// 每列的最后一根刻度线不显示（与底边重复）
.schedule-column .schedule-hour-line:last-child {
  display: none;
}

// ---- 面试事件卡片 ----
.schedule-event {
  position: absolute;
  border-radius: 6px;
  padding: 4px 6px;
  cursor: pointer;
  font-size: 12px;
  line-height: 1.4;
  box-shadow: 0 0.5px 2px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s, transform 0.15s;
  border-left: 3px solid transparent;
  overflow: hidden;
  z-index: 3;

  &:hover {
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.13);
    transform: translateY(-1px);
    z-index: 4;
  }

  // 状态配色
  &.status-scheduled,
  &.status-pending {
    background: #fff4e5;
    border-left-color: #ff8800;
    color: #b85c00;
  }

  &.status-ongoing {
    background: #e1ecfe;
    border-left-color: $primary;
    color: #1a56db;
  }

  &.status-completed,
  &.status-passed {
    background: #e8fff0;
    border-left-color: #00b42a;
    color: #007d24;
  }

  &.status-cancelled,
  &.status-failed {
    background: #fce8e6;
    border-left-color: #f53f3f;
    color: #b82727;
  }

  &.status-expired {
    background: #f0f1f5;
    border-left-color: #8f959e;
    color: #8f959e;
  }
}

.sched-ev-title {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// 整体空态
.schedule-empty-all {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
}

// ============================================================
//  右键菜单
// ============================================================
.context-menu {
  position: fixed;
  z-index: 9999;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 130px;
  border: 1px solid $border;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 13px;
  color: $text-main;
  cursor: pointer;
  transition: background 0.12s;

  .el-icon { font-size: 15px; color: $text-secondary; }

  &:hover { background: #f5f6f8; }

  &.context-menu-item-danger .el-icon { color: #f53f3f; }
  &.context-menu-item-success .el-icon { color: #13a248; }
}

// ============================================================
//  响应式
// ============================================================
@media (max-width: 1200px) {
  .stats-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 900px) {
  .dashboard-body {
    flex-direction: column;
  }
  .left-calendar-panel {
    width: 100%;
    min-width: 0;
  }
  .mini-cal-grid {
    max-width: 350px;
    margin: 0 auto;
  }
}

@media (max-width: 600px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .schedule-topbar-left { flex-direction: column; gap: 4px; }
  .schedule-hint { display: none; }
}
</style>

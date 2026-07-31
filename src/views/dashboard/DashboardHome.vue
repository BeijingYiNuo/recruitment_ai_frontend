<template>
  <div class="dashboard-home">
    <!-- ====== 数据统计卡片 ====== -->
    <div class="stats-grid" v-loading="statsLoading" element-loading-text="加载统计数据...">
      <div
        v-for="card in STAT_CARDS"
        :key="card.key"
        class="stat-card"
        :class="[`stat-card--${card.key}`, { 'is-clickable': !!card.path }]"
        @click="card.path && router.push(card.path)"
      >
        <div class="stat-card-inner">
          <div class="stat-card-left">
            <div class="stat-icon-wrap">
              <div class="stat-icon-bg"></div>
              <el-icon :size="20"><component :is="card.icon" /></el-icon>
            </div>
          </div>
          <div class="stat-card-right">
            <div class="stat-value-row">
              <span class="stat-number">{{ stats[card.key] }}</span>
              <span class="stat-trend-icon">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 8l3-3 2 2 3-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
            </div>
            <span class="stat-desc">{{ card.label }}</span>
          </div>
        </div>
        <div class="stat-card-shine"></div>
      </div>
    </div>

    <!-- ====== 主体区域 ====== -->
    <div class="dashboard-body">
      <!-- ===== 左侧迷你日历 ===== -->
      <div class="panel-calendar">
        <div class="panel-calendar-header">
          <span class="panel-calendar-title">{{ miniCalTitle }}</span>
          <div class="panel-calendar-nav">
            <button class="cal-nav-btn" @click="prevMonth">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button class="cal-nav-btn" @click="nextMonth">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </div>

        <div class="panel-calendar-quick">
          <button :class="{ active: quickActive === 'week' }" @click="goThisWeek">本周</button>
          <button :class="{ active: quickActive === 'month' }" @click="goThisMonth">本月</button>
        </div>

        <div class="panel-calendar-weekdays">
          <span v-for="w in MINI_WEEK_LABELS" :key="w">{{ w }}</span>
        </div>

        <div class="panel-calendar-grid">
          <div
            v-for="(cell, idx) in miniCalCells"
            :key="idx"
            class="cal-cell"
            :class="{
              'is-dimmed': cell.isOtherMonth,
              'is-weekend': cell.isWeekend,
              'is-today': cell.isToday,
              'is-selected': cell.dateStr === selectedDate,
            }"
            @click="onMiniDateClick(cell)"
          >
            <span class="cal-cell-num">{{ cell.day }}</span>
            <span v-if="cell.hasEvent && !cell.isToday" class="cal-cell-dot"></span>
          </div>
        </div>
      </div>

      <!-- ===== 右侧日程面板 ===== -->
      <div class="panel-schedule">
        <div class="panel-schedule-top">
          <div class="schedule-top-left">
            <h3 class="schedule-title">约见安排</h3>
            <span class="schedule-subtitle">点击可跳转详情 · 右键可操作</span>
          </div>
          <el-button type="primary" size="small" class="btn-schedule-new" @click="handleNewInterview">
            <el-icon><Plus /></el-icon> 新建面试
          </el-button>
        </div>

        <div class="panel-schedule-tools">
          <button class="tool-btn tool-btn-today" @click="goToday">今天</button>
          <button class="tool-btn tool-btn-nav" @click="prevWeek">‹</button>
          <button class="tool-btn tool-btn-nav" @click="nextWeek">›</button>
          <span class="tool-week-label">{{ scheduleTitle }}</span>
        </div>

        <div class="panel-schedule-body">
          <div class="schedule-scroll" ref="gridScrollRef" v-loading="calendarLoading">
            <div v-if="!calendarLoading && interviewList.length === 0" class="schedule-empty">
              <div class="empty-illustration">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <rect x="8" y="12" width="48" height="42" rx="6" stroke="#cbd5e1" stroke-width="2"/>
                  <line x1="8" y1="24" x2="56" y2="24" stroke="#cbd5e1" stroke-width="2"/>
                  <line x1="20" y1="8" x2="20" y2="16" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/>
                  <line x1="44" y1="8" x2="44" y2="16" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/>
                  <circle cx="22" cy="33" r="2" fill="#94a3b8"/>
                  <circle cx="32" cy="33" r="2" fill="#94a3b8"/>
                  <circle cx="42" cy="33" r="2" fill="#94a3b8"/>
                </svg>
              </div>
              <span class="empty-text">暂无已预约面试安排</span>
            </div>
            <div v-else class="schedule-grid">
              <div class="schedule-header">
                <div class="schedule-gutter"></div>
                <div
                  v-for="day in weekDays"
                  :key="day.dateStr"
                  class="schedule-day-head"
                  :class="{ 'is-today': day.isToday }"
                >
                  <span class="day-name">{{ day.name }}</span>
                  <span class="day-num">{{ day.number }}</span>
                </div>
              </div>
              <div class="schedule-body-row" :style="{ height: totalGridHeight + 'px' }">
                <div class="schedule-time-axis">
                  <div
                    v-for="hour in visibleHours"
                    :key="hour"
                    class="time-tick"
                    :style="{ top: (hour - startHour) * hourHeight + 'px' }"
                  >{{ formatHour(hour) }}</div>
                </div>
                <div class="schedule-columns">
                  <div
                    v-for="day in weekDays"
                    :key="day.dateStr"
                    class="schedule-col"
                    :class="{ 'is-today': day.isToday, 'is-selected': day.dateStr === selectedDate }"
                  >
                    <div
                      v-for="hour in visibleHours"
                      :key="hour"
                      class="hour-line"
                      :style="{ top: (hour - startHour) * hourHeight + 'px' }"
                    ></div>
                    <div
                      v-for="evt in getEventsForDay(day.dateStr)"
                      :key="evt.id"
                      class="event-chip"
                      :class="'event--' + (evt.status || 'scheduled')"
                      :style="getEventStyle(evt)"
                      @click="handleEventClick(evt)"
                      @contextmenu.prevent="handleContextMenu($event, evt)"
                    >
                      <span class="event-label">{{ evt.candidate_name || '未命名面试' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ====== 右键菜单 ====== -->
    <div
      v-if="contextMenuVisible"
      class="context-menu"
      :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
    >
      <div
        v-if="contextInterview?.status === 'scheduled' || contextInterview?.status === 'ongoing'"
        class="ctx-item ctx-item--danger"
        @click="handleContextAction('cancel')"
      >
        <el-icon><CircleClose /></el-icon><span>取消面试</span>
      </div>
      <div
        v-else-if="contextInterview?.status === 'cancelled'"
        class="ctx-item ctx-item--success"
        @click="handleContextAction('restore')"
      >
        <el-icon><CircleCheck /></el-icon><span>恢复预约</span>
      </div>
      <div class="ctx-item" @click="handleContextAction('view-resume')">
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

const startHour = 8
const endHour = 20
const hourHeight = 60

const statsLoading = ref(false)
const calendarLoading = ref(false)
const stats = reactive({
  totalResumes: 0, pendingReview: 0, pendingInterview: 0,
  pendingDecision: 0, todayInterviews: 0, totalPositions: 0,
})
const interviewList = ref([])

const miniCalYear = ref(new Date().getFullYear())
const miniCalMonth = ref(new Date().getMonth())
const selectedDate = ref(formatDateStr(new Date()))
const currentWeekStart = ref(getWeekStart(new Date()))
const quickActive = ref('')

const contextMenuVisible = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextInterview = ref(null)

const gridScrollRef = ref(null)


// ============================================================
const miniCalTitle = computed(() => `${miniCalYear.value}年${miniCalMonth.value + 1}月`)

const miniCalCells = computed(() => {
  const year = miniCalYear.value, month = miniCalMonth.value
  const firstDay = new Date(year, month, 1)
  const startDow = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()
  const todayStr = formatDateStr(new Date())
  const eventDates = new Set()
  for (const evt of interviewList.value) {
    if (evt?.scheduled_start_at) eventDates.add(evt.scheduled_start_at.slice(0, 10))
  }
  const cells = []
  for (let i = startDow - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthDays - i)
    const ds = formatDateStr(date)
    cells.push({ day: date.getDate(), dateStr: ds, isOtherMonth: true, isWeekend: [0,6].includes(date.getDay()), isToday: ds === todayStr, hasEvent: eventDates.has(ds) })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const ds = formatDateStr(date)
    cells.push({ day: d, dateStr: ds, isOtherMonth: false, isWeekend: [0,6].includes(date.getDay()), isToday: ds === todayStr, hasEvent: eventDates.has(ds) })
  }
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d)
    const ds = formatDateStr(date)
    cells.push({ day: d, dateStr: ds, isOtherMonth: true, isWeekend: [0,6].includes(date.getDay()), isToday: ds === todayStr, hasEvent: eventDates.has(ds) })
  }
  return cells
})

const weekDays = computed(() => {
  const days = []
  const todayStr = formatDateStr(new Date())
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentWeekStart.value)
    date.setDate(date.getDate() + i)
    const ds = formatDateStr(date)
    days.push({ date, dateStr: ds, name: DAY_NAMES[date.getDay()], number: date.getDate(), isToday: ds === todayStr })
  }
  return days
})

const visibleHours = computed(() => { const h = []; for (let i = startHour; i <= endHour; i++) h.push(i); return h })
const totalGridHeight = computed(() => (endHour - startHour) * hourHeight + 30)
const scheduleTitle = computed(() => {
  const s = currentWeekStart.value, e = new Date(s); e.setDate(e.getDate() + 6)
  const sy = s.getFullYear(), sm = s.getMonth()+1, ey = e.getFullYear(), em = e.getMonth()+1
  if (sy === ey && sm === em) return `${sy}年${sm}月`
  if (sy === ey) return `${sy}年${sm}月 - ${em}月`
  return `${sy}年${sm}月 - ${ey}年${em}月`
})

// ============================================================
function prevMonth() { if (miniCalMonth.value === 0) { miniCalMonth.value = 11; miniCalYear.value-- } else miniCalMonth.value--; quickActive.value = '' }
function nextMonth() { if (miniCalMonth.value === 11) { miniCalMonth.value = 0; miniCalYear.value++ } else miniCalMonth.value++; quickActive.value = '' }
function onMiniDateClick(cell) { quickActive.value = ''; selectedDate.value = cell.dateStr; const [y,m,d] = cell.dateStr.split('-').map(Number); currentWeekStart.value = getWeekStart(new Date(y,m-1,d)); scrollToSelectedDate() }
function goThisWeek() { quickActive.value = 'week'; const t = new Date(); miniCalYear.value = t.getFullYear(); miniCalMonth.value = t.getMonth(); currentWeekStart.value = getWeekStart(t); selectedDate.value = formatDateStr(t); scrollToSelectedDate() }
function goThisMonth() { quickActive.value = 'month'; const t = new Date(); miniCalYear.value = t.getFullYear(); miniCalMonth.value = t.getMonth(); currentWeekStart.value = getWeekStart(t); selectedDate.value = formatDateStr(t); scrollToSelectedDate() }

watch(currentWeekStart, (val) => {
  if (quickActive.value) return
  const mid = new Date(val); mid.setDate(mid.getDate() + 3)
  miniCalYear.value = mid.getFullYear(); miniCalMonth.value = mid.getMonth()
})

function goToday() { quickActive.value = ''; const t = new Date(); currentWeekStart.value = getWeekStart(t); selectedDate.value = formatDateStr(t); scrollToSelectedDate() }
function prevWeek() { const d = new Date(currentWeekStart.value); d.setDate(d.getDate() - 7); currentWeekStart.value = d; quickActive.value = ''; scrollToSelectedDate() }
function nextWeek() { const d = new Date(currentWeekStart.value); d.setDate(d.getDate() + 7); currentWeekStart.value = d; quickActive.value = ''; scrollToSelectedDate() }

function scrollToSelectedDate() {
  nextTick(() => {
    if (!gridScrollRef.value) return
    const cols = gridScrollRef.value.querySelectorAll('.schedule-col')
    const idx = weekDays.value.findIndex(d => d.dateStr === selectedDate.value)
    if (idx >= 0 && cols[idx]) cols[idx].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  })
}

function handleNewInterview() { router.push('/dashboard/interview-manage') }

function getMinuteOfDay(dateStr) {
  if (!dateStr) return 0
  const d = new Date(dateStr.replace('T', ' '))
  return d.getHours() * 60 + d.getMinutes()
}

function assignEventLayout(events) {
  if (events.length <= 1) return events.map(e => ({ ...e, _col: 0, _totalCols: 1 }))
  const sorted = events.map(e => ({ ...e, _startMin: getMinuteOfDay(e.scheduled_start_at), _endMin: getMinuteOfDay(e.scheduled_end_at) })).sort((a,b) => a._startMin - b._startMin || a._endMin - b._endMin)
  const cols = []
  for (const evt of sorted) {
    let placed = false
    for (let c = 0; c < cols.length; c++) { if (evt._startMin >= cols[c]) { cols[c] = evt._endMin; evt._col = c; placed = true; break } }
    if (!placed) { evt._col = cols.length; cols.push(evt._endMin) }
  }
  const total = cols.length
  for (const e of sorted) e._totalCols = total
  return sorted
}

function getEventStyle(evt) {
  const sm = getMinuteOfDay(evt.scheduled_start_at), em = getMinuteOfDay(evt.scheduled_end_at)
  const top = ((sm - startHour * 60) / 60) * hourHeight
  const h = Math.max(((em - sm) / 60) * hourHeight, 22) - 2
  evt._height = h
  const col = evt._col || 0, total = evt._totalCols || 1, cw = (100 - 2) / total
  return { top: `${top}px`, height: `${h}px`, left: `${col * cw + 1}%`, width: `${cw - 1}%` }
}

function formatHour(h) { return `${String(h).padStart(2, '0')}:00` }
function getEventsForDay(ds) { return assignEventLayout(interviewList.value.filter(e => e?.scheduled_start_at?.slice(0,10) === ds)) }
function handleEventClick(evt) { closeContextMenu(); router.push('/dashboard/interview-manage?highlight=' + evt.id) }

function handleContextMenu(e, interview) { contextMenuX.value = e.clientX; contextMenuY.value = e.clientY; contextInterview.value = interview; contextMenuVisible.value = true }
function closeContextMenu() { contextMenuVisible.value = false; contextInterview.value = null }
function onDocClick() { closeContextMenu() }

async function handleContextAction(action) {
  const iv = contextInterview.value; if (!iv) return; closeContextMenu()
  switch (action) {
    case 'cancel':
      if (iv.status === 'cancelled') { ElMessage.info('该面试已取消'); return }
      try {
        await ElMessageBox.confirm(
          `确定要取消「${iv.candidate_name}」的面试安排吗？`,
          '取消面试确认',
          { confirmButtonText: '确定取消', cancelButtonText: '暂不', type: 'warning' }
        )
        await interviewApi.updateReserveSession(iv.id, { status: 'cancelled' })
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
          `确定要将「${iv.candidate_name}」恢复为已预约状态吗？`,
          '恢复预约确认',
          { confirmButtonText: '确定恢复', cancelButtonText: '暂不', type: 'info' }
        )
        await interviewApi.updateReserveSession(iv.id, { status: 'scheduled' })
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
    case 'view-resume': router.push('/dashboard/cv?highlight=' + iv.id); break
  }
}

// ============================================================
//  示例数据（Mock模式）
// ============================================================
const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true'

function generateSampleSchedules() {
  const now = new Date()
  const weekStart = getWeekStart(now)
  const samples = []
  const names = ['张伟', '李娜', '王芳', '陈明', '刘洋', '赵敏', '周磊', '吴昊']
  const statuses = ['scheduled', 'scheduled', 'ongoing', 'completed', 'completed', 'cancelled']
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart); day.setDate(day.getDate() + i)
    const dayStr = formatDateStr(day)
    const count = dayStr === formatDateStr(now) ? 3 : (i > 0 && i < 6 ? 1 + (i % 2) : 0)
    for (let j = 0; j < count; j++) {
      const h = 9 + j * 2 + (i % 3)
      samples.push({
        id: 100 + i * 10 + j,
        candidate_name: names[(i + j) % names.length],
        scheduled_start_at: `${dayStr}T${String(h).padStart(2,'0')}:00:00`,
        scheduled_end_at: `${dayStr}T${String(h + 1).padStart(2,'0')}:00:00`,
        status: statuses[(i + j) % statuses.length],
      })
    }
  }
  return samples
}

function loadSampleData() {
  stats.totalResumes = 156; stats.pendingReview = 23; stats.pendingInterview = 8
  stats.pendingDecision = 5; stats.todayInterviews = 3; stats.totalPositions = 12
  interviewList.value = generateSampleSchedules()
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
    const ts = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const te = new Date(ts.getTime() + 86400000)
    let pi = 0, tc = 0
    for (const s of sessionList) {
      if (s.status === 'scheduled') { pi++; const st = new Date(s.scheduled_start_at?.replace('T',' ')||s.scheduled_start_at); if (st>=ts && st<te) tc++ }
    }
    stats.pendingInterview = pi; stats.todayInterviews = tc
    stats.totalPositions = Array.isArray(positions) ? positions.length : (positions?.total || 0)
  } catch (e) { console.error('Failed to fetch stats:', e) } finally {
    statsLoading.value = false
    if (isMockMode && stats.totalResumes === 0 && stats.totalPositions === 0) loadSampleData()
  }
}

async function fetchInterviewSchedules() {
  calendarLoading.value = true
  try { const data = await interviewApi.getUserInterviewSessions({}); interviewList.value = Array.isArray(data) ? data : (data.items || []) } catch (e) { console.error('Failed to fetch schedules:', e) } finally { calendarLoading.value = false; if (isMockMode && interviewList.value.length === 0) interviewList.value = generateSampleSchedules() }
}

function getWeekStart(date) { const r = new Date(date); r.setDate(r.getDate() - r.getDay()); r.setHours(0,0,0,0); return r }
function formatDateStr(date) { const y=date.getFullYear(), m=String(date.getMonth()+1).padStart(2,'0'), d=String(date.getDate()).padStart(2,'0'); return `${y}-${m}-${d}` }

onMounted(async () => {
  await Promise.all([fetchStats(), fetchInterviewSchedules()])
  document.addEventListener('click', onDocClick)
  scrollToSelectedDate()
})
onBeforeUnmount(() => { document.removeEventListener('click', onDocClick) })
</script>

<style scoped lang="scss">
.dashboard-home {
  max-width: 1400px;
  height: calc(100vh - 104px);
  display: flex;
  flex-direction: column;
  gap: 18px;
}


.dashboard-body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 18px;
  overflow: hidden;
}

/* ============================================================
   STAT CARDS
   ============================================================ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
  flex-shrink: 0;
}

.stat-card {
  position: relative;
  background: var(--color-bg-card);
  border-radius: 14px;
  border: 1px solid var(--color-border-default);
  padding: 18px 18px 16px;
  cursor: default;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-card);
  overflow: hidden;

  &.is-clickable { cursor: pointer; }

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-card-hover);
    border-color: var(--color-border-strong);
    .stat-card-shine { opacity: 1; }
  }
}

.stat-card-shine {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.stat-card-inner {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  position: relative;
  z-index: 1;
}

.stat-icon-wrap {
  position: relative;
  width: 42px; height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .stat-icon-bg {
    position: absolute; inset: 0;
    border-radius: 12px; opacity: 0.12;
  }
}

.stat-card--totalResumes     .stat-icon-wrap { color: #818cf8; .stat-icon-bg { background: #818cf8; } }
.stat-card--pendingReview    .stat-icon-wrap { color: #fbbf24; .stat-icon-bg { background: #fbbf24; } }
.stat-card--pendingInterview .stat-icon-wrap { color: #34d399; .stat-icon-bg { background: #34d399; } }
.stat-card--pendingDecision  .stat-icon-wrap { color: #f87171; .stat-icon-bg { background: #f87171; } }
.stat-card--todayInterviews  .stat-icon-wrap { color: #60a5fa; .stat-icon-bg { background: #60a5fa; } }
.stat-card--totalPositions   .stat-icon-wrap { color: #a78bfa; .stat-icon-bg { background: #a78bfa; } }

.stat-card-right { flex: 1; min-width: 0; }

.stat-value-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-main);
  line-height: 1.1;
  letter-spacing: -0.5px;
  font-variant-numeric: tabular-nums;
}

.stat-trend-icon {
  color: var(--color-success-green);
  display: flex;
  opacity: 0.45;
}

.stat-desc {
  font-size: 12.5px;
  color: var(--color-text-tertiary);
  margin-top: 3px;
  display: block;
  font-weight: 450;
}

/* ============================================================
   CALENDAR PANEL
   ============================================================ */
.panel-calendar {
  width: 240px; min-width: 240px;
  background: var(--color-bg-card);
  border-radius: 14px;
  border: 1px solid var(--color-border-default);
  padding: 20px 16px 16px;
  box-shadow: var(--shadow-card);
  flex-shrink: 0;
  display: flex; flex-direction: column;
}

.panel-calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.panel-calendar-title {
  font-size: 14.5px;
  font-weight: 650;
  color: var(--color-text-main);
}

.panel-calendar-nav { display: flex; gap: 2px; }

.cal-nav-btn {
  width: 26px; height: 26px;
  display: inline-flex;
  align-items: center; justify-content: center;
  border: none; background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: var(--color-text-tertiary);
  transition: all 0.15s;
  &:hover { background: var(--color-bg-hover); color: var(--color-text-main); }
}

.panel-calendar-quick {
  display: flex; gap: 6px;
  margin-bottom: 12px;

  button {
    flex: 1; height: 28px;
    border-radius: 7px;
    border: 1px solid var(--color-border-default);
    background: var(--color-bg-card);
    font-size: 12px; font-weight: 500;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.15s;
    &:hover { border-color: var(--color-primary-blue); color: var(--color-primary-blue); }
    &.active { background: var(--color-primary-blue); border-color: var(--color-primary-blue); color: #fff; }
  }
}

.panel-calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 4px;
  span {
    font-size: 11.5px;
    color: var(--color-text-tertiary);
    height: 26px; line-height: 26px;
  }
}

.panel-calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  flex: 1;
}

.cal-cell {
  height: 28px; line-height: 28px;
  text-align: center;
  font-size: 13px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.12s;
  color: var(--color-text-main);
  position: relative;
  font-variant-numeric: tabular-nums;

  &:hover { background: var(--color-bg-hover); }

  &.is-dimmed { color: var(--color-text-tertiary); opacity: 0.5; }
  &.is-weekend:not(.is-dimmed) { color: var(--color-text-tertiary); }

  &.is-today {
    font-weight: 650;
    color: var(--color-primary-blue);
    &::after {
      content: '';
      position: absolute;
      bottom: 2px; left: 50%;
      transform: translateX(-50%);
      width: 4px; height: 4px;
      border-radius: 50%;
      background: var(--color-primary-blue);
    }
  }

  &.is-selected {
    background: var(--color-primary-blue);
    color: #fff;
    font-weight: 650;
    &::after { display: none; }
    &:hover { background: var(--color-primary-blue-hover); }
  }
}

.cal-cell-num { position: relative; z-index: 1; }

.cal-cell-dot {
  position: absolute;
  bottom: 2px; left: 50%;
  transform: translateX(-50%);
  width: 4px; height: 4px;
  border-radius: 50%;
  background: var(--color-warning-yellow);
  z-index: 1;
}

/* ============================================================
   SCHEDULE PANEL
   ============================================================ */
.panel-schedule {
  flex: 1; min-width: 0;
  background: var(--color-bg-card);
  border-radius: 14px;
  border: 1px solid var(--color-border-default);
  display: flex; flex-direction: column;
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.panel-schedule-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--color-border-default);
  flex-shrink: 0;
}

.schedule-top-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.schedule-title {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  color: var(--color-text-main);
}

.schedule-subtitle {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.btn-schedule-new {
  border-radius: 8px !important;
  font-weight: 500 !important;
  font-size: 12.5px !important;
  background: var(--color-primary-blue) !important;
  border-color: var(--color-primary-blue) !important;
  &:hover {
    background: var(--color-primary-blue-hover) !important;
    border-color: var(--color-primary-blue-hover) !important;
  }
}

.panel-schedule-tools {
  padding: 8px 20px 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.tool-btn {
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 12.5px;
  color: var(--color-text-secondary);

  &-today {
    height: 28px;
    padding: 0 14px;
    border-radius: 7px;
    background: var(--color-primary-blue);
    color: #fff;
    font-weight: 500;
    margin-right: 8px;
    &:hover { background: var(--color-primary-blue-hover); }
  }

  &-nav {
    width: 28px; height: 28px;
    display: inline-flex;
    align-items: center; justify-content: center;
    border-radius: 7px;
    border: 1px solid var(--color-border-default);
    background: var(--color-bg-card);
    color: var(--color-text-secondary);
    font-size: 15px;
    &:hover { border-color: var(--color-primary-blue); color: var(--color-primary-blue); }
  }
}

.tool-week-label {
  font-size: 14px;
  font-weight: 650;
  color: var(--color-text-main);
  margin-left: 12px;
}

/* --- Schedule Body --- */
.panel-schedule-body {
  flex: 1; min-height: 0;
  display: flex; flex-direction: column;
}

.schedule-scroll {
  flex: 1; min-height: 0;
  overflow: auto;
  &::-webkit-scrollbar { width: 5px; height: 5px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: rgba(148,163,184,0.25);
    border-radius: 4px;
    &:hover { background: rgba(148,163,184,0.4); }
  }
}

.schedule-empty {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  height: 380px; gap: 12px;
}

.empty-illustration { opacity: 0.4; }
.empty-text { font-size: 13px; color: var(--color-text-tertiary); }

.schedule-grid {
  display: flex; flex-direction: column;
  min-width: min-content;
}

.schedule-header {
  display: flex;
  position: sticky; top: 0;
  z-index: 10;
  background: var(--color-bg-card);
  flex-shrink: 0;
  border-bottom: 1px solid var(--color-border-default);
}

.schedule-gutter { width: 50px; flex-shrink: 0; }

.schedule-day-head {
  flex: 1;
  min-width: 130px; max-width: 200px;
  display: flex; flex-direction: column;
  align-items: center;
  padding: 10px 0 10px;
  gap: 2px;

  .day-name { font-size: 11.5px; color: var(--color-text-tertiary); }
  .day-num {
    font-size: 16px; font-weight: 550;
    width: 28px; height: 28px;
    line-height: 28px; text-align: center;
    border-radius: 50%;
    color: var(--color-text-main);
  }

  &.is-today {
    .day-name { color: var(--color-primary-blue); font-weight: 550; }
    .day-num { background: var(--color-primary-blue); color: #fff; font-weight: 650; }
  }
}

.schedule-body-row { display: flex; position: relative; }

.schedule-time-axis {
  position: sticky; left: 0; z-index: 5;
  width: 50px; flex-shrink: 0;
  background: var(--color-bg-card);
}

.time-tick {
  position: absolute;
  left: 0; right: 6px;
  text-align: right;
  font-size: 11px;
  color: var(--color-text-tertiary);
  transform: translateY(-50%);
  line-height: 1;
  pointer-events: none;
}

.schedule-columns { display: flex; flex: 1; }

.schedule-col {
  flex: 1;
  min-width: 130px; max-width: 200px;
  position: relative;
  border-left: 1px solid var(--color-border-subtle);
  &:last-child { border-right: 1px solid var(--color-border-subtle); }
  &.is-today { background: rgba(99,102,241,0.04); }
  &.is-selected { background: rgba(99,102,241,0.07); }
}

.hour-line {
  position: absolute;
  left: 0; right: 0;
  height: 1px;
  background: var(--color-border-subtle);
  pointer-events: none;
}

/* --- Event Chips --- */
.event-chip {
  position: absolute;
  border-radius: 6px;
  padding: 3px 8px;
  cursor: pointer;
  font-size: 11.5px; font-weight: 550;
  line-height: 1.5;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  transition: box-shadow 0.2s, transform 0.15s;
  border-left: 3px solid transparent;
  overflow: hidden;
  z-index: 3;

  &:hover {
    box-shadow: 0 4px 14px rgba(0,0,0,0.15);
    transform: translateY(-1px);
    z-index: 4;
  }

  &.event--scheduled,
  &.event--pending { background: rgba(251,191,36,0.2); border-left-color: #fbbf24; color: #fbbf24; }
  &.event--ongoing { background: rgba(129,140,248,0.2); border-left-color: #818cf8; color: #a5b4fc; }
  &.event--completed,
  &.event--passed { background: rgba(52,211,153,0.2); border-left-color: #34d399; color: #34d399; }
  &.event--cancelled,
  &.event--failed { background: rgba(248,113,113,0.2); border-left-color: #f87171; color: #f87171; }
  &.event--expired { background: var(--color-bg-hover); border-left-color: var(--color-text-tertiary); color: var(--color-text-tertiary); }
}

.event-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

/* ============================================================
   CONTEXT MENU
   ============================================================ */
.context-menu {
  position: fixed;
  z-index: 9999;
  background: var(--color-bg-card);
  border-radius: 10px;
  box-shadow: var(--shadow-dropdown);
  border: 1px solid var(--color-border-default);
  padding: 4px;
  min-width: 140px;
}

.ctx-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--color-text-main);
  cursor: pointer;
  border-radius: 7px;
  transition: background 0.12s;

  .el-icon { font-size: 15px; color: var(--color-text-secondary); }
  &:hover { background: var(--color-bg-hover); }
  &--danger .el-icon { color: var(--color-error-red); }
  &--success .el-icon { color: var(--color-success-green); }
}

/* ============================================================
   RESPONSIVE
   ============================================================ */
@media (max-width: 1200px) { .stats-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 900px) {
  .dashboard-body { flex-direction: column; }
  .panel-calendar { width: 100%; min-width: 0; }
}
@media (max-width: 600px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
</style>

<style lang="scss">
/* driver.js 引导弹窗 — 匹配晓聘设计 */
.driver-popover {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  border-radius: 14px !important;
  box-shadow: 0 12px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05) !important;
  padding: 22px 20px 18px !important;
  min-width: 280px;
  max-width: 360px;
  background: #fff !important;

  .driver-popover-title {
    font-size: 15px;
    font-weight: 650;
    color: #0f172a;
    margin-bottom: 6px;
  }

  .driver-popover-description {
    font-size: 13px;
    color: #64748b;
    line-height: 1.6;
    margin-bottom: 14px;
  }

  .driver-popover-progress-text {
    font-size: 12px;
    color: #94a3b8;
  }

  .driver-popover-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;

    button {
      font-size: 13px;
      font-weight: 500;
      font-family: inherit;
      border-radius: 8px;
      padding: 7px 16px;
      transition: all 0.2s;
      border: 1px solid #e2e8f0;
      background: #fff;
      color: #475569;
      cursor: pointer;

      &:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
      }
    }
  }

  .driver-popover-next-btn {
    background: #6366f1 !important;
    border-color: #6366f1 !important;
    color: #fff !important;

    &:hover {
      background: #4f46e5 !important;
      border-color: #4f46e5 !important;
    }
  }

  .driver-popover-close-btn {
    font-size: 16px;
    color: #94a3b8;
    cursor: pointer;
    border: none;
    background: none;
    position: absolute;
    top: 12px;
    right: 12px;

    &:hover { color: #475569; }
  }
}

/* 遮罩层 */
.driver-overlay {
  background: rgba(15, 23, 42, 0.6) !important;
}

/* 高亮元素 */
.driver-active-element {
  position: relative;
  z-index: 10001 !important;
  outline: 3px solid #6366f1 !important;
  outline-offset: 2px;
  border-radius: 6px;
}
</style>

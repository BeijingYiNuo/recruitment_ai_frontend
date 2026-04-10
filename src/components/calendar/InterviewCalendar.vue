<template>
  <div class="interview-calendar">
    <!-- 左侧迷你月历 -->
    <div class="cal-sidebar">
      <div class="mini-cal">
        <!-- 月份导航 -->
        <div class="mini-cal-header">
          <span class="mini-cal-title">{{ miniCalTitle }}</span>
          <div class="mini-cal-navs">
            <button class="cal-btn cal-btn-nav cal-btn-sm" @click="prevMonth">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M10.354 3.646a.5.5 0 010 .708L6.707 8l3.647 3.646a.5.5 0 01-.708.708l-4-4a.5.5 0 010-.708l4-4a.5.5 0 01.708 0z"/></svg>
            </button>
            <button class="cal-btn cal-btn-nav cal-btn-sm" @click="nextMonth">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M5.646 3.646a.5.5 0 01.708 0l4 4a.5.5 0 010 .708l-4 4a.5.5 0 01-.708-.708L9.293 8 5.646 4.354a.5.5 0 010-.708z"/></svg>
            </button>
          </div>
        </div>

        <!-- 星期标题 -->
        <div class="mini-cal-weekdays">
          <span v-for="w in miniWeekLabels" :key="w">{{ w }}</span>
        </div>

        <!-- 日期网格 -->
        <div class="mini-cal-grid">
          <div
            v-for="(cell, idx) in miniCalCells"
            :key="idx"
            class="mini-cal-cell"
            :class="{
              'is-other-month': cell.isOtherMonth,
              'is-today': cell.isToday,
              'is-selected-week': cell.isInSelectedWeek,
              'is-selected': cell.dateStr === selectedMiniDate
            }"
            @click="onMiniDateClick(cell)"
          >
            {{ cell.day }}
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧主日历 -->
    <div class="cal-main">
      <!-- 顶部导航 -->
      <div class="cal-header">
        <div class="cal-header-left">
          <button class="cal-btn cal-btn-today" @click="goToday">今天</button>
          <button class="cal-btn cal-btn-nav" @click="prevWeek">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M10.354 3.646a.5.5 0 010 .708L6.707 8l3.647 3.646a.5.5 0 01-.708.708l-4-4a.5.5 0 010-.708l4-4a.5.5 0 01.708 0z"/></svg>
          </button>
          <button class="cal-btn cal-btn-nav" @click="nextWeek">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M5.646 3.646a.5.5 0 01.708 0l4 4a.5.5 0 010 .708l-4 4a.5.5 0 01-.708-.708L9.293 8 5.646 4.354a.5.5 0 010-.708z"/></svg>
          </button>
          <span class="cal-header-title">{{ headerTitle }}</span>
        </div>
      </div>

      <!-- 主体区域 -->
      <div class="cal-body">
        <!-- 日期标题行 -->
        <div class="cal-day-headers">
          <div class="cal-gutter-header">GMT+8</div>
          <div
            v-for="day in weekDays"
            :key="day.dateStr"
            class="cal-day-header"
            :class="{ 'is-today': day.isToday }"
          >
            <span class="cal-day-name" :class="{ 'is-today': day.isToday }">{{ day.name }}</span>
            <span class="cal-day-number" :class="{ 'is-today': day.isToday }">{{ day.number }}</span>
          </div>
        </div>

        <!-- 可滚动的时间网格 -->
        <div class="cal-grid-scroll" ref="gridScrollRef">
          <div class="cal-grid" :style="{ height: totalGridHeight + 'px' }">
            <!-- 左侧时间刻度 -->
            <div class="cal-time-gutter">
              <div
                v-for="hour in visibleHours"
                :key="hour"
                class="cal-time-label"
                :style="{ top: (hour - startHour) * hourHeight + 'px' }"
              >
                {{ formatHour(hour) }}
              </div>
            </div>

            <!-- 日列 -->
            <div class="cal-columns">
              <div
                v-for="day in weekDays"
                :key="day.dateStr"
                class="cal-column"
                :class="{ 'is-today': day.isToday }"
              >
                <!-- 水平网格线 -->
                <div
                  v-for="hour in visibleHours"
                  :key="hour"
                  class="cal-hour-line"
                  :style="{ top: (hour - startHour) * hourHeight + 'px' }"
                ></div>

                <!-- 面试事件块 -->
                <div
                  v-for="evt in getEventsForDay(day.dateStr)"
                  :key="evt.id"
                  class="cal-event"
                  :class="[
                    'cal-event--' + evt.session_type,
                    { 'cal-event--editing': excludeId != null && evt.id === excludeId }
                  ]"
                  :style="getEventStyle(evt)"
                  :title="evt.candidate_name + ' ' + formatEventTime(evt)"
                >
                  <div class="cal-event-title">{{ evt.candidate_name }}</div>
                  <div class="cal-event-time">{{ formatEventTime(evt) }}</div>
                </div>

                <!-- 拖拽选区 -->
                <div
                  v-if="selection && selection.dateStr === day.dateStr"
                  class="cal-selection"
                  :style="getSelectionStyle()"
                >
                  <span class="cal-selection-text">{{ formatSelectionLabel() }}</span>
                </div>

                <!-- 鼠标交互层 -->
                <div
                  class="cal-interact"
                  @mousedown.prevent="onMouseDown($event, day)"
                  @mousemove.prevent="onMouseMove($event, day)"
                  @mouseup.prevent="onMouseUp($event, day)"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

const props = defineProps({
  /** 已有面试安排列表 */
  interviews: { type: Array, default: () => [] },
  /** 外部传入的初始日期（可选） */
  initialDate: { type: String, default: '' },
  /** 编辑模式下排除当前面试的 ID，使其时段可重新选择 */
  excludeId: { type: [Number, String, null], default: null }
})

const emit = defineEmits(['select-slot'])

// ============ 常量 ============
const startHour = 8
const endHour = 22
const hourHeight = 80 // 每小时 80px，30分钟事件=40px，足够显示两行内容
const totalGridHeight = (endHour - startHour) * hourHeight
const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const miniWeekLabels = ['日', '一', '二', '三', '四', '五', '六']

// ============ 响应式状态 ============
const currentWeekStart = ref(getWeekStart(new Date()))
const miniCalMonth = ref(new Date().getMonth())    // 0-11
const miniCalYear = ref(new Date().getFullYear())
const gridScrollRef = ref(null)
const selection = ref(null)
const isDragging = ref(false)
const hasDragged = ref(false)
const dragStartMinute = ref(0)
const selectedMiniDate = ref('')

// ============ 迷你月历相关 ============
const miniCalTitle = computed(() => `${miniCalYear.value}年${miniCalMonth.value + 1}月`)
const miniCalTitleShort = computed(() => `${String(miniCalMonth.value + 1).padStart(2, '0')}月`)

const miniCalCells = computed(() => {
  const year = miniCalYear.value
  const month = miniCalMonth.value
  const firstDay = new Date(year, month, 1)
  const startDow = firstDay.getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  const today = new Date()
  const todayStr = formatDateStr(today)
  const weekStartStr = formatDateStr(currentWeekStart.value)
  const weekEndDate = new Date(currentWeekStart.value)
  weekEndDate.setDate(weekEndDate.getDate() + 6)
  const weekEndStr = formatDateStr(weekEndDate)

  const cells = []

  // 上月补齐
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthDays - i
    const date = new Date(year, month - 1, d)
    const dateStr = formatDateStr(date)
    cells.push({
      day: d,
      dateStr,
      isOtherMonth: true,
      isToday: dateStr === todayStr,
      isInSelectedWeek: dateStr >= weekStartStr && dateStr <= weekEndStr
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
      isToday: dateStr === todayStr,
      isInSelectedWeek: dateStr >= weekStartStr && dateStr <= weekEndStr
    })
  }

  // 下月补齐（补满6行 = 42格）
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d)
    const dateStr = formatDateStr(date)
    cells.push({
      day: d,
      dateStr,
      isOtherMonth: true,
      isToday: dateStr === todayStr,
      isInSelectedWeek: dateStr >= weekStartStr && dateStr <= weekEndStr
    })
  }

  return cells
})

function prevMonth() {
  if (miniCalMonth.value === 0) {
    miniCalMonth.value = 11
    miniCalYear.value--
  } else {
    miniCalMonth.value--
  }
}

function nextMonth() {
  if (miniCalMonth.value === 11) {
    miniCalMonth.value = 0
    miniCalYear.value++
  } else {
    miniCalMonth.value++
  }
}

function onMiniDateClick(cell) {
  selectedMiniDate.value = cell.dateStr
  // 跳转到该日期所在的周
  const [y, m, d] = cell.dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  currentWeekStart.value = getWeekStart(date)
}

// 周切换时同步迷你月历显示的月份
watch(currentWeekStart, (val) => {
  // 取本周中间日（周三）来决定月份
  const mid = new Date(val)
  mid.setDate(mid.getDate() + 3)
  miniCalYear.value = mid.getFullYear()
  miniCalMonth.value = mid.getMonth()
})

// ============ 周视图计算属性 ============
const visibleHours = computed(() => {
  const hours = []
  for (let h = startHour; h <= endHour; h++) hours.push(h)
  return hours
})

const weekDays = computed(() => {
  const days = []
  const today = new Date()
  const todayStr = formatDateStr(today)
  for (let i = 0; i < 7; i++) {
    const d = new Date(currentWeekStart.value)
    d.setDate(d.getDate() + i)
    const dateStr = formatDateStr(d)
    days.push({
      date: d,
      dateStr,
      name: dayNames[d.getDay()],
      number: d.getDate(),
      isToday: dateStr === todayStr
    })
  }
  return days
})

const headerTitle = computed(() => {
  const start = currentWeekStart.value
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const startYear = start.getFullYear()
  const startMonth = start.getMonth() + 1
  const endMonth = end.getMonth() + 1
  if (startMonth === endMonth) {
    return `${startYear}年${startMonth}月`
  }
  return `${startYear}年${startMonth}月 - ${endMonth}月`
})

// ============ 导航方法 ============
function goToday() {
  currentWeekStart.value = getWeekStart(new Date())
  selectedMiniDate.value = formatDateStr(new Date())
  scrollToCurrentTime()
}

function prevWeek() {
  const d = new Date(currentWeekStart.value)
  d.setDate(d.getDate() - 7)
  currentWeekStart.value = d
}

function nextWeek() {
  const d = new Date(currentWeekStart.value)
  d.setDate(d.getDate() + 7)
  currentWeekStart.value = d
}

// ============ 事件渲染 ============
function getEventsForDay(dateStr) {
  return props.interviews.filter(evt => {
    if (!evt.scheduled_start_at) return false
    const evtDate = evt.scheduled_start_at.substring(0, 10)
    return evtDate === dateStr
  })
}

function getEventStyle(evt) {
  const startMin = getMinuteOfDay(evt.scheduled_start_at)
  const endMin = getMinuteOfDay(evt.scheduled_end_at)
  const top = ((startMin - startHour * 60) / 60) * hourHeight
  const height = Math.max(((endMin - startMin) / 60) * hourHeight, 20)
  return {
    top: top + 'px',
    height: height + 'px'
  }
}

function formatEventTime(evt) {
  const s = evt.scheduled_start_at ? evt.scheduled_start_at.substring(11, 16) : ''
  const e = evt.scheduled_end_at ? evt.scheduled_end_at.substring(11, 16) : ''
  return `${s} - ${e}`
}

// ============ 拖拽选择逻辑 ============
function onMouseDown(e, day) {
  const minute = getMinuteFromEvent(e)
  if (minute < startHour * 60 || minute >= endHour * 60) return

  // 检查是否点在已有事件上
  if (isOccupied(day.dateStr, minute)) return

  isDragging.value = true
  hasDragged.value = false
  dragStartMinute.value = snapTo15(minute)
  selection.value = {
    dateStr: day.dateStr,
    startMinute: snapTo15(minute),
    endMinute: snapTo15(minute) + 15
  }
}

function onMouseMove(e, day) {
  if (!isDragging.value || !selection.value) return
  if (selection.value.dateStr !== day.dateStr) return

  const minute = getMinuteFromEvent(e)
  const snapped = snapTo15(minute)
  const endSnapped = Math.min(snapped + 15, endHour * 60)

  // 只要拖动到了不同的 15 分钟格，就认为是拖拽而非点击
  if (snapped !== dragStartMinute.value) {
    hasDragged.value = true
  }

  if (snapped >= dragStartMinute.value) {
    selection.value.startMinute = dragStartMinute.value
    selection.value.endMinute = endSnapped
  } else {
    selection.value.startMinute = snapped
    selection.value.endMinute = dragStartMinute.value + 15
  }
}

/** 核心：完成选区并触发事件 */
function finalizeSelection() {
  if (!isDragging.value || !selection.value) {
    isDragging.value = false
    return
  }
  isDragging.value = false

  // 确保最小 15 分钟
  if (selection.value.endMinute - selection.value.startMinute < 15) {
    selection.value.endMinute = selection.value.startMinute + 15
  }

  // 触发事件
  const dateStr = selection.value.dateStr
  const startTime = minuteToTimeStr(selection.value.startMinute)
  const endTime = minuteToTimeStr(selection.value.endMinute)

  emit('select-slot', {
    date: dateStr,
    startTime,
    endTime,
    scheduledStartAt: `${dateStr} ${startTime}:00`,
    scheduledEndAt: `${dateStr} ${endTime}:00`
  })
}

function onMouseUp(e, day) {
  finalizeSelection()
}

/** 全局 mouseup 兜底：防止鼠标移出日历区域后释放导致选区丢失 */
function onDocumentMouseUp() {
  if (isDragging.value) {
    finalizeSelection()
  }
}

function getSelectionStyle() {
  if (!selection.value) return {}
  const top = ((selection.value.startMinute - startHour * 60) / 60) * hourHeight
  const height = ((selection.value.endMinute - selection.value.startMinute) / 60) * hourHeight
  return {
    top: top + 'px',
    height: Math.max(height, 15) + 'px'
  }
}

function formatSelectionLabel() {
  if (!selection.value) return ''
  return `${minuteToTimeStr(selection.value.startMinute)} - ${minuteToTimeStr(selection.value.endMinute)}`
}

// ============ 工具函数 ============
function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatHour(h) {
  return String(h).padStart(2, '0') + ':00'
}

function getMinuteOfDay(timeStr) {
  if (!timeStr) return 0
  const timePart = timeStr.includes('T') ? timeStr.split('T')[1] : timeStr.split(' ')[1]
  if (!timePart) return 0
  const [h, m] = timePart.split(':').map(Number)
  return h * 60 + m
}

function getMinuteFromEvent(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  const y = e.clientY - rect.top
  const totalMinutes = (y / totalGridHeight) * (endHour - startHour) * 60
  return Math.floor(totalMinutes) + startHour * 60
}

function snapTo15(minute) {
  return Math.floor(minute / 15) * 15
}

function minuteToTimeStr(minute) {
  const h = Math.floor(minute / 60)
  const m = minute % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function isOccupied(dateStr, minute) {
  const events = getEventsForDay(dateStr)
  return events.some(evt => {
    // 编辑模式下当前面试的时段不视为占用
    if (props.excludeId != null && evt.id === props.excludeId) return false
    const s = getMinuteOfDay(evt.scheduled_start_at)
    const e = getMinuteOfDay(evt.scheduled_end_at)
    return minute >= s && minute < e
  })
}

function scrollToCurrentTime() {
  nextTick(() => {
    if (!gridScrollRef.value) return
    const now = new Date()
    const nowMinute = now.getHours() * 60 + now.getMinutes()
    const scrollTop = Math.max(((nowMinute - startHour * 60) / 60) * hourHeight - 100, 0)
    gridScrollRef.value.scrollTop = scrollTop
  })
}

// ============ 生命周期 ============
onMounted(() => {
  document.addEventListener('mouseup', onDocumentMouseUp)
  scrollToCurrentTime()
})

onUnmounted(() => {
  document.removeEventListener('mouseup', onDocumentMouseUp)
})

// 暴露清除选区方法
function clearSelection() {
  selection.value = null
}

defineExpose({ clearSelection, goToday })
</script>

<style lang="scss" scoped>
.interview-calendar {
  display: flex;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 13px;
  color: #1f2329;
  user-select: none;
}

// ====== 左侧迷你月历 ======
.cal-sidebar {
  width: 200px;
  min-width: 200px;
  border-right: 1px solid #eef0f3;
  padding: 6px 14px 0 0;
  flex-shrink: 0;
}

.mini-cal {
  width: 100%;
}

.mini-cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.mini-cal-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2329;
}

.mini-cal-navs {
  display: flex;
  gap: 2px;
}

.mini-cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 2px;

  span {
    font-size: 12px;
    color: #8f959e;
    height: 26px;
    line-height: 26px;
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
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.12s;
  color: #1f2329;

  &:hover {
    background: #f0f1f5;
  }

  &.is-other-month {
    color: #c0c4cc;
  }

  &.is-in-selected-week {
    background: #eef2fe;
    border-radius: 2px;
  }

  &.is-today {
    position: relative;
    font-weight: 600;
    color: #3370ff;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #3370ff;
    }
  }

  &.is-selected {
    background: #3370ff;
    color: #fff;
    font-weight: 600;
    border-radius: 50%;

    &::after {
      display: none;
    }
  }
}

// ====== 右侧主日历 ======
.cal-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding-left: 14px;
}

// ====== 头部导航 ======
.cal-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 2px 0 8px;
  flex-shrink: 0;
}

.cal-header-left {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cal-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dee0e3;
  background: #fff;
  color: #646a73;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: #f0f1f5;
    color: #3370ff;
    border-color: #c0c4cc;
  }
}

.cal-btn-today {
  padding: 3px 14px;
  font-size: 13px;
  font-weight: 500;
  margin-right: 6px;
}

.cal-btn-nav {
  width: 26px;
  height: 26px;
  padding: 0;
}

.cal-btn-sm {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: none;
  background: transparent;

  &:hover {
    background: #f0f1f5;
  }
}

.cal-header-title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2329;
  margin-left: 14px;
}

// ====== 日期标题行 ======
.cal-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.cal-day-headers {
  display: flex;
  border-bottom: 1px solid #dee0e3;
  flex-shrink: 0;
}

.cal-gutter-header {
  width: 52px;
  min-width: 52px;
  padding: 6px 0;
  text-align: center;
  font-size: 11px;
  color: #8f959e;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 8px;
}

.cal-day-header {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 0 6px;
  gap: 2px;
  border-left: 1px solid transparent;

  .cal-day-name {
    font-size: 12px;
    color: #8f959e;
    font-weight: 400;

    &.is-today {
      color: #3370ff;
      font-weight: 500;
    }
  }

  .cal-day-number {
    font-size: 22px;
    font-weight: 500;
    width: 32px;
    height: 32px;
    line-height: 32px;
    text-align: center;
    border-radius: 50%;
    color: #1f2329;

    &.is-today {
      background: #3370ff;
      color: #fff;
      font-weight: 600;
    }
  }
}

// ====== 时间网格 ======
.cal-grid-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(144, 147, 153, 0.25);
    border-radius: 2px;
  }
}

.cal-grid {
  position: relative;
  display: flex;
}

.cal-time-gutter {
  width: 52px;
  min-width: 52px;
  position: relative;
}

.cal-time-label {
  position: absolute;
  width: 100%;
  text-align: center;
  font-size: 11px;
  color: #8f959e;
  transform: translateY(-7px);
  pointer-events: none;
}

.cal-columns {
  flex: 1;
  display: flex;
  position: relative;
}

.cal-column {
  flex: 1;
  position: relative;
  border-left: 1px solid #eef0f3;

  &.is-today {
    background: rgba(51, 112, 255, 0.025);
  }
}

.cal-hour-line {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px solid #eef0f3;
  pointer-events: none;
}

// ====== 面试事件块 ======
.cal-event {
  position: absolute;
  left: 2px;
  right: 2px;
  border-radius: 4px;
  padding: 4px 6px;
  overflow: hidden;
  cursor: default;
  z-index: 2;
  font-size: 12px;
  line-height: 1.3;
  transition: box-shadow 0.15s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  }

  &--online {
    background: #e1ecfe;
    border-left: 3px solid #3370ff;
    color: #1a56db;
  }

  &--offline {
    background: #fef0e5;
    border-left: 3px solid #ff8800;
    color: #b85c00;
  }

  &--editing {
    opacity: 0.5;
    border: 1.5px dashed #8f959e;
    border-left-width: 3px;
    pointer-events: none; /* 让鼠标穿透它，从而能点到底部的网格进行重新选择 */
  }
}

.cal-event-title {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cal-event-time {
  font-size: 11px;
  opacity: 0.8;
  margin-top: 1px;
}

// ====== 拖拽选区 ======
.cal-selection {
  position: absolute;
  left: 2px;
  right: 2px;
  background: rgba(51, 112, 255, 0.12);
  border: 1.5px solid #3370ff;
  border-radius: 4px;
  z-index: 3;
  display: flex;
  align-items: flex-start;
  padding: 4px 6px;
  pointer-events: none;
}

.cal-selection-text {
  font-size: 11px;
  font-weight: 600;
  color: #3370ff;
}

// ====== 交互层 ======
.cal-interact {
  position: absolute;
  inset: 0;
  z-index: 1;
  cursor: pointer;
}
</style>

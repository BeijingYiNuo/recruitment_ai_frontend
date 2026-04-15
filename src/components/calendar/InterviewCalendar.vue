<template>
  <div class="interview-calendar">
    <div class="cal-sidebar">
      <div class="mini-cal">
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

        <div class="mini-cal-weekdays">
          <span v-for="w in miniWeekLabels" :key="w">{{ w }}</span>
        </div>

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

    <div class="cal-main">
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

      <div class="cal-body">
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

        <div class="cal-grid-scroll" ref="gridScrollRef">
          <div class="cal-grid" :style="{ height: totalGridHeight + 'px' }">
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

            <div class="cal-columns">
              <div
                v-for="day in weekDays"
                :key="day.dateStr"
                class="cal-column"
                :class="{ 'is-today': day.isToday }"
              >
                <div
                  v-for="hour in visibleHours"
                  :key="hour"
                  class="cal-hour-line"
                  :style="{ top: (hour - startHour) * hourHeight + 'px' }"
                ></div>

                <div
                  v-for="evt in getEventsForDay(day.dateStr)"
                  :key="evt.id"
                  class="cal-event"
                  :class="[
                    'cal-event--' + (evt.session_type || 'online'),
                    { 'cal-event--editing': excludeId != null && evt.id === excludeId }
                  ]"
                  :style="getEventStyle(evt)"
                  :title="getEventTitle(evt)"
                >
                  <div class="cal-event-title">{{ evt.candidate_name || '未命名面试' }}</div>
                  <div class="cal-event-time">{{ formatEventTime(evt) }}</div>
                </div>

                <div
                  v-if="showUnavailableOverlay && getUnavailableOverlayStyle(day.dateStr)"
                  class="cal-unavailable-overlay"
                  :style="getUnavailableOverlayStyle(day.dateStr)"
                ></div>

                <div
                  v-if="!readOnly && selection && selection.dateStr === day.dateStr"
                  class="cal-selection"
                  :style="getSelectionStyle()"
                >
                  <span class="cal-selection-text">{{ formatSelectionLabel() }}</span>
                </div>

                <div
                  v-if="!readOnly"
                  class="cal-interact"
                  @mousedown.prevent="onMouseDown($event, day)"
                  @mousemove.prevent="onMouseMove($event, day)"
                  @mouseup.prevent="onMouseUp"
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
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  interviews: { type: Array, default: () => [] },
  initialDate: { type: String, default: '' },
  excludeId: { type: [Number, String, null], default: null },
  readOnly: { type: Boolean, default: false },
  disablePastSelection: { type: Boolean, default: true },
  hourHeight: { type: Number, default: 80 }
})

const emit = defineEmits(['select-slot'])

const startHour = 8
const endHour = 23
const hourHeight = computed(() => props.hourHeight)
const totalGridHeight = computed(() => (endHour - startHour) * hourHeight.value + 30)
const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const miniWeekLabels = ['日', '一', '二', '三', '四', '五', '六']

const parsedInitialDate = parseDateTime(props.initialDate) || new Date()
const currentWeekStart = ref(getWeekStart(parsedInitialDate))
const miniCalMonth = ref(parsedInitialDate.getMonth())
const miniCalYear = ref(parsedInitialDate.getFullYear())
const gridScrollRef = ref(null)
const selection = ref(null)
const isDragging = ref(false)
const dragStartMinute = ref(0)
const selectedMiniDate = ref(formatDateStr(parsedInitialDate))

const showUnavailableOverlay = computed(() => !props.readOnly && props.disablePastSelection)

const miniCalTitle = computed(() => `${miniCalYear.value}年${miniCalMonth.value + 1}月`)

const miniCalCells = computed(() => {
  const year = miniCalYear.value
  const month = miniCalMonth.value
  const firstDay = new Date(year, month, 1)
  const startDow = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()
  const todayStr = formatDateStr(new Date())
  const weekStartStr = formatDateStr(currentWeekStart.value)
  const weekEndDate = new Date(currentWeekStart.value)
  weekEndDate.setDate(weekEndDate.getDate() + 6)
  const weekEndStr = formatDateStr(weekEndDate)
  const cells = []

  for (let i = startDow - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthDays - i)
    const dateStr = formatDateStr(date)
    cells.push({
      day: date.getDate(),
      dateStr,
      isOtherMonth: true,
      isToday: dateStr === todayStr,
      isInSelectedWeek: dateStr >= weekStartStr && dateStr <= weekEndStr
    })
  }

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

watch(currentWeekStart, (val) => {
  const middle = new Date(val)
  middle.setDate(middle.getDate() + 3)
  miniCalYear.value = middle.getFullYear()
  miniCalMonth.value = middle.getMonth()
})

const visibleHours = computed(() => {
  const hours = []
  for (let h = startHour; h <= endHour; h++) hours.push(h)
  return hours
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
      name: dayNames[date.getDay()],
      number: date.getDate(),
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
  const endYear = end.getFullYear()
  const endMonth = end.getMonth() + 1

  if (startYear === endYear && startMonth === endMonth) {
    return `${startYear}年${startMonth}月`
  }

  if (startYear === endYear) {
    return `${startYear}年${startMonth}月 - ${endMonth}月`
  }

  return `${startYear}年${startMonth}月 - ${endYear}年${endMonth}月`
})

function prevMonth() {
  if (miniCalMonth.value === 0) {
    miniCalMonth.value = 11
    miniCalYear.value -= 1
  } else {
    miniCalMonth.value -= 1
  }
}

function nextMonth() {
  if (miniCalMonth.value === 11) {
    miniCalMonth.value = 0
    miniCalYear.value += 1
  } else {
    miniCalMonth.value += 1
  }
}

function onMiniDateClick(cell) {
  selectedMiniDate.value = cell.dateStr
  const [y, m, d] = cell.dateStr.split('-').map(Number)
  currentWeekStart.value = getWeekStart(new Date(y, m - 1, d))
}

function goToday() {
  const today = new Date()
  currentWeekStart.value = getWeekStart(today)
  selectedMiniDate.value = formatDateStr(today)
  scrollToCurrentTime()
}

function prevWeek() {
  const date = new Date(currentWeekStart.value)
  date.setDate(date.getDate() - 7)
  currentWeekStart.value = date
}

function nextWeek() {
  const date = new Date(currentWeekStart.value)
  date.setDate(date.getDate() + 7)
  currentWeekStart.value = date
}

function getEventsForDay(dateStr) {
  return props.interviews.filter((evt) => evt?.scheduled_start_at?.slice(0, 10) === dateStr)
}

function getEventStyle(evt) {
  const startMin = getMinuteOfDay(evt.scheduled_start_at)
  const endMin = getMinuteOfDay(evt.scheduled_end_at)
  const top = ((startMin - startHour * 60) / 60) * hourHeight.value
  const height = Math.max(((endMin - startMin) / 60) * hourHeight.value, 20)
  return {
    top: `${top}px`,
    height: `${height}px`
  }
}

function formatEventTime(evt) {
  const start = evt.scheduled_start_at ? evt.scheduled_start_at.slice(11, 16) : ''
  const end = evt.scheduled_end_at ? evt.scheduled_end_at.slice(11, 16) : ''
  return `${start} - ${end}`
}

function getEventTitle(evt) {
  return [evt.candidate_name, formatEventTime(evt), evt.notes].filter(Boolean).join(' | ')
}

function onMouseDown(event, day) {
  if (props.readOnly) return

  const minute = getMinuteFromEvent(event)
  if (minute < startHour * 60 || minute >= endHour * 60) return

  const snappedMinute = snapTo15(minute)
  if (props.disablePastSelection && snappedMinute < getMinSelectableMinute(day.dateStr)) return
  if (isOccupied(day.dateStr, minute)) return

  isDragging.value = true
  dragStartMinute.value = snappedMinute
  selection.value = {
    dateStr: day.dateStr,
    startMinute: snappedMinute,
    endMinute: snappedMinute + 15
  }
}

function onMouseMove(event, day) {
  if (props.readOnly || !isDragging.value || !selection.value) return
  if (selection.value.dateStr !== day.dateStr) return

  const minute = getMinuteFromEvent(event)
  const minSelectableMinute = props.disablePastSelection ? getMinSelectableMinute(day.dateStr) : startHour * 60
  const snapped = Math.max(snapTo15(minute), minSelectableMinute)
  const endSnapped = Math.min(snapped + 15, endHour * 60)

  if (snapped >= dragStartMinute.value) {
    selection.value.startMinute = dragStartMinute.value
    selection.value.endMinute = endSnapped
  } else {
    selection.value.startMinute = snapped
    selection.value.endMinute = dragStartMinute.value + 15
  }
}

function onMouseUp() {
  if (props.readOnly) return
  finalizeSelection()
}

function finalizeSelection() {
  if (!isDragging.value || !selection.value) {
    isDragging.value = false
    return
  }

  isDragging.value = false
  if (selection.value.endMinute - selection.value.startMinute < 15) {
    selection.value.endMinute = selection.value.startMinute + 15
  }

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

function onDocumentMouseUp() {
  if (!props.readOnly && isDragging.value) {
    finalizeSelection()
  }
}

function getSelectionStyle() {
  if (!selection.value) return {}
  const top = ((selection.value.startMinute - startHour * 60) / 60) * hourHeight.value
  const height = ((selection.value.endMinute - selection.value.startMinute) / 60) * hourHeight.value
  return {
    top: `${top}px`,
    height: `${Math.max(height, 15)}px`
  }
}

function formatSelectionLabel() {
  if (!selection.value) return ''
  return `${minuteToTimeStr(selection.value.startMinute)} - ${minuteToTimeStr(selection.value.endMinute)}`
}

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

function parseDateTime(value) {
  if (!value) return null
  const result = new Date(String(value).replace(/-/g, '/'))
  return Number.isNaN(result.getTime()) ? null : result
}

function getTodayStr() {
  return formatDateStr(new Date())
}

function getMinSelectableMinute(dateStr) {
  const todayStr = getTodayStr()
  if (dateStr < todayStr) return endHour * 60
  if (dateStr > todayStr) return startHour * 60

  const now = new Date()
  const nextQuarterMinute = Math.floor((now.getHours() * 60 + now.getMinutes()) / 15) * 15 + 15
  return Math.max(startHour * 60, nextQuarterMinute)
}

function getUnavailableOverlayStyle(dateStr) {
  if (!props.disablePastSelection) return null

  const minSelectableMinute = getMinSelectableMinute(dateStr)
  if (minSelectableMinute <= startHour * 60) return null

  const clampedMinute = Math.min(minSelectableMinute, endHour * 60)
  const height = ((clampedMinute - startHour * 60) / 60) * hourHeight.value
  if (height <= 0) return null

  return {
    top: '0px',
    height: `${height}px`
  }
}

function formatHour(hour) {
  return `${String(hour).padStart(2, '0')}:00`
}

function getMinuteOfDay(timeStr) {
  if (!timeStr) return 0
  const timePart = timeStr.includes('T') ? timeStr.split('T')[1] : timeStr.split(' ')[1]
  if (!timePart) return 0
  const [h, m] = timePart.split(':').map(Number)
  return h * 60 + m
}

function getMinuteFromEvent(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  const y = event.clientY - rect.top
  const totalMinutes = (y / totalGridHeight.value) * (endHour - startHour) * 60
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
  return getEventsForDay(dateStr).some((evt) => {
    if (props.excludeId != null && evt.id === props.excludeId) return false
    const start = getMinuteOfDay(evt.scheduled_start_at)
    const end = getMinuteOfDay(evt.scheduled_end_at)
    return minute >= start && minute < end
  })
}

function scrollToCurrentTime() {
  nextTick(() => {
    if (!gridScrollRef.value) return
    const now = new Date()
    const nowMinute = now.getHours() * 60 + now.getMinutes()
    const scrollTop = Math.max(((nowMinute - startHour * 60) / 60) * hourHeight.value - 100, 0)
    gridScrollRef.value.scrollTop = scrollTop
  })
}

onMounted(() => {
  if (!props.readOnly) {
    document.addEventListener('mouseup', onDocumentMouseUp)
  }
  scrollToCurrentTime()
})

onUnmounted(() => {
  if (!props.readOnly) {
    document.removeEventListener('mouseup', onDocumentMouseUp)
  }
})

function clearSelection() {
  selection.value = null
}

defineExpose({ clearSelection, goToday })
</script>

<style lang="scss" scoped>
.interview-calendar {
  display: flex;
  min-height: 600px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 13px;
  color: #1f2329;
  user-select: none;
}

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

.cal-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding-left: 14px;
}

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
  padding: 6px 0 8px;
  text-align: center;
  font-size: 11px;
  color: #8f959e;
  display: flex;
  align-items: flex-end;
  justify-content: center;
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

.cal-grid-scroll {
  flex: 1;
  overflow-y: visible;
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
  padding-top: 5px;
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
    pointer-events: none;
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

.cal-unavailable-overlay {
  position: absolute;
  left: 0;
  right: 0;
  background: repeating-linear-gradient(
    -45deg,
    rgba(143, 149, 158, 0.08),
    rgba(143, 149, 158, 0.08) 8px,
    rgba(143, 149, 158, 0.14) 8px,
    rgba(143, 149, 158, 0.14) 16px
  );
  pointer-events: none;
  z-index: 1;
}

.cal-interact {
  position: absolute;
  inset: 0;
  z-index: 1;
  cursor: pointer;
}

@media (max-width: 1200px) {
  .interview-calendar {
    flex-direction: column;
  }

  .cal-sidebar {
    width: 100%;
    min-width: 0;
    border-right: none;
    border-bottom: 1px solid #eef0f3;
    padding: 0 0 16px;
    margin-bottom: 16px;
  }

  .cal-main {
    padding-left: 0;
  }
}
</style>

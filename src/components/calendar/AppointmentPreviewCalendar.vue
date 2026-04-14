<template>
  <div class="appointment-calendar">
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
          <button class="cal-btn cal-btn-today" @click="goToday">Today</button>
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
                  :class="`cal-event--${evt.status || 'pending'}`"
                  :style="getEventStyle(evt)"
                  :title="getEventTitle(evt)"
                >
                  <div class="cal-event-title">{{ evt.candidate_name || 'Untitled' }}</div>
                  <div class="cal-event-time">{{ formatEventTime(evt) }}</div>
                  <div v-if="evt.location" class="cal-event-location">{{ evt.location }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'

const props = defineProps({
  appointments: { type: Array, default: () => [] },
  durationMinutes: { type: Number, default: 60 }
})

const startHour = 8
const endHour = 22
const hourHeight = 80
const totalGridHeight = (endHour - startHour) * hourHeight
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const miniWeekLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const currentWeekStart = ref(getWeekStart(new Date()))
const miniCalMonth = ref(new Date().getMonth())
const miniCalYear = ref(new Date().getFullYear())
const selectedMiniDate = ref(formatDateStr(new Date()))
const gridScrollRef = ref(null)

const normalizedAppointments = computed(() => {
  return props.appointments
    .filter(item => item?.scheduled_at)
    .map(item => {
      const start = parseDateTime(item.scheduled_at)
      if (!start) return null
      const end = new Date(start.getTime() + props.durationMinutes * 60 * 1000)
      return {
        ...item,
        dateStr: formatDateStr(start),
        startMinute: start.getHours() * 60 + start.getMinutes(),
        endMinute: end.getHours() * 60 + end.getMinutes()
      }
    })
    .filter(Boolean)
})

const miniCalTitle = computed(() => `${miniCalYear.value}-${String(miniCalMonth.value + 1).padStart(2, '0')}`)

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

const visibleHours = computed(() => {
  const hours = []
  for (let h = startHour; h <= endHour; h++) hours.push(h)
  return hours
})

const weekDays = computed(() => {
  const days = []
  const todayStr = formatDateStr(new Date())
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
    return `${startYear}-${String(startMonth).padStart(2, '0')}`
  }
  return `${startYear}-${String(startMonth).padStart(2, '0')} ~ ${String(endMonth).padStart(2, '0')}`
})

watch(currentWeekStart, (val) => {
  const mid = new Date(val)
  mid.setDate(mid.getDate() + 3)
  miniCalYear.value = mid.getFullYear()
  miniCalMonth.value = mid.getMonth()
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
  const d = new Date(currentWeekStart.value)
  d.setDate(d.getDate() - 7)
  currentWeekStart.value = d
}

function nextWeek() {
  const d = new Date(currentWeekStart.value)
  d.setDate(d.getDate() + 7)
  currentWeekStart.value = d
}

function getEventsForDay(dateStr) {
  return normalizedAppointments.value.filter(evt => evt.dateStr === dateStr)
}

function getEventStyle(evt) {
  const top = ((evt.startMinute - startHour * 60) / 60) * hourHeight
  const safeEndMinute = Math.min(evt.endMinute, endHour * 60)
  const height = Math.max(((safeEndMinute - evt.startMinute) / 60) * hourHeight, 20)
  return {
    top: `${Math.max(top, 0)}px`,
    height: `${height}px`
  }
}

function formatEventTime(evt) {
  return `${minuteToTimeStr(evt.startMinute)} - ${minuteToTimeStr(Math.min(evt.endMinute, endHour * 60))}`
}

function getEventTitle(evt) {
  return [evt.candidate_name, evt.scheduled_at, evt.location].filter(Boolean).join(' | ')
}

function parseDateTime(value) {
  if (!value) return null
  const parsed = new Date(value.replace(/-/g, '/'))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay()
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
  return `${String(h).padStart(2, '0')}:00`
}

function minuteToTimeStr(minute) {
  const h = Math.floor(minute / 60)
  const m = minute % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
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

onMounted(() => {
  scrollToCurrentTime()
})
</script>

<style lang="scss" scoped>
.appointment-calendar {
  display: flex;
  height: 760px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 13px;
  color: #1f2329;
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

.cal-event {
  position: absolute;
  left: 2px;
  right: 2px;
  border-radius: 4px;
  padding: 6px 8px;
  overflow: hidden;
  font-size: 12px;
  line-height: 1.35;
  z-index: 2;

  &--pending {
    background: #fff7e6;
    border-left: 3px solid #faad14;
    color: #ad6800;
  }

  &--confirmed {
    background: #e6f4ff;
    border-left: 3px solid #1677ff;
    color: #0958d9;
  }

  &--completed {
    background: #f6ffed;
    border-left: 3px solid #52c41a;
    color: #389e0d;
  }

  &--cancelled {
    background: #f5f5f5;
    border-left: 3px solid #8c8c8c;
    color: #595959;
  }
}

.cal-event-title {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cal-event-time,
.cal-event-location {
  font-size: 11px;
  margin-top: 2px;
  opacity: 0.85;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 1200px) {
  .appointment-calendar {
    flex-direction: column;
    height: auto;
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

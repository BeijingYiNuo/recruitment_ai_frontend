<template>
  <div class="appointment-manage feishu-page">
    <div class="card-container">
      <!-- Header Area -->
      <div class="header-area">
        <div class="header-top">
          <div class="title-area">
            <h1>约见安排</h1>
          </div>
          <div class="action-btn-group">
            <span class="header-tip">仅预览已预约的面试时间段</span>
          </div>
        </div>
      </div>

      <!-- Main Calendar Area -->
      <div class="list-area" v-loading="loading">
        <el-empty v-if="!loading && interviewList.length === 0" description="暂无已预约面试安排" style="padding: 60px 0" />
        <div v-else style="padding: 24px; min-height: 820px; box-sizing: border-box;">
          <InterviewCalendar
            :interviews="interviewList"
            :read-only="true"
            :disable-past-selection="false"
            :hour-height="45"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import InterviewCalendar from '../../components/calendar/InterviewCalendar.vue'
import { interviewApi } from '../../api/interview'
import { getCurrentUser } from '../../services/authService'

const loading = ref(false)
const interviewList = ref([])
const currentUser = ref(getCurrentUser() || { id: 1 })

const fetchInterviewSchedules = async () => {
  loading.value = true
  try {
    const data = await interviewApi.getUserInterviewSessions(currentUser.value.id)
    interviewList.value = Array.isArray(data) ? data : (data.items || data.data || [])
  } catch (error) {
    ElMessage.error('获取面试安排失败: ' + (error?.detail || error?.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchInterviewSchedules()
})
</script>



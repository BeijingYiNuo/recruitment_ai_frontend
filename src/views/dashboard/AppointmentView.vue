<template>
  <div class="appointment-manage">
    <el-card class="calendar-card" shadow="never" v-loading="loading">
      <template #header>
        <div class="list-header">
          <span>约见安排</span>
          <span class="header-tip">仅预览已预约的面试时间段</span>
        </div>
      </template>

      <el-empty v-if="!loading && interviewList.length === 0" description="暂无已预约面试安排" />
      <InterviewCalendar
        v-else
        :interviews="interviewList"
        :read-only="true"
        :disable-past-selection="false"
      />
    </el-card>
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

<style scoped lang="scss">
.appointment-manage {
  .calendar-card {
    border-radius: 12px;
    border: 1px solid #dee0e3;
    box-shadow: 0 4px 12px rgba(31, 35, 41, 0.04);

    :deep(.el-card__header) {
      padding: 16px 24px;
      border-bottom: 1px solid #dee0e3;
    }

    :deep(.el-card__body) {
      padding: 24px;
      min-height: 820px;
    }
  }

  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    font-size: 16px;
    font-weight: 600;
    color: #1f2329;
  }

  .header-tip {
    font-size: 13px;
    font-weight: 400;
    color: #8f959e;
  }
}
</style>

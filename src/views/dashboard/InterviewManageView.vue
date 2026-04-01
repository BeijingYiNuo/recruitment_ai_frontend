<template>
  <div class="interview-manage">
    <el-card class="list-card" shadow="never">
      <template #header>
        <div class="list-header">
          <span>面试管理</span>
          <div class="header-actions">
            <el-button type="success" size="small" @click="interviewStore.openModal('online')">新增线上面试</el-button>
            <el-button type="primary" size="small" @click="interviewStore.openModal('offline')">新增线下面试</el-button>
          </div>
        </div>
      </template>

      <el-empty v-if="interviewStore.interviews.length === 0" description="暂无面试安排，请点击上方按钮创建" />

      <ul v-else class="session-list">
        <li v-for="item in interviewStore.interviews" :key="item.id" class="session-item">
          <div class="resume-info">
            <div>
              <span class="status-badge" :style="{
                backgroundColor: item.session_type === 'online' ? '#d1fae5' : '#ede9fe',
                color: item.session_type === 'online' ? '#059669' : '#6d28d9'
              }">
                {{ item.session_type === 'online' ? '线上面试' : '线下面试' }}
              </span>
              <span style="margin-left:8px; font-weight: bold;">候选人 ID: {{ item.candidate_id }}</span>
              <span style="margin-left:8px; color: #666; font-size: 13px;" v-if="item.resume_id">
                (已关联简历 ID: {{ item.resume_id }})
              </span>
            </div>
            <div style="font-size: 13px; color: #555; margin-top: 4px;">
              预定时间: {{ interviewStore.formatTime(item.scheduled_at) }}
            </div>
            <div style="font-size: 13px; color: #555; margin-top: 4px;" v-if="interviewStore.getExtraInfo(item)">
              {{ item.session_type === 'online' ? '会议链接' : '面试地点' }}:
              <span style="font-family: monospace; background: #f0f0f0; padding: 2px 4px; border-radius: 4px;">{{ interviewStore.getExtraInfo(item) }}</span>
            </div>
          </div>
          <div class="actions">
            <el-button size="small" @click="interviewStore.editInterview(item)">编辑信息</el-button>
            <el-button size="small" type="danger" @click="handleDelete(item.id)">取消/删除</el-button>
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
      @save="handleSave"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getCurrentUser } from '../../services/authService'
import { useInterviewStore } from '../../stores/interviewStore'
import { useResumeStore } from '../../stores/resumeStore'
import InterviewFormDialog from '../../components/InterviewFormDialog.vue'

const interviewStore = useInterviewStore()
const resumeStore = useResumeStore()
const currentUser = ref(getCurrentUser() || { id: 1, username: '管理员' })

const handleSave = () => {
  const form = interviewStore.interviewForm
  if (!form.candidate_id) {
    ElMessage.warning('请填写候选人 ID')
    return
  }
  if (!form.scheduled_at) {
    ElMessage.warning('请选择面试时间')
    return
  }
  if (!form.extra_info) {
    ElMessage.warning(form.session_type === 'online' ? '会议链接不能为空' : '面试地点不能为空')
    return
  }

  const wasEdit = interviewStore.isEditMode
  interviewStore.saveInterview(currentUser.value.id)
  ElMessage.success(wasEdit ? '面试信息修改成功！' : '面试会话创建成功！')
}

const handleDelete = (id) => {
  if (window.confirm('确定要取消并删除该面试会话吗？')) {
    interviewStore.deleteInterview(id)
    ElMessage.success('面试删除成功')
  }
}
</script>

<style scoped lang="scss">
.interview-manage {
  .list-card {
    border-radius: 8px;
    border: none;
    box-shadow: 0 1px 2px -2px rgba(0,0,0,0.08), 0 3px 6px 0 rgba(0,0,0,0.04), 0 5px 12px 4px rgba(0,0,0,0.02);

    :deep(.el-card__header) {
      padding: 16px 24px;
      border-bottom: 1px solid #f0f0f0;
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
      color: #1f2937;

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
    border-bottom: 1px solid #f0f0f0;
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
    gap: 4px;
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

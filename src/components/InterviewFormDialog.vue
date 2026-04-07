<template>
  <el-dialog
    :title="`${isEditMode ? '修改' : '新增'}${form.session_type === 'online' ? '线上面试信息' : '线下面试安排'}`"
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    width="92vw"
    top="3vh"
    destroy-on-close
    class="interview-form-dialog"
  >
    <div class="dialog-layout">
      <!-- 左侧：日历视图 -->
      <div class="dialog-calendar">
        <div class="calendar-tip">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="#8f959e"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 111.5 0v3.25a.75.75 0 01-1.5 0V5zM8 11.5A.75.75 0 118 10a.75.75 0 010 1.5z"/></svg>
          <span>点击或拖拽空闲区域选择面试时间，蓝色块为已排面试</span>
        </div>
        <InterviewCalendar
          ref="calendarRef"
          :interviews="allInterviews"
          @select-slot="onSlotSelected"
        />
      </div>

      <!-- 右侧：表单 -->
      <div class="dialog-form">
        <el-form :model="form" label-position="top" size="default">
          <el-form-item label="候选人姓名" required>
            <el-input v-model="form.candidate_name" placeholder="请输入真实姓名"></el-input>
          </el-form-item>

          <el-form-item label="关联简历材料">
            <el-select v-model="form.resume_id" placeholder="-- 不关联或暂无简历 --" style="width: 100%" clearable @change="handleResumeChange">
              <el-option v-for="r in resumes" :key="r.id" :label="`${r.candidate_name || r.file_name} (ID: ${r.id})`" :value="r.id"></el-option>
            </el-select>
            <div v-if="resumes.length === 0" class="form-hint">
              提示: 当前还没有上传过简历，如需强力匹配请先去简历管理页上传。
            </div>
          </el-form-item>

          <el-form-item label="预定开始时间" required>
            <el-date-picker
              v-model="form.scheduled_start_at"
              type="datetime"
              placeholder="在日历中点选或手动输入"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%" />
          </el-form-item>
          
          <el-form-item label="预定结束时间" required>
            <el-date-picker
              v-model="form.scheduled_end_at"
              type="datetime"
              placeholder="在日历中点选或手动输入"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%" />
          </el-form-item>

          <!-- 选中的时间预览 -->
          <div v-if="form.scheduled_start_at && form.scheduled_end_at" class="time-preview">
            <div class="time-preview-label">已选择时间段</div>
            <div class="time-preview-value">
              {{ form.scheduled_start_at }} 至 {{ form.scheduled_end_at }}
            </div>
          </div>

          <el-form-item :label="form.session_type === 'online' ? '面试备注 (如: 会议链接)' : '面试备注 (如: 面试地点)'" required>
            <el-input
              v-model="form.notes"
              type="textarea"
              :rows="2"
              :placeholder="form.session_type === 'online' ? '例如: 腾讯会议链接 https://meet.tencent.com/123-456' : '例如: 深圳市南山区招聘研发中心面试间'">
            </el-input>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="$emit('update:visible', false)">取消</el-button>
        <el-button type="primary" @click="$emit('save')">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import InterviewCalendar from './calendar/InterviewCalendar.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  isEditMode: { type: Boolean, default: false },
  form: { type: Object, required: true },
  resumes: { type: Array, default: () => [] },
  /** 所有已有面试列表，用于在日历上展示占用情况 */
  allInterviews: { type: Array, default: () => [] }
})

const calendarRef = ref(null)

const handleResumeChange = (val) => {
  if (val && !props.form.candidate_name) {
    const matched = props.resumes.find(r => r.id === val)
    if (matched && matched.candidate_name) {
      props.form.candidate_name = matched.candidate_name
    }
  }
}

/**
 * 日历点选/拖拽回调 —— 自动填入起止时间
 */
const onSlotSelected = (slot) => {
  props.form.scheduled_start_at = slot.scheduledStartAt
  props.form.scheduled_end_at = slot.scheduledEndAt
}

defineEmits(['update:visible', 'save'])
</script>

<style lang="scss" scoped>
.interview-form-dialog {
  :deep(.el-dialog) {
    max-width: 1500px;
  }

  :deep(.el-dialog__body) {
    padding: 12px 24px 0;
  }
}

.dialog-layout {
  display: flex;
  gap: 24px;
  height: 75vh;
  max-height: 780px;
}

.dialog-calendar {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #f0f1f5;
  padding-right: 16px;
}

.calendar-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #8f959e;
  background: #f7f8fa;
  border-radius: 6px;
  padding: 6px 10px;
  margin-bottom: 4px;
  flex-shrink: 0;
}

.dialog-form {
  width: 320px;
  min-width: 320px;
  overflow-y: auto;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(144, 147, 153, 0.2);
    border-radius: 2px;
  }
}

.form-hint {
  font-size: 12px;
  color: #e6a23c;
  margin-top: 6px;
  line-height: 1.4;
}

.time-preview {
  background: #eef2fe;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 16px;

  .time-preview-label {
    font-size: 12px;
    color: #8f959e;
    margin-bottom: 4px;
  }

  .time-preview-value {
    font-size: 13px;
    font-weight: 600;
    color: #3370ff;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>

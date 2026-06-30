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
          :exclude-id="editingId"
          @select-slot="onSlotSelected"
        />
      </div>

      <!-- 右侧：表单 -->
      <div class="dialog-form">
        <el-form :model="form" label-position="top" size="default">
          <el-form-item label="候选人姓名" required>
            <el-input v-model="form.candidate_name" placeholder="请输入真实姓名" :disabled="!!form.resume_id"></el-input>
          </el-form-item>

          <el-form-item label="关联简历材料">
            <el-select v-model="form.resume_id" placeholder="-- 不关联或暂无简历 --" style="width: 100%" clearable filterable remote :remote-method="handleRemoteSearch" @change="handleResumeChange">
              <el-option v-for="r in displayOptions" :key="r.id" :value="r.id" :label="`${r.candidate_name} - ${r.created_at?.slice(0, 16).replace('T', ' ') || ''}`">
                <span style="flex: 1">{{ r.candidate_name }} - {{ r.created_at?.slice(0, 16).replace('T', ' ') || '' }}</span>
                <span :style="`font-size: 12px; margin-left: auto; color: ${statusColor(r.review_status)};`">{{ statusLabel(r.review_status) }}</span>
              </el-option>
            </el-select>
            <div v-if="displayOptions.length === 0" class="form-hint">
              提示: 当前还没有上传过简历，如需强力匹配请先去简历管理页上传。
            </div>
          </el-form-item>
          
          <el-form-item label="关联岗位">
            <el-select v-model="form.position_id" placeholder="-- 不关联或暂无岗位 --" style="width: 100%" clearable>
              <el-option v-for="p in positions" :key="p.id" :label="p.name" :value="p.id"></el-option>
            </el-select>
            <div v-if="positions.length === 0" class="form-hint">
              提示: 当前还没有创建岗位，请先去岗位设置页面创建。
            </div>
          </el-form-item>

          <el-form-item label="关联知识库 (问答辅助)">
            <el-select v-model="form.knowledge_id" placeholder="-- 不关联或暂无知识库 --" style="width: 100%" clearable>
              <el-option v-for="k in knowledgeBases" :key="k.id" :label="k.name" :value="k.id"></el-option>
            </el-select>
            <div v-if="knowledgeBases.length === 0" class="form-hint">
              提示: 当前还没有创建知识库，如需 AI 实时检索辅助请先去知识库模块创建。
            </div>
          </el-form-item>

          <el-form-item label="预定开始时间" required>
            <el-input
              :model-value="form.scheduled_start_at"
              placeholder="请在左侧日历中点选时间"
              disabled
            />
          </el-form-item>
          
          <el-form-item label="预计时长" required>
            <el-input
              :model-value="durationText"
              placeholder="请在左侧日历中点选时间"
              disabled
            />
          </el-form-item>

          <!-- 选中的时间预览 -->
          <div v-if="form.scheduled_start_at && form.scheduled_end_at" class="time-preview">
            <div class="time-preview-label">已选择时间段</div>
            <div class="time-preview-value">
              {{ form.scheduled_start_at }} 至 {{ form.scheduled_end_at }}
            </div>
          </div>

          <!-- <el-form-item :label="form.session_type === 'online' ? '面试备注 ' : '面试备注 '" required> -->
          <el-form-item :label="form.session_type === 'online' ? '面试备注 ' : '面试备注 '" >
            <el-input
              v-model="form.notes"
              type="textarea"
              :rows="2"
              :placeholder="form.session_type === 'online' ? '' : ''">
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
import { ref, computed, watch } from 'vue'
import InterviewCalendar from './calendar/InterviewCalendar.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  isEditMode: { type: Boolean, default: false },
  form: { type: Object, required: true },
  resumes: { type: Array, default: () => [] },
  knowledgeBases: { type: Array, default: () => [] },
  positions: { type: Array, default: () => [] },
  /** 所有已有面试列表，用于在日历上展示占用情况 */
  allInterviews: { type: Array, default: () => [] },
  /** 远程搜索简历函数，接收 keyword 返回 Promise<resume[]> */
  searchResumes: { type: Function, default: null }
})

const calendarRef = ref(null)
const searchResults = ref([])  // 远程搜索结果

// 有搜索结果时展示搜索结果，否则展示默认的 resumes（仅审核通过）
const displayOptions = computed(() => {
  return searchResults.value.length > 0 ? searchResults.value : props.resumes
})

// 初始化搜索结果为默认 resumes
watch(() => props.resumes, (val) => {
  if (val.length > 0 && searchResults.value.length === 0) {
    searchResults.value = [...val]
  }
}, { immediate: true })

/** 编辑模式下排除当前面试的 ID，新增模式为 null */
const editingId = computed(() => props.isEditMode ? props.form.id : null)

/** 计算显示的时长文本 */
const durationText = computed(() => {
  if (!props.form.scheduled_start_at || !props.form.scheduled_end_at) return ''
  // 兼容不同浏览器的日期解析
  const start = new Date(props.form.scheduled_start_at.replace(/-/g, '/'))
  const end = new Date(props.form.scheduled_end_at.replace(/-/g, '/'))
  const diffMs = end.getTime() - start.getTime()
  const diffMin = Math.round(diffMs / 60000)
  
  if (diffMin <= 0) return ''
  
  const h = Math.floor(diffMin / 60)
  const m = diffMin % 60
  if (h > 0) {
    return `${h} 小时 ${m > 0 ? m + ' 分钟' : ''}`
  }
  return `${m} 分钟`
})

const handleResumeChange = (val) => {
  if (val) {
    const matched = displayOptions.value.find(r => r.id === val)
    if (matched && matched.candidate_name) {
      props.form.candidate_name = matched.candidate_name
    }
  }
}

const handleRemoteSearch = async (query) => {
  if (!query || !query.trim()) {
    searchResults.value = []
    return
  }
  if (!props.searchResumes) return
  try {
    const results = await props.searchResumes(query.trim())
    searchResults.value = results || []
  } catch (e) {
    console.warn('远程搜索简历失败', e)
  }
}

const statusLabel = (status) => {
  const map = { PASS: '通过', PENDING: '待定', FAIL: '淘汰' }
  return map[status] || '未审核'
}

const statusColor = (status) => {
  const map = { PASS: '#13a248', PENDING: '#f59e0b', FAIL: '#f56c6c' }
  return map[status] || '#8f959e'
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

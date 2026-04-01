import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useResumeStore } from './resumeStore'

export const useInterviewStore = defineStore('interview', () => {
  // ----- State -----
  const interviews = ref([])
  const showModal = ref(false)
  const isEditMode = ref(false)
  const interviewForm = ref(createEmptyForm())

  // ----- Helpers -----
  function createEmptyForm(type = 'online') {
    return {
      id: null,
      candidate_id: '',
      resume_id: '',
      session_type: type,
      scheduled_at: '',
      extra_info: ''
    }
  }

  // ----- Actions -----
  /** 打开新增弹窗 */
  const openModal = (type) => {
    isEditMode.value = false
    interviewForm.value = createEmptyForm(type)
    showModal.value = true
  }

  /** 打开编辑弹窗 */
  const editInterview = (item) => {
    isEditMode.value = true
    interviewForm.value = {
      id: item.id,
      candidate_id: item.candidate_id,
      resume_id: item.resume_id,
      session_type: item.session_type,
      scheduled_at: item.scheduled_at || '',
      extra_info: getExtraInfo(item)
    }
    showModal.value = true
  }

  /** 关闭弹窗 */
  const closeModal = () => {
    showModal.value = false
  }

  /** 保存面试（新增或编辑） */
  const saveInterview = (currentUserId) => {
    const extraKey = interviewForm.value.session_type === 'online' ? 'meeting_url' : 'location'
    const parsedNotes = JSON.stringify({ [extraKey]: interviewForm.value.extra_info })
    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ')

    if (isEditMode.value) {
      const target = interviews.value.find(i => i.id === interviewForm.value.id)
      if (target) {
        target.candidate_id = interviewForm.value.candidate_id
        target.resume_id = interviewForm.value.resume_id
        target.scheduled_at = interviewForm.value.scheduled_at
        target.notes = parsedNotes
        target.updated_at = nowStr
      }
    } else {
      const newInterview = {
        id: Date.now(),
        candidate_id: interviewForm.value.candidate_id,
        recruiter_id: currentUserId,
        resume_id: interviewForm.value.resume_id || 0,
        session_type: interviewForm.value.session_type,
        status: 'scheduled',
        scheduled_at: interviewForm.value.scheduled_at,
        started_at: null,
        ended_at: null,
        notes: parsedNotes,
        created_at: nowStr,
        updated_at: nowStr
      }
      interviews.value.unshift(newInterview)
    }
    showModal.value = false
  }

  /** 删除面试 */
  const deleteInterview = (id) => {
    interviews.value = interviews.value.filter(i => i.id !== id)
  }

  /** 解析面试附加信息（会议链接 / 地点） */
  const getExtraInfo = (item) => {
    if (!item.notes) return ''
    try {
      const obj = JSON.parse(item.notes)
      return item.session_type === 'online' ? (obj.meeting_url || '') : (obj.location || '')
    } catch {
      return item.notes
    }
  }

  /** 格式化时间 */
  const formatTime = (str) => {
    if (!str) return '未定'
    return str.replace('T', ' ')
  }

  return {
    interviews,
    showModal,
    isEditMode,
    interviewForm,
    openModal,
    editInterview,
    closeModal,
    saveInterview,
    deleteInterview,
    getExtraInfo,
    formatTime
  }
})

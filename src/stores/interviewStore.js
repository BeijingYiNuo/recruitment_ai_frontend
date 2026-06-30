import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useInterviewStore = defineStore('interview', () => {
  // ========== 列表缓存 ==========
  const interviews = ref([])
  const cachedSessionTotal = ref(0)
  const sessionListLastFetchTime = ref(0)
  const SESSION_LIST_CACHE_TTL = 30000 // 30 秒

  // ========== 详情缓存 ==========
  // key: sessionId, value: { data, cachedAt }
  const sessionDetailCache = reactive({})
  const SESSION_DETAIL_CACHE_TTL = 300000 // 5 分钟

  // ========== 弹窗状态 ==========
  const showModal = ref(false)
  const isEditMode = ref(false)
  const interviewForm = ref(createEmptyForm())

  // ----- 带缓存的获取面试列表 -----
  const getCachedSessions = async (fetchFn) => {
    const now = Date.now()
    if (now - sessionListLastFetchTime.value < SESSION_LIST_CACHE_TTL && interviews.value.length > 0) {
      return { items: interviews.value, total: cachedSessionTotal.value }
    }
    const result = await fetchFn()
    interviews.value = result.items
    cachedSessionTotal.value = result.total
    sessionListLastFetchTime.value = now
    return result
  }

  // ----- 带缓存的获取面试详情 -----
  const getCachedSessionDetail = async (sessionId, fetchFn) => {
    const now = Date.now()
    const cached = sessionDetailCache[sessionId]
    if (cached && now - cached.cachedAt < SESSION_DETAIL_CACHE_TTL) {
      return cached.data
    }
    const data = await fetchFn()
    sessionDetailCache[sessionId] = { data, cachedAt: now }
    return data
  }

  // ----- 清除面试缓存（增删改后调用） -----
  const invalidateSessionCache = () => {
    sessionListLastFetchTime.value = 0
    Object.keys(sessionDetailCache).forEach(k => delete sessionDetailCache[k])
  }

  // ----- Helpers -----
  function createEmptyForm(type = 'online') {
    return {
      id: null,
      session_type: type,
      candidate_name: '',
      resume_id: null,
      position_id: null,
      scheduled_start_at: '',
      scheduled_end_at: '',
      notes: '',
      knowledge_id: null,
      session_id: null
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
      candidate_name: item.candidate_name,
      // 将后端返回的 0 转换为 null 以便 el-select 显示占位符
      resume_id: item.resume_id || null,
      position_id: item.position_id || null,
      session_type: item.session_type,
      scheduled_start_at: item.scheduled_start_at ? item.scheduled_start_at.substring(0, 19).replace('T', ' ') : '',
      scheduled_end_at: item.scheduled_end_at ? item.scheduled_end_at.substring(0, 19).replace('T', ' ') : '',
      notes: item.notes || '',
      knowledge_id: item.knowledge_id || null
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
        updated_at: nowStr,
        session_id: null
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

  /** 更新 session_id */
  const setSessionId = (id, sessionId) => {
    const target = interviews.value.find(i => i.id === id)
    if (target) {
      target.session_id = sessionId
      target.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ')
    }
  }

  return {
    interviews,
    showModal,
    isEditMode,
    interviewForm,
    cachedSessionTotal,
    sessionListLastFetchTime,
    sessionDetailCache,
    getCachedSessions,
    getCachedSessionDetail,
    invalidateSessionCache,
    openModal,
    editInterview,
    closeModal,
    saveInterview,
    deleteInterview,
    getExtraInfo,
    formatTime,
    setSessionId
  }
})

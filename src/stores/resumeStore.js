import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useResumeStore = defineStore('resume', () => {
  // ========== 列表缓存 ==========
  const resumes = ref([])
  const totalCount = ref(0)
  const selectedResume = ref(null)
  const lastFetchTime = ref(0)
  const LIST_CACHE_TTL = 30000 // 30 秒

  // ========== 详情缓存 ==========
  const detailCache = reactive({})
  const DETAIL_CACHE_TTL = 60000 // 60 秒

  // ========== 专项缓存（教育/工作/技能/项目） ==========
  // key: `${resumeId}:${type}`, value: { data, cachedAt }
  const sectionCache = reactive({})
  const SECTION_CACHE_TTL = 120000 // 2 分钟

  // ----- 带缓存的获取列表（fetchFn 需返回 { items, total }）-----
  const getCachedResumes = async (fetchFn) => {
    const now = Date.now()
    if (now - lastFetchTime.value < LIST_CACHE_TTL && resumes.value.length > 0) {
      return { items: resumes.value, total: totalCount.value }
    }
    const result = await fetchFn()
    resumes.value = result.items
    totalCount.value = result.total
    lastFetchTime.value = now
    return result
  }

  // ----- 带缓存的获取详情 -----
  const getCachedDetail = async (id, fetchFn) => {
    const now = Date.now()
    const cached = detailCache[id]
    if (cached && now - cached.cachedAt < DETAIL_CACHE_TTL) {
      selectedResume.value = cached.data
      return cached.data
    }
    const data = await fetchFn()
    detailCache[id] = { data, cachedAt: now }
    selectedResume.value = data
    return data
  }

  // ----- 带缓存的获取专项数据 -----
  const getCachedSection = async (resumeId, type, fetchFn) => {
    const key = `${resumeId}:${type}`
    const now = Date.now()
    const cached = sectionCache[key]
    if (cached && now - cached.cachedAt < SECTION_CACHE_TTL) {
      return cached.data
    }
    const data = await fetchFn()
    sectionCache[key] = { data, cachedAt: now }
    return data
  }

  // ----- 清除缓存（增删改后调用） -----
  const invalidateCache = (resumeId) => {
    lastFetchTime.value = 0
    if (resumeId) {
      delete detailCache[resumeId]
      // 清理该简历的专项缓存
      Object.keys(sectionCache).forEach(k => {
        if (k.startsWith(`${resumeId}:`)) delete sectionCache[k]
      })
    } else {
      Object.keys(detailCache).forEach(k => delete detailCache[k])
      Object.keys(sectionCache).forEach(k => delete sectionCache[k])
    }
  }

  // ----- 原有方法 -----
  const setResumes = (list) => {
    resumes.value = list
  }

  const addResume = (resume) => {
    resumes.value.unshift(resume)
  }

  const deleteResume = (id) => {
    resumes.value = resumes.value.filter(r => r.id !== id)
    delete detailCache[id]
    if (selectedResume.value && selectedResume.value.id === id) {
      selectedResume.value = null
    }
  }

  const selectResume = (resume) => {
    selectedResume.value = resume
  }

  const clearSelection = () => {
    selectedResume.value = null
  }

  return {
    resumes,
    totalCount,
    selectedResume,
    lastFetchTime,
    detailCache,
    getCachedResumes,
    getCachedDetail,
    getCachedSection,
    invalidateCache,
    setResumes,
    addResume,
    deleteResume,
    selectResume,
    clearSelection
  }
})

import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const usePositionStore = defineStore('position', () => {
  // ========== 列表缓存 ==========
  const positions = ref([])
  const totalCount = ref(0)
  const lastFetchTime = ref(0)
  const LIST_CACHE_TTL = 300000 // 5 分钟

  // ========== 轮次缓存 ==========
  // key: positionId, value: { data, cachedAt }
  const roundsCache = reactive({})
  const ROUNDS_CACHE_TTL = 300000 // 5 分钟

  // ----- 带缓存的获取岗位列表 -----
  const getCachedPositions = async (fetchFn) => {
    const now = Date.now()
    if (now - lastFetchTime.value < LIST_CACHE_TTL && positions.value.length > 0) {
      return { items: positions.value, total: totalCount.value }
    }
    const result = await fetchFn()
    positions.value = result.items
    totalCount.value = result.total
    lastFetchTime.value = now
    return result
  }

  // ----- 带缓存的获取轮次 -----
  const getCachedRounds = async (positionId, fetchFn) => {
    const now = Date.now()
    const cached = roundsCache[positionId]
    if (cached && now - cached.cachedAt < ROUNDS_CACHE_TTL) {
      return cached.data
    }
    const data = await fetchFn()
    roundsCache[positionId] = { data, cachedAt: now }
    return data
  }

  // ----- 清除缓存（增删改后调用） -----
  const invalidateCache = () => {
    lastFetchTime.value = 0
    Object.keys(roundsCache).forEach(k => delete roundsCache[k])
  }

  return {
    positions,
    totalCount,
    lastFetchTime,
    roundsCache,
    getCachedPositions,
    getCachedRounds,
    invalidateCache
  }
})

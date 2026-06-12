import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useKnowledgeStore = defineStore('knowledge', () => {
  // ========== 列表缓存 ==========
  const collections = ref([])
  const lastFetchTime = ref(0)
  const LIST_CACHE_TTL = 300000 // 5 分钟

  // ========== 详情缓存 ==========
  // key: collectionName, value: { data, cachedAt }
  const detailCache = {}
  const DETAIL_CACHE_TTL = 300000 // 5 分钟

  // ----- 带缓存的获取知识库列表 -----
  const getCachedCollections = async (fetchFn) => {
    const now = Date.now()
    if (now - lastFetchTime.value < LIST_CACHE_TTL && collections.value.length > 0) {
      return collections.value
    }
    const data = await fetchFn()
    collections.value = data
    lastFetchTime.value = now
    return data
  }

  // ----- 带缓存的获取知识库详情 -----
  const getCachedCollectionInfo = async (name, fetchFn) => {
    const now = Date.now()
    const cached = detailCache[name]
    if (cached && now - cached.cachedAt < DETAIL_CACHE_TTL) {
      return cached.data
    }
    const data = await fetchFn()
    detailCache[name] = { data, cachedAt: now }
    return data
  }

  // ----- 清除缓存 -----
  const invalidateCache = () => {
    lastFetchTime.value = 0
    Object.keys(detailCache).forEach(k => delete detailCache[k])
  }

  return {
    collections,
    lastFetchTime,
    detailCache,
    getCachedCollections,
    getCachedCollectionInfo,
    invalidateCache
  }
})

/**
 * IndexedDB 预览缓存工具
 * 用于预览缓存，按文件名或 resumeId 存取文件 blob
 */

const DB_NAME = 'ResumeFileCache'
const DB_VERSION = 3
const PREVIEW_STORE = 'previewCache'

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      // 删除旧版 staging store
      if (db.objectStoreNames.contains('files')) {
        db.deleteObjectStore('files')
      }
      if (!db.objectStoreNames.contains(PREVIEW_STORE)) {
        db.createObjectStore(PREVIEW_STORE, { keyPath: 'name' })
      }
    }
    request.onsuccess = (event) => resolve(event.target.result)
    request.onerror = (event) => reject(event.target.error)
  })
}

export const fileCacheDB = {
  // ====== 预览缓存区 ======

  /** 上传成功后保存到预览缓存，key 为文件名 */
  async savePreviewFiles(files) {
    const db = await openDB()
    const tx = db.transaction(PREVIEW_STORE, 'readwrite')
    const store = tx.objectStore(PREVIEW_STORE)
    for (const file of files) {
      await new Promise((resolve, reject) => {
        const req = store.put({
          name: file.name,
          blob: file.blob || file,
          type: file.type,
          cachedAt: Date.now()
        })
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })
    }
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve
      tx.onerror = reject
    })
    db.close()
  },

  /** 按文件名从预览缓存读取文件 blob */
  async getPreviewFile(name) {
    const db = await openDB()
    const tx = db.transaction(PREVIEW_STORE, 'readonly')
    const store = tx.objectStore(PREVIEW_STORE)
    const item = await new Promise((resolve, reject) => {
      const req = store.get(name)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    db.close()
    return item
  },

  /** 按 resumeId 保存到预览缓存 */
  async savePreviewById(resumeId, blob, type = '') {
    const db = await openDB()
    const tx = db.transaction(PREVIEW_STORE, 'readwrite')
    const store = tx.objectStore(PREVIEW_STORE)
    await new Promise((resolve, reject) => {
      const req = store.put({
        name: `byId:${resumeId}`,
        blob: blob,
        type: type,
        cachedAt: Date.now()
      })
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
    db.close()
  },

  /** 按 resumeId 从预览缓存读取文件 blob */
  async getPreviewById(resumeId) {
    const db = await openDB()
    const tx = db.transaction(PREVIEW_STORE, 'readonly')
    const store = tx.objectStore(PREVIEW_STORE)
    const item = await new Promise((resolve, reject) => {
      const req = store.get(`byId:${resumeId}`)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    db.close()
    return item
  },

  /** 清空预览缓存 */
  async clearPreviewCache() {
    const db = await openDB()
    const tx = db.transaction(PREVIEW_STORE, 'readwrite')
    const store = tx.objectStore(PREVIEW_STORE)
    await new Promise((resolve, reject) => {
      const req = store.clear()
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
    db.close()
  }
}

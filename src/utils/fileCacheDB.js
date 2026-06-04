/**
 * IndexedDB 文件缓存工具
 * 用于批量导入简历时，先将文件缓存到浏览器，用户确认后再上传后端
 */

const DB_NAME = 'ResumeFileCache'
const DB_VERSION = 2
const STAGING_STORE = 'files'
const PREVIEW_STORE = 'previewCache'

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STAGING_STORE)) {
        const store = db.createObjectStore(STAGING_STORE, { keyPath: 'id', autoIncrement: true })
        store.createIndex('name', 'name', { unique: false })
        store.createIndex('cachedAt', 'cachedAt', { unique: false })
      }
      if (!db.objectStoreNames.contains(PREVIEW_STORE)) {
        // name 作为主键（同一文件名唯一），避免重复缓存
        db.createObjectStore(PREVIEW_STORE, { keyPath: 'name' })
      }
    }
    request.onsuccess = (event) => resolve(event.target.result)
    request.onerror = (event) => reject(event.target.error)
  })
}

export const fileCacheDB = {
  // ====== 批量上传前的暂存区（staging） ======

  /** 保存文件列表到 IndexedDB，返回新记录的 id 列表 */
  async saveFiles(files) {
    const db = await openDB()
    const tx = db.transaction(STAGING_STORE, 'readwrite')
    const store = tx.objectStore(STAGING_STORE)
    const ids = []
    for (const file of files) {
      const result = await new Promise((resolve, reject) => {
        const req = store.add({
          name: file.name,
          size: file.size,
          type: file.type,
          blob: file,
          cachedAt: Date.now()
        })
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
      ids.push(result)
    }
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve
      tx.onerror = reject
    })
    db.close()
    return ids
  },

  /** 获取所有已缓存文件列表（不含 blob 数据） */
  async getFileList() {
    const db = await openDB()
    const tx = db.transaction(STAGING_STORE, 'readonly')
    const store = tx.objectStore(STAGING_STORE)
    const all = await new Promise((resolve, reject) => {
      const req = store.getAll()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    db.close()
    return all.map(item => ({
      id: item.id,
      name: item.name,
      size: item.size,
      type: item.type,
      cachedAt: item.cachedAt
    }))
  },

  /** 获取单个文件的完整数据（含 blob） */
  async getFile(id) {
    const db = await openDB()
    const tx = db.transaction(STAGING_STORE, 'readonly')
    const store = tx.objectStore(STAGING_STORE)
    const item = await new Promise((resolve, reject) => {
      const req = store.get(id)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    db.close()
    return item
  },

  /** 获取所有文件的完整数据（含 blob） */
  async getAllFiles() {
    const db = await openDB()
    const tx = db.transaction(STAGING_STORE, 'readonly')
    const store = tx.objectStore(STAGING_STORE)
    const all = await new Promise((resolve, reject) => {
      const req = store.getAll()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    db.close()
    return all
  },

  /** 删除单个缓存文件 */
  async removeFile(id) {
    const db = await openDB()
    const tx = db.transaction(STAGING_STORE, 'readwrite')
    const store = tx.objectStore(STAGING_STORE)
    await new Promise((resolve, reject) => {
      const req = store.delete(id)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
    db.close()
  },

  /** 清空所有暂存区缓存 */
  async clearAll() {
    const db = await openDB()
    const tx = db.transaction(STAGING_STORE, 'readwrite')
    const store = tx.objectStore(STAGING_STORE)
    await new Promise((resolve, reject) => {
      const req = store.clear()
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
    db.close()
  },

  /** 获取暂存区缓存的文件数量 */
  async count() {
    const db = await openDB()
    const tx = db.transaction(STAGING_STORE, 'readonly')
    const store = tx.objectStore(STAGING_STORE)
    const count = await new Promise((resolve, reject) => {
      const req = store.count()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    db.close()
    return count
  },

  // ====== 预览缓存区（上传后保留，供直接预览） ======

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

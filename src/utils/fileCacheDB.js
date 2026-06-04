/**
 * IndexedDB 文件缓存工具
 * 用于批量导入简历时，先将文件缓存到浏览器，用户确认后再上传后端
 */

const DB_NAME = 'ResumeFileCache'
const DB_VERSION = 1
const STORE_NAME = 'files'

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
        store.createIndex('name', 'name', { unique: false })
        store.createIndex('cachedAt', 'cachedAt', { unique: false })
      }
    }
    request.onsuccess = (event) => resolve(event.target.result)
    request.onerror = (event) => reject(event.target.error)
  })
}

export const fileCacheDB = {
  /** 保存文件列表到 IndexedDB，返回新记录的 id 列表 */
  async saveFiles(files) {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
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
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
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
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
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
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
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
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    await new Promise((resolve, reject) => {
      const req = store.delete(id)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
    db.close()
  },

  /** 清空所有缓存 */
  async clearAll() {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    await new Promise((resolve, reject) => {
      const req = store.clear()
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
    db.close()
  },

  /** 获取缓存的文件数量 */
  async count() {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const count = await new Promise((resolve, reject) => {
      const req = store.count()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    db.close()
    return count
  }
}

import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'

// ====== 模块级队列（单例）======

const _queue = []
let _processing = false

function _next() {
  if (_queue.length === 0) {
    _processing = false
    return
  }
  _processing = true
  const { type, opts } = _queue.shift()
  if (type === 'message') {
    ElMessage(opts)
  } else {
    ElNotification(opts)
  }
  setTimeout(_next, 350)
}

function _enqueue(type, opts) {
  _queue.push({ type, opts })
  if (!_processing) _next()
}

/**
 * 统一通知队列 composable
 *
 * 所有组件的弹窗共享同一个队列，按序展示，避免重叠。
 *
 * 用法：
 *   const { msgSuccess, msgError, notify, confirm } = useNotify()
 *   msgSuccess('操作成功')
 *   notify({ title: '提示', message: '内容', type: 'warning' })
 *   confirm('确认删除？', '提示').then(() => { ... })
 */
export function useNotify() {
  return {
    // ---- ElMessage 快捷方法 ----
    msgSuccess: (msg) => _enqueue('message', { message: msg, type: 'success' }),
    msgError: (msg) => _enqueue('message', { message: msg, type: 'error' }),
    msgWarning: (msg) => _enqueue('message', { message: msg, type: 'warning' }),
    msgInfo: (msg) => _enqueue('message', { message: msg, type: 'info' }),

    // ---- ElNotification 快捷方法 ----
    notify: (opts) => _enqueue('notification', opts),
    notifySuccess: (title, msg) =>
      _enqueue('notification', { title, message: msg, type: 'success' }),
    notifyError: (title, msg) =>
      _enqueue('notification', { title, message: msg, type: 'error' }),
    notifyWarning: (title, msg) =>
      _enqueue('notification', { title, message: msg, type: 'warning' }),

    // ---- ElMessageBox（不排队，直接调用） ----
    confirm: ElMessageBox.confirm,
    alert: ElMessageBox.alert,
    prompt: ElMessageBox.prompt,
  }
}

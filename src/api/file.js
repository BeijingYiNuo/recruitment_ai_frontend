import request from '../utils/request'

export const fileApi = {
  // 获取文件列表（支持搜索和分页）
  getFileList: (params = {}) => request.get('/file/list', { params }),

  // 上传文件
  uploadFile: (formData) => request.post('/file/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),

  // 下载文件
  downloadFile: (fileId) => {
    return request.get('/file/download', {
      params: { file_id: fileId },
      responseType: 'blob'
    })
  },

  // 删除文件
  deleteFile: (fileId) => request.delete(`/file/delete?file_id=${fileId}`),

  // 删除会话文件夹下的所有文件
  deleteBySession: (sessionId) => request.delete(`/file/delete-by-session?session_id=${sessionId}`)
}

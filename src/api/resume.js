import request from '../utils/request'

export const resumeApi = {
  // 导入简历
  uploadResume: (userId, file) => {
    const formData = new FormData()
    formData.append('file', file)

    return request.post(`/resumes/import?user_id=${2}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 获取简历
  getResumes: (skip = 0, limit = 100) => {
    return request.get('/resumes/', { params: { skip, limit } })
  },

  // 获取特定用户简历
  getUserResumes: (userId) => {
    return request.get(`/resumes/${userId}`)
  },

  // 删除指定用户简历
  deleteUserResumes: (userId) => {
    return request.delete(`/resumes/${userId}`)
  }
}

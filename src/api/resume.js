import request from '../utils/request'

export const resumeApi = {
  // 导入简历
  uploadResume: (userId, file) => {
    const formData = new FormData()
    formData.append('file', file)

    return request.post(`/resumes/import?user_id=${userId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 120000
    })
  },

  // 获取简历（支持按审核状态、搜索关键字、时间范围筛选和分页）
  getResumes: (skip = 0, limit = 100, reviewStatus = null, keyword = '', startTime = '', endTime = '') => {
    const params = { skip, limit }
    if (reviewStatus !== null) {
      params.review_status = reviewStatus
    }
    if (keyword) {
      params.keyword = keyword
    }
    if (startTime) {
      params.start_time = startTime
    }
    if (endTime) {
      params.end_time = endTime
    }
    return request.get('/resumes', { params })
  },

  // 获取特定用户列表简历 (原接口)
  getUserResumes: (userId) => {
    return request.get(`/resumes/${userId}`)
  },

  // 获取详尽简历内容数据
  getResumeDetail: (resumeId) => {
    return request.get(`/resumes/${resumeId}`)
  },

  getResumeEducations: (resumeId) => request.get(`/resumes/${resumeId}/educations`),
  getResumeWorkExperiences: (resumeId) => request.get(`/resumes/${resumeId}/work-experiences`),
  getResumeSkills: (resumeId) => request.get(`/resumes/${resumeId}/skills`),
  getResumeProjects: (resumeId) => request.get(`/resumes/${resumeId}/projects`),

  // 下载简历原始文件
  downloadResume: (resumeId) => {
    return request.get(`/resumes/download/${resumeId}`, {
      responseType: 'blob'
    })
  },

  // 审核简历
  reviewResume: (resumeId, data) => {
    return request.post(`/resumes/${resumeId}/review`, data)
  },

  // 批量导入简历
  batchImportLocal: (files) => {
    const formData = new FormData()
    for (const file of files) {
      formData.append('files', file)
    }
    return request.post('/resumes/batch/import-local', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 180000
    })
  },

  // 彻底删除单份简历
  deleteResume: (resumeId) => {
    return request.delete(`/resumes/${resumeId}`)
  },

  // 编辑简历详情（候选人姓名 + 教育/工作/技能/项目）
  updateResumeDetails: (resumeId, data) => {
    return request.put(`/resumes/${resumeId}/details`, data)
  },

  // 重新解析简历
  reparseResume: (resumeId) => {
    return request.post(`/resumes/${resumeId}/reparse`)
  }
}

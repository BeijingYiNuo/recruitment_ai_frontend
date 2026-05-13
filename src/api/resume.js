import request from '../utils/request'

export const resumeApi = {
  // 导入简历
  uploadResume: (userId, candidateName, file) => {
    const formData = new FormData()
    formData.append('file', file)

    return request.post(`/resumes/import?user_id=${userId}&candidate_name=${encodeURIComponent(candidateName)}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 获取简历（支持按审核状态筛选）
  getResumes: (skip = 0, limit = 100, reviewStatus = null) => {
    const params = { skip, limit }
    if (reviewStatus !== null) {
      params.review_status = reviewStatus
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
  batchUploadResumes: (userId, files, candidateNames) => {
    const formData = new FormData()
    for (const file of files) {
      formData.append('files', file)
    }
    formData.append('candidate_names', JSON.stringify(candidateNames))
    return request.post(`/resumes/import/batch?user_id=${userId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 彻底删除单份简历
  deleteResume: (resumeId) => {
    return request.delete(`/resumes/${resumeId}`)
  }
}

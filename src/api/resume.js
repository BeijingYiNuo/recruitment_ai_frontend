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

  // 获取简历
  getResumes: (skip = 0, limit = 100) => {
    return request.get('/resumes/', { params: { skip, limit } })
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

  // 彻底删除单份简历
  deleteResume: (resumeId) => {
    return request.delete(`/resumes/${resumeId}`)
  }
}

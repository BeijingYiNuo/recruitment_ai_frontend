import request from '../utils/request'

// ── 简历预览内存缓存 ──
// Chrome XHR + responseType: 'blob' 不参与 HTTP 缓存，无法使用 304 协商缓存
// 此处用 Map 做模块级内存缓存，相同 resumeId 第二次调用直接返回缓存的 Blob
const previewCache = new Map()

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

  // 预览简历（走内存缓存，第二次访问秒开）
  previewResume: (resumeId) => {
    // 命中缓存 → 直接返回
    const cached = previewCache.get(resumeId)
    if (cached) return Promise.resolve(cached)

    const token = localStorage.getItem('token')
    return request.get(`/resumes/preview/${resumeId}`, {
      params: { token },
      responseType: 'blob',
      timeout: 60000 // 大 PDF 传输慢，给够 60s
    }).then(blob => {
      previewCache.set(resumeId, blob)
      return blob
    })
  },

  // 清除指定简历的预览缓存
  clearPreviewCache: (resumeId) => {
    if (resumeId !== undefined) {
      previewCache.delete(resumeId)
    } else {
      previewCache.clear()
    }
  },

  // 审核简历
  reviewResume: (resumeId, data) => {
    return request.post(`/resumes/${resumeId}/review`, data)
  },

  // 重置为待审核
  unreviewResume: (resumeId) => {
    return request.post(`/resumes/${resumeId}/unreview`)
  },

  // 设置简历关联岗位
  setResumePosition: (resumeId, positionId) => {
    return request.put(`/resumes/${resumeId}/position`, { position_id: positionId })
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

  // 批量删除简历
  batchDeleteResumes: (ids) => {
    return request.post('/resumes/batch/delete', { ids })
  },

  // 编辑简历详情（候选人姓名 + 教育/工作/技能/项目）
  updateResumeDetails: (resumeId, data) => {
    return request.put(`/resumes/${resumeId}/details`, data)
  },

  // 重新解析简历
  reparseResume: (resumeId) => {
    return request.post(`/resumes/${resumeId}/reparse`)
  },

  // AI 辅助审核简历
  aiReviewResume: (resumeId, data) => {
    return request.post(`/resumes/${resumeId}/ai-review`, data)
  },

  // 批量 AI 审核简历
  batchAiReviewResume: (data) => {
    return request.post('/resumes/ai-review/batch', data, {
      timeout: 300000
    })
  },

  // 生成/获取面试提问问题
  generateInterviewQuestions: (resumeId, instruction = '') => {
    return request.post(`/resumes/${resumeId}/interview-questions`, { instruction }, {
      timeout: 60000
    })
  },

  // 流式生成面试提问问题 - 启动
  startInterviewQuestionsStream: (resumeId, instruction = '') => {
    return request.post(`/resumes/${resumeId}/interview-questions/stream`, { instruction })
  },

  // 读取缓存的面试问题（不触发生成）
  getCachedInterviewQuestions: (resumeId) => {
    return request.get(`/resumes/${resumeId}/interview-questions/cache`)
  },

  // 流式控制 - 暂停
  pauseStream: (streamId) => request.post(`/stream/${streamId}/pause`),

  // 流式控制 - 继续
  resumeStream: (streamId) => request.post(`/stream/${streamId}/resume`),

  // 流式控制 - 取消
  cancelStream: (streamId) => request.post(`/stream/${streamId}/cancel`),

  // 预热所有简历的本地缓存（后台执行，不阻塞）
  precacheResumes: () => request.post('/resumes/precache'),

  // 暴露内存缓存，供外部检查是否已缓存
  previewCache
}

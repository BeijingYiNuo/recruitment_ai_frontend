import request from '../utils/request'

export const resumeApi = {
  // Hash 去重：上传前批量检查文件是否已存在
  checkExist: (hashes) => {
    return request.post('/resumes/upload/check-exist', { hashes })
  },

  // 导入简历（单个和批量共用）
  // processingMode: 'bg_task' = 进程内解析（单个导入）/ 'task_queue' = Worker 解析（批量导入）
  uploadResume: (userId, file, { fileHash, processingMode = 'bg_task', onProgress } = {}) => {
    const formData = new FormData()
    formData.append('file', file)
    if (fileHash) {
      formData.append('file_hash', fileHash)
    }

    return request.post(`/resumes/import?user_id=${userId}&processing_mode=${processingMode}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 180000,
      onUploadProgress: onProgress
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
    return request.get('/resumes', { params, timeout: 30000, _skipGlobalError: true })
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

  // 重置为待审核
  unreviewResume: (resumeId) => {
    return request.post(`/resumes/${resumeId}/unreview`)
  },

  // 保存审核备注（不改变审核状态）
  saveRemark: (resumeId, comment) => {
    return request.patch(`/resumes/${resumeId}/remark`, { comment })
  },

  // 设置简历关联岗位
  setResumePosition: (resumeId, positionId) => {
    return request.put(`/resumes/${resumeId}/position`, { position_id: positionId })
  },

  // 批量导入简历（多文件打包一个请求 → Worker 并行解析）
  batchImportLocal: (files, hashes, onProgress) => {
    const formData = new FormData()
    for (const file of files) {
      formData.append('files', file)
    }
    if (hashes && hashes.length > 0) {
      formData.append('hashes', JSON.stringify(hashes))
    }
    return request.post('/resumes/batch/import-local', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000,
      onUploadProgress: onProgress
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
}

import request from '../utils/request'

export const interviewApi = {
  // 获取用户的预约面试列表（支持搜索和分页）
  getUserInterviewSessions: (params = {}) => request.get('/reserve/sessions', { params }),

  // 获取单一预约面试详情
  getReserveSession: (sessionId) => request.get(`/reserve/sessions/${sessionId}`),

  // 预约新建面试
  reserveSession: (data) => request.post('/reserve/sessions', data),

  // 修改预约面试
  updateReserveSession: (sessionId, data) => request.put(`/reserve/sessions/${sessionId}`, data),

  // 取消/删除预约面试
  deleteReserveSession: (sessionId) => request.delete(`/reserve/sessions/${sessionId}`),

  // 创建新会话
  createSession: () => request.post('/sessions'),

  // 获取所有会话列表
  getSessions: () => request.get('/sessions'),

  // 获取单个会话详情
  getSession: (sessionId) => request.get(`/sessions/${sessionId}`),

  // 启动 ASR 语音识别 (基于 Session ID + Round ID)
  startASR: (sessionId, roundId, data) => request.post(`/asr/start/${sessionId}/${roundId}`, data),

  // 停止 ASR 语音识别
  stopASR: (sessionId, roundId) => request.post(`/asr/stop/${sessionId}/${roundId}`),

  // ====== 面试轮次状态 ======

  // 获取面试会话的所有轮次
  getSessionRounds: (sessionId) => request.get(`/reserve/sessions/${sessionId}/rounds`),

  // 更新面试轮次状态
  updateSessionRound: (sessionId, roundId, data) => request.patch(`/reserve/sessions/${sessionId}/rounds/${roundId}`, data),

  // 更新面试备注
  updateSessionNotes: (sessionId, data) => request.patch(`/reserve/sessions/${sessionId}/notes`, data),

  // 同步面试轮次（与岗位最新设置对齐）
  syncSessionRounds: (sessionId) => request.post(`/reserve/sessions/${sessionId}/sync-rounds`),

  // ====== 面试阶段控制 ======

  // 手动切换当前面试阶段
  manualStageTransition: (sessionId, roundId, data) => request.post(`/asr/stage/transition/${sessionId}/${roundId}`, data),

  // 手动触发 AI 分析（对最近对话生成追问建议和评价）
  manualTriggerAnalysis: (sessionId, roundId) => request.post(`/asr/analyze/manual/${sessionId}/${roundId}`, {}),

  // ====== 面试报告 ======

  // 获取候选人分组报告列表（文件夹根视图）
  getReportCandidateGroups: (params = {}) => request.get('/interviews/reports/candidate-groups', { params }),

  // 按候选人获取所有面试 session 及其报告状态
  getReportsByCandidate: (name) => request.get('/interviews/reports/by-candidate', { params: { name } }),

  // 获取会话的面试报告（含结构化数据）
  getReportBySession: (sessionId, params = {}) => request.get(`/interviews/reports/session/${sessionId}`, { params }),

  // 触发 AI 生成面试报告
  generateReport: (sessionId, params = {}) => request.post(`/interviews/reports/generate/${sessionId}`, null, { params }),

  // 更新面试报告内容
  updateReport: (reportId, data) => request.put(`/interviews/reports/${reportId}`, data),
}

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

  // 同步面试轮次（与岗位最新设置对齐）
  syncSessionRounds: (sessionId) => request.post(`/reserve/sessions/${sessionId}/sync-rounds`)
}

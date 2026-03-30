import request from '../utils/request'

export const interviewApi = {
  // 创建新会话
  createSession: () => request.post('/sessions'),
  
  // 获取所有会话列表
  getSessions: () => request.get('/sessions'),
  
  // 获取单个会话详情
  getSession: (sessionId) => request.get(`/sessions/${sessionId}`),
  
  // 启动 ASR 语音识别
  startASR: (sessionId, data) => request.post(`/asr/start/${sessionId}`, data),
  
  // 停止 ASR 语音识别
  stopASR: (sessionId) => request.post(`/asr/stop/${sessionId}`)
}

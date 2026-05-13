import request from '../utils/request'

export const positionApi = {
  // 岗位列表
  list: () => {
    return request.get('/positions')
  },

  // 岗位详情（含轮次）
  get: (id) => {
    return request.get(`/positions/${id}`)
  },

  // 创建岗位（可附带轮次）
  create: (data) => {
    return request.post('/positions', data)
  },

  // 更新岗位
  update: (id, data) => {
    return request.put(`/positions/${id}`, data)
  },

  // 删除岗位
  delete: (id) => {
    return request.delete(`/positions/${id}`)
  },

  // ====== 面试轮次 ======

  // 获取轮次列表
  listRounds: (positionId) => {
    return request.get(`/positions/${positionId}/rounds`)
  },

  // 新增轮次
  createRound: (positionId, data) => {
    return request.post(`/positions/${positionId}/rounds`, data)
  },

  // 更新轮次
  updateRound: (positionId, roundId, data) => {
    return request.put(`/positions/${positionId}/rounds/${roundId}`, data)
  },

  // 删除轮次
  deleteRound: (positionId, roundId) => {
    return request.delete(`/positions/${positionId}/rounds/${roundId}`)
  },

  // 重排轮次顺序
  reorderRounds: (positionId, roundIds) => {
    return request.put(`/positions/${positionId}/rounds/reorder`, { round_ids: roundIds })
  }
}

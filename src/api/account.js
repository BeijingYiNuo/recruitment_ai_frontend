import request from '../utils/request'

export const accountApi = {
  // 查询余额
  getBalance: () => request.get('/account/balance'),

  // 查询交易记录
  getTransactions: (params) => request.get('/account/transactions', { params }),

  // 创建充值订单
  createRecharge: (data) => request.post('/payment/recharge', data),

  // 查询订单状态（前端轮询）
  getOrderStatus: (orderNo) => request.get(`/payment/orders/${orderNo}/status`),

  // 查询服务定价
  getPricing: () => request.get('/pricing'),
}

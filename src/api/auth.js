import request from '../utils/request'

export const authApi = {
  // 注册接口
  register: (userData) => request.post('/users', userData),

  // 登录接口
  login: (credentials) => request.post('/users/login', credentials),

  // 忘记密码接口
  forgotPassword: (email) => request.post('/forgot-password', { email }),

  // 重置密码接口
  resetPassword: (token, newPassword) => request.post('/reset-password', { token, new_password: newPassword }),

  // 获取个人资料接口
  getUserProfile: (userId) => request.get(`/users/${userId}`),

  // 微信验证码登录
  verifyWeChatCode: (code) => request.post('/wechat/verify_code', { code }),

  // 绑定微信 OpenID 到当前账号
  bindWeChat: (openid) => request.post('/wechat/bind', { openid }),
}

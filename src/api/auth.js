import request from '../utils/request'

export const authApi = {
  // 注册接口
  register: (userData) => request.post('/auth/register', userData),
  
  // 登录接口
  login: (credentials) => request.post('/auth/login', credentials),
  
  // 忘记密码接口
  forgotPassword: (email) => request.post('/auth/forgot-password', { email }),
  
  // 重置密码接口
  resetPassword: (token, newPassword) => request.post('/auth/reset-password', { token, new_password: newPassword })
}

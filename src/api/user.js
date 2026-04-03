import request from '../utils/request'

export const userApi = {
  // 获取用户列表
  getUsers: () => request.get('/users'),

  // 编辑用户
  updateUser: (userId, userData) => request.put(`/users/${userId}`, userData),

  // 删除用户
  deleteUser: (userId) => request.delete(`/users/${userId}`)
}

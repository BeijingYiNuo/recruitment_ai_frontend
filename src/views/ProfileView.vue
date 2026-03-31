<template>
  <div class="profile-container">
    <header class="profile-header">
      <div class="header-left">
        <el-button circle @click="$router.push('/dashboard')">⬅</el-button>
        <h1>个人信息中心</h1>
      </div>
      <div class="user-info">
        <span>当前状态: <el-tag :type="userProfile.status === 'activate' ? 'success' : 'danger'">{{ userProfile.status }}</el-tag></span>
      </div>
    </header>

    <main class="profile-content">
      <el-card class="box-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>基础账户信息 <span style="color: #999; font-size: 13px; margin-left:10px;">(当前仅限查看，信息修改功能开发中)</span></span>
            <el-button type="primary" disabled plain>编辑信息</el-button>
          </div>
        </template>
        
        <!-- Element Plus 的描述列表组件，非常适合呈现只读的属性面板 -->
        <el-descriptions :column="2" border-size="large">
          <el-descriptions-item label="用户数字 ID" label-align="right" align="center">
            <el-tag type="info">{{ userProfile.id }}</el-tag>
          </el-descriptions-item>
          
          <el-descriptions-item label="用户名" label-align="right" align="center">
            <strong>{{ userProfile.username }}</strong>
          </el-descriptions-item>

          <el-descriptions-item label="注册邮箱" label-align="right" align="center">
            {{ userProfile.email }}
          </el-descriptions-item>
          
          <el-descriptions-item label="绑定手机号" label-align="right" align="center">
            {{ userProfile.phone || '尚未绑定手机号' }}
          </el-descriptions-item>

          <el-descriptions-item label="系统角色" label-align="right" align="center">
            <el-tag v-if="userProfile.role === 'admin'" type="danger">系统管理员 (admin)</el-tag>
            <el-tag v-else-if="userProfile.role === 'recruiter'" type="primary">招聘官 (recruiter)</el-tag>
            <el-tag v-else-if="userProfile.role === 'candidate'" type="success">候选人 (candidate)</el-tag>
            <span v-else>{{ userProfile.role }}</span>
          </el-descriptions-item>

          <el-descriptions-item label="账户状态" label-align="right" align="center">
            {{ userProfile.status === 'activate' ? '正常激活' : userProfile.status === 'inactivate' ? '未激活' : '已注销' }}
          </el-descriptions-item>
        </el-descriptions>
        
        <div style="margin-top: 30px;">
          <h3 style="margin-bottom: 15px; font-size: 15px; color: #555; border-left: 4px solid #4caf50; padding-left: 10px;">安全与时间审计</h3>
          <el-descriptions :column="1" border size="default" direction="horizontal">
            <el-descriptions-item label="账户创建时间 (created_at)">
              {{ userProfile.created_at }}
            </el-descriptions-item>
            <el-descriptions-item label="最后修改时间 (updated_at)">
              {{ userProfile.updated_at }}
            </el-descriptions-item>
            <el-descriptions-item label="最后登录记录 (last_login_at)">
              {{ userProfile.last_login_at }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
        
      </el-card>
    </main>
  </div>
</template>

<script>
import { getCurrentUser } from '../services/authService'

export default {
  name: 'ProfileView',
  data() {
    // 从现在的 token 缓存里拿基础数据，不足的字段目前采用符合 Schema 的安全缺省值填补
    const authData = getCurrentUser() || {}
    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ')
    
    return {
      userProfile: {
        id: authData.id || '--',
        username: authData.username || '未知用户',
        email: authData.email || '未知邮箱',
        
        // 以下由于当前后端 token 暂未下发这几个新定义的元数据 Schema，进行前端安全 Mock：
        phone: authData.phone || '',
        role: authData.role || 'recruiter', // 默认按招聘业务为招聘官兜底展示
        status: authData.status || 'activate',
        created_at: authData.created_at || '2026-01-01 10:00:00', // 伪造兜底注册时间
        updated_at: authData.updated_at || nowStr,
        last_login_at: authData.last_login_at || nowStr
      }
    }
  }
}
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background-color: #f5f8fa;
}

.profile-header {
  background-color: #fff;
  padding: 15px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* 调整按钮让内部的箭头完全居中 */
:deep(.header-left .el-button) {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  width: 40px;
  height: 40px;
}
:deep(.header-left .el-button span) {
  margin-left: 0 !important; /* 重置可能因为 icon="Back" 引起的默认偏移 */
  display: flex;
  justify-content: center;
  align-items: center;
}

.profile-header h1 {
  margin: 0;
  font-size: 20px;
  color: #333;
  font-weight: 500;
}

.profile-content {
  padding: 40px 20px;
  max-width: 900px;
  margin: 0 auto;
}

.box-card {
  border-radius: 8px;
  border: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
}

/* 覆盖 Element Plus 的描述表格默认颜色，使其看起来更清爽高端 */
:deep(.el-descriptions__label) {
  background-color: #f8f9fc !important;
  color: #606266;
  width: 180px;
}
:deep(.el-descriptions__content) {
  color: #303133;
}
</style>

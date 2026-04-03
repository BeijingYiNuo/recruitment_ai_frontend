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
            <span>基础账户信息</span>
            <el-button type="primary" size="small" @click="handleEdit">编辑信息</el-button>
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
            <el-descriptions-item label="最后登录记录 (last_login_at)">
              {{ userProfile.last_login_at }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
        
      </el-card>

      <!-- 编辑个人信息弹窗组件 -->
      <UserEditModal 
        v-model:visible="editDialogVisible"
        :user-data="userProfile"
        :show-role="false"
        title="修改个人信息"
        @success="fetchProfile"
      />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { authApi } from '../api/auth'
import { getCurrentUser } from '../services/authService'
import UserEditModal from '../components/UserEditModal.vue'

const editDialogVisible = ref(false)

const userProfile = ref({
  id: '--',
  username: '加载中...',
  email: '--',
  phone: '--',
  role: '--',
  status: '--',
  created_at: '--',
  last_login_at: '--'
})

const formatTime = (timeStr) => {
  if (!timeStr || timeStr === '--') return '--'
  return timeStr.replace('T', ' ').substring(0, 19)
}

const fetchProfile = async () => {
  try {
    const currentUser = getCurrentUser()
    if (!currentUser || !currentUser.id) {
      throw new Error('未获取到当前登录用户的 ID，请重新登录。')
    }
    
    const res = await authApi.getUserProfile(currentUser.id) // 请求后端个人信息数据
    
    let data;
    // 兼容取出返回的数据：按你给定的结构是包在一个数组内
    if (Array.isArray(res) && res.length > 0) {
      data = res[0]
    } else if (res && !Array.isArray(res)) {
      data = res
    } else {
      throw new Error('未获取到有效的个人信息数据')
    }

    userProfile.value = {
      id: data.id ?? '--',
      username: data.username || '未知用户',
      email: data.email || '--',
      phone: data.phone || '未绑定手机号',
      role: data.role || '--',
      status: data.status || '未激活',
      created_at: formatTime(data.created_at),
      last_login_at: formatTime(data.last_login_at)
    }
  } catch (error) {
    ElMessage.error('获取个人信息失败: ' + (error?.detail || error?.message || '未知错误'))
  }
}

const handleEdit = () => {
  editDialogVisible.value = true
}

onMounted(() => {
  fetchProfile()
})
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

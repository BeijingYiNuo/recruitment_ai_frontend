<template>
  <div class="feishu-profile">
    <header class="feishu-header">
      <div class="header-inner">
        <div class="header-left">
          <button class="lark-back-btn" @click="$router.push('/dashboard')">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <h1 class="page-title">个人信息中心</h1>
        </div>
        <div class="user-info-status">
          <span class="status-label">当前状态</span>
          <div :class="['dot-status', userProfile.status === 'activate' ? 'success' : 'danger']">
            <span class="dot"></span>
            <span class="text">{{ userProfile.status }}</span>
          </div>
        </div>
      </div>
    </header>

    <main class="feishu-main">
      <div class="feishu-card">
        <div class="card-header">
          <h2 class="card-title">基础账户信息</h2>
          <button class="lark-btn-primary small-btn" @click="handleEdit">编辑信息</button>
        </div>
        
        <div class="lark-descriptions">
          <div class="lark-desc-item">
            <div class="lark-desc-label">用户数字 ID</div>
            <div class="lark-desc-value">
              <span class="id-text">{{ userProfile.id }}</span>
            </div>
          </div>
          
          <div class="lark-desc-item">
            <div class="lark-desc-label">用户名</div>
            <div class="lark-desc-value">
              <span class="text-bold">{{ userProfile.username }}</span>
            </div>
          </div>

          <div class="lark-desc-item">
            <div class="lark-desc-label">注册邮箱</div>
            <div class="lark-desc-value">{{ userProfile.email }}</div>
          </div>
          
          <div class="lark-desc-item">
            <div class="lark-desc-label">绑定手机号</div>
            <div class="lark-desc-value">{{ userProfile.phone || '尚未绑定手机号' }}</div>
          </div>

          <div class="lark-desc-item">
            <div class="lark-desc-label">系统角色</div>
            <div class="lark-desc-value">
              <div v-if="userProfile.role === 'admin'" class="dot-status danger">
                <span class="dot"></span><span class="text">系统管理员</span>
              </div>
              <div v-else-if="userProfile.role === 'recruiter'" class="dot-status primary">
                <span class="dot"></span><span class="text">招聘官</span>
              </div>
              <div v-else-if="userProfile.role === 'candidate'" class="dot-status success">
                <span class="dot"></span><span class="text">候选人</span>
              </div>
              <div v-else class="dot-status gray">
                <span class="dot"></span><span class="text">{{ userProfile.role }}</span>
              </div>
            </div>
          </div>

          <div class="lark-desc-item">
            <div class="lark-desc-label">账户状态</div>
            <div class="lark-desc-value">
              <div :class="['dot-status', userProfile.status === 'activate' ? 'success' : userProfile.status === 'inactivate' ? 'gray' : 'danger']">
                <span class="dot"></span>
                <span class="text">{{ userProfile.status === 'activate' ? '正常激活' : userProfile.status === 'inactivate' ? '未激活' : '已注销' }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="lark-section-divider"></div>
        
        <div class="card-header">
          <h3 class="card-subtitle">安全与时间审计</h3>
        </div>
        
        <div class="lark-descriptions format-horizontal">
          <div class="lark-desc-item">
            <div class="lark-desc-label">账户创建时间</div>
            <div class="lark-desc-value text-tertiary font-mono">{{ userProfile.created_at }}</div>
          </div>
          <div class="lark-desc-item">
            <div class="lark-desc-label">最后登录记录</div>
            <div class="lark-desc-value text-tertiary font-mono">{{ userProfile.last_login_at }}</div>
          </div>
        </div>
      </div>

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

<style scoped lang="scss">
/* --- 飞书风格重构 (Lark Design System) --- */
$primary-color: #3370ff;
$primary-hover: #2458d9;
$bg-color: #f5f6f7;
$bg-white: #ffffff;
$text-main: #1f2329;
$text-secondary: #646a73;
$text-tertiary: #8f959e;
$border-color: #dee0e3;

.feishu-profile {
  font-family: "Lark Sans", "Lark Unicode", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: $bg-color;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* --- Header --- */
.feishu-header {
  height: 64px;
  background-color: $bg-white;
  border-bottom: 1px solid rgba(31, 35, 41, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  max-width: 1000px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.lark-back-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid transparent;
  background-color: transparent;
  color: $text-secondary;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
  
  &:hover {
    background-color: rgba(31, 35, 41, 0.08);
    color: $text-main;
  }
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: $text-main;
  margin: 0;
}

.user-info-status {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .status-label {
    font-size: 14px;
    color: $text-secondary;
  }
}

/* Dot Status Indicator */
.dot-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}

.dot-status .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #dee0e3;
  transition: all 0.2s ease;
}

.dot-status.success .dot { background-color: #13a248; box-shadow: 0 0 0 3px rgba(19, 162, 72, 0.15); }
.dot-status.danger .dot { background-color: #f54a45; box-shadow: 0 0 0 3px rgba(245, 74, 69, 0.15); }
.dot-status.primary .dot { background-color: #3370ff; box-shadow: 0 0 0 3px rgba(51, 112, 255, 0.15); }
.dot-status.gray .dot { background-color: #8f959e; box-shadow: 0 0 0 3px rgba(143, 149, 158, 0.15); }

.dot-status .text {
  color: #1f2329;
}

/* ID Text */
.id-text {
  font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace;
  background-color: #f5f6f7;
  padding: 2px 6px;
  border-radius: 4px;
  color: #646a73;
  font-size: 13px;
  border: 1px solid #dee0e3;
  letter-spacing: 0.5px;
}

/* --- Main Content --- */
.feishu-main {
  flex: 1;
  padding: 32px 24px;
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.feishu-card {
  background: $bg-white;
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 4px rgba(0, 0, 0, 0.02);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: $text-main;
  margin: 0;
}

.card-subtitle {
  font-size: 16px;
  font-weight: 600;
  color: $text-main;
  margin: 0;
}

/* Buttons */
.lark-btn-primary {
  background-color: $primary-color;
  border: none;
  color: #fff;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: $primary-hover;
  }
  
  &.small-btn {
    height: 32px;
    padding: 0 16px;
  }
}

/* Descriptions */
.lark-descriptions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 8px;
  
  &.format-horizontal {
    gap: 16px;
  }
}

.lark-desc-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  
  .format-horizontal & {
    flex-direction: row;
    align-items: center;
    gap: 16px;
  }
}

.lark-desc-label {
  font-size: 14px;
  color: $text-secondary;
  
  .format-horizontal & {
    min-width: 100px;
  }
}

.lark-desc-value {
  font-size: 14px;
  color: $text-main;
  min-height: 24px;
  display: flex;
  align-items: center;
}

.text-bold {
  font-weight: 600;
}

.text-tertiary {
  color: $text-tertiary;
}

.font-mono {
  font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace;
}

.lark-section-divider {
  height: 1px;
  background-color: $border-color;
  margin: 32px 0;
}

@media (max-width: 768px) {
  .lark-descriptions {
    grid-template-columns: 1fr;
  }
}
</style>

<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <h1>仪表盘</h1>
      <div class="user-info">
        <span>欢迎, {{ currentUser.username }}</span>
        <button class="btn-logout" @click="handleLogout">登出</button>
      </div>
    </header>
    <main class="dashboard-content">
      <div class="dashboard-card">
        <h2>用户信息</h2>
        <div class="user-details">
          <p><strong>用户名:</strong> {{ currentUser.username }}</p>
          <p><strong>邮箱:</strong> {{ currentUser.email }}</p>
          <p><strong>用户ID:</strong> {{ currentUser.id }}</p>
        </div>
      </div>
      <div class="dashboard-card">
        <h2>系统功能</h2>
        <div class="feature-list">
          <button class="feature-item" @click="createSession">创建面试会话</button>
          <button class="feature-item" @click="listSessions">管理面试记录</button>
          <button class="feature-item" @click="viewReports">查看面试报告</button>
          <button class="feature-item" @click="uploadResume">上传简历</button>
        </div>
      </div>
      <div class="dashboard-card" v-if="sessionId">
        <h2>会话信息</h2>
        <p>当前会话ID: {{ sessionId }}</p>
        <button class="btn-secondary" @click="startASR">开始语音识别</button>
        <button class="btn-danger" @click="stopASR" style="margin-left: 10px;">结束语音识别</button>
      </div>

      <div class="dashboard-card" v-if="sessions.length > 0">
        <h2>面试记录</h2>
        <ul class="session-list">
          <li v-for="session in sessions" :key="session">
            会话ID: {{ session }}
            <button class="btn-sm" @click="viewSession(session)">查看</button>
          </li>
        </ul>
      </div>
      <div v-if="message" class="message" :class="messageType">
        {{ message }}
      </div>
    </main>
  </div>
</template>

<script>
import { getCurrentUser } from '../services/authService'
import authService from '../services/authService'
import { interviewApi } from '../api/interview'

export default {
  name: 'DashboardView',
  data() {
    return {
      currentUser: getCurrentUser(),
      sessionId: '',
      sessions: [],
      message: '',
      messageType: 'success'
    }
  },
  methods: {
    handleLogout() {
      authService.logout()
      this.$router.push('/login')
    },
    async createSession() {
      try {
        const data = await interviewApi.createSession()
        this.sessionId = data.user_id
        this.showMessage('面试会话创建成功', 'success')
      } catch (error) {
        this.showMessage('创建面试会话失败: ' + (error.detail || error.message), 'error')
      }
    },
    async listSessions() {
      try {
        const data = await interviewApi.getSessions()
        this.sessions = data.sessions
        this.showMessage('获取面试记录成功', 'success')
      } catch (error) {
        this.showMessage('获取面试记录失败: ' + (error.detail || error.message), 'error')
      }
    },
    async viewSession(sessionId) {
      try {
        const data = await interviewApi.getSession(sessionId)
        console.log('Session details:', data)
        this.showMessage('获取会话详情成功', 'success')
      } catch (error) {
        this.showMessage('获取会话详情失败: ' + (error.detail || error.message), 'error')
      }
    },
    async startASR() {
      if (!this.sessionId) {
        this.showMessage('请先创建面试会话', 'error')
        return
      }
      // 跳转到面试页面
      this.$router.push(`/interview/${this.sessionId}`)
    },
    async stopASR() {
      // 停止语音识别的逻辑已经移到InterviewView中
      this.showMessage('请在面试页面中停止语音识别', 'info')
    },
    viewReports() {
      if (this.sessions.length === 0) {
        this.showMessage('请先获取面试记录', 'error')
        return
      }
      this.showMessage('查看面试报告功能开发中', 'info')
    },
    uploadResume() {
      this.showMessage('上传简历功能开发中', 'info')
    },
    showMessage(msg, type = 'success') {
      this.message = msg
      this.messageType = type
      setTimeout(() => {
        this.message = ''
      }, 3000)
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.dashboard-header {
  background-color: #4CAF50;
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dashboard-header h1 {
  margin: 0;
  font-size: 24px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.btn-logout {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-logout:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.dashboard-content {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.dashboard-card {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.dashboard-card h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 18px;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 10px;
}

.user-details p {
  margin: 10px 0;
  color: #555;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feature-item {
  display: block;
  padding: 12px;
  background-color: #f0f0f0;
  color: #333;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.feature-item:hover {
  background-color: #e0e0e0;
  cursor: pointer;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.btn-sm {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-left: 10px;
  transition: background-color 0.3s;
}

.btn-sm:hover {
  background-color: #45a049;
}

.session-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.session-list li {
  padding: 10px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.session-list li:last-child {
  border-bottom: none;
}

.message {
  padding: 12px;
  border-radius: 4px;
  margin-top: 20px;
  text-align: center;
  font-weight: 500;
  animation: fadeIn 0.3s ease-in-out;
}

.message.success {
  background-color: #e8f5e8;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}

.message.error {
  background-color: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
}

.message.info {
  background-color: #e3f2fd;
  color: #1565c0;
  border: 1px solid #bbdefb;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
  
  .user-info {
    flex-direction: column;
    gap: 10px;
  }
  
  .session-list li {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .btn-sm {
    margin-left: 0;
  }
}

.btn-danger {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.btn-danger:hover {
  background-color: #da190b;
}

.btn-danger:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>

<template>
  <div class="reset-password-container">
    <h1>重置密码</h1>
    <form @submit.prevent="handleResetPassword">
      <div class="form-group">
        <label for="token">重置令牌</label>
        <input 
          type="text" 
          id="token" 
          v-model="form.token" 
          required 
          placeholder="请输入重置令牌"
        />
      </div>
      <div class="form-group">
        <label for="newPassword">新密码</label>
        <input 
          type="password" 
          id="newPassword" 
          v-model="form.newPassword" 
          required 
          placeholder="请输入新密码"
        />
      </div>
      <div class="form-actions">
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? '重置中...' : '重置密码' }}
        </button>
        <a href="/login" class="btn-secondary">返回登录</a>
      </div>
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      <div v-if="success" class="success-message">
        {{ success }}
      </div>
    </form>
  </div>
</template>

<script>
import authService from '../services/authService'

export default {
  name: 'ResetPasswordView',
  data() {
    return {
      form: {
        token: '',
        newPassword: ''
      },
      loading: false,
      error: '',
      success: ''
    }
  },
  mounted() {
    // 从URL参数中获取token
    const token = this.$route.query.token
    if (token) {
      this.form.token = token
    }
  },
  methods: {
    async handleResetPassword() {
      this.loading = true
      this.error = ''
      this.success = ''
      
      try {
        const response = await authService.resetPassword(this.form.token, this.form.newPassword)
        this.success = response.message
        // 重置成功后跳转到登录页面
        setTimeout(() => {
          this.$router.push('/login')
        }, 2000)
      } catch (error) {
        this.error = error.detail || '重置密码失败，请检查令牌是否正确'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.reset-password-container {
  max-width: 400px;
  margin: 100px auto;
  padding: 30px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 30px;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-primary:hover {
  background-color: #45a049;
}

.btn-primary:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
  padding: 12px;
  border-radius: 4px;
  font-size: 16px;
  text-align: center;
  text-decoration: none;
  transition: background-color 0.3s;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.error-message {
  margin-top: 15px;
  padding: 10px;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 4px;
  font-size: 14px;
}

.success-message {
  margin-top: 15px;
  padding: 10px;
  background-color: #e8f5e8;
  color: #2e7d32;
  border-radius: 4px;
  font-size: 14px;
}
</style>

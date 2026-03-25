<template>
  <div class="forgot-password-container">
    <h1>忘记密码</h1>
    <form @submit.prevent="handleForgotPassword">
      <div class="form-group">
        <label for="email">邮箱</label>
        <input 
          type="email" 
          id="email" 
          v-model="form.email" 
          required 
          placeholder="请输入您的邮箱"
        />
      </div>
      <div class="form-actions">
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? '发送中...' : '发送重置链接' }}
        </button>
        <a href="/login" class="btn-secondary">返回登录</a>
      </div>
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      <div v-if="success" class="success-message">
        {{ success }}
        <div v-if="resetLink" class="reset-link">
          重置链接: <a :href="resetLink" target="_blank">{{ resetLink }}</a>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import authService from '../services/authService'

export default {
  name: 'ForgotPasswordView',
  data() {
    return {
      form: {
        email: ''
      },
      loading: false,
      error: '',
      success: '',
      resetLink: ''
    }
  },
  methods: {
    async handleForgotPassword() {
      this.loading = true
      this.error = ''
      this.success = ''
      this.resetLink = ''
      
      try {
        const response = await authService.forgotPassword(this.form.email)
        this.success = response.message
        this.resetLink = response.reset_link
      } catch (error) {
        this.error = error.detail || '发送重置链接失败，请检查邮箱是否正确'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.forgot-password-container {
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

.reset-link {
  margin-top: 10px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 14px;
  word-break: break-all;
}

.reset-link a {
  color: #4CAF50;
  text-decoration: none;
}

.reset-link a:hover {
  text-decoration: underline;
}
</style>

<template>
  <AuthLayout :style="{ '--auth-gradient': resetGradient }">
    <template #visual>
      <div class="visual-inner">
        <h1 class="visual-title">设置新密码</h1>
        <p class="visual-sub">为您的账号设置一个新的安全密码</p>
        <div class="benefits">
          <div class="benefit"><div class="icon">🛡️</div><div><div class="b-title">强化安全</div><div class="b-desc">使用包含数字和字母的复杂密码组合</div></div></div>
          <div class="benefit"><div class="icon">✨</div><div><div class="b-title">即刻生效</div><div class="b-desc">重置成功后即可使用新密码登录</div></div></div>
        </div>
      </div>
    </template>

    <AuthCard>
      <template #header>
        <div class="logo-wrap"><div class="logo-icon">🔄</div></div>
        <h2 class="title">重置密码</h2>
        <p class="subtitle">输入收到的令牌并设置新密码</p>
      </template>

      <form @submit.prevent="handleResetPassword" class="form">
        <div class="field">
          <label for="token">重置令牌</label>
          <div class="input-with-icon">
            <span class="icon">🔑</span>
            <input id="token" type="text" v-model="form.token" placeholder="请输入重置令牌" required />
          </div>
        </div>

        <div class="field">
          <label for="newPassword">新密码</label>
          <div class="input-with-icon">
            <span class="icon">🔒</span>
            <input :type="showPassword ? 'text' : 'password'" id="newPassword" v-model="form.newPassword" placeholder="至少8个字符，包含数字和字母" required />
            <button type="button" class="eye" @click="showPassword = !showPassword">{{ showPassword ? '🙈' : '👁️' }}</button>
          </div>
        </div>

        <div v-if="error" class="msg msg-error">{{ error }}</div>
        <div v-if="success" class="msg msg-success">{{ success }}</div>

        <button type="submit" class="primary" :disabled="loading">
          {{ loading ? '重置中...' : '确认重置密码' }}
        </button>

        <div class="back-row">
          <a href="/login" class="link">← 返回登录</a>
        </div>
      </form>
    </AuthCard>
  </AuthLayout>
</template>

<script>
import authService from '../services/authService'
import AuthLayout from '../components/AuthLayout.vue'
import AuthCard from '../components/AuthCard.vue'

export default {
  name: 'ResetPasswordView',
  components: { AuthLayout, AuthCard },
  data() {
    return {
      form: {
        token: '',
        newPassword: ''
      },
      showPassword: false,
      loading: false,
      error: '',
      success: '',
      resetGradient: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)'
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
/* visual (left) */
.visual-inner {
  color: #fff;
  max-width: 420px;
}
.visual-title {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 10px;
}
.visual-sub {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 20px;
}
.benefits {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.benefit {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.benefit .icon {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 18px;
}
.b-title {
  font-weight: 600;
}
.b-desc {
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
}

/* form */
.logo-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}
.logo-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #10b981, #059669);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 22px;
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.18);
}
.title {
  text-align: center;
  margin-top: 8px;
  font-size: 20px;
}
.subtitle {
  text-align: center;
  color: #6b7280;
  margin-top: 6px;
}
.form {
  margin-top: 6px;
}
.field {
  margin-top: 14px;
}
.field label {
  display: block;
  margin-bottom: 8px;
  color: #374151;
  font-size: 14px;
}
.input-with-icon {
  position: relative;
}
.input-with-icon .icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}
.input-with-icon input {
  width: 100%;
  padding: 12px 16px 12px 40px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  outline: none;
  font-size: 14px;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.input-with-icon input:focus {
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.08);
  border-color: transparent;
}
/* Hide browser native eye icon */
input::-ms-reveal,
input::-ms-clear {
  display: none;
}

.input-with-icon .eye {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: 0;
  cursor: pointer;
  padding: 4px;
  z-index: 10;
}

/* messages */
.msg {
  margin-top: 14px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
}
.msg-error {
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}
.msg-success {
  background-color: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

/* button */
.primary {
  width: 100%;
  margin-top: 18px;
  padding: 12px;
  border-radius: 12px;
  border: 0;
  color: #fff;
  font-size: 16px;
  background: linear-gradient(90deg, #10b981, #059669);
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(16, 185, 129, 0.12);
  transition: opacity 0.2s;
}
.primary:hover {
  opacity: 0.9;
}
.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.back-row {
  text-align: center;
  margin-top: 14px;
}
.link {
  color: #059669;
  text-decoration: none;
  font-size: 14px;
}
.link:hover {
  text-decoration: underline;
}

@media (max-width: 900px) {
  .visual-inner {
    max-width: 100%;
    margin-top: -20px;
  }
  .visual-title {
    font-size: 28px;
    margin-bottom: 4px;
  }
  .visual-sub {
    font-size: 14px;
    margin-bottom: 0;
  }
  .benefits {
    display: none;
  }
}
</style>

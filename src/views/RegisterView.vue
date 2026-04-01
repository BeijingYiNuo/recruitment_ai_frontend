<template>
  <AuthLayout :style="{ '--auth-gradient': registerGradient }">
    <template #visual>
      <div class="visual-inner">
        <h1 class="visual-title">开启全新体验</h1>
        <p class="visual-sub">加入我们的社区，与来自世界各地的用户一起探索无限可能</p>
        <div class="benefits">
          <div class="benefit"><div class="icon">✓</div><div class="b-title">完全免费</div><div class="b-desc">注册账号无需任何费用，即刻开始使用</div></div>
          <div class="benefit"><div class="icon">✓</div><div class="b-title">安全可靠</div><div class="b-desc">银行级加密保护，你的数据安全有保障</div></div>
          <div class="benefit"><div class="icon">✓</div><div class="b-title">随时随地</div><div class="b-desc">支持多平台同步，无论何时何地都能访问</div></div>
        </div>
      </div>
    </template>

    <AuthCard>
      <template #header>
        <div class="logo-wrap"><div class="logo-icon">★</div></div>
        <h2 class="title">创建账号</h2>
        <p class="subtitle">填写信息，开始你的旅程</p>
      </template>

      <form @submit.prevent="handleRegister" class="form">
        <div class="field">
          <label for="username">用户名</label>
          <div class="input-with-icon">
            <span class="icon">👤</span>
            <input id="username" type="text" v-model="form.username" placeholder="请输入用户名" required />
          </div>
        </div>

        <div class="field">
          <label for="email">邮箱或手机号</label>
          <div class="input-with-icon">
            <span class="icon">@</span>
            <input id="email" type="text" v-model="form.email" placeholder="请输入邮箱或手机号" required />
          </div>
        </div>

        <div class="field">
          <label for="password">密码</label>
          <div class="input-with-icon">
            <span class="icon">🔒</span>
            <input :type="showPassword ? 'text' : 'password'" id="password" v-model="form.password" placeholder="请输入密码" required />
            <button type="button" class="eye" @click="showPassword = !showPassword">{{ showPassword ? '🙈' : '👁️' }}</button>
          </div>
          <div v-if="form.password" class="pw-hint">
            <div :class="['dot', form.password.length >= 8 ? 'ok' : '']"></div><small> 至少 8 个字符</small>
            <div :class="['dot', /\d/.test(form.password) ? 'ok' : '']"></div><small> 包含数字</small>
            <div :class="['dot', /[a-zA-Z]/.test(form.password) ? 'ok' : '']"></div><small> 包含字母</small>
          </div>
        </div>

        <div class="field">
          <label for="confirmPassword">确认密码</label>
          <div class="input-with-icon">
            <span class="icon">🔒</span>
            <input :type="showConfirm ? 'text' : 'password'" id="confirmPassword" v-model="form.confirmPassword" placeholder="请再次输入密码" required />
            <button type="button" class="eye" @click="showConfirm = !showConfirm">{{ showConfirm ? '🙈' : '👁️' }}</button>
          </div>
          <p v-if="form.confirmPassword && form.confirmPassword !== form.password" class="error">两次密码输入不一致</p>
        </div>

        <div class="terms">
          <input type="checkbox" id="agree" v-model="agree" />
          <label for="agree">我已阅读并同意 <a href="javascript:void(0)" class="link">用户协议</a> 和 <a href="javascript:void(0)" class="link">隐私政策</a></label>
        </div>

        <button type="submit" class="submit-btn" :disabled="!canSubmit" :class="{ 'is-disabled': !canSubmit }">立即注册</button>

        <div class="register-row">已有账号？ <a href="/login" class="link">立即登录</a></div>

        <!-- <div class="divider-hr"><span>或使用以下方式登录</span></div> -->
        <SocialButtons />
      </form>
    </AuthCard>
  </AuthLayout>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import authService from '../services/authService'
import AuthLayout from '../components/AuthLayout.vue'
import AuthCard from '../components/AuthCard.vue'
import SocialButtons from '../components/SocialButtons.vue'

const router = useRouter()
const form = reactive({ username: '', email: '', password: '', confirmPassword: '' })
const showPassword = ref(false)
const showConfirm = ref(false)
const agree = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref('')

const registerGradient = 'linear-gradient(135deg,#ec4899 0%,#a855f7 50%,#6366f1 100%)'

const passwordStrength = computed(() => ({
  hasLength: form.password.length >= 8,
  hasNumber: /\d/.test(form.password),
  hasLetter: /[a-zA-Z]/.test(form.password)
}))

const canSubmit = computed(() => passwordStrength.value.hasLength && passwordStrength.value.hasNumber && passwordStrength.value.hasLetter && form.password === form.confirmPassword && form.username && form.email && agree.value)

async function handleRegister () {
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    await authService.register({ username: form.username, email: form.email, password: form.password })
    success.value = '注册成功，正在跳转...'
    setTimeout(() => router.push('/login'), 1400)
  } catch (err) {
    error.value = err?.detail || '注册失败，请检查输入信息'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
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
}
.b-title {
  font-weight: 600;
}
.b-desc {
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
}

.logo-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}
.logo-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ec4899, #a855f7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 8px 20px rgba(232, 121, 207, 0.14);
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
  padding: 12px 44px 12px 40px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  outline: none;
}
.input-with-icon input:focus {
  box-shadow: 0 8px 20px rgba(232, 121, 207, 0.08);
  border-color: transparent;
}
.eye {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: 0;
  cursor: pointer;
}
.pw-hint {
  margin-top: 10px;
  display: flex;
  gap: 12px;
  align-items: center;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 99px;
  background: #d1d5db;
}
.dot.ok {
  background: #10b981;
}
.error {
  color: #dc2626;
  margin-top: 6px;
  font-size: 13px;
}
.terms {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 12px;
}
.terms input[type="checkbox"] {
  accent-color: #ec4899;
  width: 16px;
  height: 16px;
  cursor: pointer;
  margin: 0;
}
.terms label {
  font-size: 14px;
  color: #374151;
  cursor: pointer;
}
.submit-btn {
  width: 100%;
  margin-top: 14px;
  padding: 12px;
  border-radius: 12px;
  border: 0;
  color: #fff;
  background: linear-gradient(90deg, #ec4899, #a855f7);
  cursor: pointer;
  font-size: 16px;
}
.submit-btn.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.link {
  color: #a855f7;
  text-decoration: none;
  cursor: pointer;
  background: transparent;
  border: none;
  padding: 0;
  font-size: inherit;
}
.link:hover {
  text-decoration: underline;
}
.register-row {
  text-align: center;
  margin-top: 12px;
  color: #6b7280;
}
.divider-hr {
  margin-top: 18px;
  position: relative;
  text-align: center;
}
.divider-hr span {
  background: #fff;
  padding: 0 12px;
  color: #6b7280;
}

@media (max-width: 900px) {
  .visual-inner {
    max-width: 100%;
    margin-top: -20px;
  }
  .hero-img {
    display: none;
  }
  .visual-stats {
    display: none;
  }
  .visual-title {
    font-size: 28px;
    margin-bottom: 4px;
  }
  .visual-sub {
    font-size: 14px;
    margin-bottom: 0;
  }
}
</style>

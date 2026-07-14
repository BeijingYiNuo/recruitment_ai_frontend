<template>
  <div class="feishu-page" :style="{ '--auth-gradient': registerGradient }">
    <video class="bg-video" autoplay loop muted playsinline>
      <source src="../assets/2e7c4b16983e8e20cb652d7037f0ebcc_raw.mp4" type="video/mp4" />
    </video>
    <div class="feishu-card feishu-card-large">
      <div class="feishu-header">
        <h2 class="feishu-title">创建账号</h2>
        <p class="feishu-subtitle">填写信息，开始您的全新体验</p>
      </div>

      <form @submit.prevent="handleRegister" class="feishu-form">
        <div class="feishu-field">
          <label for="username" class="feishu-label">账号</label>
          <div class="feishu-input-box">
            <input id="username" type="text" v-model="form.username" placeholder="请输入账号（3-20位）" required maxlength="20" class="feishu-input" />
          </div>
        </div>

        <div class="feishu-field">
          <label for="nickname" class="feishu-label">昵称</label>
          <div class="feishu-input-box">
            <input id="nickname" type="text" v-model="form.nickname" placeholder="请输入昵称（选填，最长20位）" maxlength="20" class="feishu-input" />
          </div>
        </div>

        <div class="feishu-field">
          <label for="email" class="feishu-label">邮箱</label>
          <div class="feishu-input-box">
            <input id="email" type="email" v-model="form.email" placeholder="请输入邮箱（选填）" maxlength="100" class="feishu-input" />
          </div>
          <div v-if="form.email && !isEmailValid" class="feishu-error-text">请输入有效的邮箱地址</div>
        </div>

        <div class="feishu-field">
          <label for="phone" class="feishu-label">手机号</label>
          <div class="feishu-input-box">
            <input id="phone" type="tel" v-model="form.phone" placeholder="请输入 11 位手机号（选填）" maxlength="11" class="feishu-input" />
          </div>
          <div v-if="form.phone && !isPhoneValid" class="feishu-error-text">请输入 11 位数字手机号</div>
        </div>


        <div class="feishu-field">
          <label for="password" class="feishu-label">密码</label>
          <div class="feishu-input-box">
            <input :type="showPassword ? 'text' : 'password'" id="password" v-model="form.password" placeholder="请输入密码" required class="feishu-input" />
            <button type="button" class="feishu-eye-btn" @click="showPassword = !showPassword" :title="showPassword ? '隐藏密码' : '显示密码'">
              <el-icon>
                <View v-if="showPassword" />
                <Hide v-else />
              </el-icon>
            </button>
          </div>
          <div v-if="form.password" class="feishu-pw-hint">
            <div class="pw-hint-item">
              <span :class="['pw-dot', form.password.length >= 8 ? 'ok' : '']"></span> 至少 8 个字符
            </div>
            <div class="pw-hint-item">
              <span :class="['pw-dot', /\d/.test(form.password) ? 'ok' : '']"></span> 包含数字
            </div>
            <div class="pw-hint-item">
              <span :class="['pw-dot', /[a-zA-Z]/.test(form.password) ? 'ok' : '']"></span> 包含字母
            </div>
          </div>
        </div>

        <div class="feishu-field">
          <label for="confirmPassword" class="feishu-label">确认密码</label>
          <div class="feishu-input-box">
            <input :type="showConfirm ? 'text' : 'password'" id="confirmPassword" v-model="form.confirmPassword" placeholder="请再次输入密码" required class="feishu-input" />
            <button type="button" class="feishu-eye-btn" @click="showConfirm = !showConfirm" :title="showConfirm ? '隐藏密码' : '显示密码'">
              <el-icon>
                <View v-if="showConfirm" />
                <Hide v-else />
              </el-icon>
            </button>
          </div>
          <div v-if="form.confirmPassword && form.confirmPassword !== form.password" class="feishu-error-text">两次密码输入不一致</div>
        </div>

        <div class="feishu-terms">
          <input type="checkbox" id="agree" v-model="agree" class="feishu-checkbox" />
          <label for="agree">我已阅读并同意 <a href="javascript:void(0)" class="feishu-link">用户协议</a> 和 <a href="javascript:void(0)" class="feishu-link">隐私政策</a></label>
        </div>

        <div v-if="error" class="feishu-alert feishu-alert-error">{{ error }}</div>
        <div v-if="success" class="feishu-alert feishu-alert-success">{{ success }}</div>

        <button type="submit" class="feishu-btn feishu-btn-primary" :disabled="!canSubmit" :class="{ 'is-disabled': !canSubmit }">
          {{ loading ? '注册中...' : '立即注册' }}
        </button>

        <div class="feishu-register-tip">
          已有账号？ <a href="/login" class="feishu-link">立即登录</a>
        </div>

        <div class="feishu-social-wrapper">
          <SocialButtons @wechat-login="showWeChatDialog = true" />
        </div>
      </form>

      <WeChatCodeDialog v-model="showWeChatDialog" @login-success="onWeChatLoginSuccess" />
    </div>

    <!-- 规避 unused var 警告 -->
    <template v-if="false">
      <AuthLayout />
      <AuthCard />
    </template>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { View, Hide } from '@element-plus/icons-vue'
import authService from '../services/authService'
import AuthLayout from '../components/AuthLayout.vue'
import AuthCard from '../components/AuthCard.vue'
import SocialButtons from '../components/SocialButtons.vue'
import WeChatCodeDialog from '../components/WeChatCodeDialog.vue'

const router = useRouter()
const form = reactive({ username: '', nickname: '', email: '', phone: '', role: 'recruiter', password: '', confirmPassword: '' })
const showPassword = ref(false)
const showConfirm = ref(false)
const agree = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref('')
const showWeChatDialog = ref(false)

function onWeChatLoginSuccess() {
  router.push('/dashboard')
}

const registerGradient = 'linear-gradient(135deg,#ec4899 0%,#a855f7 50%,#6366f1 100%)'

const passwordStrength = computed(() => ({
  hasLength: form.password.length >= 8,
  hasNumber: /\d/.test(form.password),
  hasLetter: /[a-zA-Z]/.test(form.password)
}))

const isEmailValid = computed(() => {
  return form.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
})

const isPhoneValid = computed(() => {
  return form.phone && form.phone.length === 11 && /^\d{11}$/.test(form.phone)
})

const canSubmit = computed(() =>
  passwordStrength.value.hasLength &&
  passwordStrength.value.hasNumber &&
  passwordStrength.value.hasLetter &&
  (!form.email || isEmailValid.value) &&
  (!form.phone || isPhoneValid.value) &&
  form.password === form.confirmPassword &&
  form.username &&
  agree.value
)

async function handleRegister () {
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    const payload = {
      username: form.username,
      nickname: form.nickname || form.username,
      email: form.email,
      phone: form.phone,
      password: form.password,
      role: form.role
    }
    await authService.register(payload)
    success.value = '注册成功，正在进入控制台...'
    setTimeout(() => router.push('/dashboard'), 1400)
  } catch (err) {
    if (Array.isArray(err?.detail)) {
      error.value = err.detail.map(e => e.msg).join('; ')
    } else {
      error.value = err?.detail || '注册失败，请检查输入信息'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.feishu-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1f2329;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
  padding: 40px 20px;
  box-sizing: border-box;
  overflow: hidden;
}

.bg-video {
  position: absolute;
  top: 50%;
  left: 50%;
  min-width: 100%;
  min-height: 100%;
  width: auto;
  height: auto;
  transform: translate(-50%, -50%);
  object-fit: cover;
  z-index: 0;
  filter: brightness(0.4); /* 调低亮度 */
}

.feishu-card {
  position: relative;
  z-index: 10;
  width: 100%;
  background-color: #FFFFFF;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 4px rgba(0, 0, 0, 0.02);
  padding: 40px 32px;
  box-sizing: border-box;
}

.feishu-card-large {
  max-width: 440px;
}

.feishu-header {
  margin-bottom: 32px;
  text-align: center;
}

.feishu-title {
  font-size: 24px;
  font-weight: 600;
  color: #1F2329;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.feishu-subtitle {
  font-size: 14px;
  color: #8F959E;
  margin: 0;
  line-height: 1.5;
}

.feishu-field {
  margin-bottom: 20px;
}

.feishu-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1F2329;
  margin-bottom: 8px;
  line-height: 20px;
}

.feishu-input-box {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.feishu-input,
.feishu-select {
  width: 100%;
  height: 40px;
  padding: 8px 12px;
  font-size: 14px;
  color: #1F2329;
  background-color: #FFFFFF;
  border: 1px solid #dee0e3;
  border-radius: 6px;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
  font-family: inherit;
}

.feishu-input::placeholder {
  color: #8F959E;
}

.feishu-input:hover,
.feishu-select:hover {
  border-color: #bbbfc4;
}

.feishu-input:focus,
.feishu-select:focus {
  border-color: #3370FF;
  box-shadow: 0 0 0 2px rgba(51, 112, 255, 0.2);
}

.feishu-select {
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 8.5L2 4.5L2.707 3.793L6 7.086L9.293 3.793L10 4.5L6 8.5Z' fill='%238F959E'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}

.feishu-role-display {
  display: flex;
  align-items: center;
  height: 40px;
  padding: 8px 12px;
  font-size: 14px;
  color: #1f2329;
  background-color: #f5f6f7;
  border: 1px solid #dee0e3;
  border-radius: 6px;
}

.feishu-input::-ms-reveal,
.feishu-input::-ms-clear {
  display: none;
}

.feishu-input-box input[type="password"],
.feishu-input-box input[type="text"] {
  padding-right: 36px;
}

.feishu-eye-btn {
  position: absolute;
  right: 12px;
  background: transparent;
  border: none;
  color: #8F959E;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  height: 100%;
}

.feishu-eye-btn:hover {
  color: #3370FF;
}

.feishu-error-text {
  color: #F54A45;
  font-size: 12px;
  margin-top: 4px;
  line-height: 1.5;
}

.feishu-pw-hint {
  margin-top: 8px;
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.pw-hint-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #8F959E;
  gap: 6px;
}

.pw-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #dee0e3;
  transition: background-color 0.2s;
}

.pw-dot.ok {
  background-color: #24A148;
}

.feishu-terms {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}

.feishu-checkbox {
  accent-color: #3370FF;
  width: 16px;
  height: 16px;
  cursor: pointer;
  margin: 0;
}

.feishu-terms label {
  font-size: 14px;
  color: #1F2329;
  cursor: pointer;
  user-select: none;
}

.feishu-alert {
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  margin-bottom: 24px;
  line-height: 1.5;
}

.feishu-alert-error {
  background-color: #FFF1F0;
  border: 1px solid #F54A45;
  color: #F54A45;
}

.feishu-alert-success {
  background-color: #F0F9EA;
  border: 1px solid #24A148;
  color: #24A148;
}

.feishu-link {
  font-size: 14px;
  color: #3370FF;
  text-decoration: none;
  cursor: pointer;
  background: transparent;
  border: none;
  padding: 0;
}

.feishu-link:hover {
  text-decoration: underline;
}

.feishu-btn {
  width: 100%;
  height: 40px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.feishu-btn-primary {
  background-color: #3370FF;
  color: #FFFFFF;
}

.feishu-btn-primary:hover {
  background-color: #2458D1;
}

.feishu-btn-primary.is-disabled {
  background-color: #99B5FF;
  cursor: not-allowed;
}

.feishu-register-tip {
  margin-top: 16px;
  text-align: center;
  font-size: 14px;
  color: #646A73;
}

.feishu-social-wrapper {
  margin-top: 24px;
}
</style>

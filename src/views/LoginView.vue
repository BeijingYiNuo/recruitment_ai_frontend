<template>
  <div class="feishu-page" :style="{ '--auth-gradient': loginGradient }">
    <video class="bg-video" autoplay loop muted playsinline>
      <source src="../assets/2e7c4b16983e8e20cb652d7037f0ebcc_raw.mp4" type="video/mp4" />
    </video>
    <div class="feishu-card">
      <div class="feishu-header">
        <h2 class="feishu-title">登录</h2>
        <p class="feishu-subtitle">欢迎回来，请登录您的账号</p>
      </div>

      <!-- 登录方式切换 -->
      <div class="login-tabs">
        <button
          class="login-tab"
          :class="{ active: loginMode === 'password' }"
          @click="loginMode = 'password'; clearQrState()"
        >密码登录</button>
        <button
          class="login-tab"
          :class="{ active: loginMode === 'code' }"
          @click="loginMode = 'code'"
        >验证码登录</button>
      </div>

      <!-- 密码登录 -->
      <form v-if="loginMode === 'password'" @submit.prevent="handleLogin" class="feishu-form">
        <div class="feishu-field">
          <label for="email" class="feishu-label">账号</label>
          <div class="feishu-input-box">
            <input id="email" type="text" v-model="username" placeholder="请输入账号" required class="feishu-input" />
          </div>
        </div>

        <div class="feishu-field">
          <label for="password" class="feishu-label">密码</label>
          <div class="feishu-input-box">
            <input :type="showPassword ? 'text' : 'password'" id="password" v-model="password" placeholder="请输入密码 (至少8位)" required minlength="8" class="feishu-input" />
            <button type="button" class="feishu-eye-btn" @click="showPassword = !showPassword" :title="showPassword ? '隐藏密码' : '显示密码'">
              <el-icon>
                <View v-if="showPassword" />
                <Hide v-else />
              </el-icon>
            </button>
          </div>
        </div>

        <div v-if="error" class="feishu-alert feishu-alert-error">{{ error }}</div>

        <div class="feishu-row-right">
          <a href="/forgot-password" class="feishu-link">忘记密码？</a>
        </div>

        <button type="submit" class="feishu-btn feishu-btn-primary" :disabled="!canSubmit" :class="{ 'is-disabled': !canSubmit }">
          {{ loading ? '登录中...' : '立即登录' }}
        </button>

        <div class="feishu-register-tip">
          还没有账号？ <a href="/register" class="feishu-link">立即注册</a>
        </div>

        <div class="feishu-social-wrapper">
          <SocialButtons @wechat-login="showWeChatDialog = true" />
        </div>
      </form>

      <!-- 验证码登录 -->
      <div v-if="loginMode === 'code'" class="code-login-box">
        <p class="code-login-desc">打开「晓聘」小程序 → 我的 → 生成登录验证码，输入后登录</p>
        <div class="code-input-row">
          <input
            v-for="i in 6"
            :key="i"
            type="text"
            maxlength="1"
            class="code-input"
            :ref="el => { if (el) codeInputs[i-1] = el }"
            v-model="codeDigits[i-1]"
            @input="onCodeInput(i-1)"
            @keydown.backspace="onCodeBackspace(i-1)"
          />
        </div>
        <div v-if="codeError" class="feishu-alert feishu-alert-error" style="margin-top:12px">{{ codeError }}</div>
        <button
          class="feishu-btn feishu-btn-primary"
          :disabled="codeDigits.some(d => !d) || codeVerifying"
          style="margin-top:16px"
          @click="verifyCode"
        >
          {{ codeVerifying ? '验证中...' : '确认登录' }}
        </button>
      </div>

      <div class="feishu-policy-tip" style="margin-top:16px">
        <router-link to="/privacy-policy" class="feishu-link">隐私政策</router-link>
        <span class="policy-divider">|</span>
        <router-link to="/terms-of-service" class="feishu-link">用户协议</router-link>
        <span class="policy-divider">|</span>
        <router-link to="/paid-service-agreement" class="feishu-link">付费协议</router-link>
      </div>
    </div>

    <WeChatCodeDialog v-model="showWeChatDialog" @login-success="onWeChatLoginSuccess" />

    <!-- 规避 unused var 警告 -->
    <template v-if="false">
      <AuthLayout />
      <AuthCard />
      <img :src="heroImage" alt="hidden" />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { View, Hide } from '@element-plus/icons-vue'
import authService from '../services/authService'
import { authApi } from '../api/auth'
import AuthLayout from '../components/AuthLayout.vue'
import AuthCard from '../components/AuthCard.vue'
import SocialButtons from '../components/SocialButtons.vue'
import WeChatCodeDialog from '../components/WeChatCodeDialog.vue'

const router = useRouter()
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const showWeChatDialog = ref(false)

import heroImage from '../assets/login.jpg'
const loginGradient = 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#d946ef 100%)'

const canSubmit = computed(() => {
  return username.value.trim() !== '' && password.value.length >= 8
})

async function handleLogin () {
  loading.value = true
  error.value = ''
  try {
    await authService.login({ username:  username.value, password: password.value })
    router.push('/dashboard')
  } catch (err) {
    error.value = err?.detail || '登录失败，请检查账号和密码'
  } finally {
    loading.value = false
  }
}

function onWeChatLoginSuccess () {
  router.push('/dashboard')
}

// ── 验证码登录 ────────────────────────────────────────────

const loginMode = ref('password')
const codeDigits = ref(['', '', '', '', '', ''])
const codeInputs = ref([])
const codeError = ref('')
const codeVerifying = ref(false)

function onCodeInput(idx) {
  // 只允许数字
  if (!/^\d$/.test(codeDigits.value[idx])) {
    codeDigits.value[idx] = ''
    return
  }
  codeError.value = ''
  // 自动跳到下一个输入框
  if (idx < 5 && codeDigits.value[idx]) {
    nextTick(() => {
      const next = codeInputs.value[idx + 1]
      if (next) next.focus()
    })
  }
}

function onCodeBackspace(idx) {
  if (!codeDigits.value[idx] && idx > 0) {
    codeDigits.value[idx - 1] = ''
    nextTick(() => {
      const prev = codeInputs.value[idx - 1]
      if (prev) prev.focus()
    })
  }
}

async function verifyCode() {
  const code = codeDigits.value.join('')
  if (code.length !== 6) return

  codeVerifying.value = true
  codeError.value = ''
  try {
    const data = await authApi.verifyLoginCode(code)
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify({ id: data.user_id }))
    router.push('/dashboard')
  } catch (err) {
    codeError.value = err?.detail || '验证码无效或已过期'
    // 清空输入
    codeDigits.value = ['', '', '', '', '', '']
    nextTick(() => {
      const first = codeInputs.value[0]
      if (first) first.focus()
    })
  } finally {
    codeVerifying.value = false
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
  filter: brightness(0.4);
}

.feishu-card {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 400px;
  background-color: #FFFFFF;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 4px rgba(0, 0, 0, 0.02);
  padding: 40px 32px;
  box-sizing: border-box;
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

/* 登录方式切换 */
.login-tabs {
  display: flex;
  border-bottom: 1px solid #dee0e3;
  margin-bottom: 24px;
}

.login-tab {
  flex: 1;
  padding: 10px 0;
  font-size: 14px;
  font-weight: 500;
  color: #8F959E;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.login-tab.active {
  color: #3370FF;
  border-bottom-color: #3370FF;
}

.login-tab:hover {
  color: #3370FF;
}

/* 验证码登录 */
.code-login-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.code-login-desc {
  font-size: 13px;
  color: #8F959E;
  text-align: center;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.code-input-row {
  display: flex;
  gap: 10px;
}

.code-input {
  width: 42px;
  height: 52px;
  text-align: center;
  font-size: 24px;
  font-weight: 600;
  color: #1F2329;
  background-color: #FFFFFF;
  border: 1px solid #dee0e3;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s;
  caret-color: transparent;
}

.code-input:focus {
  border-color: #3370FF;
  box-shadow: 0 0 0 2px rgba(51, 112, 255, 0.2);
}

.feishu-field {
  margin-bottom: 24px;
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

.feishu-input {
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

.feishu-input:hover {
  border-color: #bbbfc4;
}

.feishu-input:focus {
  border-color: #3370FF;
  box-shadow: 0 0 0 2px rgba(51, 112, 255, 0.2);
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

.feishu-row-right {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 24px;
  margin-top: -8px;
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
  color: #2458D1;
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
  margin-top: 32px;
}

.feishu-policy-tip {
  margin-top: 20px;
  text-align: center;
  font-size: 13px;
  color: #8F959E;
}

.policy-divider {
  margin: 0 10px;
  color: #dee0e3;
}
</style>

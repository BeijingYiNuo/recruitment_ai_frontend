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
        <button
          class="login-tab"
          :class="{ active: loginMode === 'qrcode' }"
          @click="loginMode = 'qrcode'"
        >扫码登录</button>
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

      <!-- 扫码登录 -->
      <div v-if="loginMode === 'qrcode'" class="qrcode-login-box">
        <p class="code-login-desc">使用微信扫一扫下方二维码即可登录</p>

        <!-- 加载中 -->
        <div v-if="qrLoading" class="qrcode-state">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#8F959E" stroke-width="2" class="qr-spin">
            <circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round"/>
          </svg>
          <p class="qrcode-state-text">获取二维码中...</p>
        </div>

        <!-- 小程序码 -->
        <div v-else-if="qrWxacodeUrl && !qrExpired" class="qrcode-img-wrap">
          <img :src="qrWxacodeUrl" class="qrcode-img" alt="小程序码" @error="qrExpired = true" />
          <p class="qrcode-hint">打开微信扫一扫，登录后将自动跳转</p>
        </div>

        <!-- 已过期 -->
        <div v-else-if="qrExpired" class="qrcode-state">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#F54A45" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
          </svg>
          <p class="qrcode-state-text">二维码已过期</p>
          <button class="feishu-btn feishu-btn-primary" style="width:auto;padding:0 24px;margin-top:12px" @click="qrRefresh">
            重新获取
          </button>
        </div>

        <!-- 登录成功 -->
        <div v-else-if="qrConfirmed" class="qrcode-state">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none">
            <circle cx="12" cy="12" r="10" fill="#13A248" opacity="0.1"/>
            <path d="M7.5 12l3 3 6-6" stroke="#13A248" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <p class="qrcode-state-text" style="color:#13A248;font-weight:500;">登录成功，正在跳转...</p>
        </div>
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
    </template>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { View, Hide } from '@element-plus/icons-vue'
import authService from '../services/authService'
import { authApi } from '../api/auth'
import request from '../utils/request'
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
const loginMode = ref('password')

const loginGradient = 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#d946ef 100%)'

// ── 扫码登录 ────────────────────────────────────────────

const qrTicketId = ref('')
const qrWxacodeUrl = ref('')
const qrLoading = ref(false)
const qrExpired = ref(false)
const qrConfirmed = ref(false)
let qrPollTimer = null

function clearQrState() {
  stopQrPolling()
  qrTicketId.value = ''
  qrWxacodeUrl.value = ''
  qrLoading.value = false
  qrExpired.value = false
  qrConfirmed.value = false
}

async function qrRefresh() {
  qrLoading.value = true
  qrExpired.value = false
  qrConfirmed.value = false

  try {
    const data = await request.post('/auth/qr-login')
    qrTicketId.value = data.ticket_id
    qrWxacodeUrl.value = data.wxacode_url
    qrLoading.value = false
    startQrPolling()
  } catch {
    qrLoading.value = false
    qrExpired.value = true
  }
}

function startQrPolling() {
  stopQrPolling()
  if (!qrTicketId.value) return

  qrPollTimer = setInterval(async () => {
    try {
      const data = await request.get(`/auth/qr-login/${qrTicketId.value}/status`)
      if (data.status === 'confirmed') {
        stopQrPolling()
        qrConfirmed.value = true
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('user', JSON.stringify({ id: data.user_id }))
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      } else if (data.status === 'expired') {
        stopQrPolling()
        qrExpired.value = true
      }
    } catch {
      stopQrPolling()
      qrExpired.value = true
    }
  }, 2000)
}

function stopQrPolling() {
  if (qrPollTimer) {
    clearInterval(qrPollTimer)
    qrPollTimer = null
  }
}

onBeforeUnmount(() => {
  stopQrPolling()
})

// 切换到扫码登录时自动获取二维码
watch(loginMode, (val) => {
  if (val === 'qrcode') {
    qrRefresh()
  } else {
    stopQrPolling()
  }
})

// ── 密码登录 ────────────────────────────────────────────

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

/* 扫码登录 */
.qrcode-login-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qrcode-state {
  text-align: center;
  padding: 32px 0;
}

.qrcode-state-text {
  font-size: 14px;
  color: #8F959E;
  margin: 16px 0 0 0;
}

.qrcode-img-wrap {
  text-align: center;
  padding: 8px 0;
}

.qrcode-img {
  width: 200px;
  height: 200px;
  display: block;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

.qrcode-hint {
  font-size: 13px;
  color: #8F959E;
  margin: 12px 0 0 0;
}

.qr-spin {
  animation: qr-spin 1.5s linear infinite;
}

@keyframes qr-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

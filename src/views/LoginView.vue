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

      <form @submit.prevent="handleLogin" class="feishu-form">
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { View, Hide } from '@element-plus/icons-vue'
import authService from '../services/authService'
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
</style>

<template>
  <el-dialog v-model="visible" width="420px" :close-on-click-modal="false" @close="handleClose" class="wechat-dialog" :show-close="false">
    <div class="wechat-container">
      <!-- 关闭按钮 -->
      <button class="dialog-close" @click="handleClose" type="button">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>

      <!-- 微信图标头部 -->
      <div class="dialog-header">
        <div class="wechat-icon-wrap">
          <svg viewBox="0 0 120 120" width="44" height="44">
            <path fill="#07C160" d="M42.5 10C22.12 10 6 23.65 6 40c0 9.12 5.32 17.28 13.5 22.5L16 72l11.28-5.64A38.66 38.66 0 0 0 42.5 70c7.56 0 14.6-1.88 20.66-5.14A26.5 26.5 0 0 1 62 57c0-13.25 11.75-24 26.5-24h.86C85.75 21.83 66.5 10 42.5 10z"/>
            <circle cx="26" cy="36" r="5" fill="#FFF"/>
            <circle cx="52" cy="36" r="5" fill="#FFF"/>
            <path fill="#07C160" d="M88.5 38C71.46 38 57 50.1 57 65s14.46 27 31.5 27c3.12 0 6.14-.42 8.96-1.2L112 100l-4.08-10.12C115.2 86.42 120 79.94 120 72c0-14.9-14.46-34-31.5-34z"/>
            <circle cx="78" cy="66" r="5" fill="#FFF"/>
            <circle cx="102" cy="66" r="5" fill="#FFF"/>
          </svg>
        </div>
        <h3 class="dialog-title">微信验证码登录</h3>
        <p class="dialog-subtitle">无需输入密码，微信扫码更快捷</p>
      </div>

      <!-- 步骤 1: 输入验证码 -->
      <div v-if="step === 'input'" class="step-body">
        <div class="instruction-card">
          <div class="instruction-step">
            <span class="step-num">1</span>
            <span class="step-text">打开微信，向公众号发送「<strong>登录</strong>」</span>
          </div>
          <div class="instruction-step">
            <span class="step-num">2</span>
            <span class="step-text">公众号将回复您一个 6 位验证码</span>
          </div>
          <div class="instruction-step">
            <span class="step-num">3</span>
            <span class="step-text">输入验证码完成登录</span>
          </div>
        </div>

        <div class="code-section">
          <label class="code-label">验证码</label>
          <el-input
            v-model="code"
            placeholder="请输入 6 位数字验证码"
            maxlength="6"
            size="large"
            class="code-input"
            @input="onCodeInput"
          />
          <p v-if="error" class="error-text">{{ error }}</p>
        </div>

        <el-button
          type="primary"
          size="large"
          class="submit-btn"
          :disabled="code.length !== 6 || loading"
          :loading="loading"
          @click="handleVerify"
        >
          {{ loading ? '验证中...' : '确认登录' }}
        </el-button>

        <p class="help-text">
          还没有关注公众号？
          <el-button text type="primary" size="small" @click="showFollowTips = !showFollowTips">
            如何关注？
          </el-button>
        </p>

        <div v-if="showFollowTips" class="follow-tips">
          <p>在微信搜索「<strong>{{ appName }}</strong>」或扫码关注后，发送「登录」即可获取验证码</p>
        </div>
      </div>

      <!-- 步骤 2: 登录成功 -->
      <div v-else-if="step === 'success'" class="step-body">
        <div class="success-state">
          <div class="success-icon-wrap">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none">
              <circle cx="12" cy="12" r="10" fill="#3370FF" opacity="0.1"/>
              <path d="M7.5 12l3 3 6-6" stroke="#3370FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="success-title">登录成功</h3>
          <p class="success-desc">正在跳转至控制台...</p>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import authService from '../services/authService'

const emit = defineEmits(['login-success', 'update:modelValue'])

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  appName: {
    type: String,
    default: 'xu的求职经验分享',
  },
})

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})
const code = ref('')
const step = ref('input')
const loading = ref(false)
const error = ref('')
const showFollowTips = ref(false)

function onCodeInput(value) {
  code.value = value.replace(/\D/g, '')
}

async function handleVerify() {
  if (code.value.length !== 6) return
  loading.value = true
  error.value = ''

  try {
    await authService.wechatLogin(code.value)
    step.value = 'success'
    setTimeout(() => {
      emit('login-success')
      handleClose()
    }, 1200)
  } catch (err) {
    error.value = err?.detail || '验证码无效或已过期，请重新获取'
    code.value = ''
  } finally {
    loading.value = false
  }
}

function handleClose() {
  visible.value = false
  emit('update:modelValue', false)
  setTimeout(() => {
    code.value = ''
    step.value = 'input'
    error.value = ''
    showFollowTips.value = false
  }, 300)
}
</script>

<style scoped>
/* 覆盖 el-dialog 默认样式 */
.wechat-dialog :deep(.el-dialog__header) {
  display: none;
}

.wechat-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.wechat-dialog :deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

.wechat-container {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
  position: relative;
}

/* 关闭按钮 */
.dialog-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #8F959E;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
}

.dialog-close:hover {
  background: #F7F8FA;
  color: #1F2329;
}

/* ===== 头部 ===== */
.dialog-header {
  text-align: center;
  padding: 36px 32px 0;
}

.wechat-icon-wrap {
  margin-bottom: 16px;
}

.dialog-title {
  font-size: 20px;
  font-weight: 600;
  color: #1F2329;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.dialog-subtitle {
  font-size: 14px;
  color: #8F959E;
  margin: 0;
  line-height: 1.5;
}

/* ===== 步骤体 ===== */
.step-body {
  padding: 24px 32px 36px;
}

/* 操作指引卡片 */
.instruction-card {
  background: #F7F8FA;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 24px;
}

.instruction-step {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.instruction-step:last-child {
  margin-bottom: 0;
}

.step-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3370FF;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.step-text {
  font-size: 14px;
  color: #1F2329;
  line-height: 1.5;
}

/* 验证码区域 */
.code-section {
  margin-bottom: 20px;
}

.code-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1F2329;
  margin-bottom: 8px;
  line-height: 20px;
}

.code-input :deep(.el-input__wrapper) {
  height: 44px;
  border-radius: 6px;
  border: 1px solid #dee0e3;
  box-shadow: none;
  padding: 0 12px;
  font-size: 20px;
  letter-spacing: 6px;
  text-align: center;
}

.code-input :deep(.el-input__wrapper:hover) {
  border-color: #bbbfc4;
}

.code-input :deep(.el-input__wrapper.is-focus) {
  border-color: #3370FF;
  box-shadow: 0 0 0 2px rgba(51, 112, 255, 0.2);
}

.code-input :deep(.el-input__inner) {
  height: 42px;
  font-size: 20px;
  letter-spacing: 6px;
  text-align: center;
}

/* 错误提示 */
.error-text {
  color: #F54A45;
  font-size: 13px;
  margin: 6px 0 0 0;
  line-height: 1.5;
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  height: 44px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* 关注提示 */
.help-text {
  text-align: center;
  font-size: 13px;
  color: #8F959E;
  margin: 20px 0 0 0;
  line-height: 1.5;
}

.follow-tips {
  margin-top: 12px;
  padding: 12px 16px;
  background: #F0F5FF;
  border-radius: 6px;
  font-size: 13px;
  color: #3370FF;
  line-height: 1.5;
}

.follow-tips p {
  margin: 0;
}

/* ===== 成功状态 ===== */
.success-state {
  text-align: center;
  padding: 24px 0 12px;
}

.success-icon-wrap {
  margin-bottom: 16px;
}

.success-title {
  font-size: 20px;
  font-weight: 600;
  color: #1F2329;
  margin: 0 0 8px 0;
}

.success-desc {
  font-size: 14px;
  color: #8F959E;
  margin: 0;
}
</style>

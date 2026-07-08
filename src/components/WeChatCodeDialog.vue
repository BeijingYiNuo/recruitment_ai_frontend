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
          <svg viewBox="0 0 300 300" width="44" height="44">
            <path fill="#2DC100" d="M300 255c0 24.854-20.147 45-45 45H45c-24.854 0-45-20.146-45-45V45C0 20.147 20.147 0 45 0h210c24.853 0 45 20.147 45 45v210z"/>
            <g fill="#FFF">
              <path d="M200.803 111.88c-24.213 1.265-45.268 8.605-62.362 25.188-17.271 16.754-25.155 37.284-23 62.734-9.464-1.172-18.084-2.462-26.753-3.192-2.994-.252-6.547.106-9.083 1.537-8.418 4.75-16.488 10.113-26.053 16.092 1.755-7.938 2.891-14.889 4.902-21.575 1.479-4.914.794-7.649-3.733-10.849-29.066-20.521-41.318-51.232-32.149-82.85 8.483-29.25 29.315-46.989 57.621-56.236 38.635-12.62 82.054.253 105.547 30.927 8.485 11.08 13.688 23.516 15.063 38.224zm-111.437-9.852c.223-5.783-4.788-10.993-10.74-11.167-6.094-.179-11.106 4.478-11.284 10.483-.18 6.086 4.475 10.963 10.613 11.119 6.085.154 11.186-4.509 11.411-10.435zm58.141-11.171c-5.974.11-11.022 5.198-10.916 11.004.109 6.018 5.061 10.726 11.204 10.652 6.159-.074 10.83-4.832 10.772-10.977-.051-6.032-4.981-10.79-11.06-10.679z"/>
              <path d="M255.201 262.83c-7.667-3.414-14.7-8.536-22.188-9.318-7.459-.779-15.3 3.524-23.104 4.322-23.771 2.432-45.067-4.193-62.627-20.432-33.397-30.89-28.625-78.254 10.014-103.568 34.341-22.498 84.704-14.998 108.916 16.219 21.129 27.24 18.646 63.4-7.148 86.284-7.464 6.623-10.15 12.073-5.361 20.804.884 1.612.985 3.653 1.498 5.689zm-87.274-84.499c4.881.005 8.9-3.815 9.085-8.636.195-5.104-3.91-9.385-9.021-9.406-5.06-.023-9.299 4.318-9.123 9.346.166 4.804 4.213 8.69 9.059 8.696zm56.261-18.022c-4.736-.033-8.76 3.844-8.953 8.629-.205 5.117 3.772 9.319 8.836 9.332 4.898.016 8.768-3.688 8.946-8.562.19-5.129-3.789-9.364-8.829-9.399z"/>
            </g>
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
            <span class="step-text">打开微信，向公众号发送"<strong>登录</strong>"</span>
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
          <div class="code-boxes">
            <input
              v-for="i in 6"
              :key="i"
              :ref="el => { if (el) codeInputs[i - 1] = el }"
              v-model="codeArr[i - 1]"
              type="text"
              maxlength="1"
              class="code-box"
              :class="{ filled: codeArr[i - 1] }"
              @input="onBoxInput(i - 1)"
              @keydown.delete="onBoxDelete(i - 1)"
              @paste="onBoxPaste"
            />
          </div>
          <p v-if="error" class="error-text">{{ error }}</p>
        </div>

        <el-button
          type="primary"
          size="large"
          class="submit-btn"
          :disabled="!codeFull || loading"
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
          <p>在微信搜索 <strong>{{ appName }}</strong> 或扫码关注后，发送"<strong>登录</strong>"即可获取验证码</p>
          <div class="qr-inline">
            <img :src="qrcodeImg" alt="公众号二维码" class="qr-image" />
          </div>
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
import qrcodeImg from '../assets/公众号二维码.png'

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
const codeArr = ref(['', '', '', '', '', ''])
const codeInputs = ref([])
const step = ref('input')
const loading = ref(false)
const error = ref('')
const showFollowTips = ref(false)

const codeFull = computed(() => codeArr.value.every(d => d !== ''))

function onBoxInput(idx) {
  // 只保留数字
  codeArr.value[idx] = codeArr.value[idx].replace(/\D/g, '')
  // 自动跳到下一个输入框
  if (codeArr.value[idx] && idx < 5) {
    codeInputs.value[idx + 1]?.focus()
  }
}

function onBoxDelete(idx) {
  if (!codeArr.value[idx] && idx > 0) {
    codeInputs.value[idx - 1]?.focus()
  }
}

function onBoxPaste(e) {
  const text = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6)
  if (!text) return
  e.preventDefault()
  for (let i = 0; i < 6; i++) {
    codeArr.value[i] = text[i] || ''
  }
  // 粘贴后聚焦到下一个空框或最后一个
  const nextEmpty = codeArr.value.findIndex(d => !d)
  const focusIdx = nextEmpty > 0 ? nextEmpty : 5
  codeInputs.value[focusIdx]?.focus()
}

async function handleVerify() {
  const code = codeArr.value.join('')
  if (code.length !== 6) return
  loading.value = true
  error.value = ''

  try {
    await authService.wechatLogin(code)
    step.value = 'success'
    setTimeout(() => {
      emit('login-success')
      handleClose()
    }, 1200)
  } catch (err) {
    error.value = err?.detail || '验证码无效或已过期，请重新获取'
    codeArr.value = ['', '', '', '', '', '']
    codeInputs.value[0]?.focus()
  } finally {
    loading.value = false
  }
}

function handleClose() {
  visible.value = false
  emit('update:modelValue', false)
  setTimeout(() => {
    codeArr.value = ['', '', '', '', '', '']
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

.code-boxes {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.code-box {
  width: 44px;
  height: 48px;
  border: 1px solid #dee0e3;
  border-radius: 8px;
  text-align: center;
  font-size: 22px;
  font-weight: 600;
  outline: none;
  transition: all 0.2s;
  caret-color: #3370FF;
}

.code-box:focus {
  border-color: #3370FF;
  box-shadow: 0 0 0 2px rgba(51, 112, 255, 0.2);
}

.code-box.filled {
  border-color: #3370FF;
  background: #F0F5FF;
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
  background: #F7F8FA;
  border-radius: 6px;
  font-size: 13px;
  color: #646A73;
  line-height: 1.5;
}

.follow-tips p {
  margin: 0;
}

.qr-inline {
  display: flex;
  justify-content: center;
  margin-top: 12px;
  background: #EAECEF;
  border-radius: 8px;
  padding: 12px;
}

.qr-image {
  width: 180px;
  height: 180px;
  display: block;
  border-radius: 4px;
  object-fit: contain;
  mix-blend-mode: multiply;
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

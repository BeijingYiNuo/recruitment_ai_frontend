<template>
  <el-dialog v-model="visible" width="400px" :close-on-click-modal="false" @close="handleClose" class="qr-login-dialog" :show-close="false">
    <div class="qr-container">
      <!-- 关闭按钮 -->
      <button class="dialog-close" @click="handleClose" type="button">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>

      <!-- 头部 -->
      <div class="dialog-header">
        <div class="scan-icon-wrap">
          <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="#3370FF" stroke-width="1.5">
            <rect x="3" y="3" width="6" height="6" rx="1"/>
            <rect x="15" y="3" width="6" height="6" rx="1"/>
            <rect x="3" y="15" width="6" height="6" rx="1"/>
            <rect x="15" y="15" width="6" height="6" rx="1"/>
            <path d="M6 12h12" stroke-width="2"/>
          </svg>
        </div>
        <h3 class="dialog-title">微信扫码登录</h3>
        <p class="dialog-subtitle">使用微信扫一扫，打开「晓聘」小程序即可确认</p>
      </div>

      <!-- 二维码区域 -->
      <div class="qr-body">
        <!-- 加载中 -->
        <div v-if="loading" class="qr-placeholder">
          <el-icon class="is-loading" :size="32">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#8F959E" stroke-width="2">
              <circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round"/>
            </svg>
          </el-icon>
          <p class="placeholder-text">获取二维码中...</p>
        </div>

        <!-- 二维码图片 -->
        <div v-else-if="wxacodeUrl && !expired" class="qr-code-wrap">
          <img :src="wxacodeUrl" class="qr-code-img" alt="小程序码" />
          <p class="qr-tip">打开「晓聘」小程序即可自动登录</p>
        </div>

        <!-- 已过期 -->
        <div v-else-if="expired" class="qr-placeholder">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#F54A45" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
          </svg>
          <p class="placeholder-text">二维码已过期</p>
          <el-button type="primary" size="small" @click="refreshQrCode" style="margin-top:12px">
            重新获取
          </el-button>
        </div>

        <!-- 扫码成功 -->
        <div v-else-if="confirmed" class="qr-placeholder">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none">
            <circle cx="12" cy="12" r="10" fill="#13A248" opacity="0.1"/>
            <path d="M7.5 12l3 3 6-6" stroke="#13A248" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <p class="placeholder-text" style="color:#13A248; font-weight:500;">登录成功</p>
        </div>
      </div>

      <!-- 底部提示 -->
      <div class="qr-footer">
        <p class="footer-tip">也可以打开小程序首页 → 验证码生成 → 输入验证码</p>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'

const emit = defineEmits(['login-success', 'update:modelValue'])
const router = useRouter()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const ticketId = ref('')
const wxacodeUrl = ref('')
const loading = ref(false)
const expired = ref(false)
const confirmed = ref(false)
const error = ref('')
let pollTimer = null

// 创建 ticket 并获取二维码
async function refreshQrCode() {
  loading.value = true
  expired.value = false
  confirmed.value = false
  error.value = ''

  try {
    const data = await request.post('/auth/qr-login')
    ticketId.value = data.ticket_id
    wxacodeUrl.value = `/api/auth/qr-login/${data.ticket_id}/wxacode`
    startPolling()
  } catch (err) {
    error.value = err?.detail || '获取二维码失败'
  } finally {
    loading.value = false
  }
}

// 轮询登录状态
function startPolling() {
  stopPolling()
  if (!ticketId.value) return

  pollTimer = setInterval(async () => {
    try {
      const data = await request.get(`/auth/qr-login/${ticketId.value}/status`)
      if (data.status === 'confirmed') {
        stopPolling()
        confirmed.value = true
        // 保存 JWT
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('user', JSON.stringify({ id: data.user_id }))
        // 延迟关闭
        setTimeout(() => {
          emit('login-success')
          handleClose()
        }, 1000)
      } else if (data.status === 'expired') {
        stopPolling()
        expired.value = true
      }
    } catch {
      stopPolling()
      expired.value = true
    }
  }, 2000)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function handleClose() {
  stopPolling()
  visible.value = false
  emit('update:modelValue', false)
  // 重置状态
  setTimeout(() => {
    ticketId.value = ''
    wxacodeUrl.value = ''
    loading.value = false
    expired.value = false
    confirmed.value = false
    error.value = ''
  }, 300)
}

// 监听对话框打开
watch(visible, (val) => {
  if (val) {
    refreshQrCode()
  } else {
    stopPolling()
  }
})

onBeforeUnmount(() => {
  stopPolling()
})
</script>

<style scoped>
.qr-login-dialog :deep(.el-dialog__header) {
  display: none;
}

.qr-login-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.qr-login-dialog :deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

.qr-container {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  position: relative;
}

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

.dialog-header {
  text-align: center;
  padding: 36px 32px 0;
}

.scan-icon-wrap {
  margin-bottom: 16px;
}

.dialog-title {
  font-size: 20px;
  font-weight: 600;
  color: #1F2329;
  margin: 0 0 8px 0;
}

.dialog-subtitle {
  font-size: 14px;
  color: #8F959E;
  margin: 0;
  line-height: 1.5;
}

/* 二维码区域 */
.qr-body {
  padding: 28px 32px;
  display: flex;
  justify-content: center;
}

.qr-placeholder {
  text-align: center;
  padding: 40px 0;
}

.placeholder-text {
  font-size: 14px;
  color: #8F959E;
  margin: 16px 0 0 0;
}

.qr-code-wrap {
  text-align: center;
}

.qr-code-img {
  width: 200px;
  height: 200px;
  display: block;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

.qr-tip {
  font-size: 13px;
  color: #8F959E;
  margin: 12px 0 0 0;
}

/* 底部 */
.qr-footer {
  padding: 0 32px 28px;
  text-align: center;
}

.footer-tip {
  font-size: 12px;
  color: #bbbfc4;
  margin: 0;
  line-height: 1.5;
}
</style>

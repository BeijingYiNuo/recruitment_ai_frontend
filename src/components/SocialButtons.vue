<template>
  <div class="social-row">
    <div class="divider">
      <span class="divider-text">其他方式</span>
    </div>
    <button type="button" class="social-btn" aria-label="wechat" @click="$emit('wechat-login')">
      <svg class="social-btn-icon" viewBox="0 0 120 120" width="18" height="18">
        <path fill="#07C160" d="M42.5 10C22.12 10 6 23.65 6 40c0 9.12 5.32 17.28 13.5 22.5L16 72l11.28-5.64A38.66 38.66 0 0 0 42.5 70c7.56 0 14.6-1.88 20.66-5.14A26.5 26.5 0 0 1 62 57c0-13.25 11.75-24 26.5-24h.86C85.75 21.83 66.5 10 42.5 10z"/>
        <circle cx="26" cy="36" r="5" fill="#FFF"/>
        <circle cx="52" cy="36" r="5" fill="#FFF"/>
        <path fill="#07C160" d="M88.5 38C71.46 38 57 50.1 57 65s14.46 27 31.5 27c3.12 0 6.14-.42 8.96-1.2L112 100l-4.08-10.12C115.2 86.42 120 79.94 120 72c0-14.9-14.46-34-31.5-34z"/>
        <circle cx="78" cy="66" r="5" fill="#FFF"/>
        <circle cx="102" cy="66" r="5" fill="#FFF"/>
      </svg>
      <span class="social-btn-text">微信验证码登录</span>
    </button>
  </div>
</template>

<script setup>
defineEmits(['wechat-login'])
</script>

<style scoped>
.social-row {
  display: flex;
  gap: 12px;
  flex-direction: column;
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e8e8e8;
}

.divider-text {
  font-size: 13px;
  color: #8F959E;
  white-space: nowrap;
}

.social-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 12px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.social-btn:hover {
  background: #F7F8FA;
  border-color: #d0d0d0;
}

.social-btn:active {
  background: #f0f0f0;
}

.social-btn-icon {
  flex-shrink: 0;
}

.social-btn-text {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}
</style>

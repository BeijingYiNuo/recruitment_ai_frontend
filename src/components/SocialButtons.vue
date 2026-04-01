<template>
  <div class="social-row">
    <!-- <button class="social-btn" aria-label="github">使用 GitHub 登录</button> -->
    <!-- <button class="social-btn" aria-label="wechat">使用 微信 登录</button> -->
  </div>
</template>

<script setup>
</script>

<style scoped>
.social-row {
  display: flex;
  gap: 10px;
  flex-direction: column;
  margin-top: 14px;
}
.social-btn {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #e6e6e6;
  background: #fff;
  cursor: pointer;
  text-align: center;
}
.social-btn:hover {
  background: #fafafa;
}
</style>

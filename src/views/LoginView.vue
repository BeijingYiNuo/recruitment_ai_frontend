<template>
  <AuthLayout :style="{ '--auth-gradient': loginGradient }">
    <template #visual>
      <div class="visual-inner">
        <img :src="heroImage" alt="品牌插画" class="hero-img" />
        <h1 class="visual-title">欢迎回来！</h1>
        <p class="visual-sub">开始你的精彩旅程，连接无限可能</p>

        <div class="visual-stats">
          <div class="stat"><div class="num">100K+</div><div class="label">活跃用户</div></div>
          <div class="divider"></div>
          <div class="stat"><div class="num">50+</div><div class="label">国家地区</div></div>
          <div class="divider"></div>
          <div class="stat"><div class="num">4.9</div><div class="label">用户评分</div></div>
        </div>
      </div>
    </template>

    <AuthCard>
      <template #header>
        <div class="logo-wrap"><div class="logo-icon">★</div></div>
        <h2 class="title">登录账号</h2>
        <p class="subtitle">使用你的账号继续探索</p>
      </template>

      <form @submit.prevent="handleLogin" class="form">
        <div class="field">
          <label for="email">用户名</label>
          <div class="input-with-icon">
            <span class="icon">@</span>
            <input id="email" type="text" v-model="username" placeholder="请输入用户名" required />
          </div>
        </div>

        <div class="field">
          <label for="password">密码</label>
          <div class="input-with-icon">
            <span class="icon">🔒</span>
            <input :type="showPassword ? 'text' : 'password'" id="password" v-model="password" placeholder="请输入密码" required />
            <button type="button" class="eye" @click="showPassword = !showPassword">{{ showPassword ? '🙈' : '👁️' }}</button>
          </div>
        </div>

        <div class="row-right">
          <a href="/forgot-password" class="link">忘记密码？</a>
        </div>

        <button type="submit" class="primary">立即登录</button>

        <div class="register-row">还没有账号？ <a href="/register" class="link">立即注册</a></div>

        <SocialButtons />
      </form>
    </AuthCard>
  </AuthLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import authService from '../services/authService'
import AuthLayout from '../components/AuthLayout.vue'
import AuthCard from '../components/AuthCard.vue'
import SocialButtons from '../components/SocialButtons.vue'

const router = useRouter()
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

const heroImage = 'https://images.unsplash.com/photo-1585984968562-1443b72fb0dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg'
const loginGradient = 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#d946ef 100%)'

async function handleLogin () {
  loading.value = true
  error.value = ''
  try {
    await authService.login({ username:  username.value, password: password.value })
    router.push('/dashboard')
  } catch (err) {
    error.value = err?.detail || '登录失败，请检查邮箱和密码'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* visual (left) */
.visual-inner {
  color: #fff;
  text-align: center;
  max-width: 420px;
}
.hero-img {
  width: 100%;
  max-width: 360px;
  border-radius: 18px;
  box-shadow: 0 20px 40px rgba(2, 6, 23, 0.18);
  margin-bottom: 18px;
}
.visual-title {
  font-size: 36px;
  font-weight: 700;
  margin: 8px 0;
}
.visual-sub {
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 18px;
}
.visual-stats {
  display: flex;
  gap: 18px;
  align-items: center;
  justify-content: center;
  margin-top: 12px;
}
.stat {
  text-align: center;
}
.num {
  font-size: 22px;
  font-weight: 700;
}
.label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
}
.divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.18);
}

/* form */
.logo-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}
.logo-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.18);
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
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.08);
  border-color: transparent;
}

/* Hide browser native eye icon */
input::-ms-reveal,
input::-ms-clear {
  display: none;
}

.input-with-icon .eye {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: 0;
  cursor: pointer;
  z-index: 10;
}

.row-right {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
.link {
  color: #6366f1;
  text-decoration: none;
}
.primary {
  width: 100%;
  margin-top: 14px;
  padding: 12px;
  border-radius: 12px;
  border: 0;
  color: #fff;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(99, 102, 241, 0.12);
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
    display: none;
  }
}
</style>

<template>
  <div class="feishu-home">
    <!-- Header -->
    <header class="home-header">
      <div class="header-inner">
        <div class="logo-area">
          <svg class="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#3370FF"/>
            <path d="M2 17L12 22L22 17" stroke="#3370FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="#3370FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="logo-text">面试助手系统</span>
        </div>
        <nav class="auth-nav">
          <el-button class="lark-btn-ghost" @click="$router.push('/login')">登录</el-button>
          <el-button type="primary" class="lark-btn-primary" @click="$router.push('/register')">免费注册</el-button>
        </nav>
      </div>
    </header>

    <!-- Main Content -->
    <main class="home-main">
      <!-- Hero Section -->
      <section class="hero-section fade-in-up">
        <div class="hero-content">
          <h1 class="hero-title">重新定义智能面试体验</h1>
          <p class="hero-subtitle">基于先进的 AI 语音识别与知识引擎，为企业级招聘提供智能化、自动化的专业面试管理解决方案。</p>
          <div class="hero-actions">
            <el-button type="primary" size="large" class="lark-btn-primary massive-btn" @click="$router.push('/register')">
              立即开启
              <el-icon class="ml-2"><ArrowRight /></el-icon>
            </el-button>
            <el-button size="large" class="lark-btn-ghost massive-btn" @click="$router.push('/login')">
              登录系统
            </el-button>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features-section fade-in-up delay-1">
        <h2 class="section-title">全场景智能覆盖</h2>
        <div class="features-grid">
          <!-- Feature 1 -->
          <div class="feature-card">
            <div class="feature-icon-wrapper bg-blue-light">
              <el-icon class="feature-icon text-blue"><VideoCamera /></el-icon>
            </div>
            <h3 class="feature-title">无缝面试协作</h3>
            <p class="feature-desc">全流程线上、线下面试统一管理，提供清晰的日历视图与日程预约机制，保障高效协同。</p>
          </div>
          
          <!-- Feature 2 -->
          <div class="feature-card">
            <div class="feature-icon-wrapper bg-green-light">
              <el-icon class="feature-icon text-green"><Microphone /></el-icon>
            </div>
            <h3 class="feature-title">实时语音解析</h3>
            <p class="feature-desc">采用领先的 ASR 引擎，面试过程中实时转写多方对话，精准区分发言人，不错过任何细节。</p>
          </div>

          <!-- Feature 3 -->
          <div class="feature-card">
            <div class="feature-icon-wrapper bg-orange-light">
              <el-icon class="feature-icon text-orange"><Document /></el-icon>
            </div>
            <h3 class="feature-title">智能报告生成</h3>
            <p class="feature-desc">依托大模型深度分析对话与简历，一键生成结构化面试评价与总结报告，提升决策效率。</p>
          </div>

          <!-- Feature 4 -->
          <div class="feature-card">
            <div class="feature-icon-wrapper bg-purple-light">
              <el-icon class="feature-icon text-purple"><Collection /></el-icon>
            </div>
            <h3 class="feature-title">企业级知识库</h3>
            <p class="feature-desc">定制化企业知识库集成，辅助面试官实时检索专业知识与岗位规范，构建标准化面试体系。</p>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="home-footer">
      <div class="footer-inner">
        <p>&copy; 2026 面试助手系统 (Interview Assistant). 保留所有权利.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ArrowRight, VideoCamera, Microphone, Document, Collection } from '@element-plus/icons-vue'
</script>

<style scoped lang="scss">
/* --- 飞书风格重构 (Lark Design System) --- */
$primary-color: #3370ff;
$primary-hover: #2458d9;
$bg-color: #f5f6f7;
$text-main: #1f2329;
$text-secondary: #646a73;
$text-tertiary: #8f959e;
$border-color: #dee0e3;

.feishu-home {
  font-family: "Lark Sans", "Lark Unicode", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: #ffffff;
  color: $text-main;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* --- Header --- */
.home-header {
  height: 64px;
  background-color: #ffffff;
  border-bottom: 1px solid rgba(31, 35, 41, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
  background-color: rgba(255, 255, 255, 0.95);
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;

  .logo-icon {
    width: 28px;
    height: 28px;
  }

  .logo-text {
    font-size: 20px;
    font-weight: 600;
    color: $text-main;
    letter-spacing: -0.5px;
  }
}

.auth-nav {
  display: flex;
  gap: 16px;
}

.lark-btn-ghost {
  background: transparent;
  border: 1px solid $border-color;
  color: $text-main;
  font-weight: 500;
  transition: all 0.2s;
  
  &:hover {
    background-color: $bg-color;
    border-color: #cdd0d6;
    color: $primary-color;
  }
}

.lark-btn-primary {
  background-color: $primary-color;
  border-color: $primary-color;
  font-weight: 500;
  transition: all 0.2s;
  
  &:hover {
    background-color: $primary-hover;
    border-color: $primary-hover;
  }
}

/* --- Main Content --- */
.home-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(180deg, #f5f7fc 0%, #ffffff 100%);
  padding-bottom: 80px;
}

/* --- Hero Section --- */
.hero-section {
  width: 100%;
  padding: 100px 24px 60px;
  display: flex;
  justify-content: center;
}

.hero-content {
  text-align: center;
  max-width: 800px;
}

.hero-title {
  font-size: 52px;
  font-weight: 700;
  color: $text-main;
  line-height: 1.2;
  margin-bottom: 24px;
  letter-spacing: -1px;
}

.hero-subtitle {
  font-size: 18px;
  line-height: 1.6;
  color: $text-secondary;
  margin-bottom: 48px;
  max-width: 680px;
  margin-left: auto;
  margin-right: auto;
}

.hero-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  
  .massive-btn {
    height: 52px;
    padding: 0 32px;
    font-size: 16px;
    border-radius: 8px;
    
    &.lark-btn-primary {
      box-shadow: 0 4px 12px rgba(51, 112, 255, 0.25);
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(51, 112, 255, 0.3);
      }
    }
  }
}

/* --- Features Section --- */
.features-section {
  width: 100%;
  max-width: 1200px;
  padding: 40px 24px;
}

.section-title {
  font-size: 32px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 56px;
  color: $text-main;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 24px;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.feature-card {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  padding: 32px 24px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 2px 8px rgba(31, 35, 41, 0.04);
  
  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 32px rgba(31, 35, 41, 0.08);
    border-color: rgba(51, 112, 255, 0.2);
  }
}

.feature-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  
  .feature-icon {
    font-size: 24px;
  }
  
  &.bg-blue-light { background: #e1eaff; }
  .text-blue { color: #3370ff; }
  
  &.bg-green-light { background: #e4f7eb; }
  .text-green { color: #13a248; }
  
  &.bg-orange-light { background: #fff4e5; }
  .text-orange { color: #ff8800; }
  
  &.bg-purple-light { background: #f3e8ff; }
  .text-purple { color: #9333ea; }
}

.feature-title {
  font-size: 20px;
  font-weight: 600;
  color: $text-main;
  margin-bottom: 12px;
}

.feature-desc {
  font-size: 15px;
  line-height: 1.6;
  color: $text-secondary;
}

/* --- Footer --- */
.home-footer {
  padding: 40px 24px;
  text-align: center;
  background-color: transparent;
}

.footer-inner p {
  color: $text-tertiary;
  font-size: 13px;
  margin: 0;
}

/* --- Animations --- */
.fade-in-up {
  animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: translateY(20px);
}

.delay-1 {
  animation-delay: 0.2s;
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.ml-2 { margin-left: 8px; }
</style>

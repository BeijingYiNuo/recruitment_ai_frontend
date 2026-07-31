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
            <el-button type="primary" size="large" class="lark-btn-primary massive-btn" @click="$router.push('/login')">
              立即开启
              <el-icon class="ml-2"><ArrowRight /></el-icon>
            </el-button>
            <!-- <el-button size="large" class="lark-btn-ghost massive-btn" @click="$router.push('/login')">
              登录系统
            </el-button> -->
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
        <!-- 社交媒体入口 -->
        <div class="social-links">
          <a href="https://space.bilibili.com" target="_blank" rel="noopener noreferrer" class="social-link" title="B站">
            <svg class="social-icon bilibili" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373Z"/>
            </svg>
          </a>
          <a href="https://www.douyin.com" target="_blank" rel="noopener noreferrer" class="social-link" title="抖音">
            <svg class="social-icon douyin" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
            </svg>
          </a>
          <a href="https://weibo.com" target="_blank" rel="noopener noreferrer" class="social-link" title="微博">
            <svg class="social-icon weibo" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.737 5.439l-.002.004zM9.05 17.219c-.384.616-1.208.884-1.829.602-.612-.279-.793-.991-.406-1.593.379-.595 1.176-.861 1.793-.601.622.263.82.972.442 1.592zm1.27-1.627c-.141.237-.449.353-.689.253-.236-.09-.313-.361-.177-.586.138-.227.436-.346.672-.24.239.09.315.36.18.601l.014-.028zm.176-2.719c-1.893-.493-4.033.45-4.857 2.118-.836 1.704-.026 3.591 1.886 4.21 1.983.64 4.318-.341 5.132-2.179.8-1.793-.201-3.642-2.161-4.149zm7.563-1.224c-.346-.105-.57-.18-.405-.615.375-.977.42-1.804 0-2.404-.781-1.112-2.915-1.053-5.364-.03 0 0-.766.331-.571-.271.376-1.217.315-2.224-.27-2.809-1.338-1.337-4.869.045-7.888 3.08C1.309 10.87 0 13.273 0 15.348c0 3.981 5.099 6.395 10.086 6.395 6.536 0 10.888-3.801 10.888-6.82 0-1.822-1.547-2.854-2.915-3.284v.01zm1.908-5.092c-.766-.856-1.908-1.187-2.96-.962-.436.09-.706.511-.616.932.09.42.511.691.932.602.511-.105 1.067.044 1.442.465.376.421.466.977.316 1.473-.136.406.089.856.51.992.405.119.857-.105.992-.512.33-1.021.12-2.178-.646-3.035l.03.045zm2.418-2.195c-1.576-1.757-3.905-2.419-6.054-1.968-.496.104-.812.587-.706 1.081.104.496.586.813 1.082.707 1.532-.331 3.185.15 4.296 1.383 1.112 1.246 1.429 2.943.947 4.416-.165.48.106 1.007.586 1.157.479.165.991-.104 1.157-.586.675-2.088.241-4.478-1.338-6.235l.03.045z"/>
            </svg>
          </a>
        </div>
        <p>&copy; 2026 面试助手系统 (Interview Assistant). 保留所有权利.</p>
        <p class="footer-links">
          <router-link to="/privacy-policy" class="footer-link">隐私政策</router-link>
          <span class="footer-link-divider">|</span>
          <router-link to="/terms-of-service" class="footer-link">用户协议</router-link>
          <span class="footer-link-divider">|</span>
          <router-link to="/paid-service-agreement" class="footer-link">付费协议</router-link>
        </p>
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
  padding: 60px 24px 40px;
  text-align: center;
  background-color: transparent;
}

.footer-inner p {
  color: $text-tertiary;
  font-size: 13px;
  margin: 0;
}

.footer-links {
  margin-top: 8px !important;
}

.footer-link {
  color: $text-tertiary;
  font-size: 13px;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    color: $primary-color;
    text-decoration: underline;
  }
}

.footer-link-divider {
  margin: 0 8px;
  color: $border-color;
}

/* --- Social Media Links --- */
.social-links {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 24px;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #f2f3f5;
  color: $text-tertiary;
  transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
  text-decoration: none;

  &:hover {
    transform: translateY(-3px);
  }

  .social-icon {
    width: 22px;
    height: 22px;
  }

  /* B站 hover */
  &:has(.bilibili):hover {
    background: #fb72991a;
    color: #FB7299;
    box-shadow: 0 4px 12px rgba(251, 114, 153, 0.25);
  }

  /* 抖音 hover */
  &:has(.douyin):hover {
    background: #111111;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  /* 微博 hover */
  &:has(.weibo):hover {
    background: #e6162d1a;
    color: #E6162D;
    box-shadow: 0 4px 12px rgba(230, 22, 45, 0.25);
  }
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

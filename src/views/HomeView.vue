<template>
  <div class="home-container">
    <header class="home-header">
      <h1>面试助手系统</h1>
      <nav class="home-nav">
        <el-button type="primary" link style="color: white; font-size: 16px;" @click="$router.push('/login')">登录</el-button>
        <el-button type="primary" link style="color: white; font-size: 16px;" @click="$router.push('/register')">注册</el-button>
      </nav>
    </header>
    <main class="home-content">
      <section class="hero-section">
        <h2>提升面试体验</h2>
        <p>专业的面试助手系统，帮助您更好地准备和管理面试过程</p>
        <div class="hero-buttons">
          <el-button type="primary" size="large" @click="$router.push('/register')">立即注册</el-button>
          <el-button size="large" @click="$router.push('/login')">已有账号？登录</el-button>
        </div>
      </section>
      <section class="features-section">
        <h3>系统功能</h3>
        <div class="features-grid">
          <el-card class="feature-card" shadow="hover">
            <h4>智能面试会话</h4>
            <p>创建和管理面试会话，记录面试过程</p>
          </el-card>
          <el-card class="feature-card" shadow="hover">
            <h4>实时语音识别</h4>
            <p>自动识别面试中的语音内容</p>
          </el-card>
          <el-card class="feature-card" shadow="hover">
            <h4>面试报告生成</h4>
            <p>自动生成面试总结和分析报告</p>
          </el-card>
          <el-card class="feature-card" shadow="hover">
            <h4>知识库管理</h4>
            <p>管理和查询面试相关知识</p>
          </el-card>
        </div>
      </section>
    </main>
    <footer class="home-footer">
      <p>&copy; 2026 面试助手系统. 保留所有权利.</p>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'HomeView'
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.home-header {
  background-color: #4caf50;
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.home-header h1 {
  margin: 0;
  font-size: 24px;
}

.home-nav {
  display: flex;
  gap: 20px;
}

.home-content {
  flex: 1;
  padding: 40px 20px;
}

.hero-section {
  text-align: center;
  margin-bottom: 60px;
  padding: 60px 20px;
  background-color: #f0f8f0;
  border-radius: 8px;
  max-width: 1000px;
  margin: 0 auto 60px;
}

.hero-section h2 {
  font-size: 36px;
  margin-bottom: 20px;
  color: #333;
}

.hero-section p {
  font-size: 18px;
  margin-bottom: 40px;
  color: #666;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.hero-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.features-section {
  max-width: 1000px;
  margin: 0 auto;
}

.features-section h3 {
  text-align: center;
  font-size: 28px;
  margin-bottom: 40px;
  color: #333;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
}

.feature-card {
  text-align: center;
}

.feature-card h4 {
  font-size: 18px;
  margin-bottom: 15px;
  color: #333;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
}

.home-footer {
  background-color: #333;
  color: white;
  padding: 20px;
  text-align: center;
  margin-top: auto;
}

@media (max-width: 768px) {
  .home-header {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }

  .hero-section h2 {
    font-size: 28px;
  }

  .hero-buttons {
    flex-direction: column;
    align-items: center;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>

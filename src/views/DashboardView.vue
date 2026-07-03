<template>
  <el-container class="dashboard-container">
    <!-- 左侧侧边栏 -->
    <el-aside width="220px" class="sidebar">
      <div class="logo">招聘系统</div>
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical"
        background-color="#ffffff"
        text-color="#646a73"
        active-text-color="#3370ff"
        @select="handleMenuSelect"
      >
        <el-menu-item index="/dashboard/home">
          <el-icon><House /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/dashboard/cv">
          <el-icon><Document /></el-icon>
          <span>简历管理</span>
        </el-menu-item>
        <el-menu-item index="/dashboard/resume-review">
          <el-icon><Select /></el-icon>
          <span>简历审核</span>
        </el-menu-item>
        <el-menu-item index="/dashboard/interview-manage">
          <el-icon><ChatLineRound /></el-icon>
          <span>面试管理</span>
        </el-menu-item>
        <!-- 约见安排已合并到首页中 -->
        <el-menu-item index="/dashboard/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item :index="lastKnowledgePath">
          <el-icon><DocumentCopy /></el-icon>
          <span>知识库管理</span>
        </el-menu-item>
        <el-menu-item index="/dashboard/file-manager">
          <el-icon><Folder /></el-icon>
          <span>文件管理</span>
        </el-menu-item>
        <el-menu-item index="/dashboard/report-generate">
          <el-icon><Notebook /></el-icon>
          <span>面试报告管理</span>
        </el-menu-item>
        <el-menu-item index="/dashboard/positions">
          <el-icon><Setting /></el-icon>
          <span>岗位设置</span>
        </el-menu-item>
        <!-- <el-menu-item index="" disabled>
          <el-icon><DataLine /></el-icon>
          <span>数据统计</span>
        </el-menu-item>
        <el-menu-item index="" disabled>
          <el-icon><Setting /></el-icon>
          <span>系统设置</span>
        </el-menu-item> -->
      </el-menu>
      <div class="sidebar-footer">
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
          京ICP备2026039578号
        </a>
      </div>
    </el-aside>

    <el-container class="main-wrapper">
      <!-- 顶部导航栏 -->
      <el-header height="60px" class="navbar">
        <div class="nav-left">
          <!-- <span class="breadcrumb">{{ currentPageTitle }}</span> -->
          <span class="breadcrumb"></span>
        </div>
        <div class="nav-right">
          <!-- <el-input placeholder="搜索..." class="search-input">
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-badge :is-dot="true" class="notification-badge">
            <el-icon class="notification-icon"><Bell /></el-icon>
          </el-badge> -->

          <!-- 用户下拉区域 -->
          <el-dropdown trigger="click">
            <div class="user-profile">
              <el-avatar size="small" style="background-color: #3370ff; font-size: 12px; margin-right: 8px;">
                <!-- {{ currentUser?.username?.charAt(0) || '管' }} -->
              </el-avatar>
              <span class="username">{{ currentUser?.username || '管理员' }}</span>
              <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="router.push('/profile')">进入个人中心</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout" style="color: #f56c6c;">登出</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容区 — 子路由渲染 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getCurrentUser } from '../services/authService'
import authService from '../services/authService'
import { authApi } from '../api/auth'
import {
  House, Document, User, ChatLineRound, ArrowDown, DocumentCopy, Folder, Notebook, Select, Setting
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const currentUser = ref(getCurrentUser() || { id: 1, username: '管理员' })

onMounted(async () => {
  if (currentUser.value?.id) {
    try {
      const res = await authApi.getUserProfile(currentUser.value.id)
      let data = Array.isArray(res) && res.length > 0 ? res[0] : (!Array.isArray(res) ? res : null)
      if (data && data.username) {
        currentUser.value.username = data.username
      }
    } catch (e) {
      console.error('Failed to fetch user profile:', e)
    }
  }
})

// 记录知识库最后所处的完整路径（如详情页）
const lastKnowledgePath = ref('/dashboard/knowledge-base')

watch(
  () => route.path,
  (newPath) => {
    if (newPath.startsWith('/dashboard/knowledge-base')) {
      lastKnowledgePath.value = newPath
    }
  },
  { immediate: true }
)

// 菜单高亮：如果匹配到知识库的子路由，始终高亮知识库管理菜单
const activeMenu = computed(() => {
  if (route.path.startsWith('/dashboard/knowledge-base')) {
    return lastKnowledgePath.value
  }
  return route.path
})

// 面包屑标题
const pageTitleMap = {
  '/dashboard/home': '首页',
  '/dashboard/cv': '简历管理',
  '/dashboard/interview-manage': '面试管理',
  '/dashboard/users': '用户管理',
  '/dashboard/knowledge-base': '知识库管理',
  '/dashboard/file-manager': '文件管理',
  '/dashboard/report-generate': '面试报告管理',
  '/dashboard/positions': '岗位设置',
  '/dashboard/resume-review': '简历审核'
}
const currentPageTitle = computed(() => {
  if (route.path.startsWith('/dashboard/knowledge-base')) {
    return '知识库管理'
  }
  return pageTitleMap[route.path] || '首页'
})

const handleLogout = () => {
  authService.logout()
  router.push('/login')
}

const handleMenuSelect = (index) => {
  if (index) {
    router.push(index)
  }
}
</script>

<style scoped lang="scss">
/* ----- 整体布局 ----- */
.dashboard-container {
  height: 100vh;
  width: 100vw;
  background-color: #f5f6f7;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  overflow: hidden;
}

/* ----- 侧边栏样式 ----- */
.sidebar {
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
  border-right: 1px solid #dee0e3;
  position: relative;

  .logo {
    height: 60px;
    line-height: 60px;
    text-align: center;
    color: #1f2329;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 1px;
    background-color: #ffffff;
    flex-shrink: 0;
    border-bottom: 1px solid #dee0e3;
  }

  .el-menu-vertical {
    border-right: none;
    flex: 1;
    overflow-y: auto;
    padding: 12px 8px;

    .el-menu-item {
      font-size: 14px;
      height: 40px;
      line-height: 40px;
      margin: 4px 8px;
      border-radius: 6px;
      color: #646a73 !important;

      .el-icon {
        font-size: 18px;
        margin-right: 12px;
      }


      &.is-active {
        background-color: #eef2fe !important;
        color: #3370ff !important;
        font-weight: 500;
      }
      &:hover:not(.is-active):not(.is-disabled) {
        background-color: #f5f6f7 !important;
      }
    }
  }

  .sidebar-footer {
    flex-shrink: 0;
    padding: 12px 16px;
    border-top: 1px solid #f0f0f0;
    text-align: left;

    a {
      font-size: 11px;
      color: #bbb;
      text-decoration: none;
      &:hover {
        color: #3370ff;
      }
    }
  }
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background-color: #f5f6f7;
}

/* ----- 顶部导航栏样式 ----- */
.navbar {
  background-color: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  box-shadow: none;
  border-bottom: 1px solid #dee0e3;
  z-index: 10;
  flex-shrink: 0;

  .nav-left {
    .breadcrumb {
      font-size: 16px;
      font-weight: 600;
      color: #1f2329;
    }
  }

  .nav-right {
    display: flex;
    align-items: center;
    gap: 24px;

    .search-input {
      width: 220px;
      :deep(.el-input__wrapper) {
        border-radius: 6px;
        background-color: #f5f6f7;
        box-shadow: 0 0 0 1px transparent inset;
        &:hover, &.is-focus {
          box-shadow: 0 0 0 1px #3370ff inset;
          background-color: #ffffff;
        }
      }
    }

    .notification-badge {
      cursor: pointer;
      display: flex;
      align-items: center;
      .notification-icon {
        font-size: 20px;
        color: #646a73;
        &:hover {
          color: #3370ff;
        }
      }
    }

    .user-profile {
      display: flex;
      align-items: center;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: background-color 0.2s;

      &:hover {
        background-color: #f5f6f7;
      }

      .username {
        font-size: 14px;
        color: #1f2329;
        margin-right: 4px;
        font-weight: 500;
      }
      .dropdown-icon {
        font-size: 12px;
        color: #8f959e;
      }
    }
  }
}

/* ----- 核心画布区域 ----- */
.main-content {
  padding: 24px 32px;
  overflow-y: auto;
  box-sizing: border-box;
}

/* 全局滚动条美化 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background-color: rgba(144, 147, 153, 0.3);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background-color: rgba(144, 147, 153, 0.5);
}
</style>

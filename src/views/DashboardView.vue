<template>
  <el-container class="dashboard-container" :class="{ 'theme-dark': isDark, 'theme-light': !isDark }">
    <!-- 左侧侧边栏 -->
    <el-aside width="240px" class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="url(#g)"/>
            <path d="M10 22V12l6 8 6-8v10" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            <defs><linearGradient id="g" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#6366f1"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs>
          </svg>
        </div>
        <div class="brand-text">
          <span class="brand-name">YinuoAI</span>
          <span class="brand-sub">招聘系统</span>
        </div>
      </div>

      <div class="sidebar-nav">
        <div class="nav-section-label">主菜单</div>
        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          background-color="transparent"
          :text-color="isDark ? '#94a3b8' : '#64748b'"
          :active-text-color="isDark ? '#e2e8f0' : '#4f46e5'"
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
        </el-menu>

        <div class="nav-section-label">系统管理</div>
        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          background-color="transparent"
          :text-color="isDark ? '#94a3b8' : '#64748b'"
          :active-text-color="isDark ? '#e2e8f0' : '#4f46e5'"
          @select="handleMenuSelect"
        >
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
        </el-menu>
      </div>

      <!-- 主题切换按钮 -->
      <div class="sidebar-footer">
        <button class="theme-toggle" @click="toggleTheme" :title="isDark ? '切换为白天模式' : '切换为黑夜模式'">
          <!-- 太阳图标（亮色模式） -->
          <svg v-if="isDark" class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <!-- 月亮图标（暗色模式） -->
          <svg v-else class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
          <span class="theme-label">{{ isDark ? '白天模式' : '黑夜模式' }}</span>
        </button>
      </div>
    </el-aside>

    <el-container class="main-wrapper">
      <!-- 顶部导航栏 -->
      <el-header height="56px" class="navbar">
        <div class="nav-left">
          <div class="nav-breadcrumb">
            <span class="breadcrumb-current">{{ currentPageTitle }}</span>
          </div>
          <button class="btn-guide-nav" @click="startGuide" title="页面引导">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>页面引导</span>
          </button>
        </div>
        <div class="nav-right">
          <el-dropdown trigger="click">
            <div class="nav-user-btn">
              <el-avatar :size="30" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); font-size: 12px;">
                {{ currentUser?.username?.charAt(0)?.toUpperCase() || 'A' }}
              </el-avatar>
              <el-icon class="nav-drop-arrow"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="router.push('/profile')">
                  <el-icon><User /></el-icon> 个人中心
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout" style="color: #ef4444;">
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容区 -->
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
  House, Document, User, ChatLineRound, ArrowDown,
  DocumentCopy, Folder, Notebook, Select, Setting, SwitchButton
} from '@element-plus/icons-vue'
import { driver } from 'driver.js'

const router = useRouter()
const route = useRoute()
const currentUser = ref(getCurrentUser() || { id: 1, username: '管理员' })

// ============================================================
//  主题切换
// ============================================================
const isDark = ref(true)

function applyTheme(dark) {
  isDark.value = dark
  localStorage.setItem('theme', dark ? 'dark' : 'light')
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
}

function toggleTheme() {
  applyTheme(!isDark.value)
}

onMounted(() => {
  // 从 localStorage 读取主题偏好，默认暗色
  const saved = localStorage.getItem('theme')
  applyTheme(saved !== 'light')

  if (currentUser.value?.id) {
    try {
      authApi.getUserProfile(currentUser.value.id).then(res => {
        let data = Array.isArray(res) && res.length > 0 ? res[0] : (!Array.isArray(res) ? res : null)
        if (data && data.username) currentUser.value.username = data.username
      }).catch(e => console.error('Failed to fetch user profile:', e))
    } catch (e) {}
  }
})

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

const activeMenu = computed(() => {
  if (route.path.startsWith('/dashboard/knowledge-base')) return lastKnowledgePath.value
  return route.path
})

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
  if (route.path.startsWith('/dashboard/knowledge-base')) return '知识库管理'
  return pageTitleMap[route.path] || '首页'
})

// ============================================================
//  页面引导
// ============================================================
const guideSteps = {
  '/dashboard/home': [
    { element: '.stats-grid', popover: { title: '数据概览', description: '6 个核心指标卡片：简历总数、待审阅、待面试、待决策、今日面试、岗位数量。点击卡片可跳转对应管理页面。', side: 'bottom', align: 'start' } },
    { element: '.panel-calendar', popover: { title: '面试日历', description: '迷你月历视图，有面试的日期会显示橙色小点。点击日期可快速切换右侧日程。', side: 'right', align: 'start' } },
    { element: '.panel-schedule', popover: { title: '约见安排', description: '本周面试日程时间轴。彩色卡片代表不同状态的面试，点击可跳转详情，右键可快速操作。', side: 'left', align: 'start' } },
    { element: '.btn-schedule-new', popover: { title: '新建面试', description: '准备好后点击此处预约新面试。', side: 'bottom' } },
    { element: '.nav-user-btn', popover: { title: '个人中心', description: '右上角头像按钮：点击可展开菜单，进入个人中心或退出登录。', side: 'bottom', align: 'end' } },
    { element: '.theme-toggle', popover: { title: '主题切换', description: '左下角按钮可在亮色/暗色模式之间切换。偏好会自动保存，下次访问时保持你的选择。', side: 'top', align: 'start' } },
  ],
  '/dashboard/cv': [
    { element: '.action-btn-group', popover: { title: '上传简历', description: '点击"添加简历"上传单个简历文件（PDF/Word），或点击"批量导入"一次性选择多个文件。上传后系统自动解析简历内容，进度以圆形百分比显示。', side: 'bottom', align: 'end' } },
    { element: '.list-header-row', popover: { title: '简历列表', description: '上传的简历在此展示。列表显示候选人姓名、文件格式、解析状态（绿点=已解析，蓝点旋转=解析中）、审核状态（待审核/已通过/待定/淘汰）和更新时间。', side: 'bottom', align: 'start' } },
    { element: '.list-row:nth-child(1) .col-action', popover: { title: '行操作', description: '每行右侧可操作：下载原始文件、重新解析更新简历内容、删除。审核通过的简历旁边会出现"创建面试"入口。双击候选人行可打开详情抽屉。', side: 'left', align: 'start' } },
    { element: '.batch-action-bar', popover: { title: '批量操作', description: '勾选多行后此处出现批量操作栏，可一键批量删除所选简历。表头复选框可全选/取消当前页所有简历。', side: 'bottom', align: 'start' } },
    { element: '.lark-drawer, [class*=\"drawer\"]', popover: { title: '候选人详情抽屉', description: '双击任意简历行打开右侧抽屉，展示完整候选人信息。顶部可重新解析、编辑详情、预览原始简历。下方"AI 智能专项解析"可查看 AI 自动提取的教育经历、工作经历、核心技能、项目经验。', side: 'left', align: 'start' } },
  ],
  '/dashboard/resume-review': [
    { element: '.filter-tabs', popover: { title: '状态筛选', description: '按审核状态快速筛选候选人：全部、待审核、已通过、待定、淘汰。点击标签即可切换。', side: 'bottom', align: 'start' } },
    { element: '.filter-group-actions .el-button, .el-button--primary', popover: { title: '批量 AI 审核', description: '选中多份简历后，点击此处让 AI 一次性自动审核。AI 会分析简历内容并给出"建议通过""建议待定""建议淘汰"的意见，辅助您高效决策。', side: 'bottom', align: 'end' } },
    { element: '.col-ai-review', popover: { title: 'AI 建议列', description: '每份简历的 AI 审核结果在此展示。绿色=建议通过，橙色=建议待定，红色=建议淘汰。点击标签可查看 AI 详细分析。没有 AI 审核的简历此项为空，可手动勾选后批量审核。', side: 'left', align: 'start' } },
    { element: '.row-actions', popover: { title: '快速操作', description: '每行右侧可直接操作：通过/待定/淘汰一键审核；已通过的候选人可直接创建面试；点击"详情"可切换为逐页预览模式，边看简历边做决策。', side: 'left', align: 'start' } },
  ],
  '/dashboard/interview-manage': [
    { element: '.action-btn-group', popover: { title: '新建面试', description: '点击"新增线上面试"或"新增线下面试"创建面试安排。打开的弹窗中可选择候选人、填写时间、选择岗位和面试轮次。', side: 'bottom', align: 'end' } },
    { element: '.list-header-row', popover: { title: '面试列表', description: '所有面试在此集中展示。可看到候选人信息、预约时间、面试状态（已预约/进行中/已完成/已取消）、会议类型和面试流程进度。', side: 'bottom', align: 'start' } },
    { element: '.col-rounds', popover: { title: '面试流程', description: '每场面试可设置多轮面试流程（如初试→复试→终面）。点击每轮节点可弹出操作菜单，标注该轮为"通过""淘汰"或"待定"。前序轮次未通过时，后续轮次自动锁定。', side: 'left', align: 'start' } },
    { element: '.col-action', popover: { title: '操作按钮', description: '每行右侧提供：启动 ASR（开启 AI 语音识别辅助面试）、查看面试报告（面试完成后查看 AI 评估）、编辑面试信息、删除面试。', side: 'left', align: 'start' } },
    { element: '.col-check', popover: { title: '批量操作', description: '勾选多行后，顶部出现"已选择 N 项"工具栏，可批量删除。结合搜索和状态筛选，快速定位目标面试。', side: 'right', align: 'start' } },
  ],
  '/dashboard/users': [
    { element: '.el-table', popover: { title: '用户列表', description: '系统所有用户账号在此展示，包括管理员、面试官、HR 等角色。', side: 'bottom', align: 'start' } },
    { popover: { title: '用户管理', description: '可添加新用户、编辑用户信息（角色、部门等）、删除或禁用账号。请谨慎操作删除，数据不可恢复。' } },
  ],
  '/dashboard/knowledge-base': [
    { popover: { title: '知识库管理', description: '上传企业知识文档（岗位说明书、面试题库、制度文件等），AI 将基于知识库内容辅助面试问答。点击左侧知识库名称进入详情。' } },
    { popover: { title: '知识库操作', description: '每个知识库可上传文档、搜索内容。系统自动解析文档并建立索引，供面试时实时检索使用。' } },
  ],
  '/dashboard/file-manager': [
    { element: '.el-table', popover: { title: '文件列表', description: '系统产生的所有文件在此集中展示：简历附件、面试录音、转写文本、评估报告等。', side: 'bottom', align: 'start' } },
    { popover: { title: '文件操作', description: '可按类型筛选文件，点击下载获取原始文件。通过"关联面试"可定位到对应面试详情。' } },
  ],
  '/dashboard/report-generate': [
    { popover: { title: '面试报告', description: '所有 AI 生成的面试评估报告在此展示。包含候选人的综合评分、各维度分析、面试建议等。报告仅供辅助参考，最终决策需人工复核。' } },
    { popover: { title: '报告操作', description: '点击报告可查看详细内容。支持导出 PDF 版本。如需重新生成报告，请进入对应面试详情页操作。' } },
  ],
  '/dashboard/positions': [
    { element: '.el-table, [class*=\"position\"]', popover: { title: '岗位列表', description: '所有招聘岗位在此展示，包含岗位名称、部门、状态等信息。', side: 'bottom', align: 'start' } },
    { popover: { title: '岗位设置', description: '可添加新岗位、编辑岗位信息（职责、要求等）。每个岗位可配置多轮面试流程。启用/停用控制岗位是否对外展示。' } },
  ],
}

function startGuide() {
  const path = route.path
  // 模糊匹配：知识库子路径统一使用知识库引导
  let key = path
  if (path.startsWith('/dashboard/knowledge-base')) key = '/dashboard/knowledge-base'
  const steps = guideSteps[key]
  if (!steps) return

  const tour = driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    doneBtnText: '知道了',
    closeBtnText: '跳过',
    nextBtnText: '下一步',
    prevBtnText: '上一步',
    progressText: '{{current}} / {{total}}',
    steps,
  })
  tour.drive()
}

const handleLogout = () => {
  authService.logout()
  router.push('/login')
}

const handleMenuSelect = (index) => {
  if (index) router.push(index)
}
</script>

<style scoped lang="scss">
/* ================================================================
   Theme Variables
   ================================================================ */
.theme-dark {
  --sidebar-bg: #0f172a;
  --sidebar-hover: rgba(255, 255, 255, 0.06);
  --sidebar-active: rgba(99, 102, 241, 0.18);
  --sidebar-text: #94a3b8;
  --sidebar-text-active: #e2e8f0;
  --sidebar-section: #475569;
  --sidebar-border: rgba(255, 255, 255, 0.06);
  --sidebar-brand-name: #f1f5f9;
  --sidebar-brand-sub: #64748b;

  --navbar-bg: rgba(255, 255, 255, 0.85);
  --navbar-border: #e2e8f0;
  --navbar-text: #0f172a;

  --text-main: #0f172a;
  --text-secondary: #475569;

  --toggle-bg: rgba(255, 255, 255, 0.06);
  --toggle-hover: rgba(255, 255, 255, 0.1);
  --toggle-text: #94a3b8;
}

.theme-light {
  --sidebar-bg: #ffffff;
  --sidebar-hover: rgba(99, 102, 241, 0.05);
  --sidebar-active: rgba(99, 102, 241, 0.08);
  --sidebar-text: #64748b;
  --sidebar-text-active: #4f46e5;
  --sidebar-section: #94a3b8;
  --sidebar-border: #e2e8f0;
  --sidebar-brand-name: #0f172a;
  --sidebar-brand-sub: #94a3b8;

  --navbar-bg: rgba(255, 255, 255, 0.9);
  --navbar-border: #e2e8f0;
  --navbar-text: #0f172a;

  --text-main: #0f172a;
  --text-secondary: #475569;

  --toggle-bg: rgba(99, 102, 241, 0.06);
  --toggle-hover: rgba(99, 102, 241, 0.1);
  --toggle-text: #6366f1;
}

$accent: #6366f1;
$accent-light: #818cf8;

/* ----- 整体布局 ----- */
.dashboard-container {
  height: 100vh;
  width: 100vw;
  background-color: var(--color-bg-page);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow: hidden;
}

/* ================================================================
   SIDEBAR
   ================================================================ */
.sidebar {
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--sidebar-border);
  transition: background 0.35s ease, width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

/* --- Brand --- */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 20px 24px;
  border-bottom: 1px solid var(--sidebar-border);
  transition: border-color 0.35s;
}

.brand-icon {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  svg { width: 100%; height: 100%; }
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.brand-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--sidebar-brand-name);
  letter-spacing: -0.3px;
  line-height: 1.2;
  transition: color 0.35s;
}

.brand-sub {
  font-size: 11px;
  color: var(--sidebar-brand-sub);
  letter-spacing: 0.5px;
  transition: color 0.35s;
}

/* --- Navigation --- */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;

  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.2);
    border-radius: 3px;
  }
}

.nav-section-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--sidebar-section);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  padding: 8px 12px 6px;
  margin-top: 4px;
  transition: color 0.35s;
}

.sidebar-menu {
  border-right: none !important;

  :deep(.el-menu-item) {
    height: 38px;
    line-height: 38px;
    margin: 1px 0;
    border-radius: 8px;
    font-size: 13.5px;
    font-weight: 450;
    padding-left: 12px !important;
    transition: all 0.2s ease;

    .el-icon {
      font-size: 17px;
      margin-right: 10px;
      transition: opacity 0.2s;
    }

    &:hover {
      background: var(--sidebar-hover) !important;

      .el-icon { opacity: 1; }
    }

    &.is-active {
      background: var(--sidebar-active) !important;
      font-weight: 550;
      position: relative;

      .el-icon {
        opacity: 1;
        color: $accent-light;
      }

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 8px;
        bottom: 8px;
        width: 3px;
        border-radius: 0 3px 3px 0;
        background: $accent;
      }
    }
  }
}

/* --- Sidebar Footer (Theme Toggle) --- */
.sidebar-footer {
  padding: 12px;
  border-top: 1px solid var(--sidebar-border);
  transition: border-color 0.35s;
}

.theme-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  border: none;
  border-radius: 10px;
  background: var(--toggle-bg);
  color: var(--toggle-text);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  transition: all 0.2s ease;

  &:hover {
    background: var(--toggle-hover);
  }

  &:active {
    transform: scale(0.97);
  }
}

.theme-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.theme-label {
  white-space: nowrap;
}

/* ================================================================
   MAIN WRAPPER
   ================================================================ */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--color-bg-page);
  transition: background 0.35s;
}

/* ================================================================
   NAVBAR
   ================================================================ */
.navbar {
  background: var(--navbar-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 28px;
  border-bottom: 1px solid var(--navbar-border);
  z-index: 10;
  flex-shrink: 0;
  transition: background 0.35s, border-color 0.35s;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-guide-nav {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid var(--navbar-border, #e2e8f0);
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-secondary, #64748b);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #6366f1;
    color: #6366f1;
    background: rgba(99, 102, 241, 0.06);
  }
}

.nav-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
}

.breadcrumb-current {
  font-size: 15px;
  font-weight: 600;
  color: var(--navbar-text);
  letter-spacing: -0.2px;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-user-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px 3px 3px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;

  &:hover {
    background: #f1f5f9;
    border-color: #e2e8f0;
  }
}

.nav-drop-arrow {
  font-size: 11px;
  color: #94a3b8;
}

/* ================================================================
   MAIN CONTENT
   ================================================================ */
.main-content {
  padding: 24px 28px;
  overflow-y: auto;
  box-sizing: border-box;
  background: transparent;
}

/* 全局滚动条 */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.3);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background-color: rgba(148, 163, 184, 0.5);
}
</style>

import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from '../services/authService'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue')
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/RegisterView.vue')
  },
  {
    path: '/forgot-password',
    name: 'forgotPassword',
    component: () => import('../views/ForgotPasswordView.vue')
  },
  {
    path: '/reset-password',
    name: 'resetPassword',
    component: () => import('../views/ResetPasswordView.vue')
  },
  {
    path: '/dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true },
    redirect: '/dashboard/home',
    children: [
      {
        path: 'home',
        name: 'dashboardHome',
        component: () => import('../views/dashboard/DashboardHome.vue')
      },
      {
        path: 'cv',
        name: 'cvManage',
        component: () => import('../views/dashboard/CvView.vue')
      },
      {
        path: 'interview-manage',
        name: 'interviewManage',
        component: () => import('../views/dashboard/InterviewManageView.vue')
      },
      {
        path: 'appointment',
        name: 'appointment',
        component: () => import('../views/dashboard/AppointmentView.vue')
      },
      {
        path: 'users',
        name: 'userManage',
        component: () => import('../views/dashboard/UserManageView.vue')
      },
      {
        path: 'knowledge-base',
        name: 'knowledgeBase',
        component: () => import('../views/dashboard/KnowledgeBaseView.vue')
      },
      {
        path: 'knowledge-base/:id',
        name: 'knowledgeBaseDetail',
        component: () => import('../views/dashboard/KnowledgeBaseDetailView.vue')
      },
      {
        path: 'file-manager',
        name: 'fileManager',
        component: () => import('../views/dashboard/FileManagerView.vue')
      },
      {
        path: 'report-generate',
        name: 'reportGenerate',
        component: () => import('../views/dashboard/ReportGenerateView.vue')
      }
    ]
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/ProfileView.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/interview',
    name: 'interview',
    component: () => import('../views/InterviewView.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/interview/:sessionId',
    name: 'interviewWithSession',
    component: () => import('../views/InterviewView.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/interview-assistant/:id',
    name: 'interviewAssistant',
    component: () => import('../views/InterviewAssistantView.vue'),
    meta: {
      requiresAuth: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

//路由守卫
router.beforeEach((to, from, next) => {
  const isAuth = isAuthenticated()

  // 已登录状态下访问 首页、登录、注册 页面，直接跳转到控制台
  if (isAuth && ['home', 'login', 'register'].includes(to.name)) {
    next({ path: '/dashboard' })
    return
  }

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuth) {
      next({ name: 'login' })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router

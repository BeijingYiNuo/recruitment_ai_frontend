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
      },
      {
        path: 'positions',
        name: 'positionSettings',
        component: () => import('../views/dashboard/PositionSettingsView.vue')
      },
      {
        path: 'resume-review',
        name: 'resumeReview',
        component: () => import('../views/dashboard/ResumeReviewView.vue')
      },
      {
        path: 'recharge',
        name: 'recharge',
        component: () => import('../views/dashboard/RechargeView.vue')
      },
      {
        path: 'transactions',
        name: 'transactions',
        component: () => import('../views/dashboard/TransactionsView.vue')
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
    path: '/interview/:sessionId/:roundId?',
    name: 'interviewWithSession',
    component: () => import('../views/InterviewView.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/interview-assistant/:sessionId/:roundId',
    name: 'interviewAssistant',
    component: () => import('../views/InterviewAssistantView.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/privacy-policy',
    name: 'privacyPolicy',
    component: () => import('../views/PrivacyPolicyView.vue')
  },
  {
    path: '/terms-of-service',
    name: 'termsOfService',
    component: () => import('../views/TermsOfServiceView.vue')
  },
  {
    path: '/paid-service-agreement',
    name: 'paidServiceAgreement',
    component: () => import('../views/PaidServiceAgreementView.vue')
  },
  {
    path: '/interview/candidate/:token',
    name: 'candidateInterview',
    component: () => import('../views/candidate/CandidateInterviewView.vue'),
    meta: { requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫（Vue Router 4.x：直接 return 目标路径，不要调用 next()）
router.beforeEach((to, from) => {
  const isAuth = isAuthenticated()

  // 已登录状态下访问 首页、登录、注册 页面，直接跳转到控制台
  if (isAuth && ['home', 'login', 'register'].includes(to.name)) {
    return { path: '/dashboard' }
  }

  if (to.matched.some(record => record.meta.requiresAuth) && !isAuth) {
    return { name: 'login' }
  }
})

export default router

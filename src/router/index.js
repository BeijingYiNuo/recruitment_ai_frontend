import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'
import DashboardView from '../views/DashboardView.vue'
import InterviewView from '../views/InterviewView.vue'
import ProfileView from '../views/ProfileView.vue'

// Dashboard 子视图
import DashboardHome from '../views/dashboard/DashboardHome.vue'
import CvView from '../views/dashboard/CvView.vue'
import InterviewManageView from '../views/dashboard/InterviewManageView.vue'
import AppointmentView from '../views/dashboard/AppointmentView.vue'

import { isAuthenticated } from '../services/authService'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView
  },
  {
    path: '/forgot-password',
    name: 'forgotPassword',
    component: ForgotPasswordView
  },
  {
    path: '/reset-password',
    name: 'resetPassword',
    component: ResetPasswordView
  },
  {
    path: '/dashboard',
    component: DashboardView,
    meta: { requiresAuth: true },
    redirect: '/dashboard/home',
    children: [
      {
        path: 'home',
        name: 'dashboardHome',
        component: DashboardHome
      },
      {
        path: 'cv',
        name: 'cvManage',
        component: CvView
      },
      {
        path: 'interview-manage',
        name: 'interviewManage',
        component: InterviewManageView
      },
      {
        path: 'appointment',
        name: 'appointment',
        component: AppointmentView
      }
    ]
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/interview',
    name: 'interview',
    component: InterviewView,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/interview/:sessionId',
    name: 'interviewWithSession',
    component: InterviewView,
    meta: {
      requiresAuth: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated()) {
      next({ name: 'login' })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router

<template>
  <div class="feishu-profile">
    <header class="feishu-header">
      <div class="header-inner">
        <div class="header-left">
          <button class="lark-back-btn" @click="$router.push('/dashboard')">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <h1 class="page-title">个人信息中心</h1>
        </div>
      </div>
    </header>

    <main class="feishu-main">
      <div class="feishu-card">
        <div class="card-header">
          <h2 class="card-title">基础账户信息</h2>
          <button class="lark-btn-primary small-btn" @click="handleEdit">编辑信息</button>
        </div>
        
        <div class="lark-descriptions">
          <div class="lark-desc-item">
            <div class="lark-desc-label">账号</div>
            <div class="lark-desc-value">
              <span class="text-bold">{{ userProfile.username }}</span>
            </div>
          </div>

          <div class="lark-desc-item">
            <div class="lark-desc-label">昵称</div>
            <div class="lark-desc-value">
              <span class="text-bold">{{ userProfile.nickname || '未设置' }}</span>
            </div>
          </div>

          <div class="lark-desc-item">
            <div class="lark-desc-label">注册邮箱</div>
            <div class="lark-desc-value">{{ userProfile.email || '未绑定邮箱' }}</div>          </div>
          
          <div class="lark-desc-item">
            <div class="lark-desc-label">绑定手机号</div>
            <div class="lark-desc-value">{{ userProfile.phone || '尚未绑定手机号' }}</div>
          </div>

          <div class="lark-desc-item">
            <div class="lark-desc-label">系统角色</div>
            <div class="lark-desc-value">
              <div v-if="userProfile.role === 'admin'" class="dot-status danger">
                <span class="dot"></span><span class="text">系统管理员</span>
              </div>
              <div v-else-if="userProfile.role === 'recruiter'" class="dot-status primary">
                <span class="dot"></span><span class="text">招聘官</span>
              </div>
              <div v-else-if="userProfile.role === 'candidate'" class="dot-status success">
                <span class="dot"></span><span class="text">候选人</span>
              </div>
              <div v-else class="dot-status gray">
                <span class="dot"></span><span class="text">{{ userProfile.role }}</span>
              </div>
            </div>
          </div>

</div>
        
        <div class="lark-section-divider"></div>
        
        <div class="card-header">
          <h3 class="card-subtitle">用户登录日志</h3>
        </div>
        
        <div class="lark-descriptions format-horizontal">
          <div class="lark-desc-item">
            <div class="lark-desc-label">账户创建时间</div>
            <div class="lark-desc-value text-tertiary font-mono">{{ userProfile.created_at }}</div>
          </div>
          <div class="lark-desc-item">
            <div class="lark-desc-label">最后登录时间</div>
            <div class="lark-desc-value text-tertiary font-mono">{{ userProfile.last_login_at }}</div>
          </div>
        </div>
      </div>

      <!-- 编辑个人信息弹窗组件 -->
      <UserEditModal
        v-model:visible="editDialogVisible"
        :user-data="userProfile"
        :show-role="false"
        title="修改个人信息"
        @success="fetchProfile"
      />

      <!-- 充值与消费卡片 -->
      <div class="feishu-card" style="margin-top: 16px;">
        <div class="card-header">
          <h2 class="card-title">充值与消费</h2>
          <router-link to="/dashboard/transactions" class="lark-link">查看全部</router-link>
        </div>

        <!-- 余额概览 -->
        <div class="balance-overview">
          <div class="balance-info">
            <span class="balance-label">当前余额</span>
            <span class="balance-amount">¥{{ accountInfo.balance.toFixed(2) }}</span>
          </div>
          <button class="lark-btn-primary small-btn" @click="goRecharge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;">
              <path d="M12 5v14M5 12h14" stroke-linecap="round"/>
            </svg>
            去充值
          </button>
        </div>

        <div class="lark-section-divider"></div>

        <!-- 充值记录折叠 -->
        <div style="margin-top: 16px;">
          <span class="lark-toggle" @click="showRecharge = !showRecharge">
            {{ showRecharge ? '收起' : '展开' }}充值记录
            <svg :class="['chevron', { open: showRecharge }]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </span>
          <div v-show="showRecharge" style="margin-top: 12px;">
            <div v-if="recentRecharges.length === 0" class="empty-hint">暂无充值记录</div>
            <table v-else class="lark-table">
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>金额</th>
                  <th>方式</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="tx in recentRecharges" :key="tx.order_no">
                  <td class="font-mono">{{ tx.order_no }}</td>
                  <td class="amount-cell">¥{{ Math.abs(tx.amount).toFixed(2) }}</td>
                  <td>
                    <span :class="['pay-badge', tx.payment_method]">
                      {{ paymentMethodLabel(tx.payment_method) }}
                    </span>
                  </td>
                  <td class="text-tertiary">{{ formatTime(tx.paid_at || tx.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 消费记录折叠 -->
        <div style="margin-top: 12px;">
          <span class="lark-toggle" @click="showConsume = !showConsume">
            {{ showConsume ? '收起' : '展开' }}消费记录
            <svg :class="['chevron', { open: showConsume }]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </span>
          <div v-show="showConsume" style="margin-top: 12px;">
            <div v-if="recentConsumes.length === 0" class="empty-hint">暂无消费记录</div>
            <table v-else class="lark-table">
              <thead>
                <tr>
                  <th>面试详情</th>
                  <th>服务</th>
                  <th>金额</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="tx in recentConsumes" :key="tx.order_no">
                  <td>
                    <div class="session-info">
                      <span class="session-candidate">{{ tx.session_info?.candidate_name || '--' }}</span>
                      <span class="session-round">{{ tx.session_info ? `第${tx.session_info.round_number}轮 · ${tx.session_info.round_name}` : '--' }}</span>
                    </div>
                  </td>
                  <td>
                    <el-tag size="small" :type="tx.service_type === 'interview_reserve' ? 'primary' : 'warning'" effect="plain">
                      {{ serviceTypeLabel(tx.service_type) }}
                    </el-tag>
                  </td>
                  <td class="amount-cell consume">-¥{{ Math.abs(tx.amount).toFixed(2) }}</td>
                  <td class="text-tertiary">{{ formatTime(tx.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { authApi } from '../api/auth'
import { accountApi } from '../api/account'
import { getCurrentUser } from '../services/authService'
import UserEditModal from '../components/UserEditModal.vue'

const router = useRouter()
const editDialogVisible = ref(false)
const showConsume = ref(false)
const showRecharge = ref(false)

const userProfile = ref({
  id: '--',
  username: '加载中...',
  nickname: '--',
  email: '--',
  phone: '--',
  role: '--',
  created_at: '--',
  last_login_at: '--'
})

const accountInfo = ref({
  balance: 0,
  total_recharged: 0,
  total_consumed: 0,
})

const allTransactions = ref([])

const recentRecharges = computed(() =>
  allTransactions.value.filter(tx => tx.type === 'RECHARGE' && tx.status === 'PAID').slice(0, 5)
)

const recentConsumes = computed(() =>
  allTransactions.value.filter(tx => tx.type === 'CONSUME').slice(0, 10)
)

const formatTime = (timeStr) => {
  if (!timeStr || timeStr === '--') return '--'
  return timeStr.replace('T', ' ').substring(0, 19)
}

const paymentMethodLabel = (method) => {
  const map = { wxpay: '微信支付', alipay: '支付宝', qqpay: 'QQ钱包', tenpay: '财付通', balance: '余额' }
  return map[method] || method || '--'
}

const serviceTypeLabel = (type) => {
  const map = { interview_reserve: '面试', report_generate: '报告' }
  return map[type] || type || '--'
}

const goRecharge = () => {
  router.push('/dashboard/recharge')
}

const fetchProfile = async () => {
  try {
    const currentUser = getCurrentUser()
    if (!currentUser || !currentUser.id) {
      throw new Error('未获取到当前登录用户的 ID，请重新登录。')
    }

    const res = await authApi.getUserProfile(currentUser.id)

    let data;
    if (Array.isArray(res) && res.length > 0) {
      data = res[0]
    } else if (res && !Array.isArray(res)) {
      data = res
    } else {
      throw new Error('未获取到有效的个人信息数据')
    }

    userProfile.value = {
      id: data.id ?? '--',
      username: data.username || '未知用户',
      nickname: data.nickname || '未设置',
      email: data.email || '未绑定邮箱',
      phone: data.phone || '未绑定手机号',
      role: data.role || '--',
      created_at: formatTime(data.created_at),
      last_login_at: formatTime(data.last_login_at)
    }
  } catch (error) {
    ElMessage.error('获取个人信息失败: ' + (error?.detail || error?.message || '未知错误'))
  }
}

const fetchAccount = async () => {
  try {
    const balanceRes = await accountApi.getBalance()
    accountInfo.value = {
      balance: balanceRes.balance ?? 0,
      total_recharged: balanceRes.total_recharged ?? 0,
      total_consumed: balanceRes.total_consumed ?? 0,
    }

    const txRes = await accountApi.getTransactions({ page: 1, page_size: 20 })
    allTransactions.value = txRes.items || []
  } catch (error) {
    // 账户/支付模块尚未启用时静默处理
    if (error?.code !== 'INSUFFICIENT_BALANCE') {
      console.warn('获取账户信息失败（可忽略）:', error?.detail || error?.message || error)
    }
  }
}

const handleEdit = () => {
  editDialogVisible.value = true
}

onMounted(() => {
  fetchProfile()
  fetchAccount()
})
</script>

<style scoped lang="scss">
/* --- 飞书风格重构 (Lark Design System) --- */
$primary-color: #3370ff;
$primary-hover: #2458d9;
$bg-color: #f5f6f7;
$bg-white: #ffffff;
$text-main: #1f2329;
$text-secondary: #646a73;
$text-tertiary: #8f959e;
$border-color: #dee0e3;

.feishu-profile {
  font-family: "Lark Sans", "Lark Unicode", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: $bg-color;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* --- Header --- */
.feishu-header {
  height: 64px;
  background-color: $bg-white;
  border-bottom: 1px solid rgba(31, 35, 41, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  max-width: 1000px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.lark-back-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid transparent;
  background-color: transparent;
  color: $text-secondary;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
  
  &:hover {
    background-color: rgba(31, 35, 41, 0.08);
    color: $text-main;
  }
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: $text-main;
  margin: 0;
}

/* Dot Status Indicator */
.dot-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}

.dot-status .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #dee0e3;
  transition: all 0.2s ease;
}

.dot-status.success .dot { background-color: #13a248; box-shadow: 0 0 0 3px rgba(19, 162, 72, 0.15); }
.dot-status.danger .dot { background-color: #f54a45; box-shadow: 0 0 0 3px rgba(245, 74, 69, 0.15); }
.dot-status.primary .dot { background-color: #3370ff; box-shadow: 0 0 0 3px rgba(51, 112, 255, 0.15); }
.dot-status.gray .dot { background-color: #8f959e; box-shadow: 0 0 0 3px rgba(143, 149, 158, 0.15); }

.dot-status .text {
  color: #1f2329;
}

/* ID Text */
.id-text {
  font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace;
  background-color: #f5f6f7;
  padding: 2px 6px;
  border-radius: 4px;
  color: #646a73;
  font-size: 13px;
  border: 1px solid #dee0e3;
  letter-spacing: 0.5px;
}

/* --- Main Content --- */
.feishu-main {
  flex: 1;
  padding: 32px 24px;
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.feishu-card {
  background: $bg-white;
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 4px rgba(0, 0, 0, 0.02);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: $text-main;
  margin: 0;
}

.card-subtitle {
  font-size: 16px;
  font-weight: 600;
  color: $text-main;
  margin: 0;
}

/* Buttons */
.lark-btn-primary {
  background-color: $primary-color;
  border: none;
  color: #fff;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: $primary-hover;
  }
  
  &.small-btn {
    height: 32px;
    padding: 0 16px;
  }
}

/* Descriptions */
.lark-descriptions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 8px;
  
  &.format-horizontal {
    gap: 16px;
  }
}

.lark-desc-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  
  .format-horizontal & {
    flex-direction: row;
    align-items: center;
    gap: 16px;
  }
}

.lark-desc-label {
  font-size: 14px;
  color: $text-secondary;
  
  .format-horizontal & {
    min-width: 100px;
  }
}

.lark-desc-value {
  font-size: 14px;
  color: $text-main;
  min-height: 24px;
  display: flex;
  align-items: center;
}

.text-bold {
  font-weight: 600;
}

.text-tertiary {
  color: $text-tertiary;
}

.font-mono {
  font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace;
}

.lark-section-divider {
  height: 1px;
  background-color: $border-color;
  margin: 32px 0;
}

/* --- 充值消费卡片 --- */
.balance-overview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0 8px;
}

.balance-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.balance-label {
  font-size: 14px;
  color: #646a73;
}

.balance-amount {
  font-size: 28px;
  font-weight: 700;
  color: #1f2329;
  letter-spacing: -0.5px;
}

.lark-link {
  font-size: 14px;
  color: #3370ff;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.lark-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  th {
    text-align: left;
    padding: 8px 12px;
    color: #8f959e;
    font-weight: 500;
    border-bottom: 1px solid #dee0e3;
  }

  td {
    padding: 10px 12px;
    border-bottom: 1px solid #f5f6f7;
  }

  tbody tr:hover {
    background-color: #fafafa;
  }
}

.amount-cell {
  font-weight: 600;
  color: #13a248;

  &.consume {
    color: #f54a45;
  }
}

.pay-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;

  &.wxpay {
    background-color: #e8f5e9;
    color: #13a248;
  }

  &.alipay {
    background-color: #e3f2fd;
    color: #3370ff;
  }
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.session-candidate {
  font-weight: 600;
  color: #1f2329;
  font-size: 14px;
}

.session-round {
  font-size: 12px;
  color: #8f959e;
}

.empty-hint {
  padding: 24px 0;
  text-align: center;
  color: #8f959e;
  font-size: 14px;
}

.lark-toggle {
  font-size: 14px;
  color: #3370ff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  user-select: none;

  .chevron {
    transition: transform 0.2s;

    &.open {
      transform: rotate(180deg);
    }
  }
}

@media (max-width: 768px) {
  .lark-descriptions {
    grid-template-columns: 1fr;
  }

  .lark-table {
    font-size: 12px;

    th, td {
      padding: 6px 8px;
    }
  }

  .balance-amount {
    font-size: 22px;
  }
}
</style>

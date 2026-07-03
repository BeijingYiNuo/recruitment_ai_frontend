<template>
  <div class="recharge-page">
    <header class="page-header">
      <h2>余额充值</h2>
      <p class="page-desc">选择充值金额和支付方式</p>
    </header>

    <!-- 余额概览 -->
    <div class="balance-card">
      <span class="label">当前余额</span>
      <span class="amount">¥{{ balance.toFixed(2) }}</span>
    </div>

    <!-- 金额选择 -->
    <div class="section">
      <h3>选择金额</h3>
      <div class="amount-grid">
        <div
          v-for="amt in presetAmounts"
          :key="amt"
          :class="['amount-item', { active: selectedAmount === amt }]"
          @click="selectedAmount = amt"
        >
          ¥{{ amt }}
        </div>
        <div class="amount-item custom">
          <input
            v-model="customAmount"
            type="number"
            min="1"
            placeholder="自定义"
            @focus="selectedAmount = 0"
          />
        </div>
      </div>
    </div>

    <!-- 支付方式 -->
    <div class="section">
      <h3>支付方式</h3>
      <div class="method-list">
        <div
          :class="['method-item', { active: payMethod === 'wxpay' }]"
          @click="payMethod = 'wxpay'"
        >
          <span class="method-icon wx">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="#07C160">
              <path d="M22.74 6.58a0.5 0.5 0 0 0 -0.67 -0.09L8.89 15.65a0.69 0.69 0 0 1 -1 -0.23L4.41 9.37a0.7 0.7 0 0 1 0.11 -0.84 0.67 0.67 0 0 1 0.83 -0.12l3.85 2.14a0.51 0.51 0 0 0 0.48 0l10.77 -5.74a0.49 0.49 0 0 0 0.26 -0.39 0.48 0.48 0 0 0 -0.17 -0.42A13.07 13.07 0 0 0 12 1C5.38 1 0 5.5 0 11a9.2 9.2 0 0 0 3.44 7 0.24 0.24 0 0 1 0.09 0.22l-0.43 3.95a0.76 0.76 0 0 0 0.36 0.73 0.76 0.76 0 0 0 0.39 0.1 0.72 0.72 0 0 0 0.42 -0.13c0.11 -0.08 2.58 -1.76 3.43 -2.38a0.24 0.24 0 0 1 0.2 0 22.28 22.28 0 0 0 4.1 0.63c6.62 0 12 -4.5 12 -10a8.75 8.75 0 0 0 -1.26 -4.54Z"/>
            </svg>
          </span>
          <span>微信支付</span>
        </div>
        <div
          :class="['method-item', { active: payMethod === 'alipay' }]"
          @click="payMethod = 'alipay'"
        >
          <span class="method-icon ali">
            <svg viewBox="0 0 24 24" fill="#1677FF" width="22" height="22">
              <path d="M16.076 13.732c.862-1.494 1.55-3.196 2.003-5.045h-4.731V6.988h5.795V6.04h-5.795V3.207h-2.365c-.415 0-.415.408-.415.408V6.04H4.707v.948h5.861v1.699H5.729v.948h9.386c-.343 1.18-.805 2.288-1.352 3.294-3.045-1.002-6.295-1.814-8.337-1.314-1.305.321-2.146.893-2.641 1.493-2.267 2.751-.641 6.929 4.147 6.929 2.831 0 5.559-1.574 7.673-4.168C17.758 17.381 24 19.976 24 19.976v.157c0 2.117-1.719 3.833-3.843 3.833H3.845C1.72 23.966 0 22.249 0 20.132V3.868C0 1.75 1.72.034 3.845.034h16.312C22.281.034 24 1.75 24 3.868v12.409s-.784-.062-4.24-1.216c-.96-.321-2.249-.811-3.684-1.329zM5.834 13.034c-.6.059-1.725.324-2.341.866-1.845 1.604-.741 4.537 2.993 4.537 2.17 0 4.339-1.384 6.042-3.599-2.424-1.179-4.476-2.022-6.694-1.804z"/>
            </svg>
          </span>
          <span>支付宝</span>
        </div>
      </div>
    </div>

    <!-- 提交按钮 -->
    <button
      class="submit-btn"
      :disabled="loading || !payAmount"
      @click="handleRecharge"
    >
      {{ loading ? '正在创建订单...' : `确认充值 ¥${payAmount.toFixed(2)}` }}
    </button>

    <!-- 支付弹窗 -->
    <el-dialog v-model="payDialogVisible" title="扫码支付" width="360px">
      <div class="pay-dialog-body">
        <p class="pay-order-no">订单号: {{ currentOrder?.order_no }}</p>
        <img
          v-if="currentOrder?.qr_img"
          :src="currentOrder.qr_img"
          class="qrcode-img"
          alt="支付二维码"
        />
        <p v-else-if="currentOrder?.pay_url" class="pay-hint">
          请
          <a :href="currentOrder.pay_url" target="_blank">点击此链接</a>
          完成支付
        </p>
        <p class="pay-hint">支付完成后请等待页面自动刷新</p>
        <el-button type="primary" @click="pollStatus" :loading="polling">
          我已支付完成
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { accountApi } from '../../api/account'

const presetAmounts = [5, 10, 20, 50, 100]
const selectedAmount = ref(50)
const customAmount = ref('')
const payMethod = ref('wxpay')
const loading = ref(false)
const polling = ref(false)
const payDialogVisible = ref(false)
const router = useRouter()
const currentOrder = ref(null)
const balance = ref(0)

const payAmount = computed(() => {
  if (selectedAmount.value > 0) return selectedAmount.value
  const c = parseFloat(customAmount.value)
  return c > 0 ? c : 0
})

const fetchBalance = async () => {
  try {
    const res = await accountApi.getBalance()
    balance.value = res.balance ?? 0
  } catch {
    // ignore
  }
}

const handleRecharge = async () => {
  if (payAmount.value <= 0) {
    ElMessage.warning('请选择充值金额')
    return
  }

  loading.value = true
  try {
    const res = await accountApi.createRecharge({
      amount: payAmount.value,
      payment_method: payMethod.value,
    })
    currentOrder.value = res
    payDialogVisible.value = true
    // 开始自动轮询
    startPolling(res.order_no)
  } catch (e) {
    ElMessage.error('创建充值订单失败: ' + (e?.detail || e?.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

let pollTimer = null

const startPolling = (orderNo) => {
  let count = 0
  const poll = async () => {
    if (count > 60) { // 5分钟超时
      ElMessage.warning('支付超时，请重新尝试')
      payDialogVisible.value = false
      clearTimeout(pollTimer)
      fetchBalance()
      return
    }
    try {
      const res = await accountApi.getOrderStatus(orderNo)
      if (res.status === 'PAID') {
        ElMessage.success('充值成功！')
        payDialogVisible.value = false
        clearTimeout(pollTimer)
        router.push('/profile')
        return
      }
      if (res.status === 'FAILED') {
        ElMessage.warning('订单已过期，请重新发起充值')
        payDialogVisible.value = false
        clearTimeout(pollTimer)
        fetchBalance()
        return
      }
    } catch {
      // ignore
    }
    count++
    pollTimer = setTimeout(poll, 5000)
  }
  // 立即执行第一次轮询
  poll()
}

const pollStatus = async () => {
  if (!currentOrder.value) return
  polling.value = true
  try {
    const res = await accountApi.getOrderStatus(currentOrder.value.order_no)
    if (res.status === 'PAID') {
      ElMessage.success('充值成功！')
      payDialogVisible.value = false
      clearTimeout(pollTimer)
      router.push('/profile')
    } else {
      ElMessage.info('支付尚未完成，请确认已扫码支付')
    }
  } catch {
    ElMessage.error('查询失败')
  } finally {
    polling.value = false
  }
}

onMounted(() => {
  fetchBalance()
})
</script>

<style scoped>
.recharge-page {
  max-width: 520px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 8px;
  font-size: 20px;
}

.page-desc {
  color: #8f959e;
  font-size: 14px;
  margin: 0;
}

.balance-card {
  background: linear-gradient(135deg, #3370ff, #2458d9);
  border-radius: 12px;
  padding: 24px;
  color: #fff;
  margin-bottom: 24px;
}

.balance-card .label {
  font-size: 14px;
  opacity: 0.85;
  display: block;
  margin-bottom: 8px;
}

.balance-card .amount {
  font-size: 36px;
  font-weight: 700;
}

.section {
  margin-bottom: 24px;
}

.section h3 {
  font-size: 16px;
  margin: 0 0 12px;
  color: #1f2329;
}

.amount-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.amount-item {
  border: 1px solid #dee0e3;
  border-radius: 8px;
  padding: 14px 8px;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.amount-item:hover {
  border-color: #3370ff;
}

.amount-item.active {
  border-color: #3370ff;
  background-color: #f0f5ff;
  color: #3370ff;
}

.amount-item.custom input {
  width: 100%;
  border: none;
  outline: none;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  background: transparent;
}

.method-list {
  display: flex;
  gap: 12px;
}

.method-item {
  flex: 1;
  border: 1px solid #dee0e3;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.method-item.active {
  border-color: #3370ff;
  background-color: #f0f5ff;
}

.method-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
}

.submit-btn {
  width: 100%;
  padding: 16px;
  background-color: #3370ff;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background-color: #2458d9;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pay-dialog-body {
  text-align: center;
  padding: 16px 0;
}

.pay-order-no {
  font-size: 12px;
  color: #8f959e;
  margin-bottom: 16px;
}

.qrcode-img {
  width: 240px;
  height: 240px;
  margin: 0 auto 16px;
  display: block;
}

.pay-hint {
  font-size: 14px;
  color: #646a73;
  margin: 8px 0;
}
</style>

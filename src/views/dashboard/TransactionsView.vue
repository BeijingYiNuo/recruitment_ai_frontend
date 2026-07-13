<template>
  <div class="transactions-page">
    <header class="page-header">
      <div class="page-header-left">
        <button class="back-btn" @click="$router.push('/profile')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <h2>交易记录</h2>
      </div>
    </header>

    <div class="stat-card">
      <div class="stat-item">
        <span class="label">当前余额</span>
        <span class="value">¥{{ balance.toFixed(2) }}</span>
      </div>
      <div class="stat-item">
        <span class="label">累计充值</span>
        <span class="value recharge">¥{{ totalRecharged.toFixed(2) }}</span>
      </div>
      <div class="stat-item">
        <span class="label">累计消费</span>
        <span class="value consume">¥{{ totalConsumed.toFixed(2) }}</span>
      </div>
    </div>

    <div class="table-card">
      <div v-if="loading" class="loading-hint">加载中...</div>
      <div v-else-if="list.length === 0" class="empty-hint">暂无交易记录</div>
      <el-table v-else :data="list" style="width: 100%" @filter-change="onFilterChange">
        <el-table-column label="订单号" width="200">
          <template #default="{ row }">
            <span class="font-mono">{{ row.order_no }}</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="90" column-key="type" :filters="typeFilters">
          <template #default="{ row }">
            <el-tag :type="row.type === 'RECHARGE' ? 'success' : 'warning'" size="small">
              {{ row.type === 'RECHARGE' ? '充值' : '消费' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="面试详情" min-width="160">
          <template #default="{ row }">
            <div v-if="row.session_info" class="session-info">
              <span class="session-candidate">{{ row.session_info.candidate_name }}</span>
              <span v-if="row.session_info.round_name" class="session-round">
                第{{ row.session_info.round_number }}轮 · {{ row.session_info.round_name }}
              </span>
              <span v-else class="session-round">{{ row.session_info.service_detail || '--' }}</span>
            </div>
            <span v-else class="text-muted">--</span>
          </template>
        </el-table-column>
        <el-table-column label="服务" width="80">
          <template #default="{ row }">
            <el-tag :type="serviceTagType(row.service_type)" size="small" effect="plain">
              {{ serviceLabel(row.service_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="120">
          <template #default="{ row }">
            <span :class="row.type === 'RECHARGE' ? 'amount-green' : 'amount-red'">
              {{ row.type === 'RECHARGE' ? '+' : '-' }}¥{{ Math.abs(row.amount).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="方式" width="100">
          <template #default="{ row }">
            {{ methodLabel(row.payment_method) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" column-key="status" :filters="statusFilters">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="时间" min-width="160">
          <template #default="{ row }">
            {{ formatTime(row.paid_at || row.created_at) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-bar" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="fetchData"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { accountApi } from '../../api/account'

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const tableFilters = ref({})
const loading = ref(false)
const balance = ref(0)
const totalRecharged = ref(0)
const totalConsumed = ref(0)

const typeFilters = [
  { text: '充值', value: 'RECHARGE' },
  { text: '消费', value: 'CONSUME' },
]
const statusFilters = [
  { text: '已完成', value: 'PAID' },
  { text: '待支付', value: 'PENDING' },
  { text: '失败', value: 'FAILED' },
  { text: '已退款', value: 'REFUNDED' },
]

const onFilterChange = (filters) => {
  tableFilters.value = {}
  for (const [key, values] of Object.entries(filters)) {
    if (values && values.length > 0) {
      tableFilters.value[key] = values[0]
    }
  }
  page.value = 1
  fetchData()
}

const formatTime = (t) => t ? t.replace('T', ' ').substring(0, 19) : '--'
const methodLabel = (m) => ({ wxpay: '微信', alipay: '支付宝', balance: '余额' }[m] || m || '--')
const serviceLabel = (s) => ({
  interview_reserve: '面试', report_generate: '报告',
  resume_parse: '简历解析', resume_review: '简历审核'
}[s] || s || '--')
const serviceTagType = (s) => {
  if (s === 'interview_reserve') return 'primary'
  if (s === 'report_generate') return 'warning'
  if (s === 'resume_parse') return 'success'
  if (s === 'resume_review') return 'info'
  return ''
}

const statusLabel = (s) => ({
  PAID: '已完成', PENDING: '待支付', FAILED: '失败', REFUNDED: '已退款'
}[s] || s || '--')

const statusTagType = (s) => {
  if (s === 'PAID') return 'success'
  if (s === 'PENDING') return 'warning'
  if (s === 'FAILED') return 'danger'
  if (s === 'REFUNDED') return 'info'
  return ''
}

const fetchBalance = async () => {
  try {
    const res = await accountApi.getBalance()
    balance.value = res.balance ?? 0
    totalRecharged.value = res.total_recharged ?? 0
    totalConsumed.value = res.total_consumed ?? 0
  } catch { /* ignore */ }
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value }
    if (tableFilters.value.type) params.type = tableFilters.value.type
    if (tableFilters.value.status) params.status = tableFilters.value.status
    const res = await accountApi.getTransactions(params)
    list.value = res.items || []
    total.value = res.total || 0
  } catch (e) {
    console.warn('获取交易记录失败:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchBalance()
  fetchData()
})
</script>

<style scoped>
.transactions-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-header-left h2 {
  font-size: 20px;
  margin: 0;
  color: #1f2329;
}

.back-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: #646a73;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
}

.back-btn:hover {
  background: #f5f6f7;
  color: #1f2329;
}

.stat-card {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.stat-item {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

.stat-item .label {
  font-size: 14px;
  color: #8f959e;
  display: block;
  margin-bottom: 8px;
}

.stat-item .value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2329;
}

.stat-item .value.recharge { color: #13a248; }
.stat-item .value.consume { color: #f54a45; }

.table-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

.font-mono {
  font-family: SFMono-Regular, Consolas, monospace;
  font-size: 13px;
}

.amount-green { color: #13a248; font-weight: 600; }
.amount-red { color: #f54a45; font-weight: 600; }

.loading-hint, .empty-hint {
  text-align: center;
  padding: 48px 0;
  color: #8f959e;
}

.pagination-bar {
  margin-top: 16px;
  display: flex;
  justify-content: center;
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

.text-muted {
  color: #8f959e;
  font-size: 13px;
}
</style>

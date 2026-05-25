<template>
  <div class="user-manage feishu-page">
    <div class="card-container">
      <!-- Header Area -->
      <div class="header-area">
        <div class="header-top">
          <div class="title-area">
            <h1>用户管理</h1>
            <span class="badge" v-if="totalCount > 0">{{ totalCount }}</span>
          </div>
          <div class="action-btn-group">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索用户名/邮箱"
              clearable
              style="width: 220px; margin-right: 12px;"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" class="lark-btn-primary" @click="handleAddUser">新增用户</el-button>
          </div>
        </div>
      </div>

      <!-- Main List Area -->
      <div class="list-area" style="flex: 1;">
        <!-- 真实后端用户列表 -->
        <el-table
          v-loading="loading"
          :data="users"
          style="width: 100%"
          :header-cell-style="{ background: '#FFFFFF', color: '#646A73', fontWeight: 500, borderBottom: '1px solid #DEE0E3', padding: '0', height: '44px', fontSize: '14px' }"
        >
          <el-table-column prop="id" label="ID" width="80">
            <template #header>
              <div style="padding-left: 24px;">ID</div>
            </template>
            <template #default="scope">
              <div style="padding-left: 24px;">{{ scope.row.id }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="username" label="用户名" min-width="120"></el-table-column>
          <el-table-column prop="email" label="邮箱" min-width="180"></el-table-column>
          <el-table-column prop="phone" label="手机号" width="130"></el-table-column>
          <el-table-column prop="role" label="系统角色" width="120">
            <template #default="scope">
              <el-tag :type="getRoleTagType(scope.row.role)" size="small">
                {{ scope.row.role === 'admin' ? '系统管理员' : scope.row.role === 'recruiter' ? '招聘官' : scope.row.role === 'candidate' ? '候选人' : scope.row.role }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.status)" size="small">
                {{ getStatusLabel(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="160">
            <template #default="scope">
              {{ formatTime(scope.row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #header>
              <div style="padding-right: 24px;">操作</div>
            </template>
            <template #default="scope">
              <div style="padding-right: 24px;">
                <el-button type="primary" link size="small" @click="handleEdit(scope.row)">编辑</el-button>
                <el-button type="danger" link size="small" @click="handleDelete(scope.row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
        <!-- 分页 -->
        <div class="pagination-wrapper" v-if="totalCount > 0" style="padding: 16px 24px; display: flex; justify-content: flex-end;">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="totalCount"
            layout="total, prev, pager, next"
            background
            small
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>

    <!-- 编辑用户弹窗组件 -->
    <UserEditModal 
      v-model:visible="editDialogVisible"
      :user-data="selectedUser"
      title="编辑用户信息"
      @success="loadUsers"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { userApi } from '../../api/user'
import UserEditModal from '../../components/UserEditModal.vue'

const users = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)

const editDialogVisible = ref(false)
const selectedUser = ref({})

const formatTime = (timeStr) => {
  if (!timeStr) return '--'
  return timeStr.replace('T', ' ').substring(0, 19)
}

const getRoleTagType = (role) => {
  if (role === 'admin') return 'danger'
  if (role === 'recruiter') return 'primary'
  return 'success'
}

const statusLabelMap = {
  CREATED: '已创建',
  INTERVIEWED: '已预约',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  OTHER: '其他',
}

const getStatusLabel = (status) => {
  return statusLabelMap[status] || status || '未知'
}

const getStatusTagType = (status) => {
  const typeMap = {
    CREATED: 'info',
    INTERVIEWED: 'warning',
    COMPLETED: 'success',
    CANCELLED: 'danger',
    OTHER: 'info',
  }
  return typeMap[status] || 'info'
}

const loadUsers = async () => {
  loading.value = true
  try {
    const skip = (currentPage.value - 1) * pageSize.value
    const params = { skip, limit: pageSize.value }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    const res = await userApi.getUsers(params)
    users.value = Array.isArray(res) ? res : (res.items || res.data || [])
    totalCount.value = res.total || users.value.length
  } catch (err) {
    ElMessage.error('获取用户列表失败: ' + (err?.detail || err?.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadUsers()
}

const handlePageChange = (page) => {
  currentPage.value = page
  loadUsers()
}

onMounted(() => {
  loadUsers()
})

const handleAddUser = () => {
  ElMessage.info('新增用户逻辑对接准备中，目前可使用外部通用接口注册。')
}

const handleEdit = (row) => {
  selectedUser.value = row
  editDialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要永久删除账号：[${row.username}] 吗？此操作无法撤销。`,
    '高危操作警告',
    {
      confirmButtonText: '确定摧毁',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await userApi.deleteUser(row.id)
      ElMessage.success('用户已永久删除')
      loadUsers() // 刷新本地列表
    } catch (err) {
      ElMessage.error('删除用户失败: ' + (err?.detail || err?.message || '未知错误'))
    }
  }).catch(() => {})
}
</script>

<style scoped>
/* 深度修改 el-table 样式使其外层贴合飞书白底风格，但不改变内部数据内容的格式 */
:deep(.el-table) {
  --el-table-border-color: #F5F6F7;
  --el-table-bg-color: #FFFFFF;
}

:deep(.el-table__inner-wrapper::before) {
  display: none;
}
</style>

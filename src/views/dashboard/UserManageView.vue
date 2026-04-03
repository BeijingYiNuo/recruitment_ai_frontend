<template>
  <div class="user-manage">
    <el-card class="list-card" shadow="never">
      <template #header>
        <div class="list-header">
          <span>用户管理</span>
          <el-button type="primary" size="small" @click="handleAddUser">新增用户</el-button>
        </div>
      </template>

      <!-- 真实后端用户列表 -->
      <el-table
        v-loading="loading"
        :data="users"
        style="width: 100%"
        :header-cell-style="{ background: '#f5f6f7', color: '#646a73', fontWeight: 500, borderBottom: '1px solid #dee0e3' }"
      >
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
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
            <el-tag :type="scope.row.status === 'activate' ? 'success' : 'info'" size="small">
              {{ scope.row.status === 'activate' ? '正常激活' : '未激活' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="scope">
            {{ formatTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button type="primary" link size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

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
import { userApi } from '../../api/user'
import UserEditModal from '../../components/UserEditModal.vue'

const users = ref([])
const loading = ref(false)

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

const loadUsers = async () => {
  loading.value = true
  try {
    const res = await userApi.getUsers()
    // 兼容后端可能是直接数组或对象包数组格式
    users.value = Array.isArray(res) ? res : (res.items || res.data || [])
  } catch (err) {
    ElMessage.error('获取用户列表失败: ' + (err?.detail || err?.message || '未知错误'))
  } finally {
    loading.value = false
  }
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

<style scoped lang="scss">
.user-manage {
  .list-card {
    border-radius: 12px;
    border: 1px solid #dee0e3;
    box-shadow: 0 4px 12px rgba(31, 35, 41, 0.04);

    :deep(.el-card__header) {
      padding: 16px 24px;
      border-bottom: 1px solid #dee0e3;
    }

    :deep(.el-card__body) {
      padding: 24px;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 16px;
      font-weight: 600;
      color: #1f2329;
    }
  }
}
</style>

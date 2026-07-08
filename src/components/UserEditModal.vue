<template>
  <el-dialog 
    :model-value="visible" 
    @update:model-value="val => $emit('update:visible', val)" 
    :title="title || '编辑用户信息'" 
    width="500px"
    @open="handleOpen"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="账号" prop="username">
        <el-input v-model="form.username" placeholder="请输入账号（3-20位）" maxlength="20" />
      </el-form-item>
      <el-form-item label="昵称" prop="nickname">
        <el-input v-model="form.nickname" placeholder="请输入昵称（最长20位）" maxlength="20" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="100" />
      </el-form-item>
      <el-form-item label="手机号" prop="phone">
        <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
      </el-form-item>
      <el-form-item v-if="showRole" label="角色" prop="role">
        <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%;">
          <el-option label="系统管理员" value="admin" />
          <el-option label="招聘官" value="recruiter" />
        </el-select>
      </el-form-item>
      <el-form-item label="新密码" prop="password_hash">
        <el-input v-model="form.password_hash" type="password" placeholder="留空则不修改密码" show-password />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="$emit('update:visible', false)">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitEdit">保存更改</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { authApi } from '../api/auth'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  userData: {
    type: Object,
    default: () => ({})
  },
  showRole: {
    type: Boolean,
    default: true
  },
  title: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:visible', 'success'])

const formRef = ref(null)
const submitLoading = ref(false)

const form = reactive({
  id: null,
  username: '',
  nickname: '',
  email: '',
  phone: '',
  role: '',
  password_hash: ''
})

const rules = {
  username: [{ required: true, message: '账号不能为空', trigger: 'blur' }],
  email: [
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^\d{11}$/, message: '手机号必须为11位数字', trigger: 'blur' }
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const handleOpen = () => {
  form.id = props.userData.id
  form.username = props.userData.username === '未知用户' ? '' : (props.userData.username || '')
  form.nickname = props.userData.nickname === '未设置' ? '' : (props.userData.nickname || '')
  form.email = props.userData.email === '--' ? '' : (props.userData.email || '')
  
  const phone = props.userData.phone
  form.phone = (phone === '未绑定手机号' || phone === '--') ? '' : (phone || '')
  
  form.role = props.userData.role || 'candidate'
  form.password_hash = '' 
}

const submitEdit = () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        const payload = {
          username: form.username,
          nickname: form.nickname,
          email: form.email,
          phone: form.phone,
          role: form.role
        }
        // 仅当用户填写了新密码时才提交
        if (form.password_hash) {
          payload.password_hash = form.password_hash
        }

        await authApi.updateUser(form.id, payload)
        ElMessage.success('更新用户信息成功')
        emit('update:visible', false)
        emit('success')
      } catch (err) {
        if (Array.isArray(err?.detail)) {
          const msgs = err.detail.map(e => e.msg).join('; ')
          ElMessage.error(`更新失败: ${msgs}`)
        } else {
          ElMessage.error('更新失败: ' + (err?.detail || err?.message || '未知错误'))
        }
      } finally {
        submitLoading.value = false
      }
    }
  })
}
</script>

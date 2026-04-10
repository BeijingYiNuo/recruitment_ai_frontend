<template>
  <el-dialog
    v-model="visible"
    title="创建知识库"
    width="500px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="库名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入知识库名称（字母开头，支持字母、数字、下划线）"
          maxlength="128"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="库描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          placeholder="请输入知识库描述信息"
          :rows="4"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">创建</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { knowledgeApi } from '../../api/knowledge.js'

const emit = defineEmits(['success', 'close'])

const visible = ref(false)
const formRef = ref(null)
const loading = ref(false)

const formData = reactive({
  name: '',
  description: ''
})

// 验证规则
const rules = {
  name: [
    { required: true, message: '知识库名称不能为空', trigger: 'blur' },
    { min: 1, max: 128, message: '知识库名称长度应为1-128个字符', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
      message: '知识库名称只能由字母开头，支持字母、数字、下划线',
      trigger: 'blur'
    }
  ],
  description: [
    { required: true, message: '知识库描述不能为空', trigger: 'blur' }
  ]
}

// 打开对话框
const openDialog = () => {
  visible.value = true
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
  formRef.value?.resetFields()
  Object.assign(formData, {
    name: '',
    description: ''
  })
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    // 调用真正的后端接口
    await knowledgeApi.createCollection({
      name: formData.name,
      description: formData.description
    })

    ElMessage.success('知识库创建成功')
    emit('success')
    handleClose()
  } catch (error) {
    // 验证失败或 API 请求失败
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else if (error.message) {
      ElMessage.error(error.message)
    } else {
      ElMessage.error('创建知识库失败，请检查信息后重试')
    }
  } finally {
    loading.value = false
  }
}

// 暴露方法给父组件
defineExpose({
  openDialog
})
</script>

<style scoped lang="scss">
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>

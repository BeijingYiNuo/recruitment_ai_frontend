<template>
  <div class="appointment-manage">
    <el-card class="list-card" shadow="never">
      <template #header>
        <div class="list-header">
          <span>约见安排</span>
          <el-button type="primary" size="small" @click="appointmentStore.openModal()">新增约见</el-button>
        </div>
      </template>

      <el-empty v-if="appointmentStore.appointments.length === 0" description="暂无约见安排，请点击上方按钮创建" />

      <el-table
        v-else
        :data="appointmentStore.appointments"
        style="width: 100%"
        :header-cell-style="{ background: '#f5f6f7', color: '#646a73', fontWeight: 500, borderBottom: '1px solid #dee0e3' }"
      >
        <el-table-column prop="candidate_name" label="候选人" width="120"></el-table-column>
        <el-table-column prop="candidate_id" label="候选人 ID" width="120"></el-table-column>
        <el-table-column prop="scheduled_at" label="约见时间" width="180"></el-table-column>
        <el-table-column prop="location" label="约见地点" min-width="180" show-overflow-tooltip></el-table-column>
        <el-table-column prop="contact_phone" label="联系电话" width="140"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag size="small" :type="getStatusType(scope.row.status)" effect="light" class="feishu-tag">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button type="primary" link size="small" @click="appointmentStore.editAppointment(scope.row)">编辑</el-button>
            <el-button type="primary" link size="small" v-if="scope.row.status === 'pending'" @click="handleConfirm(scope.row.id)">确认</el-button>
            <el-button type="primary" link size="small" v-if="scope.row.status === 'confirmed'" @click="handleComplete(scope.row.id)">完成</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 约见表单弹窗 -->
    <el-dialog
      :title="appointmentStore.isEditMode ? '编辑约见' : '新增约见'"
      v-model="appointmentStore.showModal"
      width="500px"
      destroy-on-close>
      <el-form :model="appointmentStore.appointmentForm" label-position="top">
        <el-form-item label="候选人姓名" required>
          <el-input v-model="appointmentStore.appointmentForm.candidate_name" placeholder="请输入候选人姓名"></el-input>
        </el-form-item>
        <el-form-item label="候选人 ID">
          <el-input v-model="appointmentStore.appointmentForm.candidate_id" placeholder="如: 10001"></el-input>
        </el-form-item>
        <el-form-item label="约见时间" required>
          <el-date-picker
            v-model="appointmentStore.appointmentForm.scheduled_at"
            type="datetime"
            placeholder="请选择约见时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%" />
        </el-form-item>
        <el-form-item label="约见地点" required>
          <el-input v-model="appointmentStore.appointmentForm.location" placeholder="例如: 深圳市南山区xx大厦3楼会议室"></el-input>
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="appointmentStore.appointmentForm.contact_phone" placeholder="候选人联系电话"></el-input>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="appointmentStore.appointmentForm.notes" type="textarea" :rows="3" placeholder="其他备注信息"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="appointmentStore.closeModal()">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'
import { useAppointmentStore } from '../../stores/appointmentStore'

const appointmentStore = useAppointmentStore()

const getStatusType = (status) => {
  switch (status) {
    case 'pending': return 'warning'
    case 'confirmed': return 'primary'
    case 'completed': return 'success'
    case 'cancelled': return 'info'
    default: return ''
  }
}

const getStatusLabel = (status) => {
  switch (status) {
    case 'pending': return '待确认'
    case 'confirmed': return '已确认'
    case 'completed': return '已完成'
    case 'cancelled': return '已取消'
    default: return status
  }
}

const handleSave = () => {
  const form = appointmentStore.appointmentForm
  if (!form.candidate_name) {
    ElMessage.warning('请填写候选人姓名')
    return
  }
  if (!form.scheduled_at) {
    ElMessage.warning('请选择约见时间')
    return
  }
  if (!form.location) {
    ElMessage.warning('请填写约见地点')
    return
  }

  const wasEdit = appointmentStore.isEditMode
  appointmentStore.saveAppointment()
  ElMessage.success(wasEdit ? '约见信息修改成功！' : '约见安排创建成功！')
}

const handleConfirm = (id) => {
  appointmentStore.updateStatus(id, 'confirmed')
  ElMessage.success('约见已确认')
}

const handleComplete = (id) => {
  appointmentStore.updateStatus(id, 'completed')
  ElMessage.success('约见已完成')
}

const handleDelete = (id) => {
  if (window.confirm('确定要删除该约见安排吗？')) {
    appointmentStore.deleteAppointment(id)
    ElMessage.success('约见删除成功')
  }
}
</script>

<style scoped lang="scss">
.appointment-manage {
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

  .feishu-tag {
    border: none;
    font-weight: 500;
  }
}
</style>

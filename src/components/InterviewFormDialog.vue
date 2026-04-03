<template>
  <el-dialog
    :title="`${isEditMode ? '修改' : '新增'}${form.session_type === 'online' ? '线上面试信息' : '线下面试安排'}`"
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    width="500px"
    destroy-on-close>
    <el-form :model="form" label-position="top">
      <el-form-item label="候选人姓名" required>
        <el-input v-model="form.candidate_name" placeholder="请输入真实姓名"></el-input>
      </el-form-item>

      <el-form-item label="关联简历材料">
        <el-select v-model="form.resume_id" placeholder="-- 不关联或暂无简历 --" style="width: 100%" clearable @change="handleResumeChange">
          <el-option v-for="r in resumes" :key="r.id" :label="`${r.candidate_name || r.file_name} (ID: ${r.id})`" :value="r.id"></el-option>
        </el-select>
        <div v-if="resumes.length === 0" style="font-size: 12px; color: #e6a23c; margin-top: 6px; line-height: 1.4;">
          提示: 当前还没有上传过简历，如需强力匹配请先去简历管理页上传。
        </div>
      </el-form-item>

      <el-form-item label="预定开始时间" required>
        <el-date-picker
          v-model="form.scheduled_start_at"
          type="datetime"
          placeholder="请选择预定开始时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%" />
      </el-form-item>
      
      <el-form-item label="预定结束时间" required>
        <el-date-picker
          v-model="form.scheduled_end_at"
          type="datetime"
          placeholder="请选择预定结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%" />
      </el-form-item>

      <el-form-item label="面试备注 (如: 会议链接 / 地点 / 提示)" required>
        <el-input
          v-model="form.notes"
          type="textarea"
          :rows="2"
          :placeholder="form.session_type === 'online' ? '例如: 腾讯会议链接 https://meet.tencent.com/123-456' : '例如: 深圳市南山区招聘研发中心面试间'">
        </el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="$emit('update:visible', false)">取消</el-button>
        <el-button type="primary" @click="$emit('save')">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
const props = defineProps({
  visible: { type: Boolean, default: false },
  isEditMode: { type: Boolean, default: false },
  form: { type: Object, required: true },
  resumes: { type: Array, default: () => [] }
})

const handleResumeChange = (val) => {
  if (val && !props.form.candidate_name) {
    const matched = props.resumes.find(r => r.id === val)
    if (matched && matched.candidate_name) {
      props.form.candidate_name = matched.candidate_name // 联动名称
    }
  }
}

defineEmits(['update:visible', 'save'])
</script>

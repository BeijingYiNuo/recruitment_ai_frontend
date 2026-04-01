<template>
  <el-dialog
    :title="`${isEditMode ? '修改' : '新增'}${form.session_type === 'online' ? '线上面试信息' : '线下面试安排'}`"
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    width="500px"
    destroy-on-close>
    <el-form :model="form" label-position="top">
      <el-form-item label="候选人 ID" required>
        <el-input v-model="form.candidate_id" placeholder="如: 10001"></el-input>
      </el-form-item>

      <el-form-item label="关联简历材料">
        <el-select v-model="form.resume_id" placeholder="-- 不关联任何或暂无简历 --" style="width: 100%" clearable>
          <el-option v-for="r in resumes" :key="r.id" :label="`${r.file_name} (ID: ${r.id})`" :value="r.id"></el-option>
        </el-select>
        <div v-if="resumes.length === 0" style="font-size: 12px; color: #e6a23c; margin-top: 6px; line-height: 1.4;">
          提示: 当前还没有上传过简历，如需关联简历请先在简历管理页上传。
        </div>
      </el-form-item>

      <el-form-item label="预定时间" required>
        <el-date-picker
          v-model="form.scheduled_at"
          type="datetime"
          placeholder="请选择预定时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%" />
      </el-form-item>

      <el-form-item :label="form.session_type === 'online' ? '会议链接/会议号' : '面试详细地点'" required>
        <el-input
          v-model="form.extra_info"
          :placeholder="form.session_type === 'online' ? '例如: https://meet.tencent.com/123-456-789' : '例如: 深圳市南山区招聘中心会议室C'">
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
defineProps({
  visible: { type: Boolean, default: false },
  isEditMode: { type: Boolean, default: false },
  form: { type: Object, required: true },
  resumes: { type: Array, default: () => [] }
})

defineEmits(['update:visible', 'save'])
</script>

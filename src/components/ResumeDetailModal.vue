<template>
  <el-dialog
    :model-value="visible"
    :title="`简历信息内容提取: ${resume?.candidate_name || resume?.file_name || '未知简历'}`"
    width="700px"
    @close="$emit('close')"
    destroy-on-close
  >
    <div class="resume-content-view">
      <el-scrollbar max-height="65vh">
        <!-- 适配后端可能的纯文本解析结果 -->
        <pre v-if="typeof resume?.parsed_content === 'string' || typeof resume?.content === 'string'" class="text-content">{{ resume.parsed_content || resume.content }}</pre>
        
        <!-- 适配后端返回整个 JSON (降级优雅展示) -->
        <pre v-else class="json-content">{{ formatJson(resume) }}</pre>
      </el-scrollbar>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="$emit('close')">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  resume: { type: Object, default: null }
})

defineEmits(['close'])

const visible = computed(() => !!props.resume)

// 对原始对象进行美化格式化用于预览展示
const formatJson = (data) => {
  if (!data) return ''
  const displayData = { ...data }
  // 屏蔽掉一些不直观的底层字段
  delete displayData.preview_url
  delete displayData.file_path
  return JSON.stringify(displayData, null, 2)
}
</script>

<style scoped>
.resume-content-view {
  background-color: #1e1e1e; /* 模拟深色代码块，突现专业感 */
  padding: 20px;
  border-radius: 8px;
  box-shadow: inset 0 2px 8px rgba(0,0,0,0.1);
}

.text-content, .json-content {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #d4d4d4; /* 匹配深色背景的高雅灰写 */
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
}
</style>

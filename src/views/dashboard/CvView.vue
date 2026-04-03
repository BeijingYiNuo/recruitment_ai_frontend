<template>
  <div class="cv-manage">
    <el-card class="list-card" shadow="never">
      <template #header>
        <div class="list-header">
          <span>简历管理</span>
          <el-button type="primary" size="small" @click="uploadDialogVisible = true">导入新简历</el-button>
        </div>
      </template>

      <el-empty v-if="resumeStore.resumes.length === 0 && !listLoading" description="暂无简历，请点击上方按钮上传" />

      <el-table
        v-else
        v-loading="listLoading"
        :data="resumeStore.resumes"
        style="width: 100%"
        :header-cell-style="{ background: '#f5f6f7', color: '#646a73', fontWeight: 500, borderBottom: '1px solid #dee0e3' }"
      >
        <el-table-column prop="candidate_name" label="候选人姓名" min-width="150" show-overflow-tooltip></el-table-column>
        <el-table-column prop="file_type" label="格式" width="100">
          <template #default="scope">
            {{ scope.row.file_type.toUpperCase() }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="解析状态" width="120">
          <template #default="scope">
            <el-tag size="small" type="success" class="status-tag status-success">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="上传时间" width="180"></el-table-column>
        <el-table-column label="操作" width="340" fixed="right">
          <template #default="scope">
            <el-button type="primary" link size="small" @click="handleViewResume(scope.row.id)">全貌</el-button>
            <el-button type="success" link size="small" @click="handleFetchSpecial(scope.row, 'educations', '教育经历')">教育</el-button>
            <el-button type="warning" link size="small" @click="handleFetchSpecial(scope.row, 'work-experiences', '工作经历')">工作</el-button>
            <el-button type="info" link size="small" @click="handleFetchSpecial(scope.row, 'skills', '技能')">技能</el-button>
            <el-button type="primary" link size="small" @click="handleFetchSpecial(scope.row, 'projects', '项目经历')">项目</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 简历详情弹窗 -->
    <ResumeDetailModal
      :resume="resumeStore.selectedResume"
      @close="resumeStore.clearSelection()"
    />

    <!-- 简历导入弹窗 -->
    <el-dialog v-model="uploadDialogVisible" title="导入新简历" width="440px" @close="resetUploadForm">
      <el-form ref="uploadFormRef" :model="uploadForm" :rules="uploadRules" label-width="95px">
        <el-form-item label="候选人姓名" prop="candidateName">
          <el-input v-model="uploadForm.candidateName" placeholder="请填写候选人真实姓名"></el-input>
        </el-form-item>
        <el-form-item label="简历文件" prop="file">
          <el-upload
            ref="uploadRef"
            class="upload-demo"
            drag
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            accept=".pdf,.doc,.docx"
            style="width: 100%;"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处或 <em>点击选取</em>
            </div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="listLoading" @click="submitUpload">确认导入</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { getCurrentUser } from '../../services/authService'
import { useResumeStore } from '../../stores/resumeStore'
import ResumeDetailModal from '../../components/ResumeDetailModal.vue'
import { resumeApi } from '../../api/resume'

const resumeStore = useResumeStore()
const currentUser = ref(getCurrentUser() || { id: 1, username: '管理员' })
const listLoading = ref(false)

const fetchResumes = async () => {
  listLoading.value = true
  try {
    const data = await resumeApi.getResumes()
    const list = Array.isArray(data) ? data : (data.items || data.data || [])
    resumeStore.setResumes(list)
  } catch (error) {
    ElMessage.error('获取简历列表失败: ' + (error?.detail || error?.message || '未知错误'))
  } finally {
    listLoading.value = false
  }
}

onMounted(() => {
  fetchResumes()
})

const uploadDialogVisible = ref(false)
const uploadFormRef = ref(null)
const uploadRef = ref(null)

const uploadForm = ref({
  candidateName: '',
  file: null
})

const uploadRules = {
  candidateName: [{ required: true, message: '必须输入候选人姓名', trigger: 'blur' }]
}

const handleFileChange = (uploadFile) => {
  uploadForm.value.file = uploadFile.raw
}

const handleFileRemove = () => {
  uploadForm.value.file = null
}

const resetUploadForm = () => {
  uploadForm.value = { candidateName: '', file: null }
  if (uploadRef.value) uploadRef.value.clearFiles()
  if (uploadFormRef.value) uploadFormRef.value.clearValidate()
}

const submitUpload = () => {
  uploadFormRef.value.validate(async (valid) => {
    if (!valid) return
    if (!uploadForm.value.file) {
      ElMessage.warning('请选择需要上传的简历文件')
      return
    }
    
    const file = uploadForm.value.file
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      ElMessage.error('只支持 PDF 或 Word 格式的简历文件')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      ElMessage.error('简历文件大小不能超过 5MB')
      return
    }

    listLoading.value = true
    try {
      const response = await resumeApi.uploadResume(currentUser.value.id, uploadForm.value.candidateName, file)
      
      const blobUrl = URL.createObjectURL(file)
      const newResume = Object.assign({
        id: Date.now(),
        user_id: currentUser.value.id,
        candidate_name: uploadForm.value.candidateName,
        file_path: '',
        file_type: file.name.split('.').pop().toLowerCase(),
        status: 'uploaded',
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }, response)
      
      newResume.preview_url = blobUrl
      resumeStore.addResume(newResume)
      
      ElMessage.success(`简历 ${file.name} 导入成功！`)
      uploadDialogVisible.value = false
      fetchResumes() // 可选：如果后端返回了最新全量数据，可以选择拉取
    } catch (error) {
      if (Array.isArray(error?.detail)) {
        const msgs = error.detail.map(e => e.msg).join('; ')
        ElMessage.error(`上传失败: ${msgs}`)
      } else {
        ElMessage.error('上传失败: ' + (error?.detail || error?.message || '未知错误'))
      }
    } finally {
      listLoading.value = false
    }
  })
}

const handleViewResume = async (id) => {
  const loading = ElLoading.service({ lock: true, text: '正在拉取完整简历内容...' })
  try {
    const detail = await resumeApi.getResumeDetail(id)
    resumeStore.selectResume(detail) // 放入 store 供给弹出层渲染
  } catch (error) {
    ElMessage.error('无法获取简历详细内容: ' + (error?.detail || error?.message || '网络异常'))
  } finally {
    loading.close()
  }
}

const handleFetchSpecial = async (row, type, titleName) => {
  const loading = ElLoading.service({ lock: true, text: `正在提取大模型解析的 ${titleName}...` })
  try {
    let data;
    if (type === 'educations') data = await resumeApi.getResumeEducations(row.id)
    else if (type === 'work-experiences') data = await resumeApi.getResumeWorkExperiences(row.id)
    else if (type === 'skills') data = await resumeApi.getResumeSkills(row.id)
    else if (type === 'projects') data = await resumeApi.getResumeProjects(row.id)

    // 精巧构建返回体，复用并欺骗原有基于 parsed_content 展示的极客暗黑框架构
    resumeStore.selectResume({
      candidate_name: `${row.candidate_name || '候选人'} 的专项分析 - ${titleName}`,
      parsed_content: JSON.stringify(data, null, 2)
    })
  } catch (error) {
    ElMessage.error(`提取 ${titleName} 失败: ` + (error?.detail || error?.message || '网络异常'))
  } finally {
    loading.close()
  }
}

const handleDelete = (id) => {
  ElMessageBox.confirm(
    '此操作将永久毁掉该简历以及相关解析数据内容，确定要继续吗？',
    '高危操作警告',
    {
      confirmButtonText: '确定摧毁',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    const loading = ElLoading.service({ lock: true, text: '正在斩草除根删除中...' })
    try {
      await resumeApi.deleteResume(id)
      resumeStore.deleteResume(id) // 同步剔除本地前端缓层缓存
      ElMessage.success('物理删除简历成功！')
      fetchResumes() // 可再次安全确认云端状态一致性
    } catch (error) {
      ElMessage.error('无法删除此简历: ' + (error?.detail || error?.message || '未知错误'))
    } finally {
      loading.close()
    }
  }).catch(() => {})
}
</script>

<style scoped lang="scss">
.cv-manage {
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

  .status-tag {
    border: none;
    font-weight: 500;
    &.status-success {
      background-color: #eaf8f1;
      color: #17a05d;
    }
  }
}
</style>

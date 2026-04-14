<template>
  <div class="feishu-page">
    <div class="card-container">
      
      <!-- Header Area -->
      <div class="header-area">
        <div class="header-top">
          <div class="title-area">
            <h1>简历管理</h1>
            <span class="badge">{{ resumeStore.resumes?.length || 0 }}</span>
          </div>
          <div class="action-btn-group">
            <el-button type="primary" class="lark-btn-primary" @click="uploadDialogVisible = true">添加简历</el-button>
          </div>
        </div>
      </div>

      <!-- Main List Area -->
      <div class="list-area" v-loading="listLoading">
        <div class="list-header-row">
          <div class="col-name">候选人</div>
          <div class="col-type">格式</div>
          <div class="col-status">解析状态</div>
          <div class="col-time">上传时间</div>
          <div class="col-action">操作</div>
        </div>
        
        <div class="list-body">
          <el-empty 
            v-if="(!resumeStore.resumes || resumeStore.resumes.length === 0) && !listLoading" 
            description="暂无简历，请点击上方按钮添加导入" 
            style="padding: 60px 0"
          />
          
          <div 
            v-else
            class="list-row"
            v-for="resume in resumeStore.resumes" 
            :key="resume.id"
            @click="openDrawer(resume.id)"
          >
            <div class="col-name">
              <el-avatar :size="32" class="lark-avatar">{{ resume.candidate_name?.charAt(0) || 'U' }}</el-avatar>
              <span class="name-text">{{ resume.candidate_name }}</span>
            </div>
            
            <div class="col-type">
              <span class="lark-tag tag-gray">{{ resume.file_type?.toUpperCase() }}</span>
            </div>
            
            <div class="col-status">
              <div class="status-indicator">
                <span class="dot" :class="resume.status === 'uploaded' ? 'dot-loading' : 'dot-success'"></span>
                <span>{{ resume.status === 'uploaded' ? '解析中...' : '解析成功' }}</span>
              </div>
            </div>
            
            <div class="col-time">{{ formatFullTime(resume.created_at) || '刚刚' }}</div>
            
            <div class="col-action">
              <el-button type="primary" link @click.stop="handlePreview(resume)">预览</el-button>
              <el-button type="primary" link @click.stop="handleDownload(resume)">下载</el-button>
              <el-button type="danger" link @click.stop="handleDelete(resume.id)">删除</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情侧滑抽屉 -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="drawerVisible" class="lark-drawer-overlay" @click="closeDrawer"></div>
      </transition>
      
      <transition name="drawer-slide">
        <div v-if="drawerVisible" class="lark-drawer" @click.stop v-loading="drawerLoading">
          <div class="drawer-header">
            <div class="drawer-title">{{ currentDetail?.candidate_name || '加载中...' }} - 候选人详情</div>
            <div class="drawer-actions">
              <el-button size="small" class="lark-btn-ghost" @click="handlePreview(currentDetail)">简历预览</el-button>
              <el-icon class="close-icon" @click="closeDrawer"><Close /></el-icon>
            </div>
          </div>
          
          <div class="drawer-tabs">
            <div class="tab-item" :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">基本信息</div>
            <div class="tab-item" :class="{ active: activeTab === 'original' }" @click="activeTab = 'original'">简历原文</div>
          </div>
          
          <div class="drawer-body">
            <!-- 基本信息 Tab -->
            <div v-show="activeTab === 'basic'">
              <div class="detail-card">
                <h3>基础信息字段</h3>
                <el-descriptions :column="2" border v-if="currentDetail">
                  <el-descriptions-item label="候选人姓名">{{ currentDetail.candidate_name }}</el-descriptions-item>
                  <el-descriptions-item label="文件格式">{{ currentDetail.file_type?.toUpperCase() }}</el-descriptions-item>
                  <el-descriptions-item label="解析状态">
                    <el-tag :type="currentDetail.status === 'uploaded' ? 'primary' : 'success'" size="small">
                      {{ currentDetail.status === 'uploaded' ? '解析中...' : '解析成功' }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="上传时间">{{ formatFullTime(currentDetail.created_at) || '未知' }}</el-descriptions-item>
                </el-descriptions>
              </div>


              <div class="detail-card">
                <h3>AI 智能专项解析</h3>
                <div class="special-actions">
                  <el-button @click="handleFetchSpecialInDrawer('educations', '教育经历')" size="small">教育经历提取</el-button>
                  <el-button @click="handleFetchSpecialInDrawer('work-experiences', '工作经历')" size="small">工作经历提取</el-button>
                  <el-button @click="handleFetchSpecialInDrawer('skills', '技能')" size="small">核心技能打标</el-button>
                  <el-button @click="handleFetchSpecialInDrawer('projects', '项目经历')" size="small">项目经验总结</el-button>
                </div>
                <!-- 显示内容区域 -->
                <div class="special-content" v-if="specialDataStr" v-loading="specialDataLoading" style="margin-top: 16px;">
                  <!-- 教育经历结构化渲染 -->
                  <div v-if="activeSpecialType === 'educations' && specialEduList.length > 0" class="special-list edu-list">
                    <div v-for="edu in specialEduList" :key="edu.id" class="special-item edu-item">
                      <div class="item-header">
                        <span class="main-title">{{ edu.school_name }}</span>
                        <div class="item-tags">
                          <el-tag v-if="edu.is_985" size="small" type="warning" effect="dark" class="mini-tag">985</el-tag>
                          <el-tag v-if="edu.is_211" size="small" type="danger" effect="dark" class="mini-tag">211</el-tag>
                        </div>
                      </div>
                      <div class="item-sub">
                        <span class="info-line">{{ edu.major }}</span>
                        <span class="divider" v-if="edu.major && edu.degree">|</span>
                        <span class="info-line">{{ edu.degree || '无学位/大专' }}</span>
                      </div>
                      <div class="item-date">
                        {{ formatSimpleDate(edu.start_date) }} 至 {{ formatSimpleDate(edu.end_date) }}
                      </div>
                    </div>
                  </div>

                  <!-- 工作经历结构化渲染 -->
                  <div v-else-if="activeSpecialType === 'work-experiences' && specialWorkList.length > 0" class="special-list work-list">
                    <div v-for="work in specialWorkList" :key="work.id" class="special-item work-item">
                      <div class="item-header">
                        <span class="main-title">{{ work.company_name }}</span>
                        <span class="item-date">{{ formatDateRange(work.start_date, work.end_date) }}</span>
                      </div>
                      <div class="item-sub">
                        <span class="position-text">{{ work.position }}</span>
                      </div>
                      <div class="item-desc" v-if="work.description">
                        {{ work.description }}
                      </div>
                    </div>
                  </div>

                  <!-- 技能打标结构化渲染 -->
                  <div v-else-if="activeSpecialType === 'skills' && specialSkillList.length > 0" class="skill-cloud">
                    <div v-for="skill in specialSkillList" :key="skill.id" class="skill-chip">
                      <span class="skill-name">{{ skill.skill_name }}</span>
                      <span class="skill-level" v-if="skill.proficiency_level">({{ skill.proficiency_level }})</span>
                    </div>
                  </div>

                  <!-- 项目经验结构化渲染 -->
                  <div v-else-if="activeSpecialType === 'projects' && specialProjectList.length > 0" class="special-list project-list">
                    <div v-for="proj in specialProjectList" :key="proj.id" class="special-item project-item">
                      <div class="item-header">
                        <span class="main-title">{{ proj.project_name }}</span>
                        <span class="item-date">{{ formatDateRange(proj.start_date, proj.end_date) }}</span>
                      </div>
                      <div class="item-sub">
                        <span class="role-text">{{ proj.role || '参与者' }}</span>
                      </div>
                      <div class="item-desc" v-if="proj.description">
                        {{ proj.description }}
                      </div>
                    </div>
                  </div>

                  <!-- 空状态处理：针对已知的结构化类型，如果列表为空则展示友好提示 -->
                  <div v-else-if="['educations', 'work-experiences', 'skills', 'projects'].includes(activeSpecialType)" class="empty-special-card">
                    <el-empty description="本次 AI 解析未提取到相关有效信息" :image-size="80"></el-empty>
                  </div>

                  <!-- 其他默认 JSON 渲染 -->
                  <pre v-else class="code-block">{{ specialDataStr }}</pre>
                </div>
              </div>
            </div>

            <!-- 简历原文 Tab -->
            <div v-show="activeTab === 'original'">
              <div class="detail-card text-center" style="padding: 40px;">
                <el-icon :size="48" color="#8F959E"><Document /></el-icon>
                <h3 style="margin-top: 16px; color: #1F2329;">源文件操作</h3>
                <p style="color: #646A73; font-size: 14px; margin-bottom: 24px;">可在线预览 PDF 格式简历，或下载原始文件到本地查看</p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                  <el-button type="primary" class="lark-btn-primary" @click="handlePreview(currentDetail)">
                    <el-icon style="margin-right: 6px;"><View/></el-icon> 预览简历
                  </el-button>
                  <el-button class="lark-btn-ghost" @click="handleDownload(currentDetail)">
                    <el-icon style="margin-right: 6px;"><Download/></el-icon> 下载原始文件
                  </el-button>
                </div>
              </div>
            </div>

            <!-- 面试记录 Tab -->
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- 简历预览弹窗 -->
    <FilePreviewDialog
      v-model="previewDialogVisible"
      :title="previewTitle"
      :url="previewUrl"
      :type="previewType"
      :loading="previewLoading"
      @close="onPreviewClose"
      @download="handleDownload(previewResumeData)"
    />

    <!-- 简历导入弹窗 (保留原逻辑与布局) -->
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
          <el-button type="primary" class="lark-btn-primary" :loading="listLoading" @click="submitUpload">确认导入</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import { UploadFilled, Download, Close, Document, View } from '@element-plus/icons-vue'
import { getCurrentUser } from '../../services/authService'
import { useResumeStore } from '../../stores/resumeStore'
import { resumeApi } from '../../api/resume'
import FilePreviewDialog from '../../components/FilePreviewDialog.vue'

const resumeStore = useResumeStore()
const currentUser = ref(getCurrentUser() || { id: 1, username: '管理员' })
const listLoading = ref(false)

// List retrieval
let statusPolling = null

const stopPolling = () => {
  if (statusPolling) {
    clearInterval(statusPolling)
    statusPolling = null
  }
}

const checkAndStartPolling = () => {
  const needsPolling = resumeStore.resumes.some(r => r.status === 'uploaded')
  
  if (needsPolling && !statusPolling) {
    statusPolling = setInterval(async () => {
      try {
        const data = await resumeApi.getResumes()
        const list = Array.isArray(data) ? data : (data.items || data.data || [])
        resumeStore.setResumes(list)
        
        // 如果全部解析完毕，停止轮询
        if (!list.some(r => r.status === 'uploaded')) {
          stopPolling()
        }
      } catch (error) {
        console.error('状态轮询失败:', error)
      }
    }, 5000)
  } else if (!needsPolling && statusPolling) {
    stopPolling()
  }
}

const fetchResumes = async () => {
  listLoading.value = true
  try {
    const data = await resumeApi.getResumes()
    const list = Array.isArray(data) ? data : (data.items || data.data || [])
    resumeStore.setResumes(list)
    checkAndStartPolling()
  } catch (error) {
    ElMessage.error('获取简历列表失败: ' + (error?.detail || error?.message || '未知错误'))
  } finally {
    listLoading.value = false
  }
}

onMounted(() => {
  fetchResumes()
})

onUnmounted(() => {
  stopPolling()
})

// Upload Drawer
const uploadDialogVisible = ref(false)
const uploadFormRef = ref(null)
const uploadRef = ref(null)

const uploadForm = ref({
  candidateName: '',
  file: null
})

const validateCandidateName = (rule, value, callback) => {
  if (!value) {
    return callback(new Error('必须输入候选人姓名'))
  }
  if (/^\d/.test(value)) {
    return callback(new Error('候选人姓名不能以数字开头'))
  }
  if (/^\d+$/.test(value)) {
    return callback(new Error('候选人姓名不能是纯数字'))
  }
  callback()
}

const uploadRules = {
  candidateName: [
    { required: true, validator: validateCandidateName, trigger: 'blur' }
  ]
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
      fetchResumes() // 这里会触发 checkAndStartPolling
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

// Custom Drawer logic
const drawerVisible = ref(false)
const drawerLoading = ref(false)
const currentDetail = ref(null)
const activeTab = ref('basic')
const specialDataStr = ref('')
const specialDataLoading = ref(false)
const activeSpecialType = ref('') // 'educations', 'work-experiences', etc.
const specialEduList = ref([])
const specialWorkList = ref([])
const specialSkillList = ref([])
const specialProjectList = ref([])

watch(drawerVisible, (val) => {
  if (val) document.body.style.overflow = 'hidden'
  else document.body.style.overflow = ''
})

const openDrawer = async (id) => {
  drawerVisible.value = true
  drawerLoading.value = true
  activeTab.value = 'basic'
  specialDataStr.value = ''
  
  try {
    const detail = await resumeApi.getResumeDetail(id)
    currentDetail.value = detail || resumeStore.resumes.find(r => r.id === id)
    // Optionally trigger store setup if deeply tied into other components
    resumeStore.selectResume(currentDetail.value)
  } catch (error) {
    ElMessage.error('无法获取简历详细内容')
    // Fallback if detail fetch fails but we've got summary list
    currentDetail.value = resumeStore.resumes.find(r => r.id === id)
  } finally {
    drawerLoading.value = false
  }
}

const closeDrawer = () => {
  drawerVisible.value = false
  setTimeout(() => {
    currentDetail.value = null
    specialDataStr.value = ''
    resumeStore.clearSelection()
  }, 300) // matches transition timing
}


const handleFetchSpecialInDrawer = async (type, titleName) => {
  if (!currentDetail.value?.id) return
  specialDataLoading.value = true
  activeSpecialType.value = type
  specialEduList.value = []
  specialWorkList.value = []
  specialSkillList.value = []
  specialDataStr.value = '正在提取并由智能分析模型组装中...'
  
  try {
    let data;
    if (type === 'educations') {
      data = await resumeApi.getResumeEducations(currentDetail.value.id)
      const list = Array.isArray(data) ? data : []
      specialEduList.value = list.sort((a, b) => new Date(b.end_date) - new Date(a.end_date))
    }
    else if (type === 'work-experiences') {
      data = await resumeApi.getResumeWorkExperiences(currentDetail.value.id)
      const list = Array.isArray(data) ? data : []
      specialWorkList.value = list.sort((a, b) => new Date(b.end_date) - new Date(a.end_date))
    }
    else if (type === 'skills') {
      data = await resumeApi.getResumeSkills(currentDetail.value.id)
      specialSkillList.value = Array.isArray(data) ? data : []
    }
    else if (type === 'projects') {
      data = await resumeApi.getResumeProjects(currentDetail.value.id)
      const list = Array.isArray(data) ? data : []
      specialProjectList.value = list.sort((a, b) => new Date(b.end_date) - new Date(a.end_date))
    }

    specialDataStr.value = JSON.stringify(data, null, 2)
  } catch (error) {
    ElMessage.error(`提取 ${titleName} 失败`)
    specialDataStr.value = '提取失败或返回格式解析出错'
  } finally {
    specialDataLoading.value = false
  }
}

const formatSimpleDate = (dateStr) => {
  if (!dateStr) return '至今'
  return dateStr.split('T')[0]
}

const formatDateRange = (startDate, endDate) => {
  const start = formatSimpleDate(startDate)
  // 开始和结束为同一天，视为"至今"
  if (startDate && endDate && startDate.split('T')[0] === endDate.split('T')[0]) {
    return '至今'
  }
  return `${start} - ${formatSimpleDate(endDate)}`
}

const formatFullTime = (dateStr) => {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const h = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    const s = String(date.getSeconds()).padStart(2, '0')
    return `${y}-${m}-${d} ${h}:${min}:${s}`
  } catch (e) {
    return dateStr
  }
}

const handleDownload = async (row) => {
  if (!row) return
  const loading = ElLoading.service({ lock: true, text: '正在下载源文件...' })
  try {
    const blob = await resumeApi.downloadResume(row.id)
    const fileName = row.file_name || `${row.candidate_name || '简历'}.${row.file_type || 'pdf'}`
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('简历下载完成')
  } catch (error) {
    ElMessage.error('下载失败: ' + (error?.detail || error?.message || '网络异常'))
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
      resumeStore.deleteResume(id)
      ElMessage.success('物理删除简历成功！')
      fetchResumes()
    } catch (error) {
      ElMessage.error('无法删除此简历: ' + (error?.detail || error?.message || '未知错误'))
    } finally {
      loading.close()
    }
  }).catch(() => {})
}

// === 预览相关 ===
const previewDialogVisible = ref(false)
const previewLoading = ref(false)
const previewUrl = ref('')
const previewType = ref('')
const previewTitle = ref('简历预览')
const previewResumeData = ref(null)

const handlePreview = async (resume) => {
  if (!resume) return

  previewResumeData.value = resume
  previewTitle.value = `${resume.candidate_name || '简历'} - 预览`
  previewType.value = (resume.file_type || '').toLowerCase()
  previewDialogVisible.value = true

  // PDF 文件使用 iframe 预览
  if (previewType.value === 'pdf') {
    previewLoading.value = true
    try {
      const blob = await resumeApi.downloadResume(resume.id)
      const pdfBlob = new Blob([blob], { type: 'application/pdf' })
      previewUrl.value = URL.createObjectURL(pdfBlob)
    } catch (error) {
      ElMessage.error('预览加载失败: ' + (error?.detail || error?.message || '网络异常'))
      previewDialogVisible.value = false
    } finally {
      previewLoading.value = false
    }
  }
}

const onPreviewClose = () => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
  previewResumeData.value = null
}
</script>

<style scoped>
/* 核心设计令牌 (Lark Design Tokens) */
.feishu-page {
  background-color: #F5F6F7;
  padding: 16px 24px;
  min-height: calc(100vh - 60px);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.card-container {
  background-color: #FFFFFF;
  border-radius: 8px;
  border: 1px solid #DEE0E3;
  min-height: 80vh;
  box-shadow: 0 2px 8px rgba(31, 35, 41, 0.04);
  display: flex;
  flex-direction: column;
}

/* 顶部配置与筛选控制流 */
.header-area {
  padding: 20px 24px;
  border-bottom: 1px solid #DEE0E3;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.title-area {
  display: flex;
  align-items: center;
}

.title-area h1 {
  font-size: 20px;
  font-weight: 600;
  color: #1F2329;
  margin: 0;
}

.badge {
  background-color: #E1EAFF;
  color: #3370FF;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  margin-left: 12px;
}

.lark-btn-primary {
  background-color: #3370FF;
  border-color: #3370FF;
  border-radius: 6px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(51, 112, 255, 0.2);
}
.lark-btn-primary:hover {
  background-color: #2458D9;
}

.lark-btn-ghost {
  border: 1px solid #DEE0E3;
  color: #1F2329;
  background: transparent;
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 500;
  transition: all 0.2s;
}
.lark-btn-ghost:hover {
  background: #F5F6F7;
}

.lark-btn-ghost:hover {
  background: #F5F6F7;
}

/* 列表渲染与微交互 */
.list-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.list-header-row {
  display: flex;
  align-items: center;
  padding: 0 24px;
  height: 44px;
  color: #646A73;
  font-size: 14px;
  font-weight: 500;
  border-bottom: 1px solid #DEE0E3;
  background-color: #FFFFFF;
}

.list-body {
  flex: 1;
}

.list-row {
  display: flex;
  align-items: center;
  padding: 0 24px;
  height: 64px;
  border-bottom: 1px solid #F5F6F7;
  cursor: pointer;
  transition: background-color 0.2s;
}

.list-row:hover {
  background-color: #F5F6F7;
}

.col-name { flex: 2.5; min-width: 240px; display: flex; align-items: center; }
.col-type { flex: 0.8; min-width: 100px; display: flex; align-items: center; }
.col-status { flex: 1.2; min-width: 140px; display: flex; align-items: center; }
.col-time { flex: 1.5; min-width: 160px; display: flex; align-items: center; color: #646A73; font-size: 14px; }
.col-action { flex: 1; min-width: 120px; display: flex; gap: 8px; justify-content: flex-end; align-items: center; }

.lark-avatar {
  background-color: #3370FF;
  color: #FFF;
  font-weight: 600;
  margin-right: 12px;
}

.name-text {
  font-size: 14px;
  font-weight: 600;
  color: #1F2329;
  margin-right: 12px;
}

/* 标签域 */
.lark-tag {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  margin-right: 6px;
}
.tag-gray { background: #F5F6F7; color: #646A73; }

/* 进度/状态标识 */
.status-indicator {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #1F2329;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}
.dot-success { background-color: #13A248; }
.dot-loading { background-color: #3370FF; animation: blink 1s infinite alternate; }
@keyframes blink {
  from { opacity: 0.4; }
  to { opacity: 1; }
}

/* 详情侧滑抽屉样式 (Drawer) */
.lark-drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(31, 35, 41, 0.4);
  z-index: 2000;
}

.lark-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 680px;
  background: #FFFFFF;
  z-index: 2001;
  box-shadow: -4px 0 24px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
}

/* 飞书动效 */
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.35s cubic-bezier(0.23, 1, 0.32, 1);
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Drawer Header */
.drawer-header {
  padding: 20px 24px;
  border-bottom: 1px solid #DEE0E3;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.drawer-title {
  font-size: 18px;
  font-weight: 600;
  color: #1F2329;
}
.drawer-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.close-icon {
  font-size: 20px;
  color: #646A73;
  cursor: pointer;
  transition: color 0.2s;
  margin-left: 8px;
}
.close-icon:hover {
  color: #1F2329;
}

/* Drawer Tabs */
.drawer-tabs {
  display: flex;
  padding: 0 24px;
  border-bottom: 1px solid #DEE0E3;
  gap: 32px;
}
.tab-item {
  padding: 16px 0;
  font-size: 14px;
  color: #646A73;
  cursor: pointer;
  position: relative;
  font-weight: 500;
  transition: color 0.2s;
}
.tab-item:hover {
  color: #1F2329;
}
.tab-item.active {
  color: #3370FF;
}
.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #3370FF;
  border-radius: 2px 2px 0 0;
}

/* Drawer Body */
.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background-color: #F5F6F7;
}

.detail-card {
  background: #FFFFFF;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid #DEE0E3;
}
.detail-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1F2329;
  margin-top: 0;
  margin-bottom: 16px;
}


.special-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.code-block {
  background: #F8F9FA; 
  padding: 16px; 
  border-radius: 6px; 
  font-size: 13px; 
  color: #1F2329; 
  white-space: pre-wrap; 
  font-family: Monaco, Menlo, Consolas, "Courier New", monospace;
  max-height: 480px;
  overflow-y: auto;
  border: 1px solid #DEE0E3;
  line-height: 1.5;
}

/* 专项提取列表公共样式 */
.special-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.special-item {
  background: #FFFFFF;
  border-radius: 6px;
  padding: 16px;
  border: 1px solid #E4E7ED;
  transition: all 0.2s;
}
.special-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-color: #3370FF;
}
.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.main-title {
  font-size: 15px;
  font-weight: 600;
  color: #1F2329;
}
.item-sub {
  font-size: 13px;
  color: #646A73;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.item-date {
  font-size: 12px;
  color: #8F959E;
}
.mini-tag {
  height: 18px;
  line-height: 17px;
  padding: 0 4px;
  font-size: 10px;
  border: none;
}

/* 工作经历特有样式 */
.item-desc {
  margin-top: 10px;
  font-size: 13px;
  color: #1F2329;
  line-height: 1.6;
  white-space: pre-wrap;
  background: #F5F6F7;
  padding: 12px;
  border-radius: 4px;
}
.position-text {
  color: #3370FF;
  font-weight: 500;
}
.role-text {
  color: #13A248;
  font-weight: 500;
}

/* 技能标签云样式 */
.skill-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.skill-chip {
  background-color: #E1EAFF;
  color: #3370FF;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #3370FF33;
}
.skill-level {
  font-size: 11px;
  opacity: 0.8;
  margin-left: 4px;
}

/* 空状态卡片样式 */
.empty-special-card {
  background: #FFFFFF;
  border-radius: 8px;
  padding: 40px 20px;
  border: 1px dashed #DEE0E3;
  display: flex;
  justify-content: center;
  align-items: center;
}


</style>

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
              <span class="lark-tag tag-blue" v-if="resume.file_type === 'pdf'">名企概率高</span>
              <span class="lark-tag tag-purple">高学历潜力</span>
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
            
            <div class="col-time">{{ resume.created_at || '刚刚' }}</div>
            
            <div class="col-action">
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
              <el-button size="small" class="lark-btn-ghost">简历预览</el-button>
              <el-button size="small" class="lark-btn-ghost">评价</el-button>
              <el-button size="small" type="primary" class="lark-btn-primary">流转</el-button>
              <el-button size="small" type="danger" plain>淘汰</el-button>
              <el-icon class="close-icon" @click="closeDrawer"><Close /></el-icon>
            </div>
          </div>
          
          <div class="drawer-tabs">
            <div class="tab-item" :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">基本信息</div>
            <div class="tab-item" :class="{ active: activeTab === 'original' }" @click="activeTab = 'original'">简历原文</div>
            <div class="tab-item" :class="{ active: activeTab === 'interview' }" @click="activeTab = 'interview'">面试记录</div>
          </div>
          
          <div class="drawer-body">
            <!-- 基本信息 Tab -->
            <div v-show="activeTab === 'basic'">
              <div class="detail-card">
                <h3>人才亮点标记</h3>
                <div v-if="currentDetail" class="highlight-tags">
                   <span class="lark-tag tag-blue">工作经验丰富</span>
                   <span class="lark-tag tag-purple">名企背景</span>
                   <span class="lark-tag tag-green">技能匹配度极高</span>
                </div>
              </div>
              
              <div class="detail-card">
                <h3>基础信息字段</h3>
                <el-descriptions :column="2" border v-if="currentDetail">
                  <el-descriptions-item label="候选人姓名">{{ currentDetail.candidate_name }}</el-descriptions-item>
                  <el-descriptions-item label="文件格式">{{ currentDetail.file_type?.toUpperCase() }}</el-descriptions-item>
                  <el-descriptions-item label="解析状态">{{ currentDetail.status }}</el-descriptions-item>
                  <el-descriptions-item label="上传时间">{{ currentDetail.created_at || '未知' }}</el-descriptions-item>
                </el-descriptions>
              </div>

              <div class="detail-card">
                <h3>全文极客解析结果</h3>
                <div class="resume-content-view" v-if="currentDetail">
                  <!-- 适配文本串以及后端返回结构对象 -->
                  <pre v-if="typeof currentDetail.parsed_content === 'string' || typeof currentDetail.content === 'string'" class="code-block" style="background-color: #1e1e1e; color: #d4d4d4;">{{ currentDetail.parsed_content || currentDetail.content }}</pre>
                  <pre v-else class="code-block" style="background-color: #1e1e1e; color: #d4d4d4;">{{ formatJson(currentDetail) }}</pre>
                </div>
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
                  <pre class="code-block">{{ specialDataStr }}</pre>
                </div>
              </div>
            </div>

            <!-- 简历原文 Tab -->
            <div v-show="activeTab === 'original'">
              <div class="detail-card text-center" style="padding: 40px;">
                <el-icon :size="48" color="#8F959E"><Document /></el-icon>
                <h3 style="margin-top: 16px; color: #1F2329;">源文件操作</h3>
                <p style="color: #646A73; font-size: 14px; margin-bottom: 24px;">（当前版本不支持直接在此处内联渲染 PDF/WORD 预览，请下载后查看）</p>
                <el-button type="primary" class="lark-btn-primary" @click="handleDownload(currentDetail)">
                  <el-icon style="margin-right: 6px;"><Download/></el-icon> 下载原始文件
                </el-button>
              </div>
            </div>

            <!-- 面试记录 Tab -->
            <div v-show="activeTab === 'interview'">
              <div class="detail-card">
                <h3>面试流程进度流转表</h3>
                <el-empty description="该候选人暂无已录入的面试流水记录与跟进评价" />
              </div>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

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
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import { UploadFilled, Download, Close, Document } from '@element-plus/icons-vue'
import { getCurrentUser } from '../../services/authService'
import { useResumeStore } from '../../stores/resumeStore'
import { resumeApi } from '../../api/resume'

const resumeStore = useResumeStore()
const currentUser = ref(getCurrentUser() || { id: 1, username: '管理员' })
const listLoading = ref(false)

// List retrieval
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

// Upload Drawer
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
      fetchResumes()
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

// 格式化解析数据，剔除不相关字段
const formatJson = (data) => {
  if (!data) return ''
  const displayData = { ...data }
  delete displayData.preview_url
  delete displayData.file_path
  return JSON.stringify(displayData, null, 2)
}

const handleFetchSpecialInDrawer = async (type, titleName) => {
  if (!currentDetail.value?.id) return
  specialDataLoading.value = true
  specialDataStr.value = '正在提取并由智能分析模型组装中...'
  try {
    let data;
    if (type === 'educations') data = await resumeApi.getResumeEducations(currentDetail.value.id)
    else if (type === 'work-experiences') data = await resumeApi.getResumeWorkExperiences(currentDetail.value.id)
    else if (type === 'skills') data = await resumeApi.getResumeSkills(currentDetail.value.id)
    else if (type === 'projects') data = await resumeApi.getResumeProjects(currentDetail.value.id)

    specialDataStr.value = JSON.stringify(data, null, 2)
  } catch (error) {
    ElMessage.error(`提取 ${titleName} 失败`)
    specialDataStr.value = '提取失败或返回格式解析出错'
  } finally {
    specialDataLoading.value = false
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
.tag-blue { background: #E1EAFF; color: #3370FF; }
.tag-purple { background: #F0E5FF; color: #722ED1; }
.tag-gray { background: #F5F6F7; color: #646A73; }
.tag-green { background: #E4F8EB; color: #13A248; }

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
.highlight-tags {
  display: flex;
  gap: 8px;
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
</style>

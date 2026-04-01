<template>
  <el-container class="dashboard-container">
    <!-- 左侧侧边栏 -->
    <el-aside width="220px" class="sidebar">
      <div class="logo">招聘管理系统</div>
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical"
        background-color="#0f172a"
        text-color="#94a3b8"
        active-text-color="#ffffff"
        @select="(index) => activeMenu = index"
      >
        <el-menu-item index="1">
          <el-icon><House /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="2">
          <el-icon><Document /></el-icon>
          <span>简历管理</span>
        </el-menu-item>
        <el-menu-item index="3">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="4">
          <el-icon><ChatLineRound /></el-icon>
          <span>面试管理</span>
        </el-menu-item>
        <el-menu-item index="5">
          <el-icon><Calendar /></el-icon>
          <span>约见安排</span>
        </el-menu-item>
        <el-menu-item index="6">
          <el-icon><DataLine /></el-icon>
          <span>数据统计</span>
        </el-menu-item>
        <el-menu-item index="7">
          <el-icon><Setting /></el-icon>
          <span>系统设置</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container class="main-wrapper">
      <!-- 顶部导航栏 -->
      <el-header height="60px" class="navbar">
        <div class="nav-left">
          <span class="breadcrumb">首页</span>
        </div>
        <div class="nav-right">
          <el-input placeholder="搜索..." class="search-input">
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-badge is-dot class="notification-badge">
            <el-icon class="notification-icon"><Bell /></el-icon>
          </el-badge>
          
          <!-- 用户下拉区域, 恢复登出按钮 -->
          <el-dropdown trigger="click">
            <div class="user-profile">
              <el-avatar size="small" style="background-color: #409eff; font-size: 12px; margin-right: 8px;">
                {{ currentUser?.username?.charAt(0) || '管' }}
              </el-avatar>
              <span class="username">{{ currentUser?.username || '管理员' }}</span>
              <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="router.push('/profile')">进入个人中心</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout" style="color: #f56c6c;">登出</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主区 -->
      <el-main class="main-content">
        <template v-if="activeMenu === '1'">
        <!-- 欢迎卡片 -->
        <el-card class="welcome-card" shadow="never">
          <div class="card-content">
            <div class="welcome-left">
              <h2>欢迎回来，{{ currentUser?.username || '管理员' }}</h2>
              <p>今日待处理任务：<span class="highlight">3 项</span></p>
            </div>
            <div class="welcome-right">
              <!-- 还原旧代码的功能按钮 -->
              <el-button type="info" plain @click="triggerResumeUpload">上传简历</el-button>
              <el-button type="success" plain @click="openInterviewModal('online')">新增线上面试</el-button>
              <el-button type="primary" plain @click="openInterviewModal('offline')">新增线下面试</el-button>
              <el-button type="warning" plain @click="createSession">创建 ASR 会话</el-button>
              <el-button type="danger" plain @click="startASR">启动 ASR</el-button>
              <el-button @click="router.push('/profile')">进入个人中心</el-button>
              <input type="file" ref="resumeInput" style="display: none" accept=".pdf,.doc,.docx" @change="handleResumeUpload" />
            </div>
          </div>
        </el-card>

        <!-- 数据概览卡片 -->
        <el-row :gutter="20" class="stats-row">
          <el-col :span="8" v-for="(stat, index) in statistics" :key="index" style="margin-bottom: 20px;">
            <el-card class="stat-card" shadow="never">
              <div class="stat-content">
                <div class="stat-info">
                  <div class="stat-title">{{ stat.title }}</div>
                  <div class="stat-value">{{ stat.value }}</div>
                  <div class="stat-change" :class="stat.trend">
                    <span class="trend-icon">
                      <el-icon v-if="stat.trend === 'up'"><TopRight /></el-icon>
                      <el-icon v-else><BottomRight /></el-icon>
                    </span>
                    {{ stat.change }} <span class="compare-text">较昨日</span>
                  </div>
                </div>
                <!-- 浅色圆形图标 -->
                <div class="stat-icon-wrapper" :style="{ backgroundColor: stat.bgColor, color: stat.color }">
                  <el-icon><component :is="stat.icon" /></el-icon>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- (原有逻辑恢复) 面试会话管理真实功能卡片 -->
        <el-card class="list-card mb-24" shadow="never" v-if="interviews.length > 0">
          <template #header>
            <div class="list-header">
              <span>面试管理 (功能区)</span>
            </div>
          </template>
          <ul class="session-list">
            <li v-for="item in interviews" :key="item.id" class="session-item">
              <div class="resume-info">
                <div>
                  <span class="status-badge" :style="{ backgroundColor: item.session_type === 'online' ? '#d1fae5' : '#ede9fe', color: item.session_type === 'online' ? '#059669' : '#6d28d9' }">
                    {{ item.session_type === 'online' ? '线上面试' : '线下面试' }}
                  </span>
                  <span style="margin-left:8px; font-weight: bold;">候选人 ID: {{ item.candidate_id }}</span>
                  <span style="margin-left:8px; color: #666; font-size: 13px;" v-if="item.resume_id">
                    (已关联简历 ID: {{ item.resume_id }})
                  </span>
                </div>
                <div style="font-size: 13px; color: #555; margin-top: 4px;">
                  预定时间: {{ formatTime(item.scheduled_at) }}
                </div>
                <div style="font-size: 13px; color: #555; margin-top: 4px;" v-if="getExtraInfo(item)">
                  {{ item.session_type === 'online' ? '会议链接' : '面试地点' }}: 
                  <span style="font-family: monospace; background: #f0f0f0; padding: 2px 4px; border-radius: 4px;">{{ getExtraInfo(item) }}</span>
                </div>
              </div>
              <div class="actions">
                 <el-button size="small" @click="editInterview(item)">编辑信息</el-button>
                 <el-button size="small" type="danger" @click="deleteInterview(item.id)">取消/删除</el-button>
              </div>
            </li>
          </ul>
        </el-card>

        <!-- 静态 Mock 简历投递管理大卡片 -->
        <el-card class="list-card" shadow="never">
          <template #header>
            <div class="list-header">
              <span>简历接收与管理 (静态演示区)</span>
            </div>
          </template>
          
          <div class="toolbar">
            <el-input v-model="searchKeyword" placeholder="搜索姓名或岗位" class="list-search">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            
            <div class="toolbar-right">
              <el-select v-model="filterJob" placeholder="全部岗位" class="filter-select">
                <el-option label="全部岗位" value="all"></el-option>
                <el-option label="前端开发" value="frontend"></el-option>
                <el-option label="Java开发" value="java"></el-option>
                <el-option label="产品经理" value="pm"></el-option>
              </el-select>
              
              <el-select v-model="filterStatus" placeholder="全部状态" class="filter-select">
                <el-option label="全部状态" value="all"></el-option>
                <el-option label="待筛选" value="pending"></el-option>
                <el-option label="已约面" value="interviewing"></el-option>
                <el-option label="已录用" value="hired"></el-option>
                <el-option label="已淘汰" value="rejected"></el-option>
              </el-select>
              <el-button type="primary">查询</el-button>
              <el-button>重置</el-button>
            </div>
          </div>

          <el-table 
            :data="tableData" 
            style="width: 100%" 
            :header-cell-style="{ background: '#fafafa', color: '#606266', fontWeight: 500, borderBottom: '1px solid #ebeef5' }"
          >
            <el-table-column prop="name" label="姓名" width="100"></el-table-column>
            <el-table-column prop="job" label="应聘岗位" min-width="140"></el-table-column>
            <el-table-column prop="edu" label="学历" width="100"></el-table-column>
            <el-table-column prop="exp" label="工作年限" width="100"></el-table-column>
            <el-table-column prop="time" label="投递时间" width="160"></el-table-column>
            <el-table-column label="简历状态" width="120">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)" size="small" :class="['status-tag', 'status-' + getStatusType(scope.row.status)]">
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default>
                <el-button type="primary" link size="small" class="action-btn">查看</el-button>
                <el-button type="primary" link size="small" class="action-btn">下载</el-button>
                <el-button type="primary" link size="small" class="action-btn">更新</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
        </template>

        <!-- ========== 简历管理页 ========== -->
        <template v-if="activeMenu === '2'">
          <el-card class="list-card" shadow="never">
            <template #header>
              <div class="list-header" style="display: flex; justify-content: space-between; align-items: center;">
                <span>简历管理台 (功能区)</span>
                <el-button type="primary" size="small" @click="triggerResumeUpload">上传新简历</el-button>
              </div>
            </template>
            <el-table 
              :data="resumes" 
              style="width: 100%" 
              :header-cell-style="{ background: '#fafafa', color: '#606266', fontWeight: 500, borderBottom: '1px solid #ebeef5' }"
            >
              <el-table-column prop="file_name" label="文件名称" min-width="150" show-overflow-tooltip></el-table-column>
              <el-table-column prop="file_type" label="格式" width="100">
                <template #default="scope">
                  {{ scope.row.file_type.toUpperCase() }}
                </template>
              </el-table-column>
              <el-table-column prop="status" label="解析状态" width="120">
                <template #default="scope">
                  <el-tag size="small" type="success" :class="['status-tag', 'status-success']">
                    {{ scope.row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="created_at" label="上传时间" width="180"></el-table-column>
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="scope">
                  <el-button type="primary" link size="small" class="action-btn" @click="viewResume(scope.row)">查看</el-button>
                  <el-button type="danger" link size="small" class="action-btn" @click="deleteResume(scope.row.id)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </template>

      </el-main>
    </el-container>

    <!-- 弹窗部分 (复用原来的逻辑组件) -->
    <!-- 面试会话表单弹窗 -->
    <el-dialog 
      :title="`${isEditMode ? '修改' : '新增'}${interviewForm.session_type === 'online' ? '线上面试信息' : '线下面试安排'}`" 
      v-model="showInterviewModal" 
      width="500px"
      destroy-on-close>
      <el-form :model="interviewForm" label-position="top">
        <el-form-item label="候选人 ID" required>
          <el-input v-model="interviewForm.candidate_id" placeholder="如: 10001"></el-input>
        </el-form-item>
        
        <el-form-item label="关联简历材料">
          <el-select v-model="interviewForm.resume_id" placeholder="-- 不关联任何或暂无简历 --" style="width: 100%" clearable>
            <el-option v-for="r in resumes" :key="r.id" :label="`${r.file_name} (ID: ${r.id})`" :value="r.id"></el-option>
          </el-select>
          <div v-if="resumes.length === 0" style="font-size: 12px; color: #e6a23c; margin-top: 6px; line-height: 1.4;">
            提示: 您当前的纯内存库中还没有上传过简历，如果需要选择关联简历，请先返回仪表盘上方点击“上传简历”。
          </div>
        </el-form-item>

        <el-form-item label="预定时间" required>
          <el-date-picker 
            v-model="interviewForm.scheduled_at" 
            type="datetime" 
            placeholder="请选择预定时间面板" 
            value-format="YYYY-MM-DD HH:mm:ss" 
            style="width: 100%" />
        </el-form-item>
        
        <el-form-item :label="interviewForm.session_type === 'online' ? '会议链接/会议号' : '面试详细地点'" required>
          <el-input 
            v-model="interviewForm.extra_info" 
            :placeholder="interviewForm.session_type === 'online' ? '例如: https://meet.tencent.com/123-456-789' : '例如: 深圳市南山区招聘中心会议室C'">
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeInterviewModal">取消</el-button>
          <el-button type="primary" @click="saveInterview">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 简历详情弹窗 -->
    <div class="modal-overlay" v-if="selectedResume" @click="closeResumeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>简历预览: {{ selectedResume.file_name }}</h3>
          <button class="close-btn" @click="closeResumeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="preview-container" v-if="selectedResume.preview_url">
            <iframe 
              v-if="selectedResume.file_type === 'pdf'" 
              :src="selectedResume.preview_url" 
              class="pdf-viewer">
            </iframe>
            <div v-else class="empty-state doc-preview-notice">
              * 由于浏览器安全限制，暂不支持内联预览 Word 格式文档 ({{ selectedResume.file_type.toUpperCase() }})。
            </div>
          </div>
          <div class="meta-data-section">
            <div class="detail-row"><span class="label">简历ID:</span> <span class="value">{{ selectedResume.id }}</span></div>
            <div class="detail-row"><span class="label">存储路径:</span> <span class="value">{{ selectedResume.file_path }}</span></div>
            <div class="detail-row">
              <span class="label">当前状态:</span> 
              <span class="value status-badge">{{ selectedResume.status }}</span>
            </div>
            <div class="detail-row"><span class="label">上传时间:</span> <span class="value">{{ selectedResume.created_at }}</span></div>
          </div>
        </div>
        <div class="modal-footer">
          <el-button @click="closeResumeModal">关闭</el-button>
        </div>
      </div>
    </div>
  </el-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCurrentUser } from '../services/authService'
import authService from '../services/authService'
import { interviewApi } from '../api/interview'
import { 
  House, Document, User, ChatLineRound, Calendar, DataLine, Setting, Search, Bell, ArrowDown,
  TopRight, BottomRight, DocumentAdd, Avatar, Medal, Coordinate
} from '@element-plus/icons-vue'

// ----- 基础注入 -----
const router = useRouter()
const currentUser = ref(getCurrentUser() || { id: 1, username: '管理员' })
const resumeInput = ref(null)
const activeMenu = ref('1')

// ----- Data: Mock 区块 (静态视觉数据) -----
const statistics = ref([
  { title: '今日新增简历', value: '28', change: '+12.5%', trend: 'up', icon: 'DocumentAdd', bgColor: '#e6f4ff', color: '#1677ff' },
  { title: '待筛选简历', value: '156', change: '+8.3%', trend: 'up', icon: 'User', bgColor: '#f6ffed', color: '#52c41a' },
  { title: '今日面试数', value: '12', change: '-3.2%', trend: 'down', icon: 'Calendar', bgColor: '#fffbe6', color: '#faad14' },
  { title: '待约见人数', value: '45', change: '+5.7%', trend: 'up', icon: 'Coordinate', bgColor: '#fff0f6', color: '#eb2f96' },
  { title: '本周 Offer 发放', value: '8', change: '+15.0%', trend: 'up', icon: 'Medal', bgColor: '#f9f0ff', color: '#722ed1' },
  { title: '系统用户数', value: '342', change: '+2.1%', trend: 'up', icon: 'Avatar', bgColor: '#e0fdfa', color: '#13c2c2' }
])
const searchKeyword = ref('')
const filterJob = ref('')
const filterStatus = ref('')
const tableData = ref([
  { name: '张三', job: '前端开发工程师', edu: '本科', exp: '3年', time: '2026-03-31 10:30', status: '待筛选' },
  { name: '李四', job: 'Java开发工程师', edu: '硕士', exp: '5年', time: '2026-03-31 09:15', status: '已约面' },
  { name: '王五', job: '产品经理', edu: '本科', exp: '4年', time: '2026-03-30 16:45', status: '已录用' },
  { name: '赵六', job: 'UI设计师', edu: '专科', exp: '2年', time: '2026-03-30 14:20', status: '已淘汰' }
])
const getStatusType = (status) => {
  switch (status) {
    case '待筛选': return 'warning'
    case '已约面': return 'primary'
    case '已录用': return 'success'
    case '已淘汰': return 'info'
    default: return ''
  }
}

// ----- 原有逻辑移植 (功能模块) -----
const sessionId = ref('')
const sessions = ref([])

const createSession = async () => {
  try {
    const data = await interviewApi.createSession()
    sessionId.value = data.user_id
    ElMessage.success('面试会话创建成功')
  } catch (error) {
    ElMessage.error('创建面试会话失败: ' + (error.detail || error.message))
  }
}

const listSessions = async () => {
  try {
    const data = await interviewApi.getSessions()
    sessions.value = data.sessions
    ElMessage.success('获取面试记录成功')
  } catch (error) {
    ElMessage.error('获取面试记录失败: ' + (error.detail || error.message))
  }
}

const viewSession = async (id) => {
  try {
    const data = await interviewApi.getSession(id)
    console.log('Session details:', data)
    ElMessage.success('获取会话详情成功')
  } catch (error) {
    ElMessage.error('获取会话详情失败: ' + (error.detail || error.message))
  }
}

const startASR = async () => {
  if (!sessionId.value) {
    ElMessage.warning('请先创建面试会话')
    return
  }
  router.push(`/interview/${sessionId.value}`)
}

const stopASR = async () => {
  ElMessage.info('请在面试页面中停止语音识别')
}

const resumes = ref([]) 
const selectedResume = ref(null) 
const interviews = ref([]) 
const showInterviewModal = ref(false)
const isEditMode = ref(false)
const interviewForm = ref({
  id: null,
  candidate_id: '',
  resume_id: '',
  session_type: 'online', 
  scheduled_at: '',
  extra_info: ''
})

const handleLogout = () => {
  authService.logout()
  router.push('/login')
}

// --- 【面试 CRUD】逻辑 ---
const openInterviewModal = (type) => {
  isEditMode.value = false;
  interviewForm.value = {
    id: null,
    candidate_id: '',
    resume_id: '',
    session_type: type,
    scheduled_at: '',
    extra_info: ''
  };
  showInterviewModal.value = true;
};

const editInterview = (item) => {
  isEditMode.value = true;
  interviewForm.value = {
    id: item.id,
    candidate_id: item.candidate_id,
    resume_id: item.resume_id,
    session_type: item.session_type,
    scheduled_at: item.scheduled_at ? item.scheduled_at : '',
    extra_info: getExtraInfo(item)
  };
  showInterviewModal.value = true;
};

const closeInterviewModal = () => {
  showInterviewModal.value = false;
};

const saveInterview = () => {
  if (!interviewForm.value.candidate_id) {
    ElMessage.warning('请填写候选人 ID'); return;
  }
  if (!interviewForm.value.scheduled_at) {
    ElMessage.warning('请选择面试时间'); return;
  }
  if (!interviewForm.value.extra_info) {
    ElMessage.warning(interviewForm.value.session_type === 'online' ? '会议链接不能为空' : '面试地点不能为空'); return;
  }

  const extraKey = interviewForm.value.session_type === 'online' ? 'meeting_url' : 'location';
  const parsedNotes = JSON.stringify({ [extraKey]: interviewForm.value.extra_info });

  if (isEditMode.value) {
    const target = interviews.value.find(i => i.id === interviewForm.value.id);
    if (target) {
      target.candidate_id = interviewForm.value.candidate_id;
      target.resume_id = interviewForm.value.resume_id;
      target.scheduled_at = interviewForm.value.scheduled_at; 
      target.notes = parsedNotes;
      target.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }
    ElMessage.success('面试信息修改成功！');
  } else {
    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const mockNewId = Date.now();
    const newInterview = {
      id: mockNewId,
      candidate_id: interviewForm.value.candidate_id,
      recruiter_id: currentUser.value.id,
      resume_id: interviewForm.value.resume_id || 0,
      session_type: interviewForm.value.session_type,
      status: 'scheduled',
      scheduled_at: interviewForm.value.scheduled_at,
      started_at: null,
      ended_at: null,
      notes: parsedNotes,
      created_at: nowStr,
      updated_at: nowStr
    };
    interviews.value.unshift(newInterview);
    ElMessage.success('面试会话创建成功！');
  }
  closeInterviewModal();
};

const deleteInterview = (id) => {
  if (confirm('确定要取消并删除该面试会话吗？')) {
     interviews.value = interviews.value.filter(i => i.id !== id);
     ElMessage.success('面试删除成功');
  }
};

const getExtraInfo = (item) => {
  if (!item.notes) return '';
  try {
    const obj = JSON.parse(item.notes);
    return item.session_type === 'online' ? (obj.meeting_url || '') : (obj.location || '');
  } catch (e) {
    return item.notes;
  }
};

const formatTime = (str) => {
  if (!str) return '未定';
  return str.replace('T', ' ');
};

// --- 【简历 CRUD】逻辑 ---
const triggerResumeUpload = () => {
  resumeInput.value.click();
};

const handleResumeUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  const allowedTypes = [
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
  
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
    ElMessage.error('只支持 PDF 或 Word 格式的简历文件')
    event.target.value = ''
    return
  }
  
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('简历文件大小不能超过 5MB')
    event.target.value = ''
    return
  }
  
  ElMessage.info('正在解析并上传简历...')
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1500))

    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const fileExt = file.name.split('.').pop().toLowerCase()
    const mockId = Date.now()
    
    const blobUrl = URL.createObjectURL(file)

    const newResume = {
      id: mockId,
      user_id: currentUser.value.id,
      file_name: file.name,
      file_path: '/mock/resumes/' + mockId + '_' + file.name,
      file_type: fileExt,
      status: 'uploaded',
      content: '暂无提取内容...',
      created_at: nowStr,
      updated_at: nowStr,
      extracted_at: null,
      preview_url: blobUrl
    }
    
    resumes.value.unshift(newResume)
    ElMessage.success(`简历 ${file.name} 上传成功！`)
  } catch (error) {
    ElMessage.error('上传失败: ' + (error.detail || error.message))
  } finally {
    event.target.value = ''
  }
};

const viewResume = (resume) => {
  selectedResume.value = resume;
};

const closeResumeModal = () => {
  selectedResume.value = null;
};

const deleteResume = (id) => {
  if (window.confirm('确定要删除这份简历吗？该操作不可恢复。')) {
    const target = resumes.value.find(r => r.id === id)
    if (target && target.preview_url) {
      URL.revokeObjectURL(target.preview_url)
    }
    
    resumes.value = resumes.value.filter(r => r.id !== id)
    if (selectedResume.value && selectedResume.value.id === id) {
      selectedResume.value = null
    }
    ElMessage.success('简历删除成功')
  }
};
</script>

<style scoped lang="scss">
/* ----- 整体布局 ----- */
.dashboard-container {
  height: 100vh;
  width: 100vw;
  background-color: #f0f2f5; 
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  overflow: hidden;
}

.mb-24 {
  margin-bottom: 24px;
}

.row-center {
  display: flex;
  align-items: center;
}

/* ----- 侧边栏样式 ----- */
.sidebar {
  background-color: #0f172a;
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
  
  .logo {
    height: 60px;
    line-height: 60px;
    text-align: center;
    color: #ffffff;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 1px;
    background-color: #0b1120;
    flex-shrink: 0;
  }

  .el-menu-vertical {
    border-right: none;
    flex: 1;
    overflow-y: auto;
    
    .el-menu-item {
      font-size: 14px;
      height: 50px;
      line-height: 50px;
      margin: 8px 12px;
      border-radius: 8px;
      
      .el-icon {
        font-size: 18px;
        margin-right: 12px;
      }
      
      &.is-active {
        background-color: #409eff !important;
        color: #fff !important;
      }
      &:hover:not(.is-active) {
        background-color: rgba(255, 255, 255, 0.05) !important;
        color: #fff !important;
      }
    }
  }
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background-color: #f0f2f5;
}

/* ----- 顶部导航栏样式 ----- */
.navbar {
  background-color: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.05);
  z-index: 10;
  flex-shrink: 0;
  
  .nav-left {
    .breadcrumb {
      font-size: 14px;
      color: #606266;
    }
  }
  
  .nav-right {
    display: flex;
    align-items: center;
    gap: 24px;
    
    .search-input {
      width: 220px;
      :deep(.el-input__wrapper) {
        border-radius: 20px;
        background-color: #f8fafc;
        box-shadow: 0 0 0 1px transparent inset;
        &:hover, &.is-focus {
          box-shadow: 0 0 0 1px #dcdfe6 inset;
        }
      }
    }
    
    .notification-badge {
      cursor: pointer;
      display: flex;
      align-items: center;
      .notification-icon {
        font-size: 20px;
        color: #606266;
      }
    }
    
    .user-profile {
      display: flex;
      align-items: center;
      cursor: pointer;
      
      .username {
        font-size: 14px;
        color: #303133;
        margin-right: 4px;
      }
      .dropdown-icon {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}

/* ----- 核心画布区域 ----- */
.main-content {
  padding: 24px;
  overflow-y: auto;
  box-sizing: border-box;
  
  .welcome-card {
    border-radius: 8px;
    border: none;
    margin-bottom: 24px;
    box-shadow: 0 1px 2px -2px rgba(0,0,0,0.08), 0 3px 6px 0 rgba(0,0,0,0.04), 0 5px 12px 4px rgba(0,0,0,0.02);
    
    :deep(.el-card__body) {
      padding: 0;
    }

    .card-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
    }
    
    .welcome-left {
      h2 {
        margin: 0 0 8px 0;
        font-size: 20px;
        color: #1f2937;
        font-weight: 600;
      }
      p {
        margin: 0;
        font-size: 14px;
        color: #6b7280;
        .highlight {
          color: #f56c6c;
          font-weight: 600;
        }
      }
    }
    
    .welcome-right {
      display: flex;
      gap: 12px;
    }
  }

  /* 行间距控制 */
  .stats-row {
    margin-bottom: 4px;
  }

  .stat-card {
    border-radius: 8px;
    border: none;
    height: 100%;
    box-shadow: 0 1px 2px -2px rgba(0,0,0,0.08), 0 3px 6px 0 rgba(0,0,0,0.04), 0 5px 12px 4px rgba(0,0,0,0.02);
    
    :deep(.el-card__body) {
      padding: 20px 24px;
    }
    
    .stat-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    
    .stat-info {
      .stat-title {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 12px;
      }
      .stat-value {
        font-size: 32px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 12px;
        line-height: 1;
        font-family: inherit;
      }
      .stat-change {
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 2px;
        font-weight: 500;
        
        .trend-icon {
          display: inline-flex;
          align-items: center;
          margin-right: 2px;
        }

        .compare-text {
          color: #9ca3af;
          font-weight: normal;
          margin-left: 4px;
        }
        
        &.up {
          color: #52c41a;
        }
        &.down {
          color: #ff4d4f;
        }
      }
    }
    
    /* 浅色圆形图标 */
    .stat-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 24px;
    }
  }

  .list-card {
    border-radius: 8px;
    border: none;
    box-shadow: 0 1px 2px -2px rgba(0,0,0,0.08), 0 3px 6px 0 rgba(0,0,0,0.04), 0 5px 12px 4px rgba(0,0,0,0.02);
    
    :deep(.el-card__header) {
      padding: 16px 24px;
      border-bottom: 1px solid #f0f0f0;
      
      .list-header {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
      }
    }
    
    :deep(.el-card__body) {
      padding: 24px;
    }
    
    /* 工具栏（搜索器/下拉框/按钮） */
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      
      .list-search {
        width: 260px;
      }
      
      .toolbar-right {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .filter-select {
          width: 140px;
        }
      }
    }
  }
}

/* ----- 表格内状态标签自定义 ----- */
.status-tag {
  border: none;
  font-weight: normal;
  &.status-warning {
    background-color: #fffbe6;
    color: #faad14;
  }
  &.status-primary {
    background-color: #e6f7ff;
    color: #1890ff;
  }
  &.status-success {
    background-color: #f6ffed;
    color: #52c41a;
  }
  &.status-info {
    background-color: #f5f5f5;
    color: #8c8c8c;
  }
}

.action-btn {
  font-size: 13px;
  padding: 4px 8px;
}

/* Session List (旧列表功能样式集成) */
.session-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.session-item {
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.session-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.resume-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

/* Modal 原生样式还原 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.65);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.15s ease-out;
}

.modal-content {
  background-color: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 800px; 
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fafafa;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 26px;
  color: #999;
  cursor: pointer;
  transition: color 0.3s;
}
.close-btn:hover {
  color: #f44336;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex-grow: 1;
}

.preview-container {
  margin-bottom: 20px;
}

.pdf-viewer {
  width: 100%;
  height: 50vh; 
  min-height: 400px;
  border: 1px solid #eee;
  border-radius: 6px;
  background: #f8f9fa;
}

.doc-preview-notice {
  background: #f8f9fa;
  padding: 40px 20px;
  text-align: center;
  border-radius: 6px;
  border: 1px dashed #ddd;
}

.meta-data-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  background: #fcfcfc;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.detail-row {
  display: flex;
  align-items: center;
}
.detail-row .label {
  font-weight: 500;
  color: #888;
  width: 70px;
  flex-shrink: 0;
  font-size: 13px;
}
.detail-row .value {
  color: #333;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  background-color: #fafafa;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 全局滚动条美化 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background-color: rgba(144, 147, 153, 0.3);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background-color: rgba(144, 147, 153, 0.5);
}
</style>

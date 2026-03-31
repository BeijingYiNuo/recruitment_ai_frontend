<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <h1>仪表盘</h1>
      <div class="user-info">
        <span>欢迎, {{ currentUser.username }}</span>
        <button class="btn-logout" @click="handleLogout">登出</button>
      </div>
    </header>
    <main class="dashboard-content">
      <div class="dashboard-card">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e0e0e0; margin-bottom: 20px; padding-bottom: 10px;">
          <h2 style="margin: 0; border: none; padding: 0;">用户信息</h2>
          <el-button type="primary" plain size="small" @click="$router.push('/profile')">进入个人中心 &gt;</el-button>
        </div>
        <div class="user-details">
          <p><strong>用户名:</strong> {{ currentUser.username }}</p>
          <p><strong>邮箱:</strong> {{ currentUser.email }}</p>
          <p><strong>用户ID:</strong> {{ currentUser.id }}</p>
        </div>
      </div>
      
      <div class="dashboard-card">
        <h2>系统功能</h2>
        <div class="feature-list">
          <!-- 修改为 Element 组件按钮，提升质感 -->
          <el-button type="success" plain @click="openInterviewModal('online')">新增线上面试</el-button>
          <el-button type="primary" plain @click="openInterviewModal('offline')">新增线下面试</el-button>
          <el-button type="info" plain @click="triggerResumeUpload">上传简历</el-button>
          <input type="file" ref="resumeInput" style="display: none" accept=".pdf,.doc,.docx" @change="handleResumeUpload" />
        </div>
      </div>
      
      <!-- 面试会话管理卡片 (大列表混排) -->
      <div class="dashboard-card" v-if="interviews.length > 0">
        <h2>面试管理</h2>
        <ul class="session-list">
          <li v-for="item in interviews" :key="item.id">
            <div class="resume-info" style="flex-direction: column; align-items: flex-start; gap: 6px;">
              <div>
                <span class="status-badge" :style="{ backgroundColor: item.session_type === 'online' ? '#d1fae5' : '#ede9fe', color: item.session_type === 'online' ? '#059669' : '#6d28d9' }">
                  {{ item.session_type === 'online' ? '线上面试' : '线下面试' }}
                </span>
                <span style="margin-left:8px; font-weight: bold;">候选人 ID: {{ item.candidate_id }}</span>
                <span style="margin-left:8px; color: #666; font-size: 13px;" v-if="item.resume_id">
                  (已关联简历 ID: {{ item.resume_id }})
                </span>
              </div>
              <div style="font-size: 13px; color: #555;">
                预定时间: {{ formatTime(item.scheduled_at) }}
              </div>
              <div style="font-size: 13px; color: #555;" v-if="getExtraInfo(item)">
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
      </div>

      <!-- 个人简历卡片 -->
      <div class="dashboard-card" v-if="resumes.length > 0">
        <h2>我的简历</h2>
        <ul class="session-list">
          <li v-for="resume in resumes" :key="resume.id">
            <div class="resume-info">
              <span class="file-name" :title="resume.file_name">{{ resume.file_name }}</span>
              <span class="file-type">({{ resume.file_type.toUpperCase() }})</span>
              <span class="status-badge">{{ resume.status }}</span>
            </div>
            <div class="actions">
              <el-button size="small" type="primary" plain @click="viewResume(resume)">查看</el-button>
              <el-button size="small" type="danger" plain @click="deleteResume(resume.id)">删除</el-button>
            </div>
          </li>
        </ul>
      </div>

      <!-- 面试会话表单弹窗 (使用 Element Plus 重构) -->
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
              提示: 您当前的纯内存库中还没有上传过简历，如果需要选择关联简历，请先返回仪表盘上传。
            </div>
          </el-form-item>

          <el-form-item label="预定时间" required>
            <!-- 替换为 Element 的时间日历组件 -->
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

      <!-- 简历详情弹窗保持原来深色的纯原生风格以便查阅底层渲染情况 -->
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
                * 由于浏览器安全限制，暂不支持内联预览 Word 格式文档 ({{ selectedResume.file_type.toUpperCase() }})。您可以在真实后端上线后通过专用组件渲染。
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
            <el-button @click="closeResumeModal">关闭窗口</el-button>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<script>
import { getCurrentUser } from '../services/authService'
import authService from '../services/authService'
import { interviewApi } from '../api/interview'
import { ElMessage } from 'element-plus'

export default {
  name: 'DashboardView',
  data() {
    return {
      currentUser: getCurrentUser(),
      sessionId: '',    
      sessions: [],     
      
      // 简历部分状态
      resumes: [], 
      selectedResume: null, 
      
      // 面试管理部分状态
      interviews: [], 
      showInterviewModal: false,
      isEditMode: false,
      interviewForm: {
        id: null,
        candidate_id: '',
        resume_id: '',
        session_type: 'online', 
        scheduled_at: '',
        extra_info: ''
      }
    }
  },
  methods: {
    handleLogout() {
      authService.logout()
      this.$router.push('/login')
    },
    async createSession() {
      try {
        const data = await interviewApi.createSession()
        this.sessionId = data.user_id
        ElMessage.success('面试会话创建成功')
      } catch (error) {
        ElMessage.error('创建面试会话失败: ' + (error.detail || error.message))
      }
    },
    async listSessions() {
      try {
        const data = await interviewApi.getSessions()
        this.sessions = data.sessions
        ElMessage.success('获取面试记录成功')
      } catch (error) {
        ElMessage.error('获取面试记录失败: ' + (error.detail || error.message))
      }
    },
    async viewSession(sessionId) {
      try {
        const data = await interviewApi.getSession(sessionId)
        console.log('Session details:', data)
        ElMessage.success('获取会话详情成功')
      } catch (error) {
        ElMessage.error('获取会话详情失败: ' + (error.detail || error.message))
      }
    },
    async startASR() {
      if (!this.sessionId) {
        ElMessage.warning('请先创建面试会话')
        return
      }
      this.$router.push(`/interview/${this.sessionId}`)
    },
    async stopASR() {
      ElMessage.info('请在面试页面中停止语音识别')
    },
    
    // --- 【面试 CRUD】核心逻辑组 ---
    openInterviewModal(type) {
      this.isEditMode = false;
      this.interviewForm = {
        id: null,
        candidate_id: '',
        resume_id: '',
        session_type: type,
        scheduled_at: '',
        extra_info: ''
      };
      this.showInterviewModal = true;
    },
    editInterview(item) {
      this.isEditMode = true;
      this.interviewForm = {
        id: item.id,
        candidate_id: item.candidate_id,
        resume_id: item.resume_id,
        session_type: item.session_type,
        // 直接读取存储的格式即可被 el-date-picker 的 value-format 读取
        scheduled_at: item.scheduled_at ? item.scheduled_at : '',
        extra_info: this.getExtraInfo(item)
      };
      this.showInterviewModal = true;
    },
    closeInterviewModal() {
      this.showInterviewModal = false;
    },
    saveInterview() {
      if (!this.interviewForm.candidate_id) {
        ElMessage.warning('请填写候选人 ID'); return;
      }
      if (!this.interviewForm.scheduled_at) {
        ElMessage.warning('请选择面试时间'); return;
      }
      if (!this.interviewForm.extra_info) {
        ElMessage.warning(this.interviewForm.session_type === 'online' ? '会议链接不能为空' : '面试地点不能为空'); return;
      }

      const extraKey = this.interviewForm.session_type === 'online' ? 'meeting_url' : 'location';
      const parsedNotes = JSON.stringify({ [extraKey]: this.interviewForm.extra_info });

      if (this.isEditMode) {
        const target = this.interviews.find(i => i.id === this.interviewForm.id);
        if (target) {
          target.candidate_id = this.interviewForm.candidate_id;
          target.resume_id = this.interviewForm.resume_id;
          target.scheduled_at = this.interviewForm.scheduled_at; 
          target.notes = parsedNotes;
          target.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        }
        ElMessage.success('面试信息修改成功！');
      } else {
        const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const mockNewId = Date.now();
        const newInterview = {
          id: mockNewId,
          candidate_id: this.interviewForm.candidate_id,
          recruiter_id: this.currentUser.id,
          resume_id: this.interviewForm.resume_id || 0,
          session_type: this.interviewForm.session_type,
          status: 'scheduled',
          scheduled_at: this.interviewForm.scheduled_at,
          started_at: null,
          ended_at: null,
          notes: parsedNotes,
          created_at: nowStr,
          updated_at: nowStr
        };
        this.interviews.unshift(newInterview);
        ElMessage.success('面试会话创建成功！');
      }
      this.closeInterviewModal();
    },
    deleteInterview(id) {
      if (confirm('确定要取消并删除该面试会话吗？')) {
         this.interviews = this.interviews.filter(i => i.id !== id);
         ElMessage.success('面试删除成功');
      }
    },
    getExtraInfo(item) {
      if (!item.notes) return '';
      try {
        const obj = JSON.parse(item.notes);
        return item.session_type === 'online' ? (obj.meeting_url || '') : (obj.location || '');
      } catch (e) {
        return item.notes;
      }
    },
    formatTime(str) {
      if (!str) return '未定';
      return str.replace('T', ' ');
    },

    // --- 【简历 CRUD】核心逻辑组 ---
    triggerResumeUpload() {
      this.$refs.resumeInput.click()
    },
    async handleResumeUpload(event) {
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
          user_id: this.currentUser.id,
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
        
        this.resumes.unshift(newResume)

        ElMessage.success(`简历 ${file.name} 上传成功！`)
      } catch (error) {
        ElMessage.error('上传失败: ' + (error.detail || error.message))
      } finally {
        event.target.value = ''
      }
    },
    viewResume(resume) {
      this.selectedResume = resume
    },
    closeResumeModal() {
      this.selectedResume = null
    },
    deleteResume(id) {
      if (window.confirm('确定要删除这份简历吗？该操作不可恢复。')) {
        const target = this.resumes.find(r => r.id === id)
        if (target && target.preview_url) {
          URL.revokeObjectURL(target.preview_url)
        }
        
        this.resumes = this.resumes.filter(r => r.id !== id)
        if (this.selectedResume && this.selectedResume.id === id) {
          this.selectedResume = null
        }
        ElMessage.success('简历删除成功')
      }
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  height: 100%;
}

.dashboard-header {
  background-color: #4caf50;
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dashboard-header h1 {
  margin: 0;
  font-size: 24px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.btn-logout {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-logout:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.dashboard-content {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.dashboard-card {
  overflow: auto;
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.dashboard-card h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 18px;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 10px;
}

.user-details p {
  margin: 10px 0;
  color: #555;
}

.feature-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.session-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.session-list li {
  padding: 10px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.session-list li:last-child {
  border-bottom: none;
}

.resume-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: bold;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-type {
  color: #999;
  font-size: 12px;
  flex-shrink: 0;
}

.status-badge {
  background-color: #bbdefb;
  color: #1565c0;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  flex-shrink: 0;
}

.actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* Modal 样式优化 (保留用于简历预览的底层框) */
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
  z-index: 1000;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 14px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 26px;
  color: #999;
  cursor: pointer;
  line-height: 1;
  padding: 0;
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
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
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

.empty-state {
  margin-top: 10px;
  color: #999;
  font-size: 13px;
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

@media (max-width: 768px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }

  .meta-data-section {
    grid-template-columns: 1fr;
  }
}
</style>

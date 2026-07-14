<template>
  <div class="feishu-page">
    <div class="card-container">
      
      <!-- Header Area -->
      <div class="header-area">
        <div class="header-top">
          <div class="title-area">
            <h1>简历管理</h1>
            <span class="badge">{{ totalCount }}</span>
          </div>
          <div class="action-btn-group">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索候选人姓名"
              clearable
              style="width: 220px; margin-right: 12px;"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" class="lark-btn-primary" @click="triggerBatchImport" :disabled="uploading">批量导入</el-button>
            <!-- 隐藏的文件选择器 -->
            <input
              ref="fileInputRef"
              type="file"
              multiple
              accept=".pdf"
              style="display: none"
              @change="handleFileSelect"
            />
          </div>
        </div>
      </div>

      <!-- 后台处理中提示 - 轻量化横幅 -->
      <div v-if="showProcessingBanner" class="processing-banner">
        <el-icon class="is-loading" style="margin-right: 6px; font-size: 14px;"><Loading /></el-icon>
        <span>后台解析中，列表数据实时刷新</span>
      </div>

      <!-- 上传队列 -->
      <div v-if="uploadQueue.length > 0" class="upload-queue-area">
        <div class="upload-queue-header">
          <span>已选文件（{{ uploadQueue.length }} 个）</span>
          <el-button
            v-if="uploading"
            type="primary" size="small" loading disabled
          >
            上传中...
          </el-button>
        </div>
        <div
          v-if="uploading"
          style="padding: 12px 0;"
        >
          <el-progress :percentage="uploadProgress" :stroke-width="6" :status="uploadProgress === 100 ? 'success' : ''" />
          <div style="text-align: center; margin-top: 8px; font-size: 13px; color: #8F959E;">
            {{ uploadProgress === 100 ? '上传完成，后台解析中...' : '正在上传至服务器...' }}
          </div>
        </div>
      </div>

      <!-- Main List Area -->
      <div class="list-area" v-loading="listLoading">
        <!-- 批量操作栏 -->
        <div v-if="selectedIds.length > 0" class="batch-action-bar">
          <span class="batch-action-info">已选择 {{ selectedIds.length }} 项</span>
          <el-button type="danger" size="small" @click="handleBatchDelete">批量删除</el-button>
          <el-button size="small" @click="selectedIds = []">取消选择</el-button>
        </div>
        <div class="list-header-row">
          <div class="col-check">
            <el-checkbox
              :indeterminate="isIndeterminate"
              :model-value="isAllSelected"
              @change="toggleSelectAll"
            />
          </div>
          <div class="col-name">候选人</div>
          <div class="col-type">格式</div>
          <div class="col-status">解析状态</div>
          <div class="col-review">审核状态</div>
          <div class="col-time">更新时间</div>
          <div class="col-action">操作</div>
        </div>

        <div class="list-body">
          <!-- 无数据空状态 -->
          <div v-if="!resumeStore.resumes || (resumeStore.resumes.length === 0 && !listLoading)" class="empty-placeholder">
            <div class="empty-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#F5F6F7"/><path d="M16 18h16M16 24h16M16 30h10" stroke="#D0D3D8" stroke-width="2" stroke-linecap="round"/><path d="M32 14h-4a2 2 0 00-2 2v2a2 2 0 002 2h4a2 2 0 002-2v-2a2 2 0 00-2-2z" fill="#E8E9ED"/></svg>
            </div>
            <div class="empty-text">暂无简历，请点击上方按钮添加导入</div>
          </div>

          <div v-else>
            <!-- 真实简历行 -->
            <div
              class="list-row"
              :class="{ 'row-selected': selectedIds.includes(resume.id) }"
              v-for="resume in pagedResumes"
              :key="resume.id"
              @dblclick="openDrawer(resume.id)"
            >
              <div class="col-check" @click.stop>
                <el-checkbox
                  :model-value="selectedIds.includes(resume.id)"
                  @change="(val) => toggleSelectOne(resume.id, val)"
                />
              </div>
              <div class="col-name" @click="openDrawer(resume.id)">
                <el-avatar :size="32" class="lark-avatar">{{ resume.candidate_name?.charAt(0) || 'U' }}</el-avatar>
                <span class="name-text">{{ resume.candidate_name }}</span>
                <el-button v-if="resume.review_status === 'PASS'" type="success" link size="small" @click.stop="createInterview(resume)">创建面试</el-button>
                <el-button type="primary" link size="small" @click.stop="handlePreview(resume)">预览</el-button>
              </div>

              <div class="col-type">
                <span class="lark-tag tag-gray">{{ resume.file_type?.toUpperCase() }}</span>
              </div>

              <div class="col-status">
                <div class="status-indicator">
                  <span class="dot" :class="statusDotClass(resume.status)"></span>
                  <span :class="statusTextClass(resume.status)">{{ getStatusLabel(resume.status) }}</span>
                </div>
              </div>

              <div class="col-review">
                <span class="lark-tag" :class="reviewTagClass(resume.review_status)">{{ reviewLabel(resume.review_status) }}</span>
              </div>

              <div class="col-time">{{ formatFullTime(resume.updated_at) || '刚刚' }}</div>

              <div class="col-action">
                <el-button type="primary" link @click.stop="handleDownload(resume)">下载</el-button>
                <el-button type="primary" link @click.stop="handleRowReparse(resume)">重新解析</el-button>
                <el-tooltip v-if="isAnalyzing(resume.status)" content="解析中，无法删除" placement="top">
                  <el-button type="danger" link disabled>删除</el-button>
                </el-tooltip>
                <el-button v-else type="danger" link @click.stop="handleDelete(resume.id)">删除</el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 - 始终渲染，联动筛选/搜索/批量操作 -->
        <div class="pagination-wrapper">
          <el-pagination
            :current-page="currentPage"
            :total="totalCount"
            layout="total, prev, pager, next"
            background
            small
            @current-change="handlePageChange"
          />
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
              <template v-if="!editMode">
                <el-button size="small" class="lark-btn-ghost" @click.stop="handleDrawerReparse">重新解析</el-button>
                <el-button size="small" type="primary" @click.stop="enterEditMode">编辑详情</el-button>
                <el-button size="small" class="lark-btn-ghost" @click.stop="handlePreview(currentDetail)">简历预览</el-button>
              </template>
              <template v-else>
                <el-button size="small" class="lark-btn-ghost" @click="cancelEdit" :disabled="editSaving">取消</el-button>
                <el-button size="small" type="primary" @click="saveEdit" :loading="editSaving">保存修改</el-button>
              </template>
              <el-icon class="close-icon" @click="closeDrawer"><Close /></el-icon>
            </div>
          </div>
          
          <div class="drawer-tabs">
            <div class="tab-item" :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">基本信息</div>
          </div>
          
          <div class="drawer-body">
            <!-- 基本信息 Tab -->
            <div v-show="activeTab === 'basic'">
              <div class="detail-card">
                <h3>基础信息字段</h3>
                <el-descriptions :column="2" border v-if="currentDetail">
                  <el-descriptions-item label="候选人姓名">
                    <template v-if="editMode">
                      <el-input v-model="editCandidateName" size="small" style="width: 200px" />
                    </template>
                    <template v-else>
                      {{ currentDetail.candidate_name }}
                    </template>
                  </el-descriptions-item>
                  <el-descriptions-item label="文件格式">{{ currentDetail.file_type?.toUpperCase() }}</el-descriptions-item>
                  <el-descriptions-item label="解析状态">
                    <el-tag :type="isAnalyzing(currentDetail.status) ? 'primary' : 'success'" size="small">
                      {{ getStatusLabel(currentDetail.status) }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="更新时间">{{ formatFullTime(currentDetail.updated_at) || '未知' }}</el-descriptions-item>
                </el-descriptions>
              </div>


              <div class="detail-card">
                <h3>AI 智能专项解析</h3>
                <div class="special-actions">
                  <el-button @click="handleSectionClick('educations', '教育经历')" size="small">教育经历</el-button>
                  <el-button @click="handleSectionClick('work-experiences', '工作经历')" size="small">工作经历</el-button>
                  <el-button @click="handleSectionClick('skills', '技能')" size="small">核心技能</el-button>
                  <el-button @click="handleSectionClick('projects', '项目经历')" size="small">项目经验</el-button>
                </div>
                <!-- 显示内容区域 -->
                <div class="special-content" v-if="specialDataStr" v-loading="specialDataLoading" style="margin-top: 16px;">

                  <!-- ========== 教育经历 - 只读模式 ========== -->
                  <template v-if="!editMode">
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

                    <div v-else-if="activeSpecialType === 'skills' && specialSkillList.length > 0" class="skill-cloud-container">
                      <div v-for="(skills, level) in groupedSkills" :key="level" class="skill-group">
                        <div class="skill-group-title">{{ level }}</div>
                        <div class="skill-cloud">
                          <div v-for="skill in skills" :key="skill.id" class="skill-chip">
                            <span class="skill-name">{{ skill.skill_name }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div v-else-if="activeSpecialType === 'projects' && specialProjectList.length > 0" class="special-list project-list">
                      <div v-for="proj in specialProjectList" :key="proj.id" class="special-item project-item">
                        <div class="item-header">
                          <span class="main-title">{{ proj.project_name }}</span>
                          <span class="item-date">{{ formatDateRange(proj.start_date, proj.end_date) }}</span>
                        </div>
                        <div class="item-sub" v-if="proj.role">
                          <span class="role-text">{{ proj.role }}</span>
                        </div>
                        <div class="item-desc" v-if="proj.description">
                          {{ proj.description }}
                        </div>
                      </div>
                    </div>

                    <div v-else-if="['educations', 'work-experiences', 'skills', 'projects'].includes(activeSpecialType)" class="empty-special-card">
                      <el-empty description="本次 AI 解析未提取到相关有效信息" :image-size="80"></el-empty>
                    </div>

                    <pre v-else class="code-block">{{ specialDataStr }}</pre>
                  </template>

                  <!-- ========== 编辑模式 ========== -->
                  <template v-if="editMode">
                    <!-- 教育经历编辑 -->
                    <div v-if="activeSpecialType === 'educations'" class="special-list edu-list">
                      <div v-for="(edu, idx) in editEduList" :key="idx" class="special-item edu-item" style="padding: 12px;">
                        <div class="edit-row">
                          <el-input v-model="edu.school_name" placeholder="学校名称" size="small" style="width: 200px; margin-right: 8px;" />
                          <el-input v-model="edu.major" placeholder="专业" size="small" style="width: 160px; margin-right: 8px;" />
                          <el-input v-model="edu.degree" placeholder="学位" size="small" style="width: 120px;" />
                        </div>
                        <div class="edit-row" style="margin-top: 8px;">
                          <el-date-picker v-model="edu.start_date" type="date" placeholder="开始日期" size="small" style="width: 150px; margin-right: 8px;" value-format="YYYY-MM-DD" />
                          <el-date-picker v-model="edu.end_date" type="date" placeholder="结束日期" size="small" style="width: 150px; margin-right: 8px;" value-format="YYYY-MM-DD" />
                          <el-checkbox v-model="edu.is_985" :true-value="1" :false-value="0" size="small">985</el-checkbox>
                          <el-checkbox v-model="edu.is_211" :true-value="1" :false-value="0" size="small">211</el-checkbox>
                          <el-button type="danger" link size="small" @click="editEduList.splice(idx, 1)">删除</el-button>
                        </div>
                      </div>
                      <el-button size="small" class="lark-btn-ghost" @click="editEduList.push({school_name:'', major:'', degree:'', start_date: null, end_date: null, is_985: 0, is_211: 0})" style="margin-top: 8px;">
                        + 添加教育经历
                      </el-button>
                    </div>

                    <!-- 工作经历编辑 -->
                    <div v-if="activeSpecialType === 'work-experiences'" class="special-list work-list">
                      <div v-for="(work, idx) in editWorkList" :key="idx" class="special-item work-item" style="padding: 12px;">
                        <div class="edit-row">
                          <el-input v-model="work.company_name" placeholder="公司名称" size="small" style="width: 200px; margin-right: 8px;" />
                          <el-input v-model="work.position" placeholder="职位" size="small" style="width: 160px;" />
                        </div>
                        <div class="edit-row" style="margin-top: 8px;">
                          <el-date-picker v-model="work.start_date" type="date" placeholder="开始日期" size="small" style="width: 150px; margin-right: 8px;" value-format="YYYY-MM-DD" />
                          <el-date-picker v-model="work.end_date" type="date" placeholder="结束日期" size="small" style="width: 150px; margin-right: 8px;" value-format="YYYY-MM-DD" />
                          <el-button type="danger" link size="small" @click="editWorkList.splice(idx, 1)">删除</el-button>
                        </div>
                        <div class="edit-row" style="margin-top: 8px;">
                          <el-input v-model="work.description" type="textarea" :rows="2" placeholder="工作描述" size="small" />
                        </div>
                      </div>
                      <el-button size="small" class="lark-btn-ghost" @click="editWorkList.push({company_name:'', position:'', start_date: null, end_date: null, description: ''})" style="margin-top: 8px;">
                        + 添加工作经历
                      </el-button>
                    </div>

                    <!-- 技能编辑 -->
                    <div v-if="activeSpecialType === 'skills'" class="skill-cloud-container">
                      <div v-for="(skill, idx) in editSkillList" :key="idx" class="edit-row" style="margin-bottom: 8px; display: flex; align-items: center;">
                        <el-input v-model="skill.skill_name" placeholder="技能名称" size="small" style="width: 180px; margin-right: 8px;" />
                        <el-select v-model="skill.proficiency_level" placeholder="熟练程度" size="small" style="width: 120px; margin-right: 8px;">
                          <el-option label="精通" value="精通" />
                          <el-option label="熟练" value="熟练" />
                          <el-option label="掌握" value="掌握" />
                          <el-option label="了解" value="了解" />
                        </el-select>
                        <el-button type="danger" link size="small" @click="editSkillList.splice(idx, 1)">删除</el-button>
                      </div>
                      <el-button size="small" class="lark-btn-ghost" @click="editSkillList.push({skill_name:'', proficiency_level:''})" style="margin-top: 8px;">
                        + 添加技能
                      </el-button>
                    </div>

                    <!-- 项目经历编辑 -->
                    <div v-if="activeSpecialType === 'projects'" class="special-list project-list">
                      <div v-for="(proj, idx) in editProjectList" :key="idx" class="special-item project-item" style="padding: 12px;">
                        <div class="edit-row">
                          <el-input v-model="proj.project_name" placeholder="项目名称" size="small" style="width: 240px; margin-right: 8px;" />
                          <el-input v-model="proj.role" placeholder="担任角色" size="small" style="width: 120px;" />
                        </div>
                        <div class="edit-row" style="margin-top: 8px;">
                          <el-date-picker v-model="proj.start_date" type="date" placeholder="开始日期" size="small" style="width: 150px; margin-right: 8px;" value-format="YYYY-MM-DD" />
                          <el-date-picker v-model="proj.end_date" type="date" placeholder="结束日期" size="small" style="width: 150px; margin-right: 8px;" value-format="YYYY-MM-DD" />
                          <el-button type="danger" link size="small" @click="editProjectList.splice(idx, 1)">删除</el-button>
                        </div>
                        <div class="edit-row" style="margin-top: 8px;">
                          <el-input v-model="proj.description" type="textarea" :rows="2" placeholder="项目描述" size="small" />
                        </div>
                      </div>
                      <el-button size="small" class="lark-btn-ghost" @click="editProjectList.push({project_name:'', role:'', start_date: null, end_date: null, description: ''})" style="margin-top: 8px;">
                        + 添加项目经历
                      </el-button>
                    </div>
                  </template>
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

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { ElLoading } from 'element-plus'
import { useNotify } from '../../composables/useNotify'
import { Close, Search, Loading } from '@element-plus/icons-vue'
import { getCurrentUser } from '../../services/authService'
import { useResumeStore } from '../../stores/resumeStore'
import { resumeApi } from '../../api/resume'
import FilePreviewDialog from '../../components/FilePreviewDialog.vue'
import { calculateSHA256, validatePdfFile } from '../../utils/fileUploadHelper'

const { msgSuccess, msgError, msgWarning, msgInfo, notify, notifySuccess, notifyError, confirm } = useNotify()
const resumeStore = useResumeStore()
const currentUser = ref(getCurrentUser() || { id: 1, username: '管理员' })
const listLoading = ref(false)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)

// List retrieval
let statusPolling = null
let pollingActive = true  // 组件卸载后置 false，防止回调更新已销毁的状态
const showProcessingBanner = ref(false)
const pollingPending = ref(false)
// 跟踪批量导入的简历 ID，用于轮询检测解析完成
const parsingIds = ref(new Set())

const stopPolling = () => {
  if (statusPolling) {
    clearInterval(statusPolling)
    statusPolling = null
  }
}

const checkAndStartPolling = (force = false) => {
  const needsPolling = resumeStore.resumes.some(r => isAnalyzing(r.status)) || force || parsingIds.value.size > 0

  if (needsPolling) {
    showProcessingBanner.value = true
    if (statusPolling) return
    statusPolling = setInterval(async () => {
      if (!pollingActive || pollingPending.value) return
      pollingPending.value = true
      try {
        const data = await resumeApi.getResumes(0, 999)
        // API 调用期间组件可能已卸载
        if (!pollingActive) return
        let list = Array.isArray(data) ? data : (data.items || data.data || [])
        // 注意：轮询时不更新 totalCount，避免分页总条数与 store 实际数据条数不一致导致分页异常
        // totalCount 只在 fetchResumes（分页查询）时更新
        const hadAnalyzing = list.some(r => isAnalyzing(r.status))

        // 只更新已有记录的状态，不替换分页列表（避免轮询冲掉分页）
        // 用最新 API 数据更新所有字段（候选人姓名、解析状态等）
        const fullMap = {}
        for (const item of list) {
          fullMap[item.id] = item
        }
        resumeStore.setResumes(
          resumeStore.resumes.map(r => {
            const updated = fullMap[r.id]
            return updated ? { ...r, ...updated } : r
          })
        )

        // ---- 检测批量导入的简历是否解析完成 ----
        if (parsingIds.value.size > 0) {
          const stillParsing = new Set()
          for (const id of parsingIds.value) {
            const item = fullMap[id] || resumeStore.resumes.find(r => r.id === id)
            if (!item) continue
            if (!isAnalyzing(item.status)) {
              if (isSuccessStatus(item.status)) {
                const displayName = item.candidate_name || '未知'
                notify({
                  title: '简历解析完成',
                  message: `「${displayName}」已解析完成`,
                  type: 'success',
                  duration: 4000,
                })
              }
            } else {
              stillParsing.add(id)
            }
          }
          parsingIds.value = stillParsing
        }

        // 当 store 中新增了记录时，同步更新 totalCount 避免分页显示异常
        const storeLen = resumeStore.resumes.length
        if (storeLen > totalCount.value) {
          totalCount.value = storeLen
        }

        if (!list.some(r => isAnalyzing(r.status)) && parsingIds.value.size === 0) {
          stopPolling()
          showProcessingBanner.value = false
          checkUploadComplete()
          // 失效缓存，下次用户操作时自动刷新（避免强制跳回第 1 页）
          resumeStore.invalidateCache()
        }
      } catch (error) {
        console.error('状态轮询失败:', error)
      } finally {
        pollingPending.value = false
      }
    }, 10000)
  } else {
    showProcessingBanner.value = false
    if (statusPolling) stopPolling()
  }
}

const fetchResumes = async () => {
  listLoading.value = true
  try {
    const skip = (currentPage.value - 1) * pageSize.value
    const result = await resumeStore.getCachedResumes(async () => {
      const data = await resumeApi.getResumes(skip, pageSize.value, null, searchKeyword.value)
      let list = Array.isArray(data) ? data : (data.items || data.data || [])
      const total = data.total || list.length
      totalCount.value = total
      return { items: list, total }
    })
    // 缓存命中时恢复 totalCount
    if (result && result.total !== undefined) {
      totalCount.value = result.total
    }
    checkAndStartPolling()
  } catch (error) {
    msgError('获取简历列表失败: ' + (error?.detail || error?.message || '未知错误'))
    // 兜底：API 失败时用 store 已有数据来维持分页
    if (totalCount.value === 0 && resumeStore.resumes.length > 0) {
      totalCount.value = resumeStore.resumes.length
    }
  } finally {
    listLoading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  resumeStore.invalidateCache()
  fetchResumes()
}

const handlePageChange = (page) => {
  currentPage.value = page
  resumeStore.invalidateCache()
  fetchResumes()
}

// 状态处理工具函数
const isAnalyzing = (status) => {
  if (!status) return false
  const s = status.toLowerCase()
  return s === 'uploaded' || s === 'processed' || s === 'analyzing' || s === 'parsing' || s === 'pending_upload'
}

const isSuccessStatus = (status) => {
  if (!status) return false
  const s = status.toLowerCase()
  return s === 'analyzed' || s === 'success' || s === 'completed'
}

const getStatusLabel = (status) => {
  if (!status) return '未知状态'
  const s = status.toLowerCase()
  if (s === 'analyzed' || s === 'success' || s === 'completed') return '解析成功'
  if (s === 'uploaded' || s === 'processed' || s === 'analyzing' || s === 'parsing' || s === 'pending_upload') return '解析中...'
  if (s === 'failed_analysis' || s === 'failed' || s === 'error') return '解析失败'
  return status
}

// 状态标识圆点样式
const statusDotClass = (status) => {
  if (!status) return 'dot-muted'
  const s = status.toLowerCase()
  if (s === 'analyzed' || s === 'success' || s === 'completed') return 'dot-success'
  if (s === 'failed_analysis' || s === 'failed' || s === 'error') return 'dot-danger'
  return 'dot-loading'
}

// 状态文字样式
const statusTextClass = (status) => {
  if (!status) return ''
  const s = status.toLowerCase()
  if (s === 'analyzed' || s === 'success' || s === 'completed') return 'text-success'
  if (s === 'failed_analysis' || s === 'failed' || s === 'error') return 'text-danger'
  return 'text-loading'
}

const reviewLabel = (status) => {
  return ({ PASS: '已通过', PENDING: '待定', FAIL: '已淘汰' })[status] || '待审核'
}

const reviewTagClass = (status) => {
  return ({ PASS: 'tag-green', PENDING: 'tag-orange', FAIL: 'tag-red' })[status] || 'tag-gray'
}

onMounted(() => {
  fetchResumes()
})

onUnmounted(() => {
  pollingActive = false
  stopPolling()
  // 恢复 body 滚动（抽屉打开时组件被强制卸载的场景，如浏览器后退）
  document.body.style.overflow = ''
  if (drawerCloseTimer) {
    clearTimeout(drawerCloseTimer)
    drawerCloseTimer = null
  }
})

// ====== 批量上传流程 ======
const fileInputRef = ref(null)
const uploadQueue = ref([])
const uploadProgress = ref(0)
const uploading = ref(false)
const MAX_BATCH_FILES = 5

// 服务端已分页，直接返回
const pagedResumes = computed(() => resumeStore.resumes || [])

const formatFileSize = (bytes) => {
  const mb = bytes / 1024 / 1024
  return mb >= 1 ? mb.toFixed(1) + 'MB' : (bytes / 1024).toFixed(0) + 'KB'
}

/** 点击"批量导入" */
const triggerBatchImport = () => {
  uploadQueue.value = []
  uploadProgress.value = 0
  fileInputRef.value?.click()
}

/** 文件选择后校验并加入队列 */
const handleFileSelect = (event) => {
  const files = Array.from(event.target.files || [])
  event.target.value = ''

  if (files.length === 0) return

  if (files.length > MAX_BATCH_FILES) {
    msgWarning(`一次最多选择 ${MAX_BATCH_FILES} 个文件`)
    return
  }

  for (const file of files) {
    const result = validatePdfFile(file)
    if (!result.valid) {
      msgError(result.reason)
      continue
    }
    if (uploadQueue.value.some(item => item.file.name === file.name)) {
      continue
    }
    uploadQueue.value.push({
      file,
      sha256: null,
      status: 'pending',
      resumeId: null
    })
  }

  if (uploadQueue.value.length === 0) {
    msgWarning('没有符合要求的文件')
    return
  }

  // 选择文件后自动开始上传
  startUpload()
}

/** 检查上传是否全部完成，完成后弹通知 */
const checkUploadComplete = () => {
  const total = uploadQueue.value.length
  if (total === 0) return

  const done = uploadQueue.value.filter(f => f.status === 'done').length
  const failed = uploadQueue.value.filter(f => f.status === 'error').length
  const skipped = uploadQueue.value.filter(f => f.status === 'skipped').length

  if (total > 0 && done + failed + skipped === total) {
    if (failed === 0 && skipped === 0) {
      notify({ title: '简历解析完成', message: `已导入的 ${total} 份简历全部解析完成`, type: 'success' })
    } else if (failed === 0 && skipped === total) {
      notify({ title: '简历已存在', message: '所选简历均已导入过', type: 'info' })
    } else if (failed === 0) {
      notify({ title: '简历解析完成', message: `${done} 份解析完成`, type: 'success' })
    } else {
      notify({ title: '简历解析完成', message: `${done} 份解析完成，${failed} 份解析失败`, type: 'warning' })
    }
  }
}

/** 批量上传：SHA-256 → checkExist → 一个请求打包上传 → Worker 并行解析 */
const startUpload = async () => {
  if (uploading.value || uploadQueue.value.length === 0) return

  uploading.value = true
  uploadProgress.value = 0


  // 1. 并行计算 SHA-256
  await Promise.all(uploadQueue.value.map(async (item) => {
    item.status = 'preparing'
    try {
      item.sha256 = await calculateSHA256(item.file)
    } catch {
      item.sha256 = null
    }
  }))

  // 2. 批量查重
  const hashesToCheck = uploadQueue.value
    .filter(item => item.sha256)
    .map(item => ({ filename: item.file.name, sha256: item.sha256 }))

  if (hashesToCheck.length > 0) {
    try {
      const result = await resumeApi.checkExist(hashesToCheck)
      const existSet = new Set((result.exist || []).map(e => e.sha256))
      for (const item of uploadQueue.value) {
        if (item.sha256 && existSet.has(item.sha256)) {
          item.status = 'skipped'
        }
      }
    } catch {
      // 查重失败不阻塞上传
    }
  }

  // 3. 收集所有待上传文件 + hash 信息，打包一个请求发送
  const filesToUpload = uploadQueue.value.filter(item => item.status !== 'skipped')

  if (filesToUpload.length > 0) {
    for (const item of filesToUpload) {
      item.status = 'uploading'
    }

    const fileObjects = filesToUpload.map(item => item.file)
    const hashesPayload = filesToUpload.map(item => ({
      filename: item.file.name,
      sha256: item.sha256
    }))

    let lastRetry = 0
    const maxRetries = 3

    while (lastRetry <= maxRetries) {
      try {
        const result = await resumeApi.batchImportLocal(fileObjects, hashesPayload, (progressEvent) => {
          if (progressEvent.total) {
            uploadProgress.value = Math.round((progressEvent.loaded / progressEvent.total) * 100)
          }
        })

        if (result && result.imported > 0) {
          // 标记已导入的文件为 done
          const importedSet = new Set(result.resume_ids || [])
          let ri = 0
          for (const item of filesToUpload) {
            if (importedSet.size > 0 && ri < (result.resume_ids || []).length) {
              item.status = 'done'
              item.resumeId = result.resume_ids[ri]

              // 创建占位行
              const name = item.file.name

              const newResume = {
                id: result.resume_ids[ri],
                user_id: currentUser.value.id,
                candidate_name: '待解析',
                file_path: '',
                file_type: (name.split('.').pop() || '').toLowerCase(),
                status: 'uploaded',
                original_file_name: name,
                created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
              }
              resumeStore.resumes.unshift(newResume)
              ri++
            } else {
              item.status = 'error'
              item.error = '未在响应中找到'
            }
          }
          // 同步更新分页总数，避免导入期间分页条不显示
          totalCount.value += result.imported
          // 跟踪这批导入的简历 ID，用于轮询检测解析完成
          if (result.resume_ids) {
            for (const id of result.resume_ids) {
              parsingIds.value.add(id)
            }
          }
          msgSuccess(`已导入 ${result.imported} 份简历${result.skipped ? `，${result.skipped} 份已存在` : ''}`)
          if (result.skipped_balance > 0) {
            notify({
              title: '余额不足',
              message: `余额不足，已跳过 ${result.skipped_balance} 份简历（共选择 ${uploadQueue.value.length} 份，仅导入 ${result.imported} 份）`,
              type: 'warning',
              duration: 6000,
            })
          }
          if (result.skipped_size > 0 && result.skipped_size_files?.length > 0) {
            const names = result.skipped_size_files.join('、')
            notify({
              title: '简历总大小超出限额',
              message: `简历文件总大小超出限额，以下简历被退回：${names}`,
              type: 'warning',
              duration: 8000,
            })
            // 标记被退回的文件为 error
            const skippedNames = new Set(result.skipped_size_files)
            for (const item of filesToUpload) {
              if (skippedNames.has(item.file.name)) {
                item.status = 'error'
                item.error = '简历总大小超出限额，被退回'
              }
            }
          }
        } else if (result && result.skipped_size > 0 && result.skipped_size_files?.length > 0) {
          // 所有文件均因总大小超限被退回
          const names = result.skipped_size_files.join('、')
          notify({
            title: '简历总大小超出限额',
            message: `简历文件总大小超出限额，以下简历被退回：${names}`,
            type: 'warning',
            duration: 8000,
          })
          const skippedNames = new Set(result.skipped_size_files)
          for (const item of filesToUpload) {
            if (skippedNames.has(item.file.name)) {
              item.status = 'error'
              item.error = '简历总大小超出限额，被退回'
            } else {
              item.status = 'error'
              item.error = result?.message || '导入失败'
            }
          }
        } else {
          for (const item of filesToUpload) {
            item.status = 'error'
            item.error = result?.message || '导入失败'
          }
        }
        break
      } catch (error) {
        if (error?.response?.status === 402) {
          const detail = error?.response?.data || {}
          notify({
            title: '余额不足',
            message: detail.message || '余额不足，无法导入简历',
            type: 'error',
            duration: 6000,
          })
          for (const item of filesToUpload) {
            item.status = 'error'
            item.error = detail.message || '余额不足'
          }
          break
        }
        if (error?.response?.status === 400) {
          const detail = error?.response?.data
          if (detail?.code === 'TOTAL_SIZE_EXCEEDED') {
            notify({
              title: '简历总大小超出限额',
              message: detail.message || '简历文件总大小超出限额',
              type: 'warning',
              duration: 8000,
            })
            const rejectedNames = new Set(detail.skipped_files || [])
            for (const item of filesToUpload) {
              if (rejectedNames.has(item.file.name)) {
                item.status = 'error'
                item.error = '简历总大小超出限额，被退回'
              } else {
                item.status = 'error'
                item.error = detail.message || '导入失败'
              }
            }
            break
          }
        }
        if (lastRetry >= maxRetries) {
          for (const item of filesToUpload) {
            item.status = 'error'
            item.error = error?.detail || error?.message || '上传失败'
          }
        }
        lastRetry++
      }
    }
  }

  // 逐份提示导入失败的简历及原因
  for (const item of uploadQueue.value) {
    if (item.status === 'error' && item.error) {
      notify({
        title: '导入失败',
        message: `「${item.file.name}」导入失败`,
        type: 'error',
        duration: 5000,
      })
    }
  }

  currentPage.value = 1
  resumeStore.invalidateCache()

  // 启动轮询检测解析完成
  uploading.value = false

  if (parsingIds.value.size > 0) {
    checkAndStartPolling(true)
  } else {
    // 无需解析（全部跳过/失败），立即通知
    checkUploadComplete()
  }
}

// Custom Drawer logic
const drawerVisible = ref(false)
const drawerLoading = ref(false)
let drawerCloseTimer = null  // closeDrawer 的延迟清理 timer，unmount 时清除
const currentDetail = ref(null)
const activeTab = ref('basic')
const specialDataStr = ref('')
const specialDataLoading = ref(false)
const activeSpecialType = ref('') // 'educations', 'work-experiences', etc.
const specialEduList = ref([])
const specialWorkList = ref([])
const specialSkillList = ref([])
const specialProjectList = ref([])

const groupedSkills = computed(() => {
  const groups = {}
  for (const skill of specialSkillList.value) {
    const level = skill.proficiency_level || '其他'
    if (!groups[level]) groups[level] = []
    groups[level].push(skill)
  }
  return groups
})

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
    currentDetail.value = await resumeStore.getCachedDetail(id, async () => {
      const detail = await resumeApi.getResumeDetail(id)
      return detail || resumeStore.resumes.find(r => r.id === id)
    })
  } catch (error) {
    msgError('无法获取简历详细内容')
    currentDetail.value = resumeStore.resumes.find(r => r.id === id)
  } finally {
    drawerLoading.value = false
  }
}

const closeDrawer = () => {
  editMode.value = false
  drawerVisible.value = false
  if (drawerCloseTimer) clearTimeout(drawerCloseTimer)
  drawerCloseTimer = setTimeout(() => {
    drawerCloseTimer = null
    currentDetail.value = null
    specialDataStr.value = ''
    resumeStore.clearSelection()
  }, 300) // matches transition timing
}


const handleSectionClick = (type, titleName) => {
  if (editMode.value) {
    activeSpecialType.value = type
    specialDataStr.value = ' ' // trigger display
  } else {
    handleFetchSpecialInDrawer(type, titleName)
  }
}

const handleFetchSpecialInDrawer = async (type, titleName) => {
  if (!currentDetail.value?.id) return
  specialDataLoading.value = true
  activeSpecialType.value = type
  specialDataStr.value = '正在提取并由智能分析模型组装中...'

  try {
    let data;
    if (type === 'educations') {
      data = await resumeStore.getCachedSection(currentDetail.value.id, 'educations',
        () => resumeApi.getResumeEducations(currentDetail.value.id))
      const list = Array.isArray(data) ? data : []
      specialEduList.value = list
        .filter(e => e.school_name || e.major)
        .sort((a, b) => new Date(b.end_date) - new Date(a.end_date))
    }
    else if (type === 'work-experiences') {
      data = await resumeStore.getCachedSection(currentDetail.value.id, 'work-experiences',
        () => resumeApi.getResumeWorkExperiences(currentDetail.value.id))
      const list = Array.isArray(data) ? data : []
      specialWorkList.value = list
        .filter(w => w.company_name || w.position)
        .sort((a, b) => new Date(b.end_date) - new Date(a.end_date))
    }
    else if (type === 'skills') {
      data = await resumeStore.getCachedSection(currentDetail.value.id, 'skills',
        () => resumeApi.getResumeSkills(currentDetail.value.id))
      specialSkillList.value = Array.isArray(data) ? data : []
    }
    else if (type === 'projects') {
      data = await resumeStore.getCachedSection(currentDetail.value.id, 'projects',
        () => resumeApi.getResumeProjects(currentDetail.value.id))
      const list = Array.isArray(data) ? data : []
      specialProjectList.value = list
        .filter(p => p.project_name || p.description || p.role)
        .sort((a, b) => new Date(b.end_date) - new Date(a.end_date))
    }

    specialDataStr.value = JSON.stringify(data, null, 2)
  } catch (error) {
    msgError(`提取 ${titleName} 失败`)
    specialDataStr.value = '提取失败或返回格式解析出错'
  } finally {
    specialDataLoading.value = false
  }
}

// ====== 重新解析 ======

const handleRowReparse = async (resume) => {
  try {
    await resumeApi.reparseResume(resume.id)
    // 立即更新本地状态为"解析中"
    const idx = resumeStore.resumes.findIndex(r => r.id === resume.id)
    if (idx !== -1) {
      resumeStore.resumes[idx] = { ...resumeStore.resumes[idx], status: 'uploaded', candidate_name: '待解析' }
    }
    resumeStore.invalidateCache(resume.id)
    msgSuccess('重新解析已启动，请稍后查看结果')
    checkAndStartPolling(true)
  } catch (error) {
    msgError('重新解析失败: ' + (error?.detail || error?.message || '未知错误'))
  }
}

const handleDrawerReparse = async () => {
  const id = currentDetail.value?.id
  if (!id) return

  try {
    await resumeApi.reparseResume(id)
    // 立即更新本地状态为"解析中"
    const idx = resumeStore.resumes.findIndex(r => r.id === id)
    if (idx !== -1) {
      resumeStore.resumes[idx] = { ...resumeStore.resumes[idx], status: 'uploaded', candidate_name: '待解析' }
    }
    if (currentDetail.value) {
      currentDetail.value = { ...currentDetail.value, status: 'uploaded', candidate_name: '待解析' }
    }
    resumeStore.invalidateCache(id)
    msgSuccess('重新解析已启动，请稍后查看结果')
    closeDrawer()
    checkAndStartPolling(true)
  } catch (error) {
    msgError('重新解析失败: ' + (error?.detail || error?.message || '未知错误'))
  }
}

// ====== 编辑模式 ======
const editMode = ref(false)
const editSaving = ref(false)
const editCandidateName = ref('')
const editEduList = ref([])
const editWorkList = ref([])
const editSkillList = ref([])
const editProjectList = ref([])

const enterEditMode = async () => {
  const id = currentDetail.value?.id
  if (!id) return

  // 并行加载所有尚未加载的 section
  const promises = []
  if (specialEduList.value.length === 0) {
    promises.push(handleFetchSpecialInDrawer('educations', '教育经历'))
  }
  if (specialWorkList.value.length === 0) {
    promises.push(handleFetchSpecialInDrawer('work-experiences', '工作经历'))
  }
  if (specialSkillList.value.length === 0) {
    promises.push(handleFetchSpecialInDrawer('skills', '技能'))
  }
  if (specialProjectList.value.length === 0) {
    promises.push(handleFetchSpecialInDrawer('projects', '项目经历'))
  }
  if (promises.length > 0) {
    await Promise.all(promises)
  }

  // 深拷贝当前数据到编辑副本
  editCandidateName.value = currentDetail.value?.candidate_name || ''
  editEduList.value = JSON.parse(JSON.stringify(specialEduList.value))
  editWorkList.value = JSON.parse(JSON.stringify(specialWorkList.value))
  editSkillList.value = JSON.parse(JSON.stringify(specialSkillList.value))
  editProjectList.value = JSON.parse(JSON.stringify(specialProjectList.value))

  editMode.value = true
}

const cancelEdit = () => {
  editMode.value = false
  editCandidateName.value = ''
  editEduList.value = []
  editWorkList.value = []
  editSkillList.value = []
  editProjectList.value = []
}

const saveEdit = async () => {
  editSaving.value = true
  try {
    const payload = {
      candidate_name: editCandidateName.value,
      educations: editEduList.value.map(e => ({
        school_name: e.school_name || '',
        degree: e.degree || '',
        major: e.major || '',
        start_date: e.start_date ? e.start_date.split('T')[0] : null,
        end_date: e.end_date ? e.end_date.split('T')[0] : null,
        is_985: e.is_985 ? 1 : 0,
        is_211: e.is_211 ? 1 : 0,
      })),
      work_experiences: editWorkList.value.map(w => ({
        company_name: w.company_name || '',
        position: w.position || '',
        start_date: w.start_date ? w.start_date.split('T')[0] : null,
        end_date: w.end_date ? w.end_date.split('T')[0] : null,
        description: w.description || '',
      })),
      skills: editSkillList.value.map(s => ({
        skill_name: s.skill_name || '',
        proficiency_level: s.proficiency_level || '',
      })),
      projects: editProjectList.value.map(p => ({
        project_name: p.project_name || '',
        description: p.description || '',
        start_date: p.start_date ? p.start_date.split('T')[0] : null,
        end_date: p.end_date ? p.end_date.split('T')[0] : null,
        role: p.role || '',
      })),
    }
    await resumeApi.updateResumeDetails(currentDetail.value.id, payload)
    msgSuccess('简历详情更新成功')

    // 同步更新本地数据
    currentDetail.value.candidate_name = editCandidateName.value
    specialEduList.value = editEduList.value
    specialWorkList.value = editWorkList.value
    specialSkillList.value = editSkillList.value
    specialProjectList.value = editProjectList.value
    // 同步更新 store 列表中的对应记录
    const storeIdx = resumeStore.resumes.findIndex(r => r.id === currentDetail.value.id)
    if (storeIdx !== -1) {
      resumeStore.resumes[storeIdx].candidate_name = editCandidateName.value
    }

    editMode.value = false
    resumeStore.invalidateCache(currentDetail.value?.id)
  } catch (error) {
    msgError('保存失败: ' + (error?.detail || error?.message || '未知错误'))
  } finally {
    editSaving.value = false
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
    const fileName = row.original_file_name || `${row.candidate_name || '简历'}.${row.file_type || 'pdf'}`
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    msgSuccess('简历下载完成')
  } catch (error) {
    msgError('下载失败: ' + (error?.detail || error?.message || '网络异常'))
  } finally {
    loading.close()
  }
}

const handleDelete = (id) => {
  confirm(
    '此操作将永久删除该简历以及相关解析数据内容，确定要继续吗？',
    '高危操作警告',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    const loading = ElLoading.service({ lock: true, text: '正在删除中...' })
    try {
      await resumeApi.deleteResume(id)
      resumeStore.deleteResume(id)
      resumeStore.invalidateCache(id)
      msgSuccess('物理删除简历成功！')
      // 如果当前页已无数据且不是第 1 页，回退到上一页
      if (resumeStore.resumes.length === 0 && currentPage.value > 1) {
        currentPage.value -= 1
      }
      fetchResumes()
    } catch (error) {
      const detail = error?.detail || error?.message || ''
      if (detail.includes('正在解析')) {
        msgWarning('该简历正在解析中，请等待解析完成后再删除')
      } else {
        msgError('无法删除此简历: ' + (detail || '未知错误'))
      }
    } finally {
      loading.close()
    }
  }).catch(() => {})
}

// ====== 批量选择与删除 ======
const selectedIds = ref([])

const isAllSelected = computed(() => {
  const list = pagedResumes.value || []
  return list.length > 0 && selectedIds.value.length === list.length
})

const isIndeterminate = computed(() => {
  const list = pagedResumes.value || []
  return selectedIds.value.length > 0 && selectedIds.value.length < list.length
})

const toggleSelectAll = (checked) => {
  if (checked) {
    selectedIds.value = (pagedResumes.value || []).map(r => r.id)
  } else {
    selectedIds.value = []
  }
}

const toggleSelectOne = (id, checked) => {
  if (checked) {
    selectedIds.value.push(id)
  } else {
    selectedIds.value = selectedIds.value.filter(v => v !== id)
  }
}

const handleBatchDelete = () => {
  if (selectedIds.value.length === 0) return
  confirm(
    `此操作将永久删除 ${selectedIds.value.length} 份简历以及相关解析数据，确定要继续吗？`,
    '高危操作警告',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    const loading = ElLoading.service({ lock: true, text: '正在批量删除...' })
    try {
      const result = await resumeApi.batchDeleteResumes(selectedIds.value)
      if (result.deleted > 0) {
        msgSuccess(`已删除 ${result.deleted} 份简历`)
      }
      if (result.errors?.length > 0) {
        const parsingErrors = result.errors.filter(e => e.error?.includes('正在解析'))
        if (parsingErrors.length > 0) {
          msgWarning(`${parsingErrors.length} 份简历正在解析中，无法删除`)
        }
        const otherErrors = result.errors.filter(e => !e.error?.includes('正在解析'))
        if (otherErrors.length > 0) {
          console.error('删除部分简历失败:', otherErrors)
          msgError(`${otherErrors.length} 份简历删除失败`)
        }
      }
      if (result.deleted === 0 && (!result.errors || result.errors.length === 0)) {
        msgInfo('未删除任何简历')
      }
      selectedIds.value = []
      resumeStore.invalidateCache()
      // 如果当前页已无数据且不是第 1 页，回退到上一页
      if (resumeStore.resumes.length === 0 && currentPage.value > 1) {
        currentPage.value -= 1
      }
      fetchResumes()
    } catch (error) {
      const errMsg = error?.detail || error?.message || ''
      if (errMsg.includes('ECONNREFUSED') || errMsg.includes('Network Error')) {
        msgError('批量删除失败：无法连接到服务器，请检查后端是否已启动')
      } else {
        msgError('批量删除失败: ' + (errMsg || '未知错误'))
      }
    } finally {
      loading.close()
    }
  }).catch(() => {})
}

// === 创建面试 ===
const createInterview = (resume) => {
  const params = new URLSearchParams({
    createInterview: '1',
    resumeId: resume.id,
    candidateName: resume.candidate_name || ''
  })
  window.location.href = `/dashboard/interview-manage?${params.toString()}`
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

  // PDF 文件：直接使用后端预览 URL，浏览器 HTTP 缓存自动处理内容缓存
  if (previewType.value === 'pdf') {
    const token = localStorage.getItem('token')
    previewUrl.value = `/api/resumes/preview/${resume.id}/image?token=${token}`
  }
}

const onPreviewClose = () => {
  previewUrl.value = ''
  previewResumeData.value = null
}
</script>

<style scoped>

/* 页面铺满视口，无需页面滚动 */
.feishu-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  padding: 8px 24px;
  overflow: hidden;
}

.card-container {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

.header-area {
  padding: 10px 24px;
  flex-shrink: 0;
}

/* 标题总数徽标 */
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  margin-left: 8px;
  border-radius: 11px;
  background: #3370FF;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  line-height: 22px;
}

/* 列表容器 - 弹性列布局 */
.list-area {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: #FFFFFF;
  border-radius: 6px;
  margin-bottom: 12px;
}

/* 列表主体内部滚动 */
.list-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.pagination-wrapper {
  flex-shrink: 0;
}

.processing-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  margin-bottom: 12px;
  background: #e6f4ff;
  border: 1px solid #91caff;
  border-radius: 6px;
  color: #1677ff;
  font-size: 14px;
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

/* 批量操作栏 */
.batch-action-bar {
  display: flex;
  align-items: center;
  padding: 8px 24px;
  background: #FFF4E5;
  border-bottom: 1px solid #FFE0B2;
  gap: 12px;
}
.batch-action-info {
  font-size: 13px;
  color: #E6A23C;
  font-weight: 500;
}
.row-selected {
  background-color: #F5F7FA;
}




.col-check { flex: 0 0 40px; min-width: 40px; display: flex; align-items: center; justify-content: center; }
.col-name { flex: 2.5; min-width: 240px; display: flex; align-items: center; cursor: pointer; }
.col-type { flex: 0.8; min-width: 100px; display: flex; align-items: center; }
.col-status { flex: 1.2; min-width: 140px; display: flex; align-items: center; }
.col-review { flex: 0.8; min-width: 90px; display: flex; align-items: center; }
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
.dot-danger { background-color: #F53F3F; }
.dot-muted { background-color: #D0D3D8; }
@keyframes blink {
  from { opacity: 0.4; }
  to { opacity: 1; }
}
.text-success { color: #13A248; }
.text-danger { color: #F53F3F; }
.text-loading { color: #3370FF; }

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

.skill-group {
  margin-bottom: 20px;
}
.skill-group-title {
  font-size: 14px;
  font-weight: 600;
  color: #1F2329;
  margin-bottom: 12px;
  border-left: 3px solid #3370FF;
  padding-left: 8px;
}
.skill-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
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


/* ====== 批量导入样式 ====== */
.batch-upload-area {
  margin-bottom: 16px;
}

.batch-file-list {
  border: 1px solid #dee0e3;
  border-radius: 6px;
  overflow: hidden;
}

.batch-list-header {
  padding: 10px 16px;
  background: #f5f6f7;
  font-size: 13px;
  color: #646a73;
  border-bottom: 1px solid #dee0e3;
}

.batch-file-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}
.batch-file-row:last-child {
  border-bottom: none;
}

.batch-file-index {
  color: #8f959e;
  font-weight: 500;
  min-width: 24px;
}

.batch-name-input {
  width: 140px;
  flex-shrink: 0;
}

.batch-file-name {
  flex: 1;
  color: #1f2329;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.batch-file-size {
  color: #8f959e;
  white-space: nowrap;
  min-width: 50px;
  text-align: right;
}

/* 审核状态标签颜色 */
.lark-tag.tag-green { background: #E4F7EB; color: #13A248; }
.lark-tag.tag-orange { background: #FFF4E5; color: #FF8800; }
.lark-tag.tag-red { background: #FFE4E2; color: #F53F3F; }

/* 缓存数量徽标 */
.cache-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  margin-left: 6px;
  border-radius: 10px;
  background-color: #F53F3F;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
}

/* ====== 列表行样式 ====== */
.list-row {
  display: flex;
  align-items: center;
  padding: 14px 24px;
  border-bottom: 1px solid #F0F1F5;
  background: #FFFFFF;
  transition: background 0.15s;
  cursor: default;
}
.list-row:hover {
  background-color: #F5F7FA;
}
.list-row:first-child {
  border-radius: 6px 6px 0 0;
}

/* ====== 分页栏样式 ====== */
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 14px 24px;
  border-top: 1px solid #DEE0E3;
  flex-shrink: 0;
}
.pagination-wrapper .el-pagination.is-background .el-pager li {
  border-radius: 6px;
  min-width: 28px;
  height: 28px;
  line-height: 28px;
  font-size: 13px;
  transition: all 0.15s;
}
.pagination-wrapper .el-pagination.is-background .el-pager li:hover {
  color: #3370FF;
  background-color: #EEF2FE;
}
.pagination-wrapper .el-pagination.is-background .el-pager li.is-active {
  color: #FFFFFF;
  background-color: #3370FF;
  font-weight: 600;
}
.pagination-wrapper .el-pagination .el-pagination__sizes .el-select .el-input {
  --el-input-border-radius: 6px;
}

/* ====== 轻量化解析提示 ====== */
.processing-banner {
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  margin-bottom: 10px;
  background: #EEF2FE;
  border-radius: 6px;
  color: #3370FF;
  font-size: 13px;
  line-height: 1;
}

/* ====== 空状态提示 ====== */
.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0 60px;
  color: #8F959E;
}
.empty-placeholder .empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #D0D3D8;
}
.empty-placeholder .empty-text {
  font-size: 14px;
}

/* 上传队列 */
.upload-queue-area {
  margin-bottom: 12px;
  background: #fff;
  border: 1px solid #DEE0E3;
  border-radius: 8px;
  padding: 16px;
}
.upload-queue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: #1F2329;
}

</style>

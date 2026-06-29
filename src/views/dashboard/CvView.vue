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
            <el-button type="primary" class="lark-btn-primary" @click="uploadDialogVisible = true">添加简历</el-button>
            <el-button class="lark-btn-ghost" @click="triggerBatchCache" :disabled="isCachingToDB">批量导入</el-button>
            <!-- 隐藏的文件选择器，用于批量选择后直接缓存 -->
            <input
              ref="batchFileInputRef"
              type="file"
              multiple
              accept=".pdf,.doc,.docx"
              style="display: none"
              @change="handleBatchFileSelect"
            />
            <!-- 缓存进度 -->
            <div v-if="isCachingToDB" style="display: inline-flex; align-items: center; gap: 8px; margin-left: 8px;">
              <el-progress
                type="circle"
                :percentage="cachingPercent"
                :width="28"
                :stroke-width="3"
                color="#1677ff"
              />
              <span style="font-size: 13px; color: #666; white-space: nowrap;">
                正在缓存 {{ cachingCurrent }}/{{ cachingTotal }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 后台处理中提示 -->
      <div v-if="showProcessingBanner" class="processing-banner">
        <el-icon class="is-loading" style="margin-right: 8px;"><Loading /></el-icon>
        <span>正在后台解析简历，请稍候...</span>
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
          <el-empty
            v-if="(!resumeStore.resumes || resumeStore.resumes.length === 0) && batchImportPlaceholders.length === 0 && !listLoading"
            description="暂无简历，请点击上方按钮添加导入"
            style="padding: 60px 0"
          />

          <div v-else>
            <!-- 批量导入占位行（显示在最上面） -->
            <div
              v-for="ph in batchImportPlaceholders"
              :key="ph.id"
              class="list-row list-row-placeholder"
            >
              <div class="col-check"></div>
              <div class="col-name">
                <el-avatar :size="32" class="lark-avatar" style="background:#8F959E;">?</el-avatar>
                <span class="name-text" style="color:#8F959E;font-weight:400;">{{ ph._displayName }}</span>
              </div>
              <div class="col-type">
                <span class="lark-tag tag-gray">{{ ph.file_type?.toUpperCase() }}</span>
              </div>
              <div class="col-status">
                <div class="status-indicator">
                  <span class="dot dot-loading"></span>
                  <span style="color:#8F959E;">待解析</span>
                </div>
              </div>
              <div class="col-review">
                <span class="lark-tag tag-gray">待审核</span>
              </div>
              <div class="col-time" style="color:#8F959E;">刚刚</div>
              <div class="col-action"></div>
            </div>

            <!-- 真实简历行 -->
            <div
              class="list-row"
              :class="{ 'row-selected': selectedIds.includes(resume.id) }"
              v-for="resume in resumeStore.resumes"
              :key="resume.id"
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
                  <span class="dot" :class="isAnalyzing(resume.status) ? 'dot-loading' : 'dot-success'"></span>
                  <span>{{ getStatusLabel(resume.status) }}</span>
                </div>
              </div>

              <div class="col-review">
                <span class="lark-tag" :class="reviewTagClass(resume.review_status)">{{ reviewLabel(resume.review_status) }}</span>
              </div>

              <div class="col-time">{{ formatFullTime(resume.updated_at) || '刚刚' }}</div>

              <div class="col-action">
                <el-button type="primary" link @click.stop="handleDownload(resume)">下载</el-button>
                <el-button type="primary" link @click.stop="handleRowReparse(resume)">重新解析</el-button>
                <el-button type="danger" link @click.stop="handleDelete(resume.id)">删除</el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination-wrapper" v-if="totalCount > 0" style="padding: 16px 24px; display: flex; justify-content: flex-end; border-top: 1px solid #DEE0E3;">
          <el-pagination
            :current-page="currentPage"
            v-model:page-size="pageSize"
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

    <!-- 缓存管理弹窗（仅查看和管理本地缓存文件） -->
    <el-dialog v-model="batchDialogVisible" title="本地缓存文件管理" width="520px" @opened="loadCachedFiles">
      <div v-if="batchFiles.length === 0" style="text-align: center; padding: 40px 0; color: #999;">
        暂无已缓存的文件，点击"批量导入"选择文件自动缓存
      </div>
      <div v-else class="batch-file-list">
        <div class="batch-list-header">
          <span>已缓存 {{ batchFiles.length }} 份简历</span>
          <el-button link type="warning" size="small" @click="clearAllCache">清除全部</el-button>
        </div>
        <div
          v-for="(item, index) in batchFiles"
          :key="item.id"
          class="batch-file-row"
        >
          <span class="batch-file-index">{{ index + 1 }}.</span>
          <span class="batch-file-name">{{ item.name }}</span>
          <span class="batch-file-size">{{ formatSize(item.size) }}</span>
          <el-tag size="small" type="success" effect="plain" style="margin-right: 8px;">已缓存</el-tag>
          <el-button link type="danger" size="small" @click="removeBatchFile(index)">移除</el-button>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchDialogVisible = false">关闭</el-button>
          <el-button
            v-if="batchFiles.length > 0"
            type="primary"
            class="lark-btn-primary"
            :loading="cacheUploading"
            @click="uploadCachedFiles"
          >
            {{ cacheUploading ? '上传中...' : '一键上传至服务器' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

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

    <!-- 简历导入弹窗 -->
    <el-dialog v-model="uploadDialogVisible" title="导入新简历" width="440px" @close="resetUploadForm">
      <el-form ref="uploadFormRef" :model="uploadForm" label-width="95px">
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
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import { UploadFilled, Download, Close, Search, Loading } from '@element-plus/icons-vue'
import { getCurrentUser } from '../../services/authService'
import { useResumeStore } from '../../stores/resumeStore'
import { resumeApi } from '../../api/resume'
import FilePreviewDialog from '../../components/FilePreviewDialog.vue'
import { fileCacheDB } from '../../utils/fileCacheDB'

const resumeStore = useResumeStore()
const currentUser = ref(getCurrentUser() || { id: 1, username: '管理员' })
const listLoading = ref(false)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)

// List retrieval
let statusPolling = null
const showProcessingBanner = ref(false)
const pollingPending = ref(false)

const stopPolling = () => {
  if (statusPolling) {
    clearInterval(statusPolling)
    statusPolling = null
  }
}

const checkAndStartPolling = (force = false) => {
  const needsPolling = resumeStore.resumes.some(r => isAnalyzing(r.status)) || force || batchImportPlaceholders.value.length > 0

  if (needsPolling) {
    showProcessingBanner.value = true
    if (statusPolling) return
    statusPolling = setInterval(async () => {
      if (pollingPending.value) return
      pollingPending.value = true
      try {
        const data = await resumeApi.getResumes(0, 999)
        let list = Array.isArray(data) ? data : (data.items || data.data || [])
        const hadAnalyzing = resumeStore.resumes.some(r => isAnalyzing(r.status))

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

        // ---- 匹配占位行与真实记录 ----
        if (batchImportPlaceholders.value.length > 0) {
          const stillPending = []
          for (const ph of batchImportPlaceholders.value) {
            const match = list.find(r => r.original_file_name === ph._originalFileName)
            if (match) {
              // 检测是否为重名（已存在的简历被更新）
              if (preImportIds.value.has(match.id)) {
                const name = match.candidate_name && match.candidate_name !== '待解析' ? match.candidate_name : ph._displayName
                ElMessage.info(`简历「${name}」已更新`)
                // 重名记录移到列表最上面
                const existIdx = resumeStore.resumes.findIndex(r => r.id === match.id)
                if (existIdx !== -1) {
                  const [existing] = resumeStore.resumes.splice(existIdx, 1)
                  resumeStore.resumes.unshift({ ...existing, ...match })
                }
              } else {
                // 新记录插入列表最上面
                const inStore = resumeStore.resumes.some(r => r.id === match.id)
                if (!inStore) {
                  resumeStore.resumes.unshift(match)
                  totalCount.value++
                }
              }
            } else {
              stillPending.push(ph)
            }
          }
          batchImportPlaceholders.value = stillPending
        }

        if (!list.some(r => isAnalyzing(r.status))) {
          // 所有记录解析完毕，清理遗留的占位行（无效文件不会生成记录）
          if (batchImportPlaceholders.value.length > 0) {
            ElMessage.warning(`${batchImportPlaceholders.value.length} 份文件不是有效简历，已自动忽略`)
            batchImportPlaceholders.value = []
          }
          stopPolling()
          showProcessingBanner.value = false
          if (hadAnalyzing) {
            ElMessage.success('简历解析完成')
          }
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
    ElMessage.error('获取简历列表失败: ' + (error?.detail || error?.message || '未知错误'))
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

const getStatusLabel = (status) => {
  if (!status) return '未知状态'
  const s = status.toLowerCase()
  if (s === 'analyzed' || s === 'success' || s === 'completed') return '解析成功'
  if (s === 'uploaded' || s === 'processed' || s === 'analyzing' || s === 'parsing' || s === 'pending_upload') return '解析中...'
  if (s === 'failed_analysis' || s === 'failed' || s === 'error') return '解析失败'
  return status
}

const reviewLabel = (status) => {
  return ({ PASS: '已通过', PENDING: '待定', FAIL: '已淘汰' })[status] || '待审核'
}

const reviewTagClass = (status) => {
  return ({ PASS: 'tag-green', PENDING: 'tag-orange', FAIL: 'tag-red' })[status] || 'tag-gray'
}

onMounted(() => {
  fetchResumes()
  loadCachedFiles()
})

onUnmounted(() => {
  stopPolling()
})

// Upload Drawer
const uploadDialogVisible = ref(false)
const uploadFormRef = ref(null)
const uploadRef = ref(null)

const uploadForm = ref({
  file: null
})

const handleFileChange = (uploadFile) => {
  uploadForm.value.file = uploadFile.raw
}

const handleFileRemove = () => {
  uploadForm.value.file = null
}

const resetUploadForm = () => {
  uploadForm.value = { file: null }
  if (uploadRef.value) uploadRef.value.clearFiles()
  if (uploadFormRef.value) uploadFormRef.value.clearValidate()
}

const submitUpload = async () => {
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

  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('简历文件大小不能超过 10MB')
    return
  }

  listLoading.value = true
  try {
    const response = await resumeApi.uploadResume(currentUser.value.id, file)

    const blobUrl = URL.createObjectURL(file)
    const newResume = Object.assign({
      id: Date.now(),
      user_id: currentUser.value.id,
      candidate_name: '待解析',
      file_path: '',
      file_type: file.name.split('.').pop().toLowerCase(),
      status: 'uploaded',
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    }, response)

    newResume.preview_url = blobUrl
    resumeStore.addResume(newResume)

    ElMessage.success(`简历 ${file.name} 导入成功！`)
    uploadDialogVisible.value = false
    resumeStore.invalidateCache()
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
}

// ====== 批量导入逻辑（两步式：先缓存浏览器 → 随后上传后端） ======
const batchDialogVisible = ref(false)
const cacheUploading = ref(false)
const cachedCount = ref(0)
const batchFileInputRef = ref(null)
// 批量导入完成后的追踪（占位行 + 重名检测）
const batchImportPlaceholders = ref([])
const preImportIds = ref(new Set())
// batchFiles 存储从 IndexedDB 读取的文件元数据 { id, name, size, cachedAt }
const batchFiles = ref([])
// IndexedDB 缓存文件进度
const isCachingToDB = ref(false)
const cachingCurrent = ref(0)
const cachingTotal = ref(0)
const cachingPercent = computed(() =>
  cachingTotal.value > 0 ? Math.round((cachingCurrent.value / cachingTotal.value) * 100) : 0
)

const validateBatchFile = (file) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
    ElMessage.error(`${file.name}: 只支持 PDF 或 Word 格式`)
    return false
  }
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error(`${file.name}: 文件大小不能超过 10MB`)
    return false
  }
  return true
}

/** 从 IndexedDB 加载已缓存的文件列表 */
const loadCachedFiles = async () => {
  try {
    batchFiles.value = await fileCacheDB.getFileList()
    cachedCount.value = batchFiles.value.length
  } catch (error) {
    console.error('加载缓存文件列表失败:', error)
    batchFiles.value = []
    cachedCount.value = 0
  }
}

/** 点击"批量导入" → 直接弹出文件选择器 */
const triggerBatchCache = () => {
  batchFileInputRef.value?.click()
}

/** 文件选择后立即缓存到 IndexedDB，不上传后端 */
const handleBatchFileSelect = async (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return

  const validFiles = []
  for (const file of files) {
    if (validateBatchFile(file)) {
      validFiles.push(file)
    }
  }

  if (validFiles.length === 0) {
    ElMessage.warning('没有符合格式要求的文件')
    return
  }

  // 显示缓存进度
  isCachingToDB.value = true
  cachingCurrent.value = 0
  cachingTotal.value = validFiles.length

  try {
    await fileCacheDB.saveFiles(validFiles, ({ current, total }) => {
      cachingCurrent.value = current
      cachingTotal.value = total
    })
    await loadCachedFiles()
    ElMessage.success(`已缓存 ${validFiles.length} 份简历，即将自动上传至服务器`)
  } catch (error) {
    ElMessage.error('缓存文件失败: ' + (error?.message || '未知错误'))
    event.target.value = ''
    isCachingToDB.value = false
    return
  }

  isCachingToDB.value = false

  // 重置 input
  event.target.value = ''
  // 缓存完成后自动触发上传
  await uploadCachedFiles()
}

/** 一键清空所有缓存 */
const clearAllCache = async () => {
  await fileCacheDB.clearAll()
  batchFiles.value = []
  cachedCount.value = 0
  ElMessage.success('已清除全部缓存')
}

const removeBatchFile = async (index) => {
  const removed = batchFiles.value[index]
  if (removed) {
    await fileCacheDB.removeFile(removed.id)
  }
  await loadCachedFiles()
}

const formatSize = (bytes) => {
  const kb = bytes / 1024
  const mb = kb / 1024
  return mb > 1 ? mb.toFixed(1) + ' MB' : kb.toFixed(0) + ' KB'
}

/** 上传所有已缓存文件到后端 */
const uploadCachedFiles = async () => {
  const items = await fileCacheDB.getAllFiles()
  if (items.length === 0) {
    ElMessage.warning('没有待上传的缓存文件')
    return
  }

  cacheUploading.value = true
  try {
    const files = items.map(item => new File([item.blob], item.name, { type: item.type }))
    // 记录导入前的简历 ID，用于后续检测重名
    preImportIds.value = new Set(resumeStore.resumes.map(r => r.id))

    const result = await resumeApi.batchImportLocal(files)

    if (result && result.imported > 0) {
      // 创建占位行：在列表显示假行，简历为未知待解析状态
      const fileNames = items.map(item => item.name)
      batchImportPlaceholders.value = fileNames.map((name, i) => ({
        id: `placeholder-${Date.now()}-${i}`,
        _placeholder: true,
        _originalFileName: name,
        _displayName: name.replace(/\.[^.]+$/, '') || name,
        candidate_name: name.replace(/\.[^.]+$/, '') || '待解析',
        file_type: (name.split('.').pop() || '').toLowerCase(),
        status: 'pending_upload',
        review_status: null,
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }))
      // 跳转到第 1 页并刷新列表
      currentPage.value = 1
      resumeStore.invalidateCache()
      ElMessage.success(`已上传 ${result.imported} 份简历`)
      await fetchResumes()
      checkAndStartPolling(true)
    } else {
      ElMessage.error('批量上传失败，请重试')
    }
  } catch (error) {
    const msg = error?.detail || error?.message || error?.error || '未知错误'
    ElMessage.error('批量上传失败: ' + (typeof msg === 'string' ? msg : JSON.stringify(msg)))
  } finally {
    // 无论成功或失败都清除缓存，避免遗留文件导致下次超出数量限制
    await fileCacheDB.clearAll()
    batchFiles.value = []
    cachedCount.value = 0
    batchDialogVisible.value = false
    cacheUploading.value = false
  }
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
    ElMessage.error('无法获取简历详细内容')
    currentDetail.value = resumeStore.resumes.find(r => r.id === id)
  } finally {
    drawerLoading.value = false
  }
}

const closeDrawer = () => {
  editMode.value = false
  drawerVisible.value = false
  setTimeout(() => {
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
  specialEduList.value = []
  specialWorkList.value = []
  specialSkillList.value = []
  specialDataStr.value = '正在提取并由智能分析模型组装中...'
  
  try {
    let data;
    if (type === 'educations') {
      data = await resumeApi.getResumeEducations(currentDetail.value.id)
      const list = Array.isArray(data) ? data : []
      // 过滤掉无核心内容的记录
      specialEduList.value = list
        .filter(e => e.school_name || e.major)
        .sort((a, b) => new Date(b.end_date) - new Date(a.end_date))
    }
    else if (type === 'work-experiences') {
      data = await resumeApi.getResumeWorkExperiences(currentDetail.value.id)
      const list = Array.isArray(data) ? data : []
      // 过滤掉无核心内容的记录
      specialWorkList.value = list
        .filter(w => w.company_name || w.position)
        .sort((a, b) => new Date(b.end_date) - new Date(a.end_date))
    }
    else if (type === 'skills') {
      data = await resumeApi.getResumeSkills(currentDetail.value.id)
      specialSkillList.value = Array.isArray(data) ? data : []
    }
    else if (type === 'projects') {
      data = await resumeApi.getResumeProjects(currentDetail.value.id)
      const list = Array.isArray(data) ? data : []
      // 过滤掉无核心内容的记录（项目名、描述、角色均为空）
      specialProjectList.value = list
        .filter(p => p.project_name || p.description || p.role)
        .sort((a, b) => new Date(b.end_date) - new Date(a.end_date))
    }

    specialDataStr.value = JSON.stringify(data, null, 2)
  } catch (error) {
    ElMessage.error(`提取 ${titleName} 失败`)
    specialDataStr.value = '提取失败或返回格式解析出错'
  } finally {
    specialDataLoading.value = false
  }
}

// ====== 重新解析 ======

const handleRowReparse = async (resume) => {
  try {
    await resumeApi.reparseResume(resume.id)
    resumeStore.invalidateCache(resume.id)
    ElMessage.success('重新解析已启动，请稍后查看结果')
    fetchResumes()
  } catch (error) {
    ElMessage.error('重新解析失败: ' + (error?.detail || error?.message || '未知错误'))
  }
}

const handleDrawerReparse = async () => {
  const id = currentDetail.value?.id
  if (!id) return

  try {
    await resumeApi.reparseResume(id)
    resumeStore.invalidateCache(id)
    ElMessage.success('重新解析已启动，请稍后查看结果')
    closeDrawer()
    fetchResumes()
  } catch (error) {
    ElMessage.error('重新解析失败: ' + (error?.detail || error?.message || '未知错误'))
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
    ElMessage.success('简历详情更新成功')

    // 同步更新本地数据
    currentDetail.value.candidate_name = editCandidateName.value
    specialEduList.value = editEduList.value
    specialWorkList.value = editWorkList.value
    specialSkillList.value = editSkillList.value
    specialProjectList.value = editProjectList.value

    editMode.value = false
    resumeStore.invalidateCache(currentDetail.value?.id)
    fetchResumes()
  } catch (error) {
    ElMessage.error('保存失败: ' + (error?.detail || error?.message || '未知错误'))
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
    ElMessage.success('简历下载完成')
  } catch (error) {
    ElMessage.error('下载失败: ' + (error?.detail || error?.message || '网络异常'))
  } finally {
    loading.close()
  }
}

const handleDelete = (id) => {
  ElMessageBox.confirm(
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
      ElMessage.success('物理删除简历成功！')
      fetchResumes()
    } catch (error) {
      ElMessage.error('无法删除此简历: ' + (error?.detail || error?.message || '未知错误'))
    } finally {
      loading.close()
    }
  }).catch(() => {})
}

// ====== 批量选择与删除 ======
const selectedIds = ref([])

const isAllSelected = computed(() => {
  const list = resumeStore.resumes || []
  return list.length > 0 && selectedIds.value.length === list.length
})

const isIndeterminate = computed(() => {
  const list = resumeStore.resumes || []
  return selectedIds.value.length > 0 && selectedIds.value.length < list.length
})

const toggleSelectAll = (checked) => {
  if (checked) {
    selectedIds.value = (resumeStore.resumes || []).map(r => r.id)
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
  ElMessageBox.confirm(
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
        ElMessage.success(`已删除 ${result.deleted} 份简历`)
      }
      if (result.errors?.length > 0) {
        console.error('删除部分简历失败:', result.errors)
        ElMessage.warning(`${result.errors.length} 份简历删除失败`)
      }
      selectedIds.value = []
      resumeStore.invalidateCache()
      fetchResumes()
    } catch (error) {
      ElMessage.error('批量删除失败: ' + (error?.detail || error?.message || '未知错误'))
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
    previewUrl.value = `/api/resumes/preview/${resume.id}?token=${token}`
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
  height: calc(100vh - 60px);
  padding: 8px 24px;
  overflow: hidden;
}

.card-container {
  min-height: 0;
  flex: 1;
}

.header-area {
  padding: 10px 24px;
  flex-shrink: 0;
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

/* 批量导入占位列样式 */
.list-row-placeholder {
  border-bottom: 1px dashed #DEE0E3 !important;
  background-color: #FAFBFC;
}
.list-row-placeholder:hover {
  background-color: #F0F2F5 !important;
}

</style>

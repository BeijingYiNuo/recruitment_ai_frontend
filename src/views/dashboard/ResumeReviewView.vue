<template>
  <div class="feishu-page">
    <div class="card-container">
      <!-- Header -->
      <div class="header-area">
        <div class="header-top">
          <div class="title-area">
            <h1>简历审核</h1>
            <span class="badge">{{ resumes.length }}</span>
          </div>
        </div>

        <div class="toolbar">
          <div class="toolbar-left">
            <div class="filter-tabs">
              <div
                v-for="tab in filterTabs"
                :key="tab.key"
                class="filter-tab"
                :class="{ active: activeFilter === tab.key }"
                @click="switchFilter(tab.key)"
              >
                <span>{{ tab.label }}</span>
              </div>
            </div>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索候选人姓名"
              clearable
              style="width: 200px; margin-left: 16px;"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-date-picker
              v-model="timeRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="上传起始"
              end-placeholder="上传截止"
              format="YYYY-MM-DD HH:mm"
              style="width: 300px; margin-left: 12px;"
              @change="handleSearch"
            />
            <el-button style="margin-left: 12px;" size="small" type="primary" plain @click="openBatchAiReview" :disabled="batchAiReviewRunning">
              <el-icon><MagicStick /></el-icon> 批量 AI 审核
            </el-button>
          </div>

          <!-- View Mode Toggle -->
          <el-radio-group v-model="viewMode" size="small" class="mode-toggle">
            <el-radio-button value="list">
              <el-icon><List /></el-icon>
              列表
            </el-radio-button>
            <el-radio-button value="detail">
              <el-icon><Grid /></el-icon>
              详情
            </el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- Progress (detail mode only) -->
      <div class="progress-bar" v-if="viewMode === 'detail' && resumes.length > 0">
        <div class="progress-dots">
          <span
            v-for="(r, i) in resumes"
            :key="r.id"
            class="dot"
            :class="{ active: i === currentIndex, reviewed: i < currentIndex }"
            @click="goTo(i)"
          />
        </div>
        <span class="progress-text">{{ currentIndex + 1 }} / {{ resumes.length }}</span>
      </div>

      <!-- ====== List Mode ====== -->
      <div v-if="viewMode === 'list'" v-loading="loading" class="review-area">
        <el-empty v-if="resumes.length === 0 && !loading" description="暂无候选人简历" style="padding: 80px 0" />
        <div v-else class="list-table-wrapper">
          <div class="list-header">
            <div class="col-name">候选人</div>
            <div class="col-status">审核状态</div>
            <div class="col-time">上传时间</div>
            <div class="col-action">操作</div>
          </div>
          <div class="list-body">
            <div
              v-for="(r, i) in resumes"
              :key="r.id"
              class="list-row"
              :class="{ even: i % 2 === 0 }"
              @dblclick="enterDetail(i)"
            >
              <div class="col-name">
                <el-avatar :size="32" class="row-avatar">{{ r.candidate_name?.charAt(0) || '?' }}</el-avatar>
                <span class="row-name">{{ r.candidate_name }}</span>
                <el-tooltip v-if="r.ai_review_data" content="AI 已出具审核意见" placement="top">
                  <el-icon style="color:#3370ff;margin-left:4px;font-size:14px;" @click.stop><MagicStick /></el-icon>
                </el-tooltip>
              </div>
              <div class="col-status">
                <span class="lark-tag" :class="statusTagClass(r.review_status)">{{ statusLabel(r.review_status) }}</span>
              </div>
              <div class="col-time">{{ fmtDateTime(r.created_at) }}</div>
              <div class="col-action">
                <div class="row-actions">
                  <el-button size="small" class="row-action-btn pass" :disabled="reviewingId === r.id" @click.stop="quickReview(r, 'PASS')">通过</el-button>
                  <el-button size="small" class="row-action-btn pending" :disabled="reviewingId === r.id" @click.stop="quickReview(r, 'PENDING')">待定</el-button>
                  <el-button size="small" class="row-action-btn fail" :disabled="reviewingId === r.id" @click.stop="quickReview(r, 'FAIL')">淘汰</el-button>
                  <el-button v-if="r.review_status === 'PASS'" size="small" type="primary" plain @click.stop="createInterview(r)">
                    <el-icon style="margin-right:2px"><Plus /></el-icon> 创建面试
                  </el-button>
                  <el-button size="small" text type="primary" @click.stop="enterDetail(i)">详情</el-button>
                </div>
              </div>
            </div>
          </div>
          <!-- 分页 -->
          <div class="pagination-wrapper" v-if="totalCount > 0" style="padding: 16px 24px; display: flex; justify-content: flex-end; border-top: 1px solid #DEE0E3;">
            <el-pagination
              v-model:current-page="currentPage"
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

      <!-- ====== Detail Mode ====== -->
      <div v-if="viewMode === 'detail'" class="review-area" v-loading="loading">
        <el-empty v-if="resumes.length === 0 && !loading" description="暂无待审核简历" style="padding: 80px 0" />
        <template v-if="resumes.length > 0">
          <div class="split-panel">
            <!-- Left: File Preview -->
            <div class="left-panel">
              <div class="panel-header">
                <div class="candidate-info">
                  <el-avatar :size="36" class="candidate-avatar">
                    {{ currentResume?.candidate_name?.charAt(0) || '?' }}
                  </el-avatar>
                  <div>
                    <div class="candidate-name">{{ currentResume?.candidate_name }}</div>
                    <div class="candidate-tags">
                      <span class="lark-tag" :class="statusTagClass(currentResume?.review_status)">{{ statusLabel(currentResume?.review_status) }}</span>
                      <span class="lark-tag tag-gray">{{ currentResume?.file_type?.toUpperCase() }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="file-preview" v-loading="previewLoading" element-loading-text="加载预览中...">
                <iframe v-if="fileType === 'pdf' && fileUrl" :src="fileUrl" class="file-iframe" />
                <img v-else-if="isImageType && fileUrl" :src="fileUrl" class="file-image" alt="简历预览" />
                <div v-else class="file-fallback">
                  <el-icon :size="48" color="#8F959E"><Document /></el-icon>
                  <p>暂不支持该文件类型在线预览</p>
                </div>
              </div>
              <div class="preview-nav">
                <el-button text :disabled="currentIndex === 0" @click="prev"><el-icon><ArrowLeft /></el-icon> 上一份</el-button>
                <el-button text :disabled="currentIndex === resumes.length - 1" @click="next">下一份 <el-icon><ArrowRight /></el-icon></el-button>
              </div>
            </div>

            <!-- Right: Parsed Info -->
            <div class="right-panel">
              <div class="panel-header">
                <span class="panel-title">简历详情</span>
                <el-button size="small" plain :disabled="reviewing || aiReviewLoading" @click="openAiReview">
                  <el-icon><MagicStick /></el-icon> AI审核
                </el-button>
              </div>
              <div class="position-bar">
                <span class="position-label">应聘岗位</span>
                <el-select
                  :model-value="currentResume?.position_id ?? null"
                  placeholder="选择岗位（选填）"
                  size="small"
                  clearable
                  filterable
                  :loading="positionLoading"
                  style="flex: 1; min-width: 0;"
                  @change="handlePositionChange"
                >
                  <el-option
                    v-for="pos in positions"
                    :key="pos.id"
                    :label="pos.name + (pos.department ? ' · ' + pos.department : '')"
                    :value="pos.id"
                  />
                </el-select>
              </div>
              <div v-if="currentResumeAiReview" class="ai-review-summary">
                <div class="ai-review-summary-header">
                  <el-icon><MagicStick /></el-icon> AI 审核意见
                  <span class="lark-tag" :class="resultTagClass(currentResumeAiReview.suggestion)" style="margin-left: 6px;">{{ statusLabel(currentResumeAiReview.suggestion) }}</span>
                </div>
                <div class="ai-review-summary-body">{{ currentResumeAiReview.reason }}</div>
              </div>
              <div class="parsed-content" v-loading="detailLoading">
                <div class="detail-section" v-if="parsedData.educations.length">
                  <div class="section-title"><el-icon><Reading /></el-icon> 教育经历</div>
                  <div v-for="edu in parsedData.educations" :key="edu.id" class="detail-item">
                    <div class="detail-main">{{ edu.school_name }}</div>
                    <div class="detail-sub">{{ edu.degree }} · {{ edu.major }}</div>
                    <div class="detail-time">{{ fmtDate(edu.start_date) }} - {{ fmtDate(edu.end_date) }}</div>
                  </div>
                </div>
                <div class="detail-section" v-if="parsedData.workExperiences.length">
                  <div class="section-title"><el-icon><Briefcase /></el-icon> 工作经历</div>
                  <div v-for="w in parsedData.workExperiences" :key="w.id" class="detail-item">
                    <div class="detail-main">{{ w.company_name }}</div>
                    <div class="detail-sub">{{ w.position }}</div>
                    <div class="detail-time">{{ fmtDate(w.start_date) }} - {{ fmtDate(w.end_date) }}</div>
                    <div class="detail-desc" v-if="w.description">{{ w.description }}</div>
                  </div>
                </div>
                <div class="detail-section" v-if="parsedData.skills.length">
                  <div class="section-title"><el-icon><Coin /></el-icon> 技能</div>
                  <div class="skill-list">
                    <span v-for="s in parsedData.skills" :key="s.id" class="skill-tag">{{ s.skill_name }}</span>
                  </div>
                </div>
                <div class="detail-section" v-if="parsedData.projects.length">
                  <div class="section-title"><el-icon><Collection /></el-icon> 项目经历</div>
                  <div v-for="p in parsedData.projects" :key="p.id" class="detail-item">
                    <div class="detail-main">{{ p.project_name }}</div>
                    <div class="detail-time">{{ fmtDate(p.start_date) }} - {{ fmtDate(p.end_date) }}</div>
                    <div class="detail-sub" v-if="p.role">角色: {{ p.role }}</div>
                    <div class="detail-desc" v-if="p.description">{{ p.description }}</div>
                  </div>
                </div>
                <div v-if="!detailLoading && emptyDetail" class="no-detail">
                  <el-icon :size="40" color="#dee0e3"><Document /></el-icon>
                  <p>暂无解析数据</p>
                </div>
              </div>
              <div class="action-bar">
                <el-button class="action-btn" plain :disabled="reviewing" @click="openRemark">
                  <el-icon><EditPen /></el-icon> 备注
                </el-button>
                <template v-if="currentResume?.review_status !== 'PASS'">
                  <el-button class="action-btn fail" :disabled="reviewing" @click="detailQuickReview('FAIL')"><el-icon><Close /></el-icon> 淘汰</el-button>
                  <el-button class="action-btn pending" :disabled="reviewing" @click="detailQuickReview('PENDING')"><el-icon><QuestionFilled /></el-icon> 待定</el-button>
                  <el-button class="action-btn pass" :disabled="reviewing" @click="detailQuickReview('PASS')"><el-icon><Check /></el-icon> 通过</el-button>
                  <el-button v-if="currentResume?.review_status" class="action-btn" plain :disabled="reviewing" @click="resetToUnreviewed">
                    重置为待审核
                  </el-button>
                </template>
                <template v-else>
                  <el-button class="action-btn" plain :disabled="reviewing" @click="resetToUnreviewed">
                    重置为待审核
                  </el-button>
                </template>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 备注弹窗 -->
    <el-dialog v-model="remarkVisible" title="备注" width="420px" destroy-on-close @close="saveCurrentRemark">
      <el-input v-model="remarkText" type="textarea" :rows="8" placeholder="在此写下备注信息，边看简历边记录..." maxlength="1000" show-word-limit />
      <template #footer>
        <el-button type="primary" class="lark-btn-primary" @click="remarkVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- AI 辅助审核弹窗 -->
    <el-dialog v-model="aiReviewVisible" title="AI 辅助审核" width="520px" destroy-on-close @close="aiReviewResult = null">
      <template v-if="!aiReviewResult">
        <el-form label-width="100px" label-position="top" style="padding: 0 4px;">
          <el-form-item label="岗位名称">
            <el-input v-model="aiReviewForm.position" placeholder="例：Java后端开发" />
          </el-form-item>
          <el-form-item label="岗位描述（JD）">
            <el-input v-model="aiReviewForm.jd" type="textarea" :rows="4" placeholder="粘贴 JD 内容..." />
          </el-form-item>
          <el-form-item label="自定义要求">
            <el-input v-model="aiReviewForm.custom_requirements" type="textarea" :rows="3" placeholder="其他筛选要求..." />
          </el-form-item>
          <el-form-item label="需求人数">
            <el-input-number v-model="aiReviewForm.headcount" :min="1" :max="100" />
          </el-form-item>
        </el-form>
      </template>
      <template v-else>
        <div class="ai-review-result">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
            <span class="lark-tag" :class="statusTagClass(aiReviewResult.suggestion)">
              {{ statusLabel(aiReviewResult.suggestion) }}
            </span>
            <span style="font-size:13px;color:#646a73;">AI 建议</span>
          </div>
          <div style="margin-bottom:12px;font-size:14px;line-height:1.6;color:#1f2329;white-space:pre-wrap;">{{ aiReviewResult.reason }}</div>
          <div v-if="aiReviewResult.matched_points?.length" style="margin-bottom:8px;">
            <div style="font-size:13px;font-weight:600;color:#52c41a;margin-bottom:4px;">匹配点</div>
            <div v-for="(pt, i) in aiReviewResult.matched_points" :key="i" style="font-size:13px;color:#646a73;padding:2px 0;">● {{ pt }}</div>
          </div>
          <div v-if="aiReviewResult.gaps?.length">
            <div style="font-size:13px;font-weight:600;color:#ff4d4f;margin-bottom:4px;">不足点</div>
            <div v-for="(pt, i) in aiReviewResult.gaps" :key="i" style="font-size:13px;color:#646a73;padding:2px 0;">● {{ pt }}</div>
          </div>
        </div>
      </template>
      <template #footer>
        <el-button v-if="aiReviewResult" @click="aiReviewResult = null; aiReviewForm.position = ''">重新填写</el-button>
        <el-button @click="aiReviewVisible = false">取消</el-button>
        <el-button v-if="!aiReviewResult" type="primary" class="lark-btn-primary" :loading="aiReviewLoading" @click="submitAiReview">生成建议</el-button>
        <el-button v-else type="primary" class="lark-btn-primary" @click="acceptAiReview">采纳建议</el-button>
      </template>
    </el-dialog>

    <!-- 批量 AI 审核弹窗 -->
    <el-dialog v-model="batchAiReviewVisible" title="批量 AI 审核" width="600px" destroy-on-close @close="batchAiReviewResults = []; batchAiReviewRunning = false">
      <template v-if="!batchAiReviewRunning && batchAiReviewResults.length === 0">
        <div style="margin-bottom: 12px; font-size: 14px; color: #1f2329; display: flex; align-items: center; justify-content: space-between;">
          <span>待审核简历 <strong>{{ pendingReviewResumes.length }}</strong> 份，已选 <strong>{{ batchSelectedResumeIds.length }}</strong> 份</span>
          <el-checkbox
            :indeterminate="batchSelectedResumeIds.length > 0 && batchSelectedResumeIds.length < pendingReviewResumes.length"
            :model-value="batchSelectedResumeIds.length === pendingReviewResumes.length"
            @change="toggleBatchSelectAll"
          >全选</el-checkbox>
        </div>
        <el-form label-width="100px" label-position="top" style="padding: 0 4px;">
          <el-form-item label="岗位名称">
            <el-select v-model="batchSelectedPositionId" placeholder="请选择岗位" style="width: 100%" clearable filterable @change="handleBatchPositionChange">
              <el-option v-for="p in positions" :key="p.id" :label="p.name" :value="p.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="岗位描述（JD）">
            <el-input v-model="batchAiReviewForm.jd" type="textarea" :rows="3" placeholder="粘贴 JD 内容..." />
          </el-form-item>
          <el-form-item label="自定义要求">
            <el-input v-model="batchAiReviewForm.custom_requirements" type="textarea" :rows="2" placeholder="其他筛选要求..." />
          </el-form-item>
          <el-form-item label="需求人数">
            <el-input-number v-model="batchAiReviewForm.headcount" :min="1" :max="100" />
          </el-form-item>
        </el-form>
        <div style="max-height: 250px; overflow-y: auto; border: 1px solid #dee0e3; border-radius: 6px; margin-top: 8px;">
          <div v-for="(r, i) in pendingReviewResumes" :key="r.id" class="batch-review-row" :class="{ even: i % 2 === 0 }" @click="toggleBatchSelect(r.id)" style="cursor: pointer;">
            <el-checkbox :model-value="batchSelectedResumeIds.includes(r.id)" style="margin-right: 8px; pointer-events: none;" />
            <el-avatar :size="24" class="batch-review-avatar">{{ r.candidate_name?.charAt(0) || '?' }}</el-avatar>
            <span class="batch-review-name">{{ r.candidate_name }}</span>
            <span class="lark-tag" :class="statusTagClass(r.review_status)">{{ statusLabel(r.review_status) }}</span>
          </div>
        </div>
      </template>
      <template v-else>
        <div style="margin-bottom: 16px;">
          <el-progress :percentage="batchReviewProgress" :stroke-width="12" :text-inside="true" />
        </div>
        <div style="max-height: 350px; overflow-y: auto; border: 1px solid #dee0e3; border-radius: 6px;">
          <div v-for="(item, i) in batchAiReviewResults" :key="item.resume_id" class="batch-review-row batch-review-result-row" :class="{ even: i % 2 === 0 }">
            <div class="batch-review-result-left">
              <span class="batch-review-index">{{ i + 1 }}.</span>
              <span class="batch-review-name">{{ item.candidate_name || ('简历 ' + item.resume_id) }}</span>
              <span v-if="item.error" class="lark-tag tag-red">失败</span>
              <span v-else class="lark-tag" :class="resultTagClass(item.result?.suggestion)">{{ statusLabel(item.result?.suggestion) }}</span>
              <span v-if="item.result?.reason" class="batch-review-reason" :title="item.result.reason">{{ item.result.reason.slice(0, 50) }}{{ item.result.reason.length > 50 ? '...' : '' }}</span>
            </div>
            <div v-if="!item.error && !item._reviewed" class="batch-review-result-actions">
              <el-button size="small" class="row-action-btn pass" @click="batchApplyReview(item, 'PASS')">通过</el-button>
              <el-button size="small" class="row-action-btn pending" @click="batchApplyReview(item, 'PENDING')">待定</el-button>
              <el-button size="small" class="row-action-btn fail" @click="batchApplyReview(item, 'FAIL')">淘汰</el-button>
            </div>
            <div v-else-if="item._reviewed" style="font-size:12px;color:#8f959e;flex-shrink:0;">
              已{{ { PASS: '通过', PENDING: '待定', FAIL: '淘汰' }[item._decision] || '处理' }}
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <el-button @click="batchAiReviewVisible = false">关闭</el-button>
        <el-button v-if="!batchAiReviewRunning && batchAiReviewResults.length === 0" type="primary" class="lark-btn-primary" :loading="batchAiReviewRunning" @click="startBatchAiReview">开始审核</el-button>
      </template>
    </el-dialog>

    <!-- 面试提问建议 - 浮窗组件（仅详情模式显示） -->
    <InterviewQuestionsFloat
      v-if="viewMode === 'detail'"
      :key="currentResume?.id"
      :resume-id="currentResume?.id"
      :candidate-name="currentResume?.candidate_name"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { resumeApi } from '../../api/resume'
import { positionApi } from '../../api/position'
import { ElMessage } from 'element-plus'
import InterviewQuestionsFloat from '../../components/InterviewQuestionsFloat.vue'
import {
  ArrowLeft, ArrowRight, Close, QuestionFilled, Check, Document, EditPen, MagicStick,
  Reading, Briefcase, Coin, Collection, List, Grid, Plus, Search
} from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const resumes = ref([])
const currentIndex = ref(0)
const fileUrl = ref('')
const previewLoading = ref(false)
const reviewing = ref(false)
const reviewingId = ref(null)
const remarkVisible = ref(false)
const remarkText = ref('')
const remarkMap = reactive({})
const activeFilter = ref('null')
const detailLoading = ref(false)
const viewMode = ref('list')
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)
const timeRange = ref([])

// AI 审核
const aiReviewVisible = ref(false)
const aiReviewLoading = ref(false)
const aiReviewForm = reactive({ position: '', jd: '', custom_requirements: '', headcount: 1 })
const aiReviewResult = ref(null)

// 批量 AI 审核
const batchAiReviewVisible = ref(false)
const batchAiReviewRunning = ref(false)
const batchAiReviewForm = reactive({ position: '', jd: '', custom_requirements: '', headcount: 1 })
const batchSelectedPositionId = ref(null)
const batchSelectedResumeIds = ref([])
const batchAiReviewResults = ref([])
const batchReviewProgress = ref(0)

const pendingReviewResumes = computed(() =>
  resumes.value.filter(r => !r.review_status || r.review_status === 'null')
)

// 岗位选择
const positions = ref([])
const positionLoading = ref(false)


const parsedData = reactive({
  educations: [],
  workExperiences: [],
  skills: [],
  projects: []
})

const currentResumeAiReview = computed(() => {
  const data = currentResume.value?.ai_review_data
  if (!data) return null
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    return parsed
  } catch { return null }
})

const filterTabs = computed(() => [
  { key: 'all', label: `全部 ${tabCounts.all}` },
  { key: 'null', label: `待审核 ${tabCounts.null}` },
  { key: 'PASS', label: `已通过 ${tabCounts.PASS}` },
  { key: 'PENDING', label: `待定 ${tabCounts.PENDING}` },
  { key: 'FAIL', label: `已淘汰 ${tabCounts.FAIL}` }
])

const tabCounts = reactive({ all: 0, null: 0, PASS: 0, PENDING: 0, FAIL: 0 })

const currentResume = computed(() => resumes.value[currentIndex.value] || null)
const fileType = computed(() => (currentResume.value?.file_type || '').toLowerCase())
const isImageType = computed(() => ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(fileType.value))
const emptyDetail = computed(() =>
  !parsedData.educations.length && !parsedData.workExperiences.length &&
  !parsedData.skills.length && !parsedData.projects.length
)

function statusLabel(status) {
  return ({ PASS: '已通过', PENDING: '待定', FAIL: '已淘汰' })[status] || '待审核'
}

function statusTagClass(status) {
  if (!status) return 'tag-info'
  return ({ PASS: 'tag-green', PENDING: 'tag-orange', FAIL: 'tag-red' })[status] || 'tag-gray'
}

function fmtDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
}

function fmtDateTime(d) {
  if (!d) return '—'
  const dt = new Date(d)
  const pad = (n) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

function getFilterParam() {
  if (activeFilter.value === 'all') return null
  if (activeFilter.value === 'null') return 'null'
  return activeFilter.value
}

function enterDetail(index) {
  saveCurrentRemark()
  currentIndex.value = index
  viewMode.value = 'detail'
  loadCurrent()
  fetchPositions()
}

function formatTimeRange() {
  if (!timeRange.value || timeRange.value.length !== 2) return { startTime: '', endTime: '' }
  const fmt = (d) => {
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  return { startTime: fmt(timeRange.value[0]), endTime: fmt(timeRange.value[1]) }
}

async function fetchResumes() {
  loading.value = true
  try {
    const skip = (currentPage.value - 1) * pageSize.value
    const { startTime, endTime } = formatTimeRange()
    const res = await resumeApi.getResumes(skip, pageSize.value, getFilterParam(), searchKeyword.value, startTime, endTime)
    const list = Array.isArray(res) ? res : (res?.items || res?.data || [])
    totalCount.value = res.total || list.length

    // Load parsed summaries for list mode (batch: first page resumes)
    const summaryMap = {}
    await Promise.all(list.slice(0, 20).map(async (r) => {
      try {
        const [educations, workExperiences, skills] = await Promise.all([
          resumeApi.getResumeEducations(r.id).catch(() => null),
          resumeApi.getResumeWorkExperiences(r.id).catch(() => null),
          resumeApi.getResumeSkills(r.id).catch(() => null),
        ])
        const eduList = Array.isArray(educations) ? educations : (educations?.data || [])
        const workList = Array.isArray(workExperiences) ? workExperiences : (workExperiences?.data || [])
        const skillList = Array.isArray(skills) ? skills : (skills?.data || [])
        summaryMap[r.id] = {
          education: eduList.map(e => e.school_name),
          workExperience: workList.map(w => `${w.company_name} ${w.position}`),
          skills: skillList.map(s => s.skill_name),
        }
      } catch (_) { /* ignore */ }
    }))
    list.forEach(r => {
      if (summaryMap[r.id]) {
        r.summary = summaryMap[r.id]
      }
    })

    resumes.value = list
    currentIndex.value = 0
    await loadCurrent()
    fetchTabCounts()

    // 后台预热简历缓存（服务器磁盘 + 浏览器内存）
    resumeApi.precacheResumes().catch(() => {})
    // 逐个后台下载第一页简历的 PDF 到浏览器内存缓存，点开详情时秒开
    precacheBrowserCache(list.slice(0, pageSize.value))
  } catch (e) {
    ElMessage.error('获取简历列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  currentPage.value = 1
  fetchResumes()
}

// 逐个后台下载 PDF 到浏览器内存缓存，不阻塞页面
function precacheBrowserCache(resumes) {
  let i = 0
  const next = () => {
    if (i >= resumes.length) return
    const r = resumes[i++]
    if (resumeApi.previewCache?.has(r.id)) { next(); return }
    resumeApi.previewResume(r.id).then(next).catch(next)
  }
  next()
}

function handlePageChange(page) {
  currentPage.value = page
  fetchResumes()
}

function revokeFileUrl() {
  if (fileUrl.value && fileUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(fileUrl.value)
  }
  fileUrl.value = ''
}

async function loadCurrent() {
  saveCurrentRemark()
  revokeFileUrl()

  const resume = currentResume.value
  if (!resume) {
    clearParsed()
    return
  }

  // 列表模式不需要 PDF 预览
  if (viewMode.value === 'detail') {
    // 通过 Axios 获取预览（走 Vite proxy，避免 HTTPS 自签名证书报错）
    previewLoading.value = true
    const currentId = resume.id
    try {
      const blob = await resumeApi.previewResume(resume.id)
      // 防止快速切换简历时旧请求覆盖新内容
      if (currentResume.value?.id !== currentId) return
      if (fileType.value === 'pdf') {
        fileUrl.value = URL.createObjectURL(
          new Blob([blob], { type: 'application/pdf' })
        )
      } else if (isImageType.value) {
        fileUrl.value = URL.createObjectURL(blob)
      }
    } catch (error) {
      if (currentResume.value?.id !== currentId) return
      console.error('预览加载失败:', error)
      fileUrl.value = ''
    } finally {
      if (currentResume.value?.id === currentId) {
        previewLoading.value = false
      }
    }
  }

  await fetchParsedData(resume.id)
}

function clearParsed() {
  Object.assign(parsedData, { educations: [], workExperiences: [], skills: [], projects: [] })
}

async function fetchTabCounts() {
  try {
    const { startTime, endTime } = formatTimeRange()
    const [all, nul, pass, pending, fail] = await Promise.all([
      resumeApi.getResumes(0, 1, null, '', startTime, endTime),
      resumeApi.getResumes(0, 1, 'null', '', startTime, endTime),
      resumeApi.getResumes(0, 1, 'PASS', '', startTime, endTime),
      resumeApi.getResumes(0, 1, 'PENDING', '', startTime, endTime),
      resumeApi.getResumes(0, 1, 'FAIL', '', startTime, endTime),
    ])
    tabCounts.all = all.total || (Array.isArray(all) ? all.length : 0)
    tabCounts.null = nul.total || (Array.isArray(nul) ? nul.length : 0)
    tabCounts.PASS = pass.total || (Array.isArray(pass) ? pass.length : 0)
    tabCounts.PENDING = pending.total || (Array.isArray(pending) ? pending.length : 0)
    tabCounts.FAIL = fail.total || (Array.isArray(fail) ? fail.length : 0)
  } catch (_) {}
}

async function fetchParsedData(resumeId) {
  detailLoading.value = true
  clearParsed()
  try {
    const [educations, workExperiences, skills, projects] = await Promise.all([
      resumeApi.getResumeEducations(resumeId).catch(() => null),
      resumeApi.getResumeWorkExperiences(resumeId).catch(() => null),
      resumeApi.getResumeSkills(resumeId).catch(() => null),
      resumeApi.getResumeProjects(resumeId).catch(() => null),
    ])
    parsedData.educations = Array.isArray(educations) ? educations : (educations?.data || [])
    parsedData.workExperiences = Array.isArray(workExperiences) ? workExperiences : (workExperiences?.data || [])
    parsedData.skills = Array.isArray(skills) ? skills : (skills?.data || [])
    parsedData.projects = Array.isArray(projects) ? projects : (projects?.data || [])
  } catch (e) {
    console.error('Failed to fetch parsed data:', e)
  } finally {
    detailLoading.value = false
  }
}

function switchFilter(key) {
  activeFilter.value = key
  fetchResumes()
}

function prev() {
  if (currentIndex.value > 0) { saveCurrentRemark(); currentIndex.value--; loadCurrent() }
}

function next() {
  if (currentIndex.value < resumes.value.length - 1) { saveCurrentRemark(); currentIndex.value++; loadCurrent() }
}

function goTo(index) {
  saveCurrentRemark()
  currentIndex.value = index
  loadCurrent()
}

// ---- 岗位选择 ----
async function fetchPositions() {
  positionLoading.value = true
  try {
    const res = await positionApi.list({ skip: 0, limit: 200 })
    positions.value = Array.isArray(res) ? res : (res?.items || res?.data || [])
  } catch (e) {
    console.error('获取岗位列表失败:', e)
  } finally {
    positionLoading.value = false
  }
}

async function handlePositionChange(positionId) {
  const resume = currentResume.value
  if (!resume) return
  try {
    await resumeApi.setResumePosition(resume.id, positionId || null)
    resume.position_id = positionId || null
    ElMessage.success(positionId ? '岗位设置成功' : '已清除岗位选择')
  } catch (e) {
    ElMessage.error('岗位设置失败')
  }
}

// ---- AI 审核 ----
function openAiReview() {
  const resume = currentResume.value
  if (!resume) return

  // 如有关联岗位，自动填充
  if (resume.position_id) {
    const pos = positions.value.find(p => p.id === resume.position_id)
    if (pos) {
      aiReviewForm.position = pos.name || ''
      const parts = []
      if (pos.description) parts.push(pos.description)
      if (pos.requirements) parts.push(pos.requirements)
      aiReviewForm.jd = parts.join('\n\n')
    } else {
      aiReviewForm.position = ''
      aiReviewForm.jd = ''
    }
  } else {
    aiReviewForm.position = ''
    aiReviewForm.jd = ''
  }
  aiReviewForm.custom_requirements = ''
  aiReviewForm.headcount = 1
  aiReviewResult.value = null
  aiReviewVisible.value = true
}

async function submitAiReview() {
  const resume = currentResume.value
  if (!resume) return
  aiReviewLoading.value = true
  try {
    const res = await resumeApi.aiReviewResume(resume.id, {
      position: aiReviewForm.position,
      jd: aiReviewForm.jd,
      custom_requirements: aiReviewForm.custom_requirements,
      headcount: aiReviewForm.headcount
    })
    aiReviewResult.value = res
  } catch (e) {
    ElMessage.error('AI 审核失败')
  } finally {
    aiReviewLoading.value = false
  }
}

function acceptAiReview() {
  const result = aiReviewResult.value
  if (!result?.suggestion) return
  // 将 AI 审核结果存入备注，提交审核时作为 comment
  remarkMap[currentResume.value.id] = JSON.stringify({
    type: 'ai_review',
    reason: result.reason || '',
    matched_points: result.matched_points || [],
    gaps: result.gaps || [],
    ai_generated_at: new Date().toISOString()
  })
  aiReviewVisible.value = false
  detailQuickReview(result.suggestion)
}

function resultTagClass(suggestion) {
  return ({ PASS: 'tag-green', PENDING: 'tag-orange', FAIL: 'tag-red' })[suggestion] || 'tag-gray'
}

function handleBatchPositionChange(positionId) {
  if (!positionId) {
    batchAiReviewForm.position = ''
    batchAiReviewForm.jd = ''
    return
  }
  const pos = positions.value.find(p => p.id === positionId)
  if (pos) {
    batchAiReviewForm.position = pos.name || ''
    const parts = []
    if (pos.description) parts.push(pos.description)
    if (pos.requirements) parts.push(pos.requirements)
    batchAiReviewForm.jd = parts.join('\n\n')
  }
}

function openBatchAiReview() {
  if (pendingReviewResumes.value.length === 0) {
    ElMessage.warning('当前没有待审核的简历')
    return
  }
  batchAiReviewForm.position = ''
  batchAiReviewForm.jd = ''
  batchAiReviewForm.custom_requirements = ''
  batchAiReviewForm.headcount = 1
  batchSelectedPositionId.value = null
  batchSelectedResumeIds.value = []
  batchAiReviewResults.value = []
  batchReviewProgress.value = 0
  batchAiReviewVisible.value = true
  fetchPositions()
}

function toggleBatchSelectAll(checked) {
  batchSelectedResumeIds.value = checked
    ? pendingReviewResumes.value.map(r => r.id)
    : []
}

function toggleBatchSelect(id) {
  const idx = batchSelectedResumeIds.value.indexOf(id)
  if (idx === -1) {
    batchSelectedResumeIds.value.push(id)
  } else {
    batchSelectedResumeIds.value.splice(idx, 1)
  }
}

async function startBatchAiReview() {
  if (batchSelectedResumeIds.value.length === 0) {
    ElMessage.warning('请先选择至少一份简历')
    return
  }
  batchAiReviewRunning.value = true
  batchAiReviewResults.value = []
  batchReviewProgress.value = 0

  const ids = [...batchSelectedResumeIds.value]
  const total = ids.length
  const results = []

  for (let idx = 0; idx < total; idx++) {
    const resumeId = ids[idx]
    try {
      const extra = batchAiReviewForm.custom_requirements || ''
      const res = await resumeApi.aiReviewResume(resumeId, {
        position: batchAiReviewForm.position || '',
        jd: batchAiReviewForm.jd || '',
        custom_requirements: extra,
        headcount: batchAiReviewForm.headcount || 1,
      })
      const resumeObj = pendingReviewResumes.value.find(r => r.id === resumeId)
      results.push({
        resume_id: resumeId,
        candidate_name: resumeObj?.candidate_name || '',
        result: res,
      })
    } catch (e) {
      results.push({
        resume_id: resumeId,
        candidate_name: pendingReviewResumes.value.find(r => r.id === resumeId)?.candidate_name || '',
        error: e?.detail || e?.message || '审核失败',
      })
    }
    batchAiReviewResults.value = [...results]
    batchReviewProgress.value = Math.round(((idx + 1) / total) * 100)
  }

  batchAiReviewRunning.value = false
  ElMessage.success(`批量 AI 审核完成，共处理 ${total} 份简历`)
  fetchResumes()
}

async function batchApplyReview(item, decision) {
  try {
    await resumeApi.reviewResume(item.resume_id, { decision, comment: '' })
    item._reviewed = true
    item._decision = decision
    // 更新本地 resumes 中的审核状态
    const idx = resumes.value.findIndex(r => r.id === item.resume_id)
    if (idx !== -1) {
      resumes.value[idx].review_status = decision
    }
    ElMessage.success({ PASS: '已通过', PENDING: '已标记为待定', FAIL: '已淘汰' }[decision])
  } catch (e) {
    ElMessage.error('审核操作失败，请重试')
  }
}

function createInterview(resume) {
  const params = new URLSearchParams({
    createInterview: '1',
    resumeId: resume.id,
    candidateName: resume.candidate_name
  })
  window.location.href = `/dashboard/interview-manage?${params.toString()}`
}

function openRemark() {
  const resume = currentResume.value
  if (resume) {
    remarkText.value = remarkMap[resume.id] || ''
  }
  remarkVisible.value = true
}

function saveCurrentRemark() {
  const resume = currentResume.value
  if (resume && remarkText.value) {
    remarkMap[resume.id] = remarkText.value
  }
}

async function detailQuickReview(decision) {
  const resume = currentResume.value
  if (!resume) return
  reviewing.value = true
  try {
    const comment = (remarkMap[resume.id] || '')
    await resumeApi.reviewResume(resume.id, { decision, comment })
    ElMessage.success({ PASS: '已通过', PENDING: '已标记为待定', FAIL: '已淘汰' }[decision])
    // 清空已审核简历的备注
    delete remarkMap[resume.id]
    resume.review_status = decision
    const idx = resumes.value.findIndex(r => r.id === resume.id)
    if (idx !== -1) {
      resumes.value[idx].review_status = decision
    }
    // 不再匹配当前筛选条件时，从列表中移出
    if (activeFilter.value !== 'all') {
      const filterParam = getFilterParam()
      const matches = filterParam === 'null'
        ? (!resume.review_status || resume.review_status === 'null')
        : resume.review_status === filterParam
      if (!matches) {
        saveCurrentRemark()
        removeCurrent()
      }
    }
    fetchTabCounts()
  } catch (e) {
    ElMessage.error('审核操作失败，请重试')
  } finally {
    reviewing.value = false
  }
}

async function quickReview(resume, decision) {
  reviewingId.value = resume.id
  try {
    await resumeApi.reviewResume(resume.id, { decision, comment: '' })
    ElMessage.success({ PASS: '已通过', PENDING: '已标记为待定', FAIL: '已淘汰' }[decision])
    resume.review_status = decision
    // 不再匹配当前筛选条件时，从列表中移出
    if (activeFilter.value !== 'all') {
      const filterParam = getFilterParam()
      const matches = filterParam === 'null'
        ? (!resume.review_status || resume.review_status === 'null')
        : resume.review_status === filterParam
      if (!matches) {
        resumes.value = resumes.value.filter(r => r.id !== resume.id)
      }
    }
    fetchTabCounts()
  } catch (e) {
    ElMessage.error('审核操作失败，请重试')
  } finally {
    reviewingId.value = null
  }
}

async function resetToUnreviewed() {
  const resume = currentResume.value
  if (!resume) return
  reviewing.value = true
  try {
    await resumeApi.unreviewResume(resume.id)
    ElMessage.success('已重置为待审核')
    resume.review_status = null
    const idx = resumes.value.findIndex(r => r.id === resume.id)
    if (idx !== -1) {
      resumes.value[idx].review_status = null
    }
    // 不在"全部"或"待审核"筛选下时移出列表
    if (activeFilter.value !== 'all' && activeFilter.value !== 'null') {
      saveCurrentRemark()
      removeCurrent()
    }
    fetchTabCounts()
  } catch (e) {
    ElMessage.error('重置失败，请重试')
  } finally {
    reviewing.value = false
  }
}

function removeCurrent() {
  const removedIndex = currentIndex.value
  resumes.value = resumes.value.filter((_, i) => i !== removedIndex)
  if (resumes.value.length === 0) {
    currentIndex.value = 0
    revokeFileUrl()
    clearParsed()
  } else if (removedIndex >= resumes.value.length) {
    currentIndex.value = resumes.value.length - 1
    loadCurrent()
  } else {
    loadCurrent()
  }
}

onMounted(() => fetchResumes())
onUnmounted(() => revokeFileUrl())
</script>

<style scoped lang="scss">
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.filter-tabs {
  display: flex;
  gap: 4px;
  background: #f5f6f7;
  border-radius: 8px;
  padding: 4px;

  .filter-tab {
    padding: 6px 16px;
    border-radius: 6px;
    font-size: 14px;
    color: #646a73;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
    &:hover { color: #3370ff; }
    &.active {
      background: #ffffff;
      color: #1f2329;
      font-weight: 500;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
    }
  }
}

.mode-toggle {
  :deep(.el-radio-button__inner) {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
  }
}

.progress-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 12px;
  .progress-dots {
    display: flex;
    gap: 6px;
    .dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #dee0e3; cursor: pointer; transition: all 0.2s;
      &.active { background: #3370ff; width: 24px; border-radius: 4px; }
      &.reviewed { background: #52c41a; }
    }
  }
  .progress-text { font-size: 13px; color: #8f959e; }
}

.review-area { margin-top: 12px; }

/* ====== List Mode ====== */
.list-table-wrapper {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.list-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #646a73;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.list-row {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.15s;
  cursor: default;
  &:hover { background: #f5f7ff; }
  &.even { background: #fafbfc; &:hover { background: #f5f7ff; } }
  &:last-child { border-bottom: none; }
}

.col-name {
  flex: 1.2;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  .row-avatar { background: #3370ff; flex-shrink: 0; }
  .row-name { font-size: 14px; font-weight: 500; color: #1f2329; }
}
.col-status { flex: 0.8; }
.col-time { flex: 0.8; color: #8f959e; font-size: 13px; }
.col-action { flex: 1.5; }

.row-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.row-action-btn {
  font-size: 12px !important;
  padding: 2px 8px !important;
  height: 26px !important;
  border-radius: 4px !important;
  min-width: 0 !important;

  &.pass {
    color: #52c41a !important;
    &:hover { background: #f0fff0 !important; }
  }
  &.pending {
    color: #faad14 !important;
    &:hover { background: #fff7e6 !important; }
  }
  &.fail {
    color: #ff4d4f !important;
    &:hover { background: #fff1f0 !important; }
  }
}

/* 岗位选择栏 */
.position-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}
.position-label {
  font-size: 13px;
  color: #646a73;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ====== Detail Mode ====== */
.split-panel {
  display: flex;
  gap: 16px;
  height: calc(100vh - 260px);
  min-height: 500px;
}

.left-panel {
  flex: 1;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .panel-header {
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
  }
  .candidate-info {
    display: flex;
    align-items: center;
    gap: 10px;
    .candidate-avatar { background: #3370ff; flex-shrink: 0; }
    .candidate-name { font-size: 15px; font-weight: 600; color: #1f2329; }
    .candidate-tags { display: flex; gap: 6px; margin-top: 4px; }
  }
}

.file-preview {
  flex: 1;
  background: #f5f6f7;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  .file-iframe { width: 100%; height: 100%; border: none; }
  .file-image { max-width: 100%; max-height: 100%; object-fit: contain; background: #ffffff; }
  .file-fallback { display: flex; flex-direction: column; align-items: center; gap: 12px; color: #8f959e; font-size: 14px; }
}

.preview-nav {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
  border-top: 1px solid #f0f0f0;
}

.right-panel {
  flex: 1;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  .panel-header {
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .panel-title { font-size: 14px; font-weight: 600; color: #1f2329; }
}

.parsed-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}

.detail-section { margin-bottom: 16px; &:last-child { margin-bottom: 0; } }

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #1f2329;
  margin-bottom: 6px;
  .el-icon { font-size: 15px; color: #3370ff; }
}

.detail-item {
  padding: 4px 0 4px 18px;
  border-left: 2px solid #eef2fe;
  margin-left: 4px;
  margin-bottom: 8px;
  .detail-main { font-size: 14px; font-weight: 500; color: #1f2329; }
  .detail-sub { font-size: 13px; color: #646a73; margin-top: 1px; }
  .detail-time { font-size: 12px; color: #8f959e; margin-top: 1px; }
  .detail-desc { font-size: 13px; color: #646a73; margin-top: 4px; line-height: 1.5; }
}

.skill-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-left: 4px;
  .skill-tag {
    padding: 2px 10px;
    background: #eef2fe;
    color: #3370ff;
    border-radius: 4px;
    font-size: 12px;
  }
}

.no-detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: #8f959e;
  font-size: 14px;
}

.action-bar {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid #f0f0f0;
}

.action-btn {
  min-width: 80px;
  height: 36px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 20px !important;
  display: flex;
  align-items: center;
  gap: 4px;
  .el-icon { font-size: 16px; }
  &.pass {
    &:not(:disabled) { background: #f0fff0; border-color: #52c41a; color: #52c41a;
      &:hover { background: #52c41a; color: #fff; } }
  }
  &.pending {
    &:not(:disabled) { background: #fff7e6; border-color: #faad14; color: #faad14;
      &:hover { background: #faad14; color: #fff; } }
  }
  &.fail {
    &:not(:disabled) { background: #fff1f0; border-color: #ff4d4f; color: #ff4d4f;
      &:hover { background: #ff4d4f; color: #fff; } }
  }
}

/* Review Dialog */
.review-dialog-body {
  .review-dialog-hint { font-size: 14px; color: #646a73; margin: 0 0 16px; line-height: 1.6; }
}

// Status tags
.tag-green { background: #e8f8e8 !important; color: #00a854 !important; }
.tag-orange { background: #fff3e0 !important; color: #f5a623 !important; }
.tag-red { background: #fce8e6 !important; color: #e53935 !important; }
.tag-info { background: #f0f0f0 !important; color: #8f959e !important; }
.tag-gray { background: #f5f6f7; color: #646a73; }

:deep(.lark-tag) {
  display: inline-block; padding: 2px 10px; border-radius: 4px;
  font-size: 12px; font-weight: 500;
}

.lark-btn-primary { background-color: #3370FF; border-color: #3370FF; color: white; border-radius: 6px; }
.lark-btn-primary:hover { background-color: #2458D9; }

/* AI 审核结果 */
.ai-review-result {
  padding: 0 4px;
}

/* 批量 AI 审核 */
.batch-review-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  font-size: 13px;
}
.batch-review-row.even {
  background: #f8f9fa;
}
.batch-review-index {
  color: #8f959e;
  font-weight: 500;
  min-width: 24px;
}
.batch-review-avatar {
  flex-shrink: 0;
}
.batch-review-name {
  flex: 1;
  color: #1f2329;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.batch-review-reason {
  color: #646a73;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}
.batch-review-result-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 12px;
  font-size: 13px;
}
.batch-review-result-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}
.batch-review-result-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* AI 审核意见摘要 */
.ai-review-summary {
  background: #f7f8fa;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
}
.ai-review-summary-header {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: #1f2329;
  margin-bottom: 6px;
  gap: 4px;
}
.ai-review-summary-body {
  font-size: 13px;
  color: #646a73;
  line-height: 1.5;
  white-space: pre-wrap;
}
</style>


<template>
  <div class="feishu-page">
    <div class="card-container">
      
      <!-- Header Area -->
      <div class="header-area">
        <div class="header-top">
          <div class="title-area">
            <h1>面试管理</h1>
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
            <el-button type="primary" class="lark-btn-primary" @click="interviewStore.openModal('online')">新增线上面试</el-button>
            <el-button class="lark-btn-ghost" @click="interviewStore.openModal('offline')">新增线下面试</el-button>
          </div>
        </div>
      </div>

      <!-- Main List Area -->
      <div class="list-area" v-loading="listLoading">
        <div class="list-header-row">
          <div class="col-check"><el-checkbox v-model="selectAllChecked" @change="handleSelectAll" /></div>
          <div class="col-candidate">候选人</div>
          <div class="col-time">预约面试时间</div>
          <div class="col-status">计划状态</div>
          <div class="col-type">会议类型</div>
          <div class="col-rounds">面试流程</div>
          <div class="col-action">操作</div>
        </div>

        <div class="toolbar-row" v-if="selectedIds.length > 0">
          <span class="selected-count">已选择 {{ selectedIds.length }} 项</span>
          <el-button type="danger" size="small" @click="handleBatchDelete">批量删除</el-button>
        </div>

        <div class="list-body">
          <el-empty
            v-if="interviewStore.interviews.length === 0 && !listLoading"
            description="暂无面试安排，请点击上方按钮创建"
            style="padding: 60px 0"
          />

          <div
            v-else
            class="list-row"
            :class="{ 'row-highlight': highlightId === item.id }"
            v-for="item in interviewStore.interviews"
            :key="item.id"
            :ref="el => { if (item.id === highlightId) highlightedEl = el }"
            @click="handleViewDetail(item.id)"
          >
            <div class="col-check" @click.stop><el-checkbox :value="item.id" v-model="selectedIds" /></div>
            <div class="col-candidate">
              <el-avatar :size="32" class="lark-avatar">{{ item.candidate_name?.charAt(0) || 'U' }}</el-avatar>
              <div class="candidate-detail">
                <span class="name-text">{{ item.candidate_name }}</span>
                <el-button
                  v-if="item.resume_id"
                  link
                  type="primary"
                  size="small"
                  class="preview-btn"
                  @click.stop="handlePreviewResume(item)"
                >
                  <el-icon><View /></el-icon>
                </el-button>
              </div>
            </div>
            
            <div class="col-time">
              <div class="time-range">
                <span class="main-time">{{ interviewStore.formatTime(item.scheduled_start_at) }}</span>
                <span class="time-sep">至</span>
                <span class="main-time">{{ interviewStore.formatTime(item.scheduled_end_at) }}</span>
              </div>
            </div>
            
            <div class="col-status" @click.stop>
              <el-dropdown
                @command="(val) => handleStatusChange(item, val)"
                trigger="click"
              >
                <span class="lark-tag pointer" :class="'tag-' + getStatusType(item.status)">
                  {{ getStatusLabel(item.status) }}
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="scheduled" :disabled="item.status === 'scheduled'">已预约</el-dropdown-item>
                    <el-dropdown-item command="ongoing" :disabled="item.status === 'ongoing'">进行中</el-dropdown-item>
                    <el-dropdown-item command="passed" divided :disabled="item.status === 'passed'">已通过</el-dropdown-item>
                    <el-dropdown-item command="failed" :disabled="item.status === 'failed'">不通过</el-dropdown-item>
                    <el-dropdown-item command="pending" :disabled="item.status === 'pending'">待定</el-dropdown-item>
                    <el-dropdown-item command="cancelled" divided :disabled="item.status === 'cancelled'">已取消</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>

            <div class="col-type">
              <span class="lark-tag" :class="item.session_type === 'online' ? 'tag-primary' : 'tag-gray'">
                {{ item.session_type === 'online' ? '线上面试' : '线下面试' }}
              </span>
            </div>

            <div class="col-rounds">
              <span v-if="item.status === 'cancelled'" class="text-placeholder" style="font-size: 12px;">已取消</span>
              <div v-else-if="roundsMap[item.id]?.length" class="round-flow">
                <template v-for="(rd, rIdx) in visibleRounds(item.id)" :key="rd.id">
                  <div
                    class="round-node"
                    :class="'round-' + rd.status"
                    @click.stop="handleRoundClick(item, rd)"
                  >
                    <div class="round-dot"></div>
                    <span class="round-label">{{ rd.round_name }}</span>
                    <span v-if="rIdx < visibleRounds(item.id).length - 1" class="round-connector"></span>
                  </div>
                </template>
                <el-tooltip
                  v-if="hiddenRounds(item.id).length > 0"
                  :content="hiddenRounds(item.id).map(r => r.round_name).join(' → ')"
                  placement="top"
                >
                  <span class="round-overflow-badge">+{{ hiddenRounds(item.id).length }}</span>
                </el-tooltip>
              </div>
              <span v-else class="text-placeholder" style="font-size: 12px;">无流程</span>
            </div>
            
            <div class="col-action">
              <el-button type="success" link size="small" v-if="item.session_id && item.status !== 'completed' && item.status !== 'cancelled'" @click.stop="handleStartASR(item)">启动 ASR</el-button>
              <el-button type="primary" link size="small" v-if="item.status === 'completed'" @click.stop="handleViewReport(item)">查看面试报告</el-button>
              <el-button type="primary" link size="small" v-if="item.status !== 'completed' && item.status !== 'cancelled'" @click.stop="interviewStore.editInterview(item)">编辑</el-button>
              <el-button type="danger" link size="small" @click.stop="handleDelete(item.id)">删除</el-button>
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

    <!-- 面试表单弹窗 -->
    <InterviewFormDialog
      v-model:visible="interviewStore.showModal"
      :is-edit-mode="interviewStore.isEditMode"
      :form="interviewStore.interviewForm"
      :resumes="approvedResumes"
      :knowledge-bases="knowledgeBases"
      :positions="positions"
      :all-interviews="interviewStore.interviews"
      @save="handleSave"
    />

    <!-- 面试详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="面试预约详细信息" width="550px" class="lark-dialog">
      <el-descriptions border :column="1" size="small" v-if="sessionDetail" class="lark-descriptions">
        <el-descriptions-item label="面试 ID">{{ sessionDetail.id }}</el-descriptions-item>
        <el-descriptions-item label="候选人">{{ sessionDetail.candidate_name }}</el-descriptions-item>
        <el-descriptions-item label="计划状态">
          <span class="lark-tag" :class="'tag-' + getStatusType(sessionDetail.status)">
            {{ getStatusLabel(sessionDetail.status) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="会议类型">
          <span class="lark-tag" :class="sessionDetail.session_type === 'online' ? 'tag-primary' : 'tag-gray'">
            {{ sessionDetail.session_type === 'online' ? '线上面试' : '线下面试' }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="预定时间">
          {{ interviewStore.formatTime(sessionDetail.scheduled_start_at) }} 至 {{ interviewStore.formatTime(sessionDetail.scheduled_end_at) }}
        </el-descriptions-item>
        <el-descriptions-item label="实际起止">
          <span :class="sessionDetail.started_at ? '' : 'text-placeholder'">
            {{ sessionDetail.started_at ? interviewStore.formatTime(sessionDetail.started_at) : '尚未开始' }}
          </span>
          <span class="mx-2">-</span>
          <span :class="sessionDetail.ended_at ? '' : 'text-placeholder'">
            {{ sessionDetail.ended_at ? interviewStore.formatTime(sessionDetail.ended_at) : '尚未结束' }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="面试备注">
          <div style="display: flex; gap: 8px; align-items: flex-start; width: 100%;">
            <el-input
              v-model="editableNotes"
              type="textarea"
              :rows="3"
              placeholder="请输入面试备注..."
              style="flex: 1;"
            />
            <el-button
              type="primary"
              size="small"
              :loading="notesSaving"
              :disabled="editableNotes === sessionDetail?.notes"
              @click="handleSaveNotes"
            >保存</el-button>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="招聘官 ID">{{ sessionDetail.recruiter_id }}</el-descriptions-item>
        <el-descriptions-item label="关联简历 ID">{{ sessionDetail.resume_id || '无' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ interviewStore.formatTime(sessionDetail.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="最后更新">{{ interviewStore.formatTime(sessionDetail.updated_at) }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" class="lark-btn-primary" @click="detailDialogVisible = false">关闭预览</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 面试轮次详情弹窗 -->
    <el-dialog v-model="roundDialogVisible" :title="'轮次详情 - ' + (currentRound?.round_name || '')" width="480px" class="lark-dialog">
      <el-descriptions border :column="1" size="small" v-if="currentRound" class="lark-descriptions">
        <el-descriptions-item label="轮次名称">{{ currentRound.round_name }}</el-descriptions-item>
        <el-descriptions-item label="轮次类型">{{ roundTypeLabel(currentRound.round_type) }}</el-descriptions-item>
        <el-descriptions-item label="轮次序号">第 {{ currentRound.round_number }} 轮</el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <span class="lark-tag" :class="'round-tag-' + currentRound.status">
            {{ roundStatusLabel(currentRound.status) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="评分">{{ currentRound.score ?? '未评分' }}</el-descriptions-item>
        <el-descriptions-item label="评价">{{ currentRound.comment || '暂无评价' }}</el-descriptions-item>
        <el-descriptions-item label="评估时间">{{ currentRound.evaluated_at ? interviewStore.formatTime(currentRound.evaluated_at) : '尚未评估' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <div class="dialog-footer" style="gap: 8px;">
          <el-button type="primary" v-if="canStartCurrentRound() && currentSessionForRound?.status !== 'cancelled'" @click="handleCreateSession(currentSessionForRound)">
            开始面试
          </el-button>
          <el-button type="success" v-if="!canStartCurrentRound() && currentSessionForRound && currentSessionForRound.session_id && currentSessionForRound.status !== 'completed' && currentSessionForRound.status !== 'cancelled'" @click="handleStartASR(currentSessionForRound)">
            启动 ASR
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 面试评估弹窗 -->
    <el-dialog v-model="evaluationDialogVisible" title="面试评估" width="480px" class="lark-dialog">
      <el-form :model="evaluationForm" label-width="80px" v-if="currentRound">
        <el-form-item label="轮次">
          <span>{{ currentRound.round_name }}</span>
        </el-form-item>
        <el-form-item label="评估结果">
          <el-radio-group v-model="evaluationForm.status">
            <el-radio value="pass">通过</el-radio>
            <el-radio value="fail">未通过</el-radio>
            <el-radio value="skip">跳过</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="评分">
          <el-input-number v-model="evaluationForm.score" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="评价">
          <el-input v-model="evaluationForm.comment" type="textarea" :rows="3" placeholder="请输入评价内容..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer" style="gap: 8px;">
          <el-button type="primary" @click="submitEvaluation">提交评估</el-button>
          <el-button @click="evaluationDialogVisible = false">取消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 简历预览弹窗 -->
    <el-dialog v-model="previewDialogVisible" title="简历预览" width="800px" class="lark-dialog">
      <div v-loading="previewLoading" style="min-height: 400px;">
        <iframe
          v-if="previewUrl"
          :src="previewUrl"
          style="width: 100%; height: 70vh; border: none; border-radius: 4px;"
        />
        <el-empty v-else-if="!previewLoading" description="暂无简历" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import { Search, ArrowDown, View } from '@element-plus/icons-vue'
import { getCurrentUser } from '../../services/authService'
import { interviewApi } from '../../api/interview'
import { resumeApi } from '../../api/resume'
import { knowledgeApi } from '../../api/knowledge'
import { positionApi } from '../../api/position'
import { useInterviewStore } from '../../stores/interviewStore'
import { useResumeStore } from '../../stores/resumeStore'
import InterviewFormDialog from '../../components/InterviewFormDialog.vue'

const interviewStore = useInterviewStore()
const resumeStore = useResumeStore()
const currentUser = ref(getCurrentUser() || { id: 1, username: '管理员' })
const router = useRouter()
const route = useRoute()
const listLoading = ref(false)
const knowledgeBases = ref([])
const positions = ref([])
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)
const highlightId = ref(null)
const highlightedEl = ref(null)

// 批量删除
const selectedIds = ref([])
const selectAllChecked = computed({
  get: () => interviewStore.interviews.length > 0 && selectedIds.value.length === interviewStore.interviews.length,
  set: () => {}
})
const handleSelectAll = (checked) => {
  selectedIds.value = checked ? interviewStore.interviews.map(i => i.id) : []
}

const handleBatchDelete = () => {
  if (selectedIds.value.length === 0) return
  ElMessageBox.confirm(
    `确定要批量删除选中的 ${selectedIds.value.length} 条面试记录吗？删除后将无法恢复。`,
    '批量删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    const loading = ElLoading.service({ lock: true, text: `正在删除 ${selectedIds.value.length} 条记录...` })
    try {
      await Promise.all(selectedIds.value.map(id => interviewApi.deleteReserveSession(id)))
      ElMessage.success(`成功删除 ${selectedIds.value.length} 条面试记录`)
      selectedIds.value = []
      fetchInterviews()
    } catch (err) {
      ElMessage.error('批量删除失败: ' + (err?.detail || err?.message || '网络连接异常'))
    } finally {
      loading.close()
    }
  }).catch(() => {})
}

// 轮次状态管理
const roundsMap = reactive({})
const roundDialogVisible = ref(false)
const currentRound = ref(null)
const currentSessionForRound = ref(null)

// 面试评估弹窗
const evaluationDialogVisible = ref(false)
const evaluationForm = reactive({
  status: 'pass',
  score: null,
  comment: ''
})

const openEvaluationDialog = () => {
  evaluationForm.status = currentRound.value?.status === 'pass' ? 'pass' : (currentRound.value?.status === 'fail' ? 'fail' : 'pass')
  evaluationForm.score = currentRound.value?.score || null
  evaluationForm.comment = currentRound.value?.comment || ''
  evaluationDialogVisible.value = true
}

const submitEvaluation = async () => {
  if (!currentRound.value || !currentSessionForRound.value) return
  const loading = ElLoading.service({ lock: true, text: '提交评估...' })
  try {
    const updated = await interviewApi.updateSessionRound(
      currentSessionForRound.value.id,
      currentRound.value.id,
      {
        status: evaluationForm.status,
        score: evaluationForm.score,
        comment: evaluationForm.comment
      }
    )
    // 更新本地轮次数据
    const rounds = roundsMap[currentSessionForRound.value.id]
    if (rounds) {
      const idx = rounds.findIndex(r => r.id === currentRound.value.id)
      if (idx !== -1) {
        rounds[idx] = updated
        currentRound.value = { ...updated }
      }
    }
    ElMessage.success('评估提交成功！')
    evaluationDialogVisible.value = false
    fetchInterviews() // 刷新面试列表以更新计划状态
  } catch (error) {
    ElMessage.error('评估提交失败: ' + (error?.detail || error?.message || '未知错误'))
  } finally {
    loading.close()
  }
}

const getStatusLabel = (status) => {
  const map = {
    'scheduled': '已预约',
    'ongoing': '进行中',
    'completed': '已完成',
    'cancelled': '已取消',
    'expired': '已过期',
    'passed': '已通过',
    'failed': '不通过',
    'pending': '待定'
  }
  return map[status] || status
}

const getStatusType = (status) => {
  const map = {
    'scheduled': 'warning',
    'ongoing': 'success',
    'completed': 'info',
    'cancelled': 'danger',
    'expired': 'danger',
    'passed': 'success',
    'failed': 'danger',
    'pending': 'warning'
  }
  return map[status] || 'info'
}

// 轮次相关函数
const roundTypeLabel = (type) => {
  const map = {
    'TECHNICAL': '技术面',
    'HR': 'HR面',
    'MANAGER': '主管面',
    'BEHAVIORAL': '行为面',
    'WRITTEN': '笔试',
    'GROUP': '群面'
  }
  return map[type] || type
}

const roundStatusLabel = (status) => {
  const map = {
    'pending': '待面试',
    'pass': '通过',
    'fail': '未通过',
    'skip': '已跳过',
    'completed': '已完成'
  }
  return map[status] || status
}

const handleRoundClick = (session, round) => {
  currentSessionForRound.value = session
  currentRound.value = { ...round }
  roundDialogVisible.value = true
}

const canStartCurrentRound = () => {
  if (!currentRound.value || !currentSessionForRound.value) return false
  if (currentRound.value.status !== 'pending') return false

  const rounds = roundsMap[currentSessionForRound.value.id]
  if (!rounds || rounds.length === 0) return false

  const currentIdx = rounds.findIndex(r => r.id === currentRound.value.id)
  if (currentIdx === -1) return false

  // 第一轮始终可以开始（pending状态下）
  if (currentIdx === 0) return true

  // 检查前一轮状态，前一轮通过、跳过或已完成（ASR停止）即可开始当前轮
  const prevRound = rounds[currentIdx - 1]
  return prevRound.status === 'pass' || prevRound.status === 'skip' || prevRound.status === 'completed'
}

const MAX_VISIBLE_ROUNDS = 3

const visibleRounds = (sessionId) => {
  const rounds = roundsMap[sessionId] || []
  return rounds.slice(0, MAX_VISIBLE_ROUNDS)
}

const hiddenRounds = (sessionId) => {
  const rounds = roundsMap[sessionId] || []
  return rounds.slice(MAX_VISIBLE_ROUNDS)
}

const handleUpdateRound = async (status) => {
  if (!currentRound.value || !currentSessionForRound.value) return
  const loading = ElLoading.service({ lock: true, text: '更新轮次状态...' })
  try {
    const updated = await interviewApi.updateSessionRound(
      currentSessionForRound.value.id,
      currentRound.value.id,
      { status }
    )
    // 更新本地数据
    const rounds = roundsMap[currentSessionForRound.value.id]
    if (rounds) {
      const idx = rounds.findIndex(r => r.id === currentRound.value.id)
      if (idx !== -1) {
        rounds[idx] = updated
        currentRound.value = { ...updated }
      }
    }
    ElMessage.success('轮次状态更新成功！')
  } catch (error) {
    ElMessage.error('更新失败: ' + (error?.detail || error?.message || '未知错误'))
  } finally {
    loading.close()
  }
}

const fetchInterviews = async () => {
  listLoading.value = true
  try {
    const skip = (currentPage.value - 1) * pageSize.value
    const params = { skip, limit: pageSize.value }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    const data = await interviewApi.getUserInterviewSessions(params)
    let list = Array.isArray(data) ? data : (data.items || data.data || [])
    totalCount.value = data.total || list.length

    interviewStore.interviews = list

    // 并行获取并同步所有有关联岗位的面试轮次（与岗位最新设置对齐）
    const roundPromises = list
      .filter(item => item.position_id)
      .map(item =>
        interviewApi.syncSessionRounds(item.id).then(rounds => {
          roundsMap[item.id] = Array.isArray(rounds) ? rounds : (rounds?.data || [])
        }).catch(() => {
          // 同步失败时回退到普通获取
          interviewApi.getSessionRounds(item.id).then(rounds => {
            roundsMap[item.id] = Array.isArray(rounds) ? rounds : (rounds?.data || [])
          }).catch(() => {
            roundsMap[item.id] = []
          })
        })
      )
    await Promise.all(roundPromises)
  } catch (error) {
    ElMessage.error('获取面试列表失败: ' + (error?.detail || error?.message || '未知错误'))
  } finally {
    listLoading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchInterviews()
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchInterviews()
}

const fetchResumesSilent = async () => {
  try {
    const data = await resumeApi.getResumes()
    const list = Array.isArray(data) ? data : (data.items || data.data || [])
    resumeStore.setResumes(list)
  } catch (e) {
    console.warn('获取关联简历数据失败', e)
  }
}

// 仅显示已通过的简历
const approvedResumes = computed(() => {
  return resumeStore.resumes.filter(r => r.review_status === 'PASS')
})

const fetchKnowledgeBasesSilent = async () => {
  try {
    const data = await knowledgeApi.getCollections()
    knowledgeBases.value = Array.isArray(data) ? data : (data.items || data.data || [])
  } catch (e) {
    console.warn('获取关联知识库数据失败', e)
  }
}

const fetchPositionsSilent = async () => {
  try {
    const data = await positionApi.list()
    positions.value = Array.isArray(data) ? data : (data.items || data.data || [])
  } catch (e) {
    console.warn('获取岗位列表失败', e)
  }
}

onMounted(async () => {
  fetchInterviews()
  fetchResumesSilent()
  fetchKnowledgeBasesSilent()
  fetchPositionsSilent()

  // 从简历审核页跳转过来时，自动打开新增弹窗并预填数据
  if (route.query.createInterview === '1' && route.query.resumeId) {
    const type = route.query.sessionType || 'online'
    interviewStore.openModal(type)
    interviewStore.interviewForm.resume_id = parseInt(route.query.resumeId)
    if (route.query.candidateName) {
      interviewStore.interviewForm.candidate_name = route.query.candidateName
    }
  }

  // 从首页点击跳转时，高亮对应行
  if (route.query.highlight) {
    highlightId.value = Number(route.query.highlight)
    await nextTick()
    await nextTick() // 确保列表已渲染
    if (highlightedEl.value) {
      highlightedEl.value.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // 3 秒后移除高亮
      setTimeout(() => { highlightId.value = null }, 3000)
    }
  }
})

const handleSave = async () => {
  const form = interviewStore.interviewForm
  if (!form.candidate_name) {
    ElMessage.warning('请填写候选人姓名')
    return
  }
  if (!form.position_id) {
    ElMessage.warning('未选择岗位无法约面')
    return
  }
  if (!form.scheduled_start_at || !form.scheduled_end_at) {
    ElMessage.warning('请选择完整的面试起止时间')
    return
  }

  const now = new Date()
  // 替换横杠兼容特定浏览器 Date 解析
  const startTime = new Date(form.scheduled_start_at.replace(/-/g, '/'))
  const endTime = new Date(form.scheduled_end_at.replace(/-/g, '/'))

  if (startTime <= now) {
    ElMessage.warning('面试开始时间必须在当前系统时间之后')
    return
  }
  
  if (endTime <= startTime) {
    ElMessage.warning('面试结束时间必须晚于面试开始时间')
    return
  }

  const loading = ElLoading.service({ lock: true, text: interviewStore.isEditMode ? '提交修改中...' : '提交新建中...' })
  try {
    if (interviewStore.isEditMode) {
      // 编辑接口专属精简载荷
      const editPayload = {
        candidate_name: form.candidate_name,
        resume_id: form.resume_id || 0,
        position_id: form.position_id || null,
        knowledge_id: form.knowledge_id || 0,
        session_type: form.session_type || 'online',
        scheduled_start_at: form.scheduled_start_at,
        scheduled_end_at: form.scheduled_end_at,
        notes: form.notes || ''
      }
      // 已过期的面试更新预约时间后自动恢复为已预约
      if (form.status === 'expired') {
        editPayload.status = 'scheduled'
      }
      await interviewApi.updateReserveSession(form.id, editPayload)
      ElMessage.success('面试安排修改成功！')
    } else {
      // 新建接口载荷（含 recruiter_id）
      const createPayload = {
        candidate_name: form.candidate_name,
        recruiter_id: currentUser.value.id,
        resume_id: form.resume_id || 0,
        position_id: form.position_id || null,
        knowledge_id: form.knowledge_id || 0,
        session_type: form.session_type || 'online',
        scheduled_start_at: form.scheduled_start_at,
        scheduled_end_at: form.scheduled_end_at,
        notes: form.notes || ''
      }
      await interviewApi.reserveSession(createPayload)
      ElMessage.success('面试安排预定成功！')
    }
    
    interviewStore.showModal = false
    fetchInterviews() // 无论增改，重新拉取列表同步最新后台视图
  } catch (error) {
    if (Array.isArray(error?.detail)) {
        const msgs = error.detail.map(e => e.msg).join('; ')
        ElMessage.error(`创建失败: ${msgs}`)
    } else {
        ElMessage.error('创建面试失败: ' + (error?.detail || error?.message || '未知异常'))
    }
  } finally {
    loading.close()
  }
}

const detailDialogVisible = ref(false)
const sessionDetail = ref(null)
const editableNotes = ref('')
const notesSaving = ref(false)

const handleSaveNotes = async () => {
  if (!sessionDetail.value) return
  notesSaving.value = true
  try {
    const updated = await interviewApi.updateSessionNotes(sessionDetail.value.id, { notes: editableNotes.value })
    sessionDetail.value = updated
    ElMessage.success('备注保存成功')
    fetchInterviews()
  } catch (error) {
    ElMessage.error('备注保存失败: ' + (error?.detail || error?.message || '未知错误'))
  } finally {
    notesSaving.value = false
  }
}

const handleViewDetail = async (id) => {
  const loading = ElLoading.service({ lock: true, text: '正在拉取预约详情...' })
  try {
    const res = await interviewApi.getReserveSession(id)
    sessionDetail.value = res
    editableNotes.value = res.notes || ''
    detailDialogVisible.value = true
  } catch (err) {
    ElMessage.error('获取详情失败: ' + (err?.detail || err?.message || '网络错误'))
  } finally {
    loading.close()
  }
}

// 简历预览
const previewDialogVisible = ref(false)
const previewLoading = ref(false)
const previewUrl = ref('')

const handlePreviewResume = async (item) => {
  if (!item.resume_id) return
  previewDialogVisible.value = true
  previewLoading.value = true
  previewUrl.value = ''
  try {
    const token = localStorage.getItem('token')
    // 直接使用后端预览 URL，浏览器 HTTP 缓存自动处理内容缓存
    previewUrl.value = `/api/resumes/preview/${item.resume_id}?token=${token}`
  } catch (error) {
    ElMessage.error('简历预览加载失败')
    previewDialogVisible.value = false
  } finally {
    previewLoading.value = false
  }
}

const handleDelete = (id) => {
  ElMessageBox.confirm(
    '是否确定要永久删除该面试记录？删除后将无法恢复。',
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    const loading = ElLoading.service({ lock: true, text: '正在进行数据销毁...' })
    try {
      await interviewApi.deleteReserveSession(id)
      ElMessage.success('面试安排删除成功！')
      fetchInterviews()
    } catch (err) {
      ElMessage.error('无法删除此面试安排: ' + (err?.detail || err?.message || '网络连接异常'))
    } finally {
      loading.close()
    }
  }).catch(() => {})
}

const handleCancel = (item) => {
  ElMessageBox.confirm(
    `确定要取消「${item.candidate_name}」的面试安排吗？`,
    '取消面试确认',
    {
      confirmButtonText: '确定取消',
      cancelButtonText: '暂不',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await interviewApi.updateReserveSession(item.id, { status: 'cancelled' })
      ElMessage.success('已取消面试安排')
      fetchInterviews()
    } catch (err) {
      ElMessage.error('取消失败: ' + (err?.detail || err?.message || '网络连接异常'))
    }
  }).catch(() => {})
}

const handleStatusChange = async (item, newStatus) => {
  if (item.status === newStatus) return
  try {
    await interviewApi.updateReserveSession(item.id, { status: newStatus })
    ElMessage.success('状态已更新')
    fetchInterviews()
  } catch (err) {
    ElMessage.error('状态更新失败: ' + (err?.detail || err?.message || '网络连接异常'))
  }
}

const handleCreateSession = (session) => {
  const roundId = currentRound.value?.id
  if (!roundId) {
    ElMessage.warning('未选中面试轮次')
    return
  }
  router.push(`/interview-assistant/${session.id}/${roundId}`)
}

const handleStartASR = (item) => {
  if (!item.session_id) {
    ElMessage.warning('请先创建面试会话')
    return
  }
  // 取第一个轮次的ID作为默认轮次
  const rounds = roundsMap[item.id]
  const roundId = rounds?.[0]?.id
  if (!roundId) {
    ElMessage.warning('该面试尚无面试轮次，请先设置面试流程')
    return
  }
  router.push(`/interview/${item.session_id}/${roundId}`)
}

const handleViewReport = (item) => {
  // 跳转到报告生成页面，传递 session_id
  router.push(`/dashboard/report-generate?session_id=${item.id}`)
}

const handleSyncRounds = async (sessionId) => {
  const loading = ElLoading.service({ lock: true, text: '同步面试流程...' })
  try {
    const rounds = await interviewApi.syncSessionRounds(sessionId)
    roundsMap[sessionId] = Array.isArray(rounds) ? rounds : (rounds?.data || [])
    ElMessage.success('面试流程同步成功！')
    // 更新当前弹窗中的轮次数据
    if (currentSessionForRound.value && currentSessionForRound.value.id === sessionId) {
      const updated = roundsMap[sessionId].find(r => r.id === currentRound.value?.id)
      if (updated) currentRound.value = { ...updated }
    }
  } catch (error) {
    ElMessage.error('同步失败: ' + (error?.detail || error?.message || '未知错误'))
  } finally {
    loading.close()
  }
}
</script>

<style scoped lang="scss">
/* 核心设计令牌 (Lark Design Tokens) */
.feishu-page {
  background-color: #F5F6F7;
  padding: 16px 24px;
  min-height: calc(100vh - 60px);
  font-family: "Lark Sans", "Lark Unicode", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
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

.action-btn-group {
  display: flex;
  gap: 12px;
}

/* 批量删除工具栏 */
.toolbar-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 24px;
  background: #FFF4E5;
  border-bottom: 1px solid #FFE0B2;
}
.selected-count {
  font-size: 13px;
  color: #FF8800;
  font-weight: 500;
}

/* 按钮规范 */
.lark-btn-primary {
  background-color: #3370FF;
  border-color: #3370FF;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.2s;
  &:hover { background-color: #2458D9; border-color: #2458D9; }
}

.lark-btn-ghost {
  border: 1px solid #DEE1E5;
  color: #1F2329;
  background: transparent;
  border-radius: 4px;
  font-weight: 500;
  &:hover { background: #F5F6F7; color: #3370FF; border-color: #3370FF; }
}

/* 列表渲染 */
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
  position: relative;
}

.list-body {
  flex: 1;
}

.list-row {
  display: flex;
  align-items: center;
  padding: 0 24px;
  height: 72px;
  border-bottom: 1px solid #F5F6F7;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
  &:hover { background-color: #F0F4FF; }
  &.row-highlight {
    background-color: #E8F4FF;
    box-shadow: inset 3px 0 0 #3370FF;
  }
}

.pointer { cursor: pointer; }

/* 列定义 */
.col-check { width: 40px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.col-candidate { flex: 1.5; min-width: 180px; display: flex; align-items: center; }
.col-time { flex: 1.5; min-width: 240px; display: flex; align-items: center; }
.col-status { flex: 1; min-width: 100px; display: flex; align-items: center; }
.col-type { flex: 1; min-width: 110px; display: flex; align-items: center; }
.col-action { position: absolute; right: 24px; display: flex; gap: 4px; align-items: center; }

/* 候选人信息 */
.candidate-detail {
  margin-left: 12px;
  display: flex;
  flex-direction: column;
}

.name-text {
  font-size: 14px;
  font-weight: 500;
  color: #1F2329;
  letter-spacing: -0.2px;
}

.resume-id {
  font-size: 12px;
  color: #8F959E;
  margin-top: 2px;
}

.preview-btn {
  margin-left: 4px;
  padding: 0 4px;
  font-size: 14px;
}

.lark-avatar {
  background-color: #3370FF;
  color: #FFF;
  font-weight: 600;
}

/* 时间显示 */
.time-range {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1F2329;
  font-size: 13px;
}

.main-time {
  background: #F5F6F7;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 400;
  letter-spacing: 0.2px;
}

.time-sep {
  color: #8F959E;
}

/* 面试流程列 */
.col-rounds { flex: 2; min-width: 220px; display: flex; align-items: center; }

.round-flow {
  display: flex;
  align-items: center;
  gap: 0;
  flex-wrap: nowrap;
}

.round-node {
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
}

.round-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.round-node:hover .round-dot {
  transform: scale(1.3);
}

.round-node:hover .round-label {
  color: #3370ff;
}

.round-label {
  font-size: 11px;
  margin-left: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
  color: #646A73;
  font-weight: 500;
}

.round-connector {
  width: 20px;
  height: 2px;
  background: #DEE0E3;
  margin: 0 4px;
  flex-shrink: 0;
}

/* 轮次状态颜色 */
.round-pending .round-dot { background: #DEE0E3; }
.round-pass .round-dot { background: #13A248; }
.round-pass .round-label { color: #13A248; }
.round-fail .round-dot { background: #F53F3F; }
.round-fail .round-label { color: #F53F3F; }
.round-skip .round-dot { background: #8F959E; }
.round-skip .round-label { color: #8F959E; }

.round-overflow-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 11px;
  background: #F0F1F5;
  color: #646A73;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  margin-left: 6px;
  flex-shrink: 0;
  transition: all 0.2s;
  &:hover { background: #E1EAFF; color: #3370FF; }
}

/* 轮次状态标签 */
.round-tag-pending { background: #F0F1F5; color: #646A73; }
.round-tag-pass { background: #E4F7EB; color: #13A248; }
.round-tag-fail { background: #FFE4E2; color: #F53F3F; }
.round-tag-skip { background: #F0F1F5; color: #8F959E; }

/* 标签域 (浅色背景 + 深色文字) */
.lark-tag {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.tag-primary { background: #E1EAFF; color: #3370FF; }
.tag-warning { background: #FFF4E5; color: #FF8800; }
.tag-success { background: #E4F7EB; color: #13A248; }
.tag-danger  { background: #FFE4E2; color: #F53F3F; }
.tag-info    { background: #F0F1F5; color: #646A73; }
.tag-gray    { background: #F5F6F7; color: #646A73; }

/* 弹窗与描述 */
.lark-dialog {
  :deep(.el-dialog__header) {
    padding: 20px 24px;
    margin-right: 0;
    border-bottom: 1px solid #DEE1E5;
    .el-dialog__title { font-size: 16px; font-weight: 600; color: #1F2329; }
  }
  :deep(.el-dialog__body) { padding: 24px; }
  :deep(.el-dialog__footer) { padding: 12px 24px 20px; border-top: 1px solid #DEE1E5; }
}

.lark-descriptions {
  :deep(.el-descriptions__label) {
    background-color: #F5F6F7 !important;
    color: #646A73;
    font-weight: 500;
    width: 120px;
  }
  :deep(.el-descriptions__content) {
    color: #1F2329;
  }
}

.text-placeholder {
  color: #8F959E;
  font-style: italic;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.mx-2 { margin: 0 8px; }
</style>

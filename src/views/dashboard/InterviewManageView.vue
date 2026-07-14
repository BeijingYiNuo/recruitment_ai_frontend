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
            <el-button type="primary" class="lark-btn-primary" @click="handleOpenModal('online')">新增线上面试</el-button>
            <el-button class="lark-btn-ghost" @click="handleOpenModal('offline')">新增线下面试</el-button>
          </div>
        </div>
      </div>

      <!-- Main List Area -->
      <div class="list-area" v-loading="listLoading">
        <div class="list-header-row">
          <div class="col-check"><el-checkbox v-model="selectAllChecked" @change="handleSelectAll" /></div>
          <div class="col-candidate">候选人</div>
          <div class="col-time">预约面试时间</div>
          <div class="col-status">面试状态</div>
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
              <span class="lark-tag" :class="'tag-' + sessionStatusType(item)">
                {{ sessionStatusLabel(item) }}
              </span>
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
                  <el-popover
                    placement="bottom"
                    :width="200"
                    :visible="popoverVisible[item.id + '-' + rd.id]"
                    trigger="manual"
                  >
                    <template #reference>
                      <div
                        class="round-node"
                        :class="'round-' + roundDisplayStatus(item, rd)"
                        @click.stop="toggleRoundPopover(item.id, rd.id)"
                      >
                        <div class="round-dot"></div>
                        <span class="round-label">{{ rd.round_name }}</span>
                      </div>
                    </template>
                    <div class="round-popover-actions">
                      <el-button
                        size="small"
                        type="success"
                        :plain="rd.status !== 'pass'"
                        :disabled="rd.status === 'pass' || isRoundLocked(rd, roundsMap[item.id]) || item.status === 'expired'"
                        @click.stop="handleRoundStatusChange(item, rd, 'pass')"
                      >通过</el-button>
                      <el-button
                        size="small"
                        type="danger"
                        :plain="rd.status !== 'fail'"
                        :disabled="rd.status === 'fail' || isRoundLocked(rd, roundsMap[item.id]) || item.status === 'expired'"
                        @click.stop="handleRoundStatusChange(item, rd, 'fail')"
                      >淘汰</el-button>
                      <el-button
                        size="small"
                        type="warning"
                        :plain="rd.status !== 'pending_review'"
                        :disabled="rd.status === 'pending_review' || isRoundLocked(rd, roundsMap[item.id]) || item.status === 'expired'"
                        @click.stop="handleRoundStatusChange(item, rd, 'pending_review')"
                      >待定</el-button>
                    </div>
                  </el-popover>
                  <span v-if="rIdx < visibleRounds(item.id).length - 1" class="round-connector"></span>
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
              <el-button type="primary" link size="small" v-if="getFirstStartableRound(item.id)" @click.stop="handleStartInterview(item)">开始面试</el-button>
              <el-button type="success" link size="small" v-if="item.session_id && item.status !== 'completed' && item.status !== 'cancelled'" @click.stop="handleStartASR(item)">启动 ASR</el-button>
              <el-button type="primary" link size="small" v-if="item.status === 'completed'" @click.stop="handleViewReport(item)">查看面试报告</el-button>
              <el-button type="primary" link size="small" v-if="item.status === 'scheduled' || item.status === 'cancelled'" @click.stop="interviewStore.editInterview(item)">编辑</el-button>
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
      :search-resumes="searchAllResumes"
      @save="handleSave"
    />

    <!-- 面试详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="面试预约详细信息" width="550px" class="lark-dialog">
      <el-descriptions border :column="1" size="small" v-if="sessionDetail" class="lark-descriptions">
        <el-descriptions-item label="面试 ID">{{ sessionDetail.id }}</el-descriptions-item>
        <el-descriptions-item label="候选人">{{ sessionDetail.candidate_name }}</el-descriptions-item>
        <el-descriptions-item label="面试状态">
          <span class="lark-tag" :class="'tag-' + sessionStatusType(sessionDetail)">
            {{ sessionStatusLabel(sessionDetail) }}
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
          <el-button type="success" v-if="!canStartCurrentRound() && currentSessionForRound && currentSessionForRound.session_id && currentSessionForRound.status !== 'completed' && currentSessionForRound.status !== 'cancelled' && currentSessionForRound.status !== 'expired'" @click="handleStartASR(currentSessionForRound)">
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
            <el-radio value="pending_review">待定</el-radio>
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
      <div v-loading="previewLoading" style="min-height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <img v-if="previewUrl" :src="previewUrl" style="max-width: 100%; max-height: 65vh; object-fit: contain; box-shadow: 0 2px 8px rgba(0,0,0,0.15);" alt="简历预览" />
        <div v-if="previewUrl && pdfPreviewPageCount > 1" style="display: flex; align-items: center; gap: 12px; margin-top: 12px;">
          <el-button size="small" :disabled="pdfPreviewPage <= 1" @click="goToPdfPreviewPage(pdfPreviewPage - 1)">上一页</el-button>
          <span style="font-size: 13px; color: #646A73;">{{ pdfPreviewPage }} / {{ pdfPreviewPageCount }}</span>
          <el-button size="small" :disabled="pdfPreviewPage >= pdfPreviewPageCount" @click="goToPdfPreviewPage(pdfPreviewPage + 1)">下一页</el-button>
        </div>
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
import { Search, View } from '@element-plus/icons-vue'
import { getCurrentUser } from '../../services/authService'
import { interviewApi } from '../../api/interview'
import { resumeApi } from '../../api/resume'
import { knowledgeApi } from '../../api/knowledge'
import { positionApi } from '../../api/position'
import { accountApi } from '../../api/account'
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
      interviewStore.invalidateSessionCache()
      fetchInterviews(true)
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
const popoverVisible = reactive({})

const toggleRoundPopover = (sessionId, roundId) => {
  const key = sessionId + '-' + roundId
  popoverVisible[key] = !popoverVisible[key]
}

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
      // 根据所有轮次状态推导面试状态（不再仅看最后一轮）
      const allStatuses = rounds.map(r => r.status)
      let planStatus = null
      if (allStatuses.some(s => s === 'fail')) {
        planStatus = 'failed'
      } else if (allStatuses.every(s => s === 'pass' || s === 'skip')) {
        planStatus = 'passed'
      } else if (allStatuses.every(s => s !== 'pending') && allStatuses.some(s => s === 'pending_review')) {
        planStatus = 'pending'
      }
      if (planStatus && currentSessionForRound.value.status !== planStatus) {
        await interviewApi.updateReserveSession(currentSessionForRound.value.id, { status: planStatus })
      }

      // 中间轮次不通过 → 后续轮次跳过 + 计划状态同步
      if (evaluationForm.status === 'fail' && idx < rounds.length - 1) {
        for (let i = idx + 1; i < rounds.length; i++) {
          if (rounds[i].status === 'pending') {
            const updatedRound = await interviewApi.updateSessionRound(
              currentSessionForRound.value.id, rounds[i].id, { status: 'skip' }
            )
            rounds[i] = updatedRound
          }
        }
        if (currentSessionForRound.value.status !== 'failed') {
          await interviewApi.updateReserveSession(currentSessionForRound.value.id, { status: 'failed' })
        }
      }

      // 从淘汰切换到其他状态时，恢复后续被自动跳过的轮次
      if (currentRound.value.status === 'fail' && evaluationForm.status !== 'fail' && idx < rounds.length - 1) {
        for (let i = idx + 1; i < rounds.length; i++) {
          if (rounds[i].status === 'skip') {
            const reset = await interviewApi.updateSessionRound(
              currentSessionForRound.value.id, rounds[i].id, { status: 'pending' }
            )
            rounds[i] = reset
          }
        }
      }
    }
    ElMessage.success('评估提交成功！')
    evaluationDialogVisible.value = false
    interviewStore.invalidateSessionCache()
    fetchInterviews(true) // 刷新面试列表以更新计划状态
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

// 根据所有轮次结果推导面试状态展示（不再仅看最后一轮）
const sessionStatusLabel = (session) => {
  const rounds = roundsMap[session.id]
  if (rounds && rounds.length > 0) {
    // 有任一失败 → 未通过
    if (rounds.some(r => r.status === 'fail')) return '未通过'
    // 全部通过/跳过 → 已通过
    if (rounds.every(r => r.status === 'pass' || r.status === 'skip')) return '已通过'
    // 所有轮次都有结论（含 pending_review，无 pending）→ 待定
    if (rounds.every(r => r.status !== 'pending') && rounds.some(r => r.status === 'pending_review')) return '待定'
    // 全是 pending → 沿用计划状态
    if (rounds.every(r => r.status === 'pending')) return getStatusLabel(session.status)
    // 部分已评估部分待开始 → 沿用原有状态
  }
  return getStatusLabel(session.status)
}

const sessionStatusType = (session) => {
  const rounds = roundsMap[session.id]
  if (rounds && rounds.length > 0) {
    if (rounds.some(r => r.status === 'fail')) return 'danger'
    if (rounds.every(r => r.status === 'pass' || r.status === 'skip')) return 'success'
    if (rounds.every(r => r.status !== 'pending') && rounds.some(r => r.status === 'pending_review')) return 'warning'
    if (rounds.every(r => r.status === 'pending')) return getStatusType(session.status)
  }
  return getStatusType(session.status)
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
    'pending_review': '待定',
    'skip': '已跳过',
    'completed': '已完成'
  }
  return map[status] || status
}

// 单节点流程：节点颜色按计划状态显示，多节点则显示轮次实际状态
const roundDisplayStatus = (session, round) => {
  const rounds = roundsMap[session.id]
  if (rounds && rounds.length === 1) {
    const map = {
      'passed': 'pass',
      'failed': 'fail',
      'pending': 'pending_review',
      'scheduled': 'pending',
      'ongoing': 'pending',
      'cancelled': 'skip'
    }
    return map[session.status] || round.status
  }
  return round.status
}

// 检查轮次是否被锁定（后续轮次已开始则不可更改当前轮次）
// pending = 未开始, skip = 上一轮淘汰导致自动跳过，均不锁定
const isRoundLocked = (round, allRounds) => {
  if (!allRounds || allRounds.length <= 1) return false
  const currentIdx = allRounds.findIndex(r => r.id === round.id)
  if (currentIdx === -1) return false
  for (let i = currentIdx + 1; i < allRounds.length; i++) {
    const s = allRounds[i].status
    if (s !== 'pending' && s !== 'skip') return true
  }
  return false
}

// 行内切换轮次状态（通过/淘汰/待定）
const handleRoundStatusChange = async (item, round, newStatus) => {
  if (round.status === newStatus) return
  if (item.status === 'expired') {
    ElMessage.warning('面试已过期，无法修改轮次状态')
    return
  }
  const loading = ElLoading.service({ lock: true, text: '更新轮次状态...' })
  try {
    const updated = await interviewApi.updateSessionRound(item.id, round.id, { status: newStatus })
    const rounds = roundsMap[item.id]
    if (rounds) {
      const idx = rounds.findIndex(r => r.id === round.id)
      if (idx !== -1) rounds[idx] = updated

      // 淘汰时自动跳过后续轮次
      if (newStatus === 'fail' && idx < rounds.length - 1) {
        for (let i = idx + 1; i < rounds.length; i++) {
          if (rounds[i].status === 'pending') {
            const skipped = await interviewApi.updateSessionRound(item.id, rounds[i].id, { status: 'skip' })
            rounds[i] = skipped
          }
        }
      }

      // 从淘汰切换到其他状态时，恢复之前被自动跳过的后续轮次为待面试
      if (round.status === 'fail' && newStatus !== 'fail' && idx < rounds.length - 1) {
        for (let i = idx + 1; i < rounds.length; i++) {
          if (rounds[i].status === 'skip') {
            const reset = await interviewApi.updateSessionRound(item.id, rounds[i].id, { status: 'pending' })
            rounds[i] = reset
          }
        }
      }

      // 根据所有轮次状态推导面试状态（不再仅看最后一个非 pending 轮次）
      const allStatuses = rounds.map(r => r.status)
      let planStatus = null
      if (allStatuses.some(s => s === 'fail')) {
        planStatus = 'failed'
      } else if (allStatuses.every(s => s === 'pass' || s === 'skip')) {
        planStatus = 'passed'
      } else if (allStatuses.every(s => s !== 'pending') && allStatuses.some(s => s === 'pending_review')) {
        planStatus = 'pending'
      }
      if (planStatus && item.status !== planStatus) {
        await interviewApi.updateReserveSession(item.id, { status: planStatus })
        item.status = planStatus // 本地同步更新状态
      }
    }
    // 关闭弹窗
    popoverVisible[item.id + '-' + round.id] = false
    ElMessage.success('轮次状态已更新')
  } catch (err) {
    ElMessage.error('更新失败: ' + (err?.detail || err?.message || '未知错误'))
  } finally {
    loading.close()
  }
}

const handleRoundClick = (session, round) => {
  currentSessionForRound.value = session
  currentRound.value = { ...round }
  roundDialogVisible.value = true
}

const canStartCurrentRound = () => {
  if (!currentRound.value || !currentSessionForRound.value) return false
  // 已预约或进行中时允许开始新的轮次
  if (currentSessionForRound.value.status !== 'scheduled' && currentSessionForRound.value.status !== 'ongoing') return false
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

// 获取第一个可开始的轮次：前置轮次都已通过/跳过/完成，且当前轮为 pending
const getFirstStartableRound = (sessionId) => {
  const rounds = roundsMap[sessionId]
  if (!rounds || rounds.length === 0) return null

  for (let i = 0; i < rounds.length; i++) {
    const round = rounds[i]
    if (round.status !== 'pending') continue

    // 第一轮 pending 即可开始
    if (i === 0) return round

    // 前一轮通过、跳过或已完成（ASR停止）才能开始当前轮
    const prevRound = rounds[i - 1]
    if (prevRound.status === 'pass' || prevRound.status === 'skip' || prevRound.status === 'completed') {
      return round
    }

    // 前一轮未通过，后续轮次不可开始
    return null
  }

  return null
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

const fetchInterviews = async (forceRefresh = false) => {
  listLoading.value = true
  try {
    const skip = (currentPage.value - 1) * pageSize.value
    const params = { skip, limit: pageSize.value }
    if (searchKeyword.value) params.keyword = searchKeyword.value

    // 仅在首页无搜索时使用缓存，翻页/搜索/增删改时 forceRefresh 绕过缓存
    let data, list
    const shouldUseCache = !forceRefresh && !searchKeyword.value && currentPage.value === 1

    if (shouldUseCache) {
      const cached = await interviewStore.getCachedSessions(async () => {
        const result = await interviewApi.getUserInterviewSessions(params)
        const items = Array.isArray(result) ? result : (result.items || result.data || [])
        const total = result.total || items.length
        return { items, total }
      })
      list = cached.items
      totalCount.value = cached.total
    } else {
      data = await interviewApi.getUserInterviewSessions(params)
      list = Array.isArray(data) ? data : (data.items || data.data || [])
      totalCount.value = data.total || list.length
    }

    interviewStore.interviews = list

    // 从列表响应中直接提取轮次数据（后端已批量加载，消除 N+1 查询）
    list.forEach(item => {
      if (item.rounds && item.rounds.length > 0) {
        roundsMap[item.id] = item.rounds
      } else if (item.position_id) {
        // 后端未返回 rounds（如旧后端），后台异步懒加载兜底
        roundsMap[item.id] = roundsMap[item.id] || []
        loadSessionRounds(item.id)
      } else {
        roundsMap[item.id] = []
      }
    })

    // 前端过期校验：检测已预约但已过结束时间的面试
    checkExpiredInterviews()
  } catch (error) {
    ElMessage.error('获取面试列表失败: ' + (error?.detail || error?.message || '未知错误'))
  } finally {
    listLoading.value = false
  }
}

// 检测并标记已过期的面试
const checkExpiredInterviews = async () => {
  const now = new Date()
  const expiredItems = interviewStore.interviews.filter(item => {
    if (item.status !== 'scheduled') return false
    if (!item.scheduled_end_at) return false
    const endTime = new Date(item.scheduled_end_at.replace(' ', 'T'))
    const isExpired = endTime <= now
    if (isExpired) {
      console.log('检测到过期面试:', item.candidate_name, item.id, item.scheduled_end_at, '结束时间:', endTime, '当前时间:', now)
    }
    return isExpired
  })

  if (expiredItems.length === 0) {
    console.log('未检测到过期面试，当前时间:', now, '面试总数:', interviewStore.interviews.length, '状态:', interviewStore.interviews.map(i => ({ name: i.candidate_name, status: i.status, end: i.scheduled_end_at })))
    return
  }

  for (const item of expiredItems) {
    try {
      await interviewApi.updateReserveSession(item.id, { status: 'expired' })
      item.status = 'expired'
      console.log('已标记面试过期:', item.candidate_name, item.id)
    } catch (e) {
      console.warn('标记面试 ' + item.id + ' 过期失败:', e)
    }
  }
}

// 懒加载轮次数据（兜底：当后端未返回 rounds 时按需获取 + 同步）
const roundsLoadingSet = new Set()
const loadSessionRounds = async (sessionId) => {
  if (roundsMap[sessionId] && roundsMap[sessionId].length > 0) return
  if (roundsLoadingSet.has(sessionId)) return
  roundsLoadingSet.add(sessionId)
  try {
    // 先尝试同步（与岗位最新配置对齐），失败则回退到普通读取
    const rounds = await interviewApi.syncSessionRounds(sessionId)
    roundsMap[sessionId] = Array.isArray(rounds) ? rounds : (rounds?.data || [])
  } catch {
    try {
      const rounds = await interviewApi.getSessionRounds(sessionId)
      roundsMap[sessionId] = Array.isArray(rounds) ? rounds : (rounds?.data || [])
    } catch {
      roundsMap[sessionId] = roundsMap[sessionId] || []
    }
  } finally {
    roundsLoadingSet.delete(sessionId)
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchInterviews(true)
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchInterviews(true)
}

const fetchResumesSilent = async () => {
  try {
    // 默认只加载审核通过的简历
    const data = await resumeApi.getResumes(0, 100, 'PASS')
    const list = Array.isArray(data) ? data : (data.items || data.data || [])
    resumeStore.setResumes(list)
  } catch (e) {
    console.warn('获取关联简历数据失败', e)
  }
}

// 仅显示审核通过的简历
const approvedResumes = computed(() => {
  return resumeStore.resumes.filter(r => r.review_status === 'PASS')
})

// 搜索所有简历（不仅限审核通过），供弹窗远程搜索使用
const searchAllResumes = async (keyword) => {
  try {
    const data = await resumeApi.getResumes(0, 100, null, keyword)
    return Array.isArray(data) ? data : (data.items || data.data || [])
  } catch (e) {
    console.warn('搜索简历失败', e)
    return []
  }
}

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

// 辅助数据懒加载：仅在弹窗打开时才去拉取（减少首屏请求数）
const ensureAuxiliaryData = () => {
  if (resumeStore.resumes.length === 0) fetchResumesSilent()
  if (knowledgeBases.value.length === 0) fetchKnowledgeBasesSilent()
  if (positions.value.length === 0) fetchPositionsSilent()
}

const handleOpenModal = (type) => {
  ensureAuxiliaryData()
  interviewStore.openModal(type)
}

onMounted(async () => {
  ensureAuxiliaryData()
  const hasHighlight = !!route.query.highlight

  if (hasHighlight) {
    // 从首页点击跳转时，先加载所有数据找到目标项所在页码
    const savedPageSize = pageSize.value
    pageSize.value = 9999
    await fetchInterviews()

    const idx = interviewStore.interviews.findIndex(i => i.id === Number(route.query.highlight))
    if (idx !== -1) {
      currentPage.value = Math.floor(idx / savedPageSize) + 1
    }
    // 恢复分页并重新加载目标页
    pageSize.value = savedPageSize
    await fetchInterviews()
  } else {
    fetchInterviews()
  }

  // 从简历审核页跳转过来时，自动打开新增弹窗并预填数据
  if (route.query.createInterview === '1' && route.query.resumeId) {
    const type = route.query.sessionType || 'online'
    handleOpenModal(type)
    interviewStore.interviewForm.resume_id = parseInt(route.query.resumeId)
    if (route.query.candidateName) {
      interviewStore.interviewForm.candidate_name = route.query.candidateName
    }
  }

  // 从首页点击跳转时，高亮对应行
  if (hasHighlight) {
    highlightId.value = Number(route.query.highlight)
    await nextTick()
    await nextTick() // 确保列表已渲染
    if (highlightedEl.value) {
      highlightedEl.value.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // 10 秒后移除高亮
      setTimeout(() => { highlightId.value = null }, 10000)
    }
  }
})

const handleSave = async () => {
  const form = interviewStore.interviewForm
  if (interviewStore.isEditMode && form.status && form.status !== 'scheduled' && form.status !== 'cancelled') {
    ElMessage.warning('已开始的面试仅可修改备注，请通过详情弹窗编辑')
    return
  }
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
      // 已过期或已取消的面试更新预约时间后自动恢复为已预约
      if (form.status === 'expired' || form.status === 'cancelled') {
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
      console.log('[创建面试] 发送载荷:', JSON.stringify(createPayload, null, 2))
      await interviewApi.reserveSession(createPayload)
      ElMessage.success('面试安排预定成功！')
    }
    
    interviewStore.showModal = false
    interviewStore.invalidateSessionCache()
    fetchInterviews(true) // 无论增改，重新拉取列表同步最新后台视图
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
    interviewStore.invalidateSessionCache()
    fetchInterviews(true)
  } catch (error) {
    ElMessage.error('备注保存失败: ' + (error?.detail || error?.message || '未知错误'))
  } finally {
    notesSaving.value = false
  }
}

const handleViewDetail = async (id) => {
  const loading = ElLoading.service({ lock: true, text: '正在拉取预约详情...' })
  try {
    const res = await interviewStore.getCachedSessionDetail(id, () => interviewApi.getReserveSession(id))
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
const pdfPreviewPage = ref(1)
const pdfPreviewPageCount = ref(0)
const pdfPreviewResumeId = ref(null)

const handlePreviewResume = async (item) => {
  if (!item.resume_id) return
  previewDialogVisible.value = true
  previewLoading.value = true
  previewUrl.value = ''
  pdfPreviewPage.value = 1
  pdfPreviewPageCount.value = 0
  try {
    const token = localStorage.getItem('token')
    // 获取 PDF 页数
    try {
      const res = await fetch(`/api/resumes/preview/${item.resume_id}/page-count?token=${token}`)
      const data = await res.json()
      pdfPreviewPageCount.value = data.total_pages || 1
    } catch {
      pdfPreviewPageCount.value = 1
    }
    pdfPreviewResumeId.value = item.resume_id
    previewUrl.value = `/api/resumes/preview/${item.resume_id}/image?page=1&token=${token}`
  } catch (error) {
    ElMessage.error('简历预览加载失败')
    previewDialogVisible.value = false
  } finally {
    previewLoading.value = false
  }
}

function goToPdfPreviewPage(page) {
  if (page < 1 || page > pdfPreviewPageCount.value || !pdfPreviewResumeId.value) return
  pdfPreviewPage.value = page
  const token = localStorage.getItem('token')
  previewUrl.value = `/api/resumes/preview/${pdfPreviewResumeId.value}/image?page=${page}&token=${token}`
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
      interviewStore.invalidateSessionCache()
      fetchInterviews(true)
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
      interviewStore.invalidateSessionCache()
      fetchInterviews(true)
    } catch (err) {
      ElMessage.error('取消失败: ' + (err?.detail || err?.message || '网络连接异常'))
    }
  }).catch(() => {})
}

const handleCreateSession = async (session) => {
  const roundId = currentRound.value?.id
  if (!roundId) {
    ElMessage.warning('未选中面试轮次')
    return
  }

  // 余额校验
  const { sufficient, balance, price } = await checkBalanceBeforeStart()
  if (!sufficient) {
    ElMessageBox.confirm(
      `当前余额 ¥${balance.toFixed(2)}，不足以支付面试费用（¥${price.toFixed(2)}），请先充值。`,
      '余额不足',
      {
        confirmButtonText: '去充值',
        cancelButtonText: '取消',
        type: 'warning',
      }
    ).then(() => {
      router.push('/dashboard/recharge')
    }).catch(() => {})
    return
  }

  router.push(`/interview-assistant/${session.id}/${roundId}`)
}

const checkBalanceBeforeStart = async () => {
  try {
    const [balanceRes, pricingRes] = await Promise.all([
      accountApi.getBalance(),
      accountApi.getPricing(),
    ])
    const balance = balanceRes.balance ?? 0
    const interviewPricing = pricingRes.items?.find(p => p.service_type === 'interview_reserve')
    const price = interviewPricing?.price ?? 5
    return { sufficient: balance >= price, balance, price }
  } catch {
    // 支付模块不可用时放行
    return { sufficient: true, balance: 0, price: 0 }
  }
}

const handleStartInterview = async (item) => {
  // 确保轮次数据已加载
  if (!roundsMap[item.id] || roundsMap[item.id].length === 0) {
    await loadSessionRounds(item.id)
  }
  const rounds = roundsMap[item.id]
  if (!rounds || rounds.length === 0) {
    ElMessage.warning('该面试尚无面试轮次，请先设置面试流程')
    return
  }
  // 找到第一个可开始的轮次（前置轮次均已通过/跳过/完成）
  const firstStartable = getFirstStartableRound(item.id)
  if (!firstStartable) {
    ElMessage.warning('无可开始的轮次，请确认前置轮次均已通过')
    return
  }

  // 余额校验
  const { sufficient, balance, price } = await checkBalanceBeforeStart()
  if (!sufficient) {
    ElMessageBox.confirm(
      `当前余额 ¥${balance.toFixed(2)}，不足以支付面试费用（¥${price.toFixed(2)}），请先充值。`,
      '余额不足',
      {
        confirmButtonText: '去充值',
        cancelButtonText: '取消',
        type: 'warning',
      }
    ).then(() => {
      router.push('/dashboard/recharge')
    }).catch(() => {})
    return
  }

  router.push(`/interview-assistant/${item.id}/${firstStartable.id}`)
}

const handleStartASR = async (item) => {
  if (!item.session_id) {
    ElMessage.warning('请先创建面试会话')
    return
  }
  await loadSessionRounds(item.id)
  // 取第一个轮次的ID作为默认轮次
  const rounds = roundsMap[item.id]
  const roundId = rounds?.[0]?.id
  if (!roundId) {
    ElMessage.warning('该面试尚无面试轮次，请先设置面试流程')
    return
  }
  router.push(`/interview/${item.session_id}/${roundId}`)
}

const handleViewReport = async (item) => {
  await loadSessionRounds(item.id)
  // 跳转到报告生成页面，传递 session_id 和 round_id
  const rounds = roundsMap[item.id]
  const roundId = rounds?.[0]?.id
  router.push(`/dashboard/report-generate?session_id=${item.id}${roundId ? '&round_id=' + roundId : ''}`)
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
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: "Lark Sans", "Lark Unicode", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

.card-container {
  background-color: #FFFFFF;
  border-radius: 8px;
  border: 1px solid #DEE0E3;
  min-height: 0;
  flex: 1;
  box-shadow: 0 2px 8px rgba(31, 35, 41, 0.04);
  display: flex;
  flex-direction: column;
}

/* 顶部配置与筛选控制流 */
.header-area {
  padding: 20px 24px;
  border-bottom: 1px solid #DEE0E3;
  flex-shrink: 0;
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
  min-height: 0;
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
  overflow-y: auto;
  min-height: 0;
}

.pagination-wrapper {
  flex-shrink: 0;
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
.round-pending_review .round-dot { background: #FF8800; }
.round-pending_review .round-label { color: #FF8800; }
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

/* 轮次状态切换弹出按钮组 */
.round-popover-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  padding: 4px 0;
}
.round-popover-actions .el-button {
  flex: 1;
}

/* 轮次状态标签 */
.round-tag-pending { background: #F0F1F5; color: #646A73; }
.round-tag-pass { background: #E4F7EB; color: #13A248; }
.round-tag-fail { background: #FFE4E2; color: #F53F3F; }
.round-tag-pending_review { background: #FFF4E5; color: #FF8800; }
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

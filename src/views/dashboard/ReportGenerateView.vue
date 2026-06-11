<template>
  <div class="feishu-page">

    <!-- ==================== ROOT VIEW ==================== -->
    <template v-if="viewMode === 'root'">
      <div class="card-container">
        <div class="header-area">
          <div class="header-top">
            <div class="title-area">
              <h1>面试报告</h1>
            </div>
            <div class="header-actions">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索候选人姓名"
                clearable
                style="width: 240px;"
                @keyup.enter="fetchCandidateGroups"
                @clear="fetchCandidateGroups"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
          </div>
        </div>

        <div v-if="loadingRoot" class="loading-container-inline">
          <el-skeleton :rows="6" animated />
        </div>

        <div v-else-if="candidateGroups.length === 0" class="empty-container-inline">
          <el-empty description="暂无面试报告数据">
            <el-button @click="$router.push('/dashboard/interview-manage')">前往面试管理</el-button>
          </el-empty>
        </div>

        <div v-else class="folder-grid">
          <div
            v-for="group in candidateGroups"
            :key="group.candidate_name"
            class="folder-card"
            @click="enterCandidate(group.candidate_name)"
          >
            <div class="folder-icon">
              <el-icon :size="40"><FolderOpened /></el-icon>
            </div>
            <div class="folder-name">{{ group.candidate_name }}</div>
            <div class="folder-meta">
              <span>{{ group.session_count }} 次面试</span>
              <span v-if="group.report_count">· {{ group.report_count }} 份报告</span>
            </div>
            <div v-if="group.latest_report_at" class="folder-time">
              {{ formatDate(group.latest_report_at) }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ==================== CANDIDATE VIEW ==================== -->
    <template v-if="viewMode === 'candidate'">
      <div class="card-container">
        <div class="header-area">
          <div class="header-top">
            <div class="title-area">
              <el-button text @click="goToRoot">
                <el-icon><ArrowLeft /></el-icon>
              </el-button>
              <h1>面试报告 / {{ currentCandidate }}</h1>
            </div>
          </div>
        </div>

        <div v-if="loadingCandidate" class="loading-container-inline">
          <el-skeleton :rows="6" animated />
        </div>

        <div v-else-if="candidateSessions.length === 0" class="empty-container-inline">
          <el-empty description="该候选人暂无面试记录" />
        </div>

        <el-table v-else :data="candidateSessions" stripe style="width: 100%">
          <el-table-column label="面试日期" width="140">
            <template #default="{ row }">
              {{ row.interview_date || '未知' }}
            </template>
          </el-table-column>
          <el-table-column label="面试轮次" min-width="160">
            <template #default="{ row }">
              <div v-if="row.rounds && row.rounds.length">
                <el-tag
                  v-for="r in row.rounds"
                  :key="r.round_id"
                  size="small"
                  style="margin-right: 4px;"
                >
                  {{ r.round_name }}
                </el-tag>
              </div>
              <span v-else class="text-muted">无轮次</span>
            </template>
          </el-table-column>
          <el-table-column label="报告状态" width="140">
            <template #default="{ row }">
              <template v-for="rp in row.reports" :key="rp.report_id">
                <el-tag v-if="rp.status === 'final'" type="success" size="small" style="margin-right: 4px;">
                  已完成
                </el-tag>
                <el-tag v-else-if="rp.status === 'generating'" type="warning" size="small" style="margin-right: 4px;">
                  生成中
                </el-tag>
                <el-tag v-else-if="rp.status === 'failed'" type="danger" size="small" style="margin-right: 4px;">
                  失败
                </el-tag>
              </template>
              <span v-if="!row.reports || !row.reports.length" class="text-muted">未生成</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button
                v-for="rp in row.reports"
                :key="rp.report_id"
                :type="rp.status === 'failed' ? 'warning' : 'primary'"
                size="small"
                style="margin-right: 4px;"
                @click="enterDetail(row.session_id, rp.round_id)"
              >
                {{ rp.status === 'failed' ? '重新生成' : '查看' }}
              </el-button>
              <el-button
                v-if="!row.reports || !row.reports.length"
                type="primary"
                size="small"
                @click="triggerGenerate(row.session_id, row.rounds?.[0]?.round_id, true)"
              >
                生成报告
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>

    <!-- ==================== DETAIL VIEW ==================== -->
    <template v-if="viewMode === 'detail'">
      <!-- Loading -->
      <div v-if="loading" class="card-container">
        <div class="loading-container-inline">
          <el-skeleton :rows="10" animated />
        </div>
      </div>

      <!-- Generating overlay -->
      <div v-else-if="reportStatus === 'generating'" class="card-container">
        <div class="generating-container">
          <el-progress type="circle" :percentage="50" :indeterminate="true" :width="120" :stroke-width="8" />
          <h2 class="generating-title">AI 正在生成面试报告...</h2>
          <p class="generating-sub">正在分析面试对话，请稍候</p>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="card-container">
        <div class="empty-container-inline">
          <el-result icon="error" title="加载失败" :sub-title="error">
            <template #extra>
              <el-button type="primary" @click="fetchReport">重新加载</el-button>
              <el-button @click="goToCandidate">返回候选人</el-button>
            </template>
          </el-result>
        </div>
      </div>

      <!-- Not Generated -->
      <div v-else-if="!reportData" class="card-container">
        <div class="empty-container-inline">
          <el-result icon="info" title="报告尚未生成">
            <template #extra>
              <el-button type="primary" :loading="generating" @click="triggerGenerate(sessionId, roundId)">生成面试报告</el-button>
              <el-button @click="goToCandidate">返回候选人</el-button>
            </template>
          </el-result>
        </div>
      </div>

      <!-- Failed -->
      <div v-else-if="reportStatus === 'failed'" class="card-container">
        <div class="empty-container-inline">
          <el-result icon="error" title="报告生成失败">
            <template #extra>
              <el-button type="primary" :loading="generating" @click="triggerGenerate(sessionId, roundId)">重新生成</el-button>
              <el-button @click="goToCandidate">返回候选人</el-button>
            </template>
          </el-result>
        </div>
      </div>

      <!-- Report Content -->
      <div v-else class="card-container">
        <!-- Header -->
        <div class="header-area">
          <div class="header-top">
            <div class="title-area">
              <el-button text @click="goToCandidate">
                <el-icon><ArrowLeft /></el-icon>
              </el-button>
              <h1>面试报告</h1>
              <span class="badge">{{ badgeText }}</span>
            </div>
            <div class="header-actions">
              <el-button class="lark-btn-ghost" @click="goToCandidate">返回候选人</el-button>
              <el-button v-if="!editMode" class="lark-btn-primary" type="primary" @click="enterEditMode">编辑</el-button>
              <el-button v-if="editMode" type="success" :loading="saving" @click="saveReport">保存</el-button>
              <el-button v-if="editMode" @click="cancelEdit">取消</el-button>
              <el-button class="lark-btn-ghost" @click="exportPDF">导出 PDF</el-button>
            </div>
          </div>
        </div>

        <!-- Overview Cards -->
        <div class="overview-cards">
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">候选人</span>
              <span class="info-value">{{ reportData.candidate_name || '未知' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">面试官</span>
              <span class="info-value">{{ reportData.interviewer_name || '未知' }}</span>
            </div>
          </div>
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">应聘岗位</span>
              <span class="info-value">{{ reportData.position_name || '未知' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">面试形式</span>
              <span class="info-value">{{ reportData.session_type || '未知' }}</span>
            </div>
          </div>
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">面试日期</span>
              <span class="info-value">{{ reportData.interview_date || '未知' }}</span>
            </div>
          </div>
          <div class="info-card stages-card">
            <div class="info-row">
              <span class="info-label">面试阶段</span>
            </div>
            <div class="stages-flow">
              <template v-for="(stage, i) in reportData.stages" :key="i">
                <span v-if="i > 0" class="stage-arrow">→</span>
                <span class="stage-tag" :class="stage.active ? 'active' : 'inactive'">{{ stage.name }}</span>
              </template>
            </div>
          </div>
        </div>

        <!-- Score Summary Cards (editable) -->
        <div class="score-summary-row">
          <div class="score-card overall">
            <div class="score-icon"><el-icon><Medal /></el-icon></div>
            <div class="score-content">
              <div v-if="editMode" class="score-edit">
                <el-select v-model="editData.overall_score" size="small" style="width: 80px;">
                  <el-option label="A" value="A" />
                  <el-option label="B" value="B" />
                  <el-option label="C" value="C" />
                  <el-option label="D" value="D" />
                </el-select>
              </div>
              <div v-else class="score-value">{{ reportData.overall_score || '-' }}</div>
              <div class="score-label">综合评分</div>
              <div class="score-range">参考: A/B/C/D</div>
            </div>
          </div>
          <div class="score-card match">
            <div class="score-icon"><el-icon><DataAnalysis /></el-icon></div>
            <div class="score-content">
              <div v-if="editMode" class="score-edit">
                <el-input-number v-model="editData.tech_match" :min="0" :max="100" size="small" style="width: 120px;" />
              </div>
              <div v-else class="score-value">{{ reportData.tech_match ?? '-' }}%</div>
              <div class="score-label">技术匹配度</div>
              <div class="score-range">{{ techMatchLabel }}</div>
            </div>
          </div>
          <div class="score-card recommendation">
            <div class="score-icon"><el-icon><Document /></el-icon></div>
            <div class="score-content">
              <div v-if="editMode" class="score-edit">
                <el-select v-model="editData.final_decision" size="small" style="width: 120px;">
                  <el-option label="建议录用" value="recommend" />
                  <el-option label="待定" value="neutral" />
                  <el-option label="不建议录用" value="not_recommend" />
                </el-select>
              </div>
              <div v-else class="score-value" :class="decisionClass">{{ decisionLabel }}</div>
              <div class="score-label">推荐意见</div>
              <div class="score-options">
                <span class="opt" :class="{ selected: reportData.final_decision === 'recommend' }">建议录用</span>
                <span class="opt" :class="{ selected: reportData.final_decision === 'neutral' }">待定</span>
                <span class="opt" :class="{ selected: reportData.final_decision === 'not_recommend' }">不建议</span>
              </div>
            </div>
          </div>
          <div class="score-card risk">
            <div class="score-icon"><el-icon><WarningFilled /></el-icon></div>
            <div class="score-content">
              <div v-if="editMode" class="score-edit">
                <el-select v-model="editData.risk_level" size="small" style="width: 100px;">
                  <el-option label="低" value="low" />
                  <el-option label="中等" value="medium" />
                  <el-option label="高" value="high" />
                </el-select>
              </div>
              <div v-else class="score-value" :class="riskClass">{{ riskLabel }}</div>
              <div class="score-label">风险等级</div>
              <div class="risk-bar">
                <div class="risk-segment low" :class="{ active: reportData.risk_level === 'low' }"></div>
                <div class="risk-segment medium" :class="{ active: reportData.risk_level === 'medium' }"></div>
                <div class="risk-segment high" :class="{ active: reportData.risk_level === 'high' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Radar Chart + Ability Indicators (editable) -->
        <div class="section-card">
          <h2 class="section-title">能力评估</h2>
          <div class="radar-section">
            <div class="radar-chart-container">
              <div ref="radarChartRef" class="radar-chart"></div>
            </div>
            <div class="ability-list">
              <div v-for="(item, idx) in abilityIndicators" :key="idx" class="ability-item">
                <div class="ability-header">
                  <span class="ability-icon" :class="item.status">{{ item.status === 'good' ? '★' : item.status === 'abnormal' ? '⚠' : '✓' }}</span>
                  <span class="ability-name">{{ item.name }}</span>
                  <span v-if="editMode" class="ability-edit-score">
                    <el-select v-model="editData.ability_indicators[idx].score" size="small" style="width: 70px;">
                      <el-option label="A" value="A" />
                      <el-option label="B" value="B" />
                      <el-option label="C" value="C" />
                      <el-option label="D" value="D" />
                    </el-select>
                  </span>
                  <span v-else class="ability-score" :class="item.status">{{ item.score }}</span>
                </div>
                <div class="ability-bar-wrapper">
                  <div class="ability-bar-bg">
                    <div class="ability-bar-fill" :class="item.status" :style="{ width: abilityBarWidth(item.score) }"></div>
                  </div>
                  <span class="ability-range">参考: A/B/C/D</span>
                </div>
                <div v-if="editMode" class="ability-edit-desc">
                  <el-input v-model="editData.ability_indicators[idx].desc" type="textarea" :rows="2" size="small" />
                </div>
                <div v-else class="ability-desc">{{ item.desc }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Stage Comparison Bar Chart (editable) -->
        <div class="section-card">
          <h2 class="section-title">各阶段表现</h2>
          <div class="stage-chart-section">
            <div class="stage-chart-container">
              <div ref="stageChartRef" class="stage-chart"></div>
            </div>
            <div class="stage-insights">
              <div v-for="(item, i) in stageInsights" :key="i" class="insight-item" :class="item.type">
                <span class="insight-icon">{{ item.type === 'positive' ? '★' : '⚠' }}</span>
                <span v-if="editMode">
                  <el-select v-model="editData.stage_data[i].score" size="small" style="width: 70px; margin-right: 8px;">
                    <el-option label="A" value="A" />
                    <el-option label="B" value="B" />
                    <el-option label="C" value="C" />
                    <el-option label="D" value="D" />
                  </el-select>
                  <el-input v-model="editData.stage_data[i].insight" type="textarea" :rows="2" size="small" style="margin-top: 4px;" />
                </span>
                <span v-else>{{ item.text }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Abnormal Findings Table (editable) -->
        <div class="section-card">
          <h2 class="section-title">
            异常发现
            <span class="section-subtitle">需关注的技术盲区与风险点</span>
          </h2>
          <el-table :data="abnormalFindings" style="width: 100%" stripe :header-cell-style="{ background: '#FAFBFC', color: '#1F2329', fontWeight: 600 }">
            <el-table-column prop="item" label="异常项目" width="120">
              <template #default="{ row, $index }">
                <span class="abnormal-item"><el-icon><WarningFilled /></el-icon>
                  <el-input v-if="editMode" v-model="editData.abnormal_findings[$index].item" size="small" />
                  <span v-else>{{ row.item }}</span>
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="finding" label="异常描述" min-width="200">
              <template #default="{ row, $index }">
                <el-input v-if="editMode" v-model="editData.abnormal_findings[$index].finding" size="small" />
                <span v-else>{{ row.finding }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="detail" label="详细说明" min-width="280">
              <template #default="{ row, $index }">
                <el-input v-if="editMode" v-model="editData.abnormal_findings[$index].detail" type="textarea" :rows="2" size="small" />
                <span v-else>{{ row.detail }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="severity" label="严重程度" width="100">
              <template #default="{ row, $index }">
                <el-select v-if="editMode" v-model="editData.abnormal_findings[$index].severity" size="small">
                  <el-option label="高" value="高" />
                  <el-option label="中" value="中" />
                  <el-option label="低" value="低" />
                </el-select>
                <el-tag v-else :type="severityType(row.severity)" size="small">{{ row.severity }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="suggested_action" label="处理建议" min-width="200">
              <template #default="{ row, $index }">
                <el-input v-if="editMode" v-model="editData.abnormal_findings[$index].suggested_action" size="small" />
                <span v-else>{{ row.suggested_action }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- Tech Keywords (editable) -->
        <div class="section-card">
          <h2 class="section-title">技术关键词</h2>
          <div class="keywords-section">
            <div class="keyword-tags">
              <el-tag
                v-for="(kw, idx) in techKeywords"
                :key="idx"
                :class="'freq-' + kw.freq"
                class="keyword-tag"
                :closable="editMode"
                @close="removeKeyword(idx)"
              >{{ kw.text }}</el-tag>
              <el-button v-if="editMode" size="small" type="primary" plain @click="addKeyword">+ 添加</el-button>
            </div>
            <div class="keyword-legend">
              <span class="freq-dot high"></span> 高频提及
              <span class="freq-dot mid" style="margin-left: 20px;"></span> 中频
              <span class="freq-dot low" style="margin-left: 20px;"></span> 低频
            </div>
          </div>
        </div>

        <!-- Conclusion & Recommendation (editable) -->
        <div class="section-card conclusion-card">
          <h2 class="section-title">总检结论与建议</h2>
          <div class="conclusion-grid">
            <div class="conclusion-block strengths">
              <div class="block-title">优势</div>
              <ul>
                <li v-for="(s, i) in conclusion.strengths" :key="i">
                  <el-input v-if="editMode" v-model="editData.conclusion.strengths[i]" size="small" style="width: 90%;" />
                  <span v-else>{{ s }}</span>
                  <el-button v-if="editMode" type="danger" size="small" :icon="Delete" circle @click="removeConclusionItem('strengths', i)" />
                </li>
              </ul>
              <el-button v-if="editMode" size="small" type="primary" plain @click="addConclusionItem('strengths')">+ 添加</el-button>
            </div>
            <div class="conclusion-block weaknesses">
              <div class="block-title">不足</div>
              <ul>
                <li v-for="(w, i) in conclusion.weaknesses" :key="i">
                  <el-input v-if="editMode" v-model="editData.conclusion.weaknesses[i]" size="small" style="width: 90%;" />
                  <span v-else>{{ w }}</span>
                  <el-button v-if="editMode" type="danger" size="small" :icon="Delete" circle @click="removeConclusionItem('weaknesses', i)" />
                </li>
              </ul>
              <el-button v-if="editMode" size="small" type="primary" plain @click="addConclusionItem('weaknesses')">+ 添加</el-button>
            </div>
            <div class="conclusion-block suggestions">
              <div class="block-title">建议</div>
              <ul>
                <li v-for="(s, i) in conclusion.suggestions" :key="i">
                  <el-input v-if="editMode" v-model="editData.conclusion.suggestions[i]" size="small" style="width: 90%;" />
                  <span v-else>{{ s }}</span>
                  <el-button v-if="editMode" type="danger" size="small" :icon="Delete" circle @click="removeConclusionItem('suggestions', i)" />
                </li>
              </ul>
              <el-button v-if="editMode" size="small" type="primary" plain @click="addConclusionItem('suggestions')">+ 添加</el-button>
            </div>
          </div>
          <el-divider />
          <div class="final-decision">
            <div class="decision-label">综合决定</div>
            <div class="decision-options">
              <el-radio-group v-model="finalDecision" size="large" :disabled="!editMode">
                <el-radio-button value="recommend" class="decision-recommend">建议录用</el-radio-button>
                <el-radio-button value="neutral" class="decision-neutral">待定</el-radio-button>
                <el-radio-button value="not_recommend" class="decision-not">不建议录用</el-radio-button>
              </el-radio-group>
            </div>
          </div>
          <div class="next-focus">
            <span class="next-label">下阶段重点关注：</span>
            <el-tag
              v-for="(f, idx) in conclusion.nextFocus"
              :key="idx"
              class="focus-tag"
              :closable="editMode"
              @close="removeFocusItem(idx)"
            >{{ f }}</el-tag>
            <el-button v-if="editMode" size="small" type="primary" plain @click="addFocusItem">+ 添加</el-button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Medal, DataAnalysis, Document, WarningFilled,
  Search, FolderOpened, ArrowLeft, Delete
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { interviewApi } from '../../api/interview'

const route = useRoute()
const router = useRouter()

// ========== View State ==========
const viewMode = ref('root') // 'root' | 'candidate' | 'detail'
const searchKeyword = ref('')

// Root view state
const loadingRoot = ref(false)
const candidateGroups = ref([])

// Candidate view state
const loadingCandidate = ref(false)
const currentCandidate = ref('')
const candidateSessions = ref([])

// Detail view state
const loading = ref(false)
const error = ref('')
const generating = ref(false)
const saving = ref(false)
const reportData = ref(null)
const reportStatus = ref('')
const finalDecision = ref('neutral')
const sessionId = ref(null)
const roundId = ref(null)
const reportId = ref(null)

// Edit mode
const editMode = ref(false)
const editData = ref(null)
const originalData = ref(null)

// ========== Lifecycle ==========
onMounted(async () => {
  const qSessionId = route.query.session_id
  const qRoundId = route.query.round_id
  const qCandidate = route.query.candidate

  if (qSessionId) {
    sessionId.value = Number(qSessionId)
    roundId.value = qRoundId ? Number(qRoundId) : null
    viewMode.value = 'detail'
    await fetchReport()
  } else if (qCandidate) {
    currentCandidate.value = qCandidate
    viewMode.value = 'candidate'
    await fetchCandidateSessions()
  } else {
    viewMode.value = 'root'
    await fetchCandidateGroups()
  }
})

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  radarChart?.dispose()
  stageChart?.dispose()
})

// ========== Root View ==========
async function fetchCandidateGroups() {
  loadingRoot.value = true
  try {
    const params = {}
    if (searchKeyword.value) params.keyword = searchKeyword.value
    candidateGroups.value = await interviewApi.getReportCandidateGroups(params)
  } catch (e) {
    ElMessage.error('加载候选人列表失败: ' + (e?.detail || e?.message || ''))
    candidateGroups.value = []
  } finally {
    loadingRoot.value = false
  }
}

function enterCandidate(name) {
  currentCandidate.value = name
  viewMode.value = 'candidate'
  fetchCandidateSessions()
}

// ========== Candidate View ==========
async function fetchCandidateSessions() {
  loadingCandidate.value = true
  try {
    const res = await interviewApi.getReportsByCandidate(currentCandidate.value)
    candidateSessions.value = res.sessions || []
  } catch (e) {
    ElMessage.error('加载候选人面试记录失败')
    candidateSessions.value = []
  } finally {
    loadingCandidate.value = false
  }
}

function goToRoot() {
  viewMode.value = 'root'
  router.replace('/dashboard/report-generate')
}

function goToCandidate() {
  sessionId.value = null
  roundId.value = null
  editMode.value = false
  editData.value = null
  originalData.value = null
  reportData.value = null
  viewMode.value = 'candidate'
  router.replace(`/dashboard/report-generate?candidate=${encodeURIComponent(currentCandidate.value)}`)
  fetchCandidateSessions()
}

// ========== Detail View ==========
function enterDetail(sid, rid) {
  sessionId.value = sid
  roundId.value = rid
  editMode.value = false
  editData.value = null
  originalData.value = null
  viewMode.value = 'detail'
  router.replace(`/dashboard/report-generate?session_id=${sid}${rid ? '&round_id=' + rid : ''}`)
  fetchReport()
}

async function fetchReport() {
  if (!sessionId.value) return

  loading.value = true
  error.value = ''
  try {
    const params = {}
    if (roundId.value) params.round_id = roundId.value
    const res = await interviewApi.getReportBySession(sessionId.value, params)

    if (res.status === 'generating') {
      reportStatus.value = 'generating'
      loading.value = false
      await waitForReport(sessionId.value)
    } else if (res.status === 'final' && res.report_data) {
      reportData.value = res.report_data
      reportStatus.value = 'final'
      finalDecision.value = res.report_data.final_decision || 'neutral'
      reportId.value = res.id
      loading.value = false
      await nextTick()
      initCharts()
    } else if (res.status === 'failed') {
      reportStatus.value = 'failed'
      reportData.value = null
      loading.value = false
    } else {
      reportStatus.value = 'not_generated'
      reportData.value = null
      loading.value = false
    }
  } catch (e) {
    error.value = e?.detail || e?.message || '加载报告失败'
    loading.value = false
  }
}

async function waitForReport(sid) {
  let retries = 0
  const maxRetries = 300

  while (retries < maxRetries) {
    await new Promise(r => setTimeout(r, 5000))
    retries++

    try {
      const params = {}
      if (roundId.value) params.round_id = roundId.value
      const res = await interviewApi.getReportBySession(sid, params)

      if (res.status === 'final' && res.report_data) {
        reportData.value = res.report_data
        reportStatus.value = 'final'
        finalDecision.value = res.report_data.final_decision || 'neutral'
        reportId.value = res.id
        await nextTick()
        initCharts()
        ElMessage.success('面试报告生成完成')
        return
      }

      if (res.status === 'failed') {
        reportStatus.value = 'failed'
        ElMessage.error('报告生成失败，请点击重试')
        return
      }

      if (res.status === 'not_generated') {
        reportStatus.value = 'not_generated'
        return
      }
    } catch {
      // continue polling
    }
  }

  reportStatus.value = 'timeout'
  ElMessage.warning('报告生成超时，请稍后重试')
}

async function triggerGenerate(sid, rid, isCandidateView = false) {
  const targetSid = sid || sessionId.value
  const targetRid = rid !== undefined ? rid : roundId.value

  if (isCandidateView) {
    generating.value = true
    try {
      const params = {}
      if (targetRid) params.round_id = targetRid
      await interviewApi.generateReport(targetSid, params)
      ElMessage.success('已触发报告生成')
      await fetchCandidateSessions()
    } catch (e) {
      ElMessage.error(e?.detail || e?.message || '触发生成失败')
    } finally {
      generating.value = false
    }
    return
  }

  generating.value = true
  reportStatus.value = 'generating'
  try {
    const params = {}
    if (targetRid) params.round_id = targetRid
    const res = await interviewApi.generateReport(targetSid, params)
    if (res.status === 'final' && res.report_data) {
      reportData.value = res.report_data
      reportStatus.value = 'final'
      finalDecision.value = res.report_data.final_decision || 'neutral'
      ElMessage.success('报告生成成功')
      await nextTick()
      initCharts()
    } else if (res.status === 'generating') {
      reportStatus.value = 'generating'
      await waitForReport(targetSid)
    } else {
      ElMessage.error('报告生成失败，请稍后重试')
      reportStatus.value = 'failed'
    }
  } catch (e) {
    ElMessage.error(e?.detail || e?.message || '报告生成失败')
    reportStatus.value = 'failed'
  } finally {
    generating.value = false
  }
}

// ========== Edit Mode ==========
function enterEditMode() {
  originalData.value = JSON.parse(JSON.stringify(reportData.value))
  editData.value = JSON.parse(JSON.stringify(reportData.value))
  editMode.value = true
}

function cancelEdit() {
  editData.value = null
  originalData.value = null
  editMode.value = false
}

const scoreToValue = { A: 85, B: 65, C: 45, D: 25 }

function syncScoreToValue(data) {
  if (!data) return
  if (data.ability_indicators) {
    for (const item of data.ability_indicators) {
      if (item.score && scoreToValue[item.score] !== undefined) {
        item.value = scoreToValue[item.score]
      }
    }
  }
  if (data.stage_data) {
    for (const item of data.stage_data) {
      if (item.score && scoreToValue[item.score] !== undefined) {
        item.value = scoreToValue[item.score]
      }
    }
  }
}

async function saveReport() {
  if (!reportId.value) {
    ElMessage.error('报告 ID 缺失，无法保存')
    return
  }

  saving.value = true
  try {
    // Sync finalDecision back to editData
    editData.value.final_decision = finalDecision.value
    // 将 score(A/B/C/D) 同步为 value(数值)，确保持久化数据一致性
    syncScoreToValue(editData.value)

    await interviewApi.updateReport(reportId.value, {
      report_data: JSON.stringify(editData.value),
    })
    reportData.value = JSON.parse(JSON.stringify(editData.value))
    ElMessage.success('报告已保存')
    editMode.value = false
    editData.value = null
    originalData.value = null
    await nextTick()
    initCharts()
  } catch (e) {
    ElMessage.error('保存失败: ' + (e?.detail || e?.message || ''))
  } finally {
    saving.value = false
  }
}

// ========== Edit Helpers ==========
function addKeyword() {
  editData.value.tech_keywords.push({ text: '新关键词', freq: 'mid' })
}

function removeKeyword(idx) {
  editData.value.tech_keywords.splice(idx, 1)
}

function addConclusionItem(field) {
  editData.value.conclusion[field].push('')
}

function removeConclusionItem(field, idx) {
  editData.value.conclusion[field].splice(idx, 1)
}

function addFocusItem() {
  editData.value.conclusion.next_focus.push('')
}

function removeFocusItem(idx) {
  editData.value.conclusion.next_focus.splice(idx, 1)
}

// ========== Computed ==========
const badgeText = computed(() => {
  const map = { recommend: '建议录用', neutral: '待定', not_recommend: '不建议录用' }
  return map[reportData.value?.final_decision] || '待定'
})

const decisionLabel = computed(() => {
  const map = { recommend: '建议录用', neutral: '待定', not_recommend: '不建议录用' }
  return map[reportData.value?.final_decision] || '待定'
})

const decisionClass = computed(() => {
  const map = { recommend: '', neutral: 'neutral', not_recommend: 'not' }
  return map[reportData.value?.final_decision] || 'neutral'
})

const riskLabel = computed(() => {
  const map = { low: '低', medium: '中等', high: '高' }
  return map[reportData.value?.risk_level] || '未知'
})

const riskClass = computed(() => {
  const map = { low: 'low', medium: 'medium', high: 'high' }
  return map[reportData.value?.risk_level] || 'medium'
})

const techMatchLabel = computed(() => {
  const v = reportData.value?.tech_match
  if (v == null) return '未知'
  if (v >= 80) return '较匹配'
  if (v >= 60) return '一般'
  return '较弱'
})

const abilityIndicators = computed(() => {
  if (editMode.value && editData.value?.ability_indicators) {
    return editData.value.ability_indicators
  }
  return reportData.value?.ability_indicators || []
})

const abnormalFindings = computed(() => {
  if (editMode.value && editData.value?.abnormal_findings) {
    return editData.value.abnormal_findings
  }
  return reportData.value?.abnormal_findings || []
})

const techKeywords = computed(() => {
  if (editMode.value && editData.value?.tech_keywords) {
    return editData.value.tech_keywords
  }
  return reportData.value?.tech_keywords || []
})

const conclusion = computed(() => {
  const c = editMode.value && editData.value?.conclusion
    ? editData.value.conclusion
    : (reportData.value?.conclusion || {})
  return {
    strengths: c.strengths || [],
    weaknesses: c.weaknesses || [],
    suggestions: c.suggestions || [],
    nextFocus: c.next_focus || [],
  }
})

const stageInsights = computed(() => {
  const items = reportData.value?.stage_data || []
  return items
    .filter(s => s.insight)
    .map(s => ({
      type: s.score === 'A' || s.score === 'B' ? 'positive' : 'warning',
      text: s.insight,
    }))
})

// ========== Chart Helpers ==========
function abilityBarWidth(score) {
  const map = { A: '85%', B: '65%', C: '45%', D: '25%' }
  return map[score] || '50%'
}

function severityType(severity) {
  const map = { '高': 'danger', '中': 'warning', '低': 'info' }
  return map[severity] || 'info'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ========== Charts ==========
const radarChartRef = ref(null)
const stageChartRef = ref(null)
let radarChart = null
let stageChart = null

function initCharts() {
  initRadarChart()
  initStageChart()
}

/** 将 score 等级映射为图表数值 */
function getChartValue(item) {
  const map = { A: 85, B: 65, C: 45, D: 25 }
  if (item.score && map[item.score] !== undefined) return map[item.score]
  return item.value || 0
}

function initRadarChart() {
  if (!radarChartRef.value) return
  if (radarChart) radarChart.dispose()
  radarChart = echarts.init(radarChartRef.value)
  const indicators = abilityIndicators.value
  if (!indicators.length) return
  radarChart.setOption({
    radar: {
      indicator: indicators.map(i => ({ name: i.name, max: 100 })),
      center: ['50%', '50%'],
      radius: '65%',
      axisName: { color: '#1F2329', fontSize: 13, fontWeight: 500 },
      splitArea: {
        areaStyle: {
          color: ['rgba(51,112,255,0.02)', 'rgba(51,112,255,0.04)', 'rgba(51,112,255,0.06)', 'rgba(51,112,255,0.08)'],
        },
      },
      axisLine: { lineStyle: { color: 'rgba(0,0,0,0.1)' } },
    },
    series: [{
      type: 'radar',
      data: [{ value: indicators.map(i => getChartValue(i)), name: '能力评估' }],
      areaStyle: { color: 'rgba(51,112,255,0.2)' },
      lineStyle: { color: '#3370FF', width: 2 },
      itemStyle: { color: '#3370FF' },
      symbol: 'circle',
      symbolSize: 6,
    }],
  })
}

function updateRadarChart() {
  if (!radarChart) return
  const indicators = abilityIndicators.value
  if (!indicators.length) return
  radarChart.setOption({
    radar: {
      indicator: indicators.map(i => ({ name: i.name, max: 100 })),
    },
    series: [{
      data: [{ value: indicators.map(i => getChartValue(i)), name: '能力评估' }],
    }],
  })
}

function initStageChart() {
  if (!stageChartRef.value) return
  if (stageChart) stageChart.dispose()
  stageChart = echarts.init(stageChartRef.value)
  const stageData = reportData.value?.stage_data || []
  if (!stageData.length) return
  const chartValues = stageData.map(d => getChartValue(d))
  stageChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '8%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: { type: 'value', max: 100, axisLabel: { show: true }, splitLine: { lineStyle: { color: '#F0F1F5' } } },
    yAxis: {
      type: 'category',
      data: stageData.map((d, i) => chartValues[i] > 0 ? `${d.name}  ${d.score}` : d.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#1F2329', fontSize: 13, fontWeight: 500 },
    },
    series: [{
      type: 'bar',
      data: stageData.map((d, i) => {
        if (chartValues[i] === 0) return { value: 0, itemStyle: { color: '#E5E6EB' } }
        const colorMap = { A: '#52C41A', B: '#3370FF', C: '#FAAD14', D: '#FF4D4F' }
        return { value: chartValues[i], itemStyle: { color: colorMap[d.score] || '#3370FF', borderRadius: [0, 4, 4, 0] } }
      }),
      barWidth: 22,
      label: {
        show: true,
        position: 'right',
        formatter: (p) => {
          const v = chartValues[p.dataIndex]
          return v > 0 ? stageData[p.dataIndex].score : '未考察'
        },
        color: '#646A73',
        fontSize: 13,
        fontWeight: 500,
      },
    }],
  })
}

function updateStageChart() {
  if (!stageChart) return
  const stageData = reportData.value?.stage_data || []
  if (!stageData.length) return
  const chartValues = stageData.map(d => getChartValue(d))
  stageChart.setOption({
    yAxis: {
      data: stageData.map((d, i) => chartValues[i] > 0 ? `${d.name}  ${d.score}` : d.name),
    },
    series: [{
      data: stageData.map((d, i) => {
        if (chartValues[i] === 0) return { value: 0, itemStyle: { color: '#E5E6EB' } }
        const colorMap = { A: '#52C41A', B: '#3370FF', C: '#FAAD14', D: '#FF4D4F' }
        return { value: chartValues[i], itemStyle: { color: colorMap[d.score] || '#3370FF', borderRadius: [0, 4, 4, 0] } }
      }),
    }],
  })
}

function handleResize() {
  radarChart?.resize()
  stageChart?.resize()
}

function exportPDF() {
  window.print()
}

// ========== Watch ==========
watch(editMode, async (val) => {
  if (!val) return
  await nextTick()
  initCharts()
})

watch(reportData, async () => {
  if (viewMode.value !== 'detail') return
  await nextTick()
  initCharts()
})

// 编辑模式下实时更新图表（深监听编辑数据的变化）
watch(editData, () => {
  if (!editMode.value || viewMode.value !== 'detail') return
  updateRadarChart()
  updateStageChart()
}, { deep: true })
</script>

<style scoped lang="scss">
.feishu-page {
  background-color: #F5F6F7;
  padding: 16px 24px;
  min-height: calc(100vh - 60px);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.card-container {
  background: #FFFFFF;
  border-radius: 8px;
  border: 1px solid #DEE0E3;
  min-height: 80vh;
  box-shadow: 0 2px 8px rgba(31, 35, 41, 0.04);
  padding: 24px;
}

.loading-container-inline,
.empty-container-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
}

/* ===== Generating ===== */
.generating-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 16px;
}
.generating-title {
  font-size: 20px;
  font-weight: 600;
  color: #1F2329;
  margin: 0;
}
.generating-sub {
  font-size: 14px;
  color: #8F959E;
  margin: 0;
}

/* ===== Folder Grid (Root View) ===== */
.folder-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 8px;
}
.folder-card {
  background: #FAFBFC;
  border: 1px solid #E5E6EB;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
.folder-card:hover {
  border-color: #3370FF;
  box-shadow: 0 2px 8px rgba(51, 112, 255, 0.1);
  transform: translateY(-2px);
}
.folder-icon {
  margin-bottom: 8px;
  color: #3370FF;
}
.folder-name {
  font-size: 16px;
  font-weight: 600;
  color: #1F2329;
  margin-bottom: 4px;
}
.folder-meta {
  font-size: 12px;
  color: #8F959E;
}
.folder-time {
  font-size: 11px;
  color: #C0C4CC;
  margin-top: 4px;
}

/* ===== Header ===== */
.header-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.title-area {
  display: flex;
  align-items: center;
  gap: 12px;
}
.title-area h1 {
  font-size: 22px;
  font-weight: 600;
  color: #1F2329;
  margin: 0;
}
.badge {
  display: inline-block;
  background: #FFF7E6;
  color: #D48806;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 10px;
}
.header-actions {
  display: flex;
  gap: 12px;
}

.text-muted {
  color: #C0C4CC;
  font-size: 12px;
}

/* ===== Overview Cards ===== */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.info-card {
  background: #FAFBFC;
  border: 1px solid #E5E6EB;
  border-radius: 8px;
  padding: 16px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.info-row:last-child { margin-bottom: 0; }
.info-label {
  font-size: 13px;
  color: #8F959E;
}
.info-value {
  font-size: 14px;
  color: #1F2329;
  font-weight: 500;
}
.stages-flow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
}
.stage-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
}
.stage-tag.active {
  background: #E8F0FF;
  color: #3370FF;
}
.stage-tag.inactive {
  background: #F0F1F5;
  color: #8F959E;
}
.stage-arrow {
  color: #C0C4CC;
  font-size: 11px;
}

/* ===== Score Summary ===== */
.score-summary-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.score-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #FFFFFF;
  border: 1px solid #E5E6EB;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.score-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}
.overall .score-icon { background: #E8F0FF; color: #3370FF; }
.match .score-icon { background: #E8F8E8; color: #52C41A; }
.recommendation .score-icon { background: #FFF7E6; color: #FAAD14; }
.risk .score-icon { background: #FFF0F0; color: #FF4D4F; }

.score-content { flex: 1; }
.score-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.1;
  color: #1F2329;
}
.score-value.neutral { color: #FAAD14; }
.score-value.not { color: #FF4D4F; }
.score-value.medium { color: #FAAD14; }
.score-value.low { color: #52C41A; }
.score-value.high { color: #FF4D4F; }
.score-label {
  font-size: 13px;
  color: #8F959E;
  margin-top: 2px;
}
.score-range {
  font-size: 12px;
  color: #C0C4CC;
  margin-top: 4px;
}
.score-options {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}
.score-options .opt {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 4px;
  background: #F0F1F5;
  color: #8F959E;
}
.score-options .opt.selected {
  background: #FFF7E6;
  color: #D48806;
  font-weight: 500;
}
.risk-bar {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}
.risk-segment {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #F0F1F5;
}
.risk-segment.active { background: #FAAD14; }
.risk-segment.low.active { background: #52C41A; }
.risk-segment.high.active { background: #FF4D4F; }
.score-edit {
  margin-bottom: 4px;
}

/* ===== Section Card ===== */
.section-card {
  background: #FFFFFF;
  border: 1px solid #E5E6EB;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 20px;
}
.section-title {
  font-size: 17px;
  font-weight: 600;
  color: #1F2329;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}
.section-subtitle {
  font-size: 13px;
  font-weight: 400;
  color: #8F959E;
}

/* ===== Radar Section ===== */
.radar-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.radar-chart-container {
  height: 320px;
}
.radar-chart {
  width: 100%;
  height: 100%;
}
.ability-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ability-item {
  padding: 8px 12px;
  background: #FAFBFC;
  border-radius: 6px;
}
.ability-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ability-icon {
  font-size: 14px;
  width: 20px;
  text-align: center;
}
.ability-icon.good { color: #52C41A; }
.ability-icon.abnormal { color: #FAAD14; }
.ability-icon.normal { color: #3370FF; }
.ability-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #1F2329;
}
.ability-score {
  font-size: 18px;
  font-weight: 700;
  color: #1F2329;
}
.ability-score.good { color: #52C41A; }
.ability-score.abnormal { color: #FAAD14; }
.ability-edit-score {
  margin-left: auto;
}
.ability-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
}
.ability-bar-bg {
  flex: 1;
  height: 6px;
  background: #F0F1F5;
  border-radius: 3px;
  overflow: hidden;
}
.ability-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease;
}
.ability-bar-fill.good { background: linear-gradient(90deg, #52C41A, #73D13D); }
.ability-bar-fill.abnormal { background: linear-gradient(90deg, #FAAD14, #FFC53D); }
.ability-bar-fill.normal { background: linear-gradient(90deg, #3370FF, #597EF7); }
.ability-range {
  font-size: 11px;
  color: #C0C4CC;
  white-space: nowrap;
}
.ability-desc {
  font-size: 12px;
  color: #646A73;
  margin-top: 4px;
  padding-left: 28px;
}
.ability-edit-desc {
  margin-top: 4px;
  padding-left: 28px;
}

/* ===== Stage Chart ===== */
.stage-chart-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.stage-chart-container {
  height: 300px;
}
.stage-chart {
  width: 100%;
  height: 100%;
}
.stage-insights {
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
}
.insight-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 8px;
  font-size: 14px;
  color: #1F2329;
  line-height: 1.6;
}
.insight-item.positive { background: #E8F8E8; }
.insight-item.warning { background: #FFF7E6; }
.insight-icon {
  font-size: 16px;
  flex-shrink: 0;
}
.insight-item.positive .insight-icon { color: #52C41A; }
.insight-item.warning .insight-icon { color: #FAAD14; }

/* ===== Abnormal Findings ===== */
.abnormal-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #FF4D4F;
  font-weight: 500;
}

/* ===== Keywords ===== */
.keywords-section {
  padding: 8px 0;
}
.keyword-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  padding: 12px 0;
  align-items: center;
}
.keyword-tag.freq-high {
  font-size: 15px;
  padding: 6px 16px;
  background: #E8F0FF;
  color: #3370FF;
  border: none;
  font-weight: 600;
}
.keyword-tag.freq-mid {
  font-size: 13px;
  padding: 4px 12px;
  background: #F0F5FF;
  color: #73A3FF;
  border: none;
}
.keyword-tag.freq-low {
  font-size: 12px;
  padding: 3px 10px;
  background: #F5F7FA;
  color: #A0B3CC;
  border: none;
}
.keyword-legend {
  text-align: center;
  font-size: 12px;
  color: #8F959E;
  margin-top: 8px;
}
.freq-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  vertical-align: middle;
  margin-right: 4px;
}
.freq-dot.high { background: #3370FF; }
.freq-dot.mid { background: #73A3FF; }
.freq-dot.low { background: #C0D4F0; }

/* ===== Conclusion ===== */
.conclusion-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 8px;
}
.conclusion-block {
  padding: 16px;
  border-radius: 8px;
}
.conclusion-block.strengths { background: #E8F8E8; }
.conclusion-block.weaknesses { background: #FFF7E6; }
.conclusion-block.suggestions { background: #E8F0FF; }

.block-title {
  font-size: 15px;
  font-weight: 600;
  color: #1F2329;
  margin-bottom: 10px;
}
.conclusion-block ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.conclusion-block li {
  font-size: 13px;
  color: #1F2329;
  line-height: 1.6;
  padding: 3px 0;
  padding-left: 16px;
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
}
.conclusion-block li::before {
  content: '•';
  position: absolute;
  left: 0;
  font-weight: 700;
}
.strengths li::before { color: #52C41A; }
.weaknesses li::before { color: #FAAD14; }
.suggestions li::before { color: #3370FF; }

.final-decision {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 8px 0;
}
.decision-label {
  font-size: 15px;
  font-weight: 600;
  color: #1F2329;
  white-space: nowrap;
}
.next-focus {
  margin-top: 16px;
  padding: 12px 16px;
  background: #FAFBFC;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.next-label {
  font-size: 14px;
  font-weight: 500;
  color: #1F2329;
}
.focus-tag {
  background: #E8F0FF;
  color: #3370FF;
  border: none;
}
</style>

<style>
@media print {
  body, #app, .app-wrapper, .main-wrapper {
    background: white !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    overflow: visible !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  .sidebar, .el-aside, .navbar, .el-header, .el-menu,
  .header-actions, .header-area .header-actions {
    display: none !important;
  }
  .main-wrapper {
    margin-left: 0 !important;
    width: 100% !important;
    overflow: visible !important;
  }
  .feishu-page {
    background: white !important;
    padding: 0 !important;
    min-height: auto !important;
  }
  .card-container {
    box-shadow: none !important;
    border: none !important;
    padding: 10px 20px !important;
  }
  .card-container::before {
    content: '面试报告 - 招聘系统';
    display: block;
    font-size: 18px;
    font-weight: 600;
    color: #1F2329;
    padding: 10px 0 20px 0;
    border-bottom: 2px solid #3370FF;
    margin-bottom: 20px;
  }
  .header-area {
    display: none !important;
  }
  .section-card {
    break-inside: avoid;
  }
}
</style>

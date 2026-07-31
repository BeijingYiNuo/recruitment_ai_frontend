<template>
  <div class="position-page">
    <!-- 操作栏 -->
    <div class="header-area">
      <div class="header-top">
        <div class="title-area">
          <h1>岗位管理</h1>
          <span class="badge" v-if="totalCount > 0">{{ totalCount }}</span>
        </div>
        <div class="action-btn-group">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索岗位名称"
            clearable
            style="width: 220px; margin-right: 12px;"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" @click="openCreateDialog">
            <el-icon><Plus /></el-icon>
            新建岗位
          </el-button>
        </div>
      </div>
      <p class="header-desc">管理招聘岗位及其对应的面试流程，每个岗位可自定义多轮面试环节。</p>
    </div>

    <!-- 岗位列表 -->
    <div class="position-list" v-loading="loading">
      <el-empty v-if="!loading && positions.length === 0" description="暂无岗位，点击上方按钮创建" />

      <el-card
        v-for="pos in positions"
        :key="pos.id"
        class="position-card"
        shadow="never"
      >
        <div class="card-header">
          <div class="card-title">
            <div class="pos-name">
              <span class="name-text">{{ pos.name }}</span>
              <el-tag :type="pos.status === 'ACTIVE' ? 'success' : 'info'" size="small">
                {{ pos.status === 'ACTIVE' ? '启用' : '停用' }}
              </el-tag>
            </div>
            <div class="pos-meta">
              <span v-if="pos.department" class="meta-item">
                <el-icon><OfficeBuilding /></el-icon>
                {{ pos.department }}
              </span>
              <span class="meta-item">
                <el-icon><List /></el-icon>
                {{ pos.round_count }} 轮面试
              </span>
            </div>
          </div>
          <div class="card-actions">
            <el-tooltip v-if="pos.is_locked" content="该岗位已有面试开始，配置已锁定" placement="top">
              <el-tag size="small" type="warning" effect="plain" style="margin-right: 6px;">已锁定</el-tag>
            </el-tooltip>
            <el-button size="small" @click="openRoundsDialog(pos)">面试流程</el-button>
            <el-button size="small" :disabled="pos.is_locked" @click="openEditDialog(pos)">编辑</el-button>
            <el-popconfirm
              title="确认删除此岗位？"
              confirm-button-text="删除"
              @confirm="handleDelete(pos)"
              :disabled="pos.is_locked"
            >
              <template #reference>
                <el-button size="small" type="danger" plain :disabled="pos.is_locked">删除</el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </el-card>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="totalCount > 0" style="margin-top: 16px; display: flex; justify-content: flex-end;">
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

    <!-- 岗位编辑弹窗 -->
    <el-dialog
      v-model="formDialog.visible"
      :title="formDialog.isEdit ? '编辑岗位' : '新建岗位'"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
        label-position="left"
      >
        <el-form-item label="岗位名称" prop="name">
          <el-input v-model="form.name" placeholder="例如：前端开发工程师" maxlength="100" />
        </el-form-item>
        <el-form-item label="所属部门" prop="department">
          <el-input v-model="form.department" placeholder="例如：技术部" maxlength="100" />
        </el-form-item>
        <el-form-item label="薪资范围">
          <el-input v-model="form.salary_range" placeholder="例如：20K-35K" maxlength="100" />
        </el-form-item>
        <el-form-item label="岗位描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="岗位职责描述"
          />
        </el-form-item>
        <el-form-item label="任职要求">
          <el-input
            v-model="form.requirements"
            type="textarea"
            :rows="3"
            placeholder="任职资格要求"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 面试流程管理弹窗（可视化树状图） -->
    <el-dialog
      v-model="roundsDialog.visible"
      title="面试流程"
      width="720px"
      :close-on-click-modal="false"
      top="5vh"
    >
      <div class="rounds-header">
        <el-button size="small" type="primary" :disabled="roundsDialog.isLocked" @click="openAddRoundDialog">
          <el-icon><Plus /></el-icon>
          新增面试轮次
        </el-button>
        <span class="rounds-hint">共 {{ rounds.length }} 轮面试</span>
      </div>
      <el-alert
        v-if="roundsDialog.isLocked"
        title="该岗位已有面试开始，面试流程已锁定，不可修改（含轮次AI面试属性）"
        type="warning"
        show-icon
        :closable="false"
        style="margin-bottom: 12px;"
      />

      <!-- 可视化流程图 -->
      <div class="flow-canvas" v-loading="roundsDialog.loading">
        <el-empty v-if="!roundsDialog.loading && rounds.length === 0" description="暂无面试轮次，点击上方按钮添加" />

        <div class="flow-tree" v-else>
          <template v-for="(round, index) in rounds" :key="round.id">
            <!-- 连接线（非第一个节点） -->
            <div v-if="index > 0" class="flow-connector">
              <div class="connector-line"></div>
              <div class="connector-arrow">
                <el-icon><CaretBottom /></el-icon>
              </div>
            </div>

            <!-- 流程节点 -->
            <div class="flow-node">
              <!-- 左侧时间线 -->
              <div class="node-timeline">
                <div class="node-dot" :class="`dot-${round.round_type.toLowerCase()}`">
                  <span class="dot-number">{{ round.round_number }}</span>
                </div>
                <div v-if="index < rounds.length - 1" class="timeline-line"></div>
              </div>

              <!-- 节点卡片 -->
              <div class="node-card">
                <div class="node-card-header">
                  <div class="node-title-row">
                    <span class="node-name">{{ round.round_name }}</span>
                    <el-tag
                      size="small"
                      :type="roundTypeTag(round.round_type)"
                      effect="plain"
                    >
                      {{ roundTypeLabel(round.round_type) }}
                    </el-tag>
                    <span class="node-duration">
                      <el-icon><Clock /></el-icon>
                      {{ round.duration_minutes }} 分钟
                    </span>
                    <el-tag
                      v-if="round.round_type === 'AI_INTERVIEW'"
                      size="small"
                      type="primary"
                      effect="dark"
                      style="margin-left: 6px;"
                    >AI</el-tag>
                    <el-tag
                      v-else
                      size="small"
                      type="info"
                      effect="plain"
                      style="margin-left: 6px;"
                    >辅助</el-tag>
                  </div>
                  <div class="node-actions">
                    <el-tooltip content="编辑" placement="top">
                      <el-button size="small" circle :disabled="roundsDialog.isLocked" @click="openEditRoundDialog(round)">
                        <el-icon><Edit /></el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="删除" placement="top">
                      <el-button size="small" circle type="danger" plain :disabled="roundsDialog.isLocked" @click="handleDeleteRound(round)">
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </el-tooltip>
                  </div>
                </div>
                <div class="node-card-body" v-if="round.description">
                  <span class="node-desc-label">考察内容：</span>
                  <span class="node-desc-text">{{ round.description }}</span>
                </div>
              </div>
            </div>
          </template>

          <!-- 结束节点 -->
          <div class="flow-connector">
            <div class="connector-line"></div>
            <div class="connector-arrow">
              <el-icon><CaretBottom /></el-icon>
            </div>
          </div>
          <div class="flow-end">
            <div class="end-dot">
              <el-icon><Select /></el-icon>
            </div>
            <span class="end-label">面试结束 — 综合评估</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 面试轮次编辑弹窗 -->
    <el-dialog
      v-model="roundFormDialog.visible"
      :title="roundFormDialog.isEdit ? '编辑轮次' : '新增轮次'"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="roundFormRef"
        :model="roundForm"
        :rules="roundFormRules"
        label-width="100px"
        label-position="left"
      >
        <el-form-item label="轮次名称" prop="round_name">
          <el-select v-model="roundForm.round_name" placeholder="请选择轮次名称" style="width: 100%;">
            <el-option v-for="n in 10" :key="n" :label="roundNameOptions[n - 1]" :value="roundNameOptions[n - 1]" />
          </el-select>
        </el-form-item>
        <el-form-item label="面试类型" prop="round_type">
          <el-select v-model="roundForm.round_type" style="width: 100%">
            <el-option label="技术面" value="TECHNICAL" />
            <el-option label="HR面" value="HR" />
            <el-option label="主管面" value="MANAGER" />
            <el-option label="行为面" value="BEHAVIORAL" />
            <el-option label="笔试" value="WRITTEN" />
            <el-option label="群面" value="GROUP" />
            <el-option label="AI面试" value="AI_INTERVIEW" />
          </el-select>
        </el-form-item>
        <el-form-item label="面试时长">
          <el-input-number v-model="roundForm.duration_minutes" :min="5" :max="180" :step="5" />
          <span style="margin-left: 8px; color: #8f959e;">分钟</span>
        </el-form-item>
        <el-form-item label="内容描述">
          <el-input
            v-model="roundForm.description"
            type="textarea"
            :rows="3"
            placeholder="该轮面试的主要内容/考察点"
          />
        </el-form-item>
        <el-form-item label="AI面试音色" v-if="roundForm.round_type === 'AI_INTERVIEW'">
          <el-select v-model="roundForm.ai_speaker" style="width: 100%">
            <el-option
              v-for="opt in aiSpeakerOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <div style="font-size: 12px; color: #909399; margin-top: 4px;">
            仅 AI 自动面试可用，默认跟随系统音色；确认火山男声（稳重）音色 id 后可在此补充选项
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roundFormDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="savingRounds" @click="handleSaveRound">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, OfficeBuilding, List, CaretBottom, Clock, Edit, Delete, User, Select, Search } from '@element-plus/icons-vue'
import { positionApi } from '../../api/position.js'
import { usePositionStore } from '../../stores/positionStore.js'

const positionStore = usePositionStore()

const loading = ref(false)
const saving = ref(false)
const savingRounds = ref(false)
const positions = ref([])
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)

// 岗位表单
const formRef = ref(null)
const form = reactive({
  name: '',
  department: '',
  salary_range: '',
  description: '',
  requirements: '',
})
const formRules = {
  name: [{ required: true, message: '请输入岗位名称', trigger: 'blur' }],
}
const formDialog = reactive({
  visible: false,
  isEdit: false,
  editId: null,
})

// 轮次管理
const rounds = ref([])
const roundsDialog = reactive({
  visible: false,
  loading: false,
  positionName: '',
  positionId: null,
  isLocked: false,
})

// 轮次名称枚举：一面 ~ 十面
const roundNameOptions = Array.from({ length: 10 }, (_, i) => {
  const chineseNum = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  return `${chineseNum[i]}面`
})

// AI 面试音色选项：默认跟随系统音色；确认火山男声（稳重）音色 id 后在此补充，
// 例如 { label: '男声·稳重', value: 'zh_male_xxx_bigtts' }
const aiSpeakerOptions = [
  { label: '默认音色（跟随系统）', value: '' },
]

// 轮次表单
const roundFormRef = ref(null)
const roundForm = reactive({
  round_name: '',
  round_type: 'TECHNICAL',
  duration_minutes: 30,
  description: '',
  ai_speaker: '',
})
const roundFormRules = {
  round_name: [
    { required: true, message: '请选择轮次名称', trigger: 'change' },
  ],
  round_type: [{ required: true, message: '请选择面试类型', trigger: 'change' }],
}
const roundFormDialog = reactive({
  visible: false,
  isEdit: false,
  editId: null,
})

// ====== 生命周期 ======
onMounted(() => {
  loadPositions()
})

// ====== 数据加载 ======
const loadPositions = async () => {
  loading.value = true
  try {
    const skip = (currentPage.value - 1) * pageSize.value
    const params = { skip, limit: pageSize.value }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    await positionStore.getCachedPositions(async () => {
      const res = await positionApi.list(params)
      const list = Array.isArray(res) ? res : res?.items || res?.data || []
      const total = res.total || list.length
      return { items: list, total }
    })
    // 从 store 同步到本地 ref（支持缓存命中）
    positions.value = positionStore.positions
    totalCount.value = positionStore.totalCount
  } catch (e) {
    console.error('加载岗位列表失败:', e)
    ElMessage.error('加载岗位列表失败')
    positions.value = []
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadPositions()
}

const handlePageChange = (page) => {
  currentPage.value = page
  loadPositions()
}

// ====== 岗位 CRUD ======
const openCreateDialog = () => {
  formDialog.isEdit = false
  formDialog.editId = null
  form.name = ''
  form.department = ''
  form.salary_range = ''
  form.description = ''
  form.requirements = ''
  formDialog.visible = true
}

const openEditDialog = (pos) => {
  formDialog.isEdit = true
  formDialog.editId = pos.id
  form.name = pos.name
  form.department = pos.department || ''
  form.salary_range = pos.salary_range || ''
  form.description = pos.description || ''
  form.requirements = pos.requirements || ''
  formDialog.visible = true
}

const handleSave = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    if (formDialog.isEdit) {
      await positionApi.update(formDialog.editId, {
        name: form.name,
        department: form.department || null,
        salary_range: form.salary_range || null,
        description: form.description || null,
        requirements: form.requirements || null,
      })
      ElMessage.success('岗位更新成功')
    } else {
      await positionApi.create({
        name: form.name,
        department: form.department || null,
        salary_range: form.salary_range || null,
        description: form.description || null,
        requirements: form.requirements || null,
        rounds: [],
      })
      ElMessage.success('岗位创建成功')
    }
    formDialog.visible = false
    positionStore.invalidateCache()
    loadPositions()
  } catch (e) {
    console.error('保存岗位失败:', e)
    ElMessage.error(e?.detail || e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const handleDelete = async (pos) => {
  try {
    await positionApi.delete(pos.id)
    positionStore.invalidateCache()
    ElMessage.success('岗位已删除')
    loadPositions()
  } catch (e) {
    ElMessage.error(e?.detail || e?.message || '删除失败')
  }
}

// ====== 轮次管理 ======
const openRoundsDialog = async (pos) => {
  roundsDialog.positionId = pos.id
  roundsDialog.positionName = pos.name
  roundsDialog.isLocked = !!pos.is_locked
  roundsDialog.visible = true
  await loadRounds()
}

const loadRounds = async () => {
  roundsDialog.loading = true
  try {
    const result = await positionStore.getCachedRounds(roundsDialog.positionId, async () => {
      const res = await positionApi.listRounds(roundsDialog.positionId)
      return Array.isArray(res) ? res : res?.data || []
    })
    rounds.value = result
  } catch (e) {
    console.error('加载轮次失败:', e)
    ElMessage.error('加载面试轮次失败')
    rounds.value = []
  } finally {
    roundsDialog.loading = false
  }
}

const roundTypeLabel = (type) => {
  const map = {
    TECHNICAL: '技术面',
    HR: 'HR面',
    MANAGER: '主管面',
    BEHAVIORAL: '行为面',
    WRITTEN: '笔试',
    GROUP: '群面',
    AI_INTERVIEW: 'AI面试',
  }
  return map[type] || type
}

const roundTypeTag = (type) => {
  const map = {
    TECHNICAL: 'primary',
    HR: 'success',
    MANAGER: 'warning',
    BEHAVIORAL: '',
    WRITTEN: 'info',
    GROUP: 'danger',
    AI_INTERVIEW: 'primary',
  }
  return map[type] || ''
}

const openAddRoundDialog = () => {
  roundFormDialog.isEdit = false
  roundFormDialog.editId = null
  roundForm.round_name = ''
  roundForm.round_type = 'TECHNICAL'
  roundForm.duration_minutes = 30
  roundForm.description = ''
  roundForm.ai_speaker = ''
  roundFormDialog.visible = true
}

const openEditRoundDialog = (round) => {
  roundFormDialog.isEdit = true
  roundFormDialog.editId = round.id
  roundForm.round_name = round.round_name
  roundForm.round_type = round.round_type
  roundForm.duration_minutes = round.duration_minutes
  roundForm.description = round.description || ''
  roundForm.ai_speaker = round.ai_speaker || ''
  roundFormDialog.visible = true
}

const handleSaveRound = async () => {
  const valid = await roundFormRef.value.validate().catch(() => false)
  if (!valid) return

  savingRounds.value = true
  try {
    if (roundFormDialog.isEdit) {
      await positionApi.updateRound(roundsDialog.positionId, roundFormDialog.editId, {
        round_name: roundForm.round_name,
        round_type: roundForm.round_type,
        duration_minutes: roundForm.duration_minutes,
        description: roundForm.description || null,
        ai_speaker: roundForm.ai_speaker || null,
      })
      ElMessage.success('轮次更新成功')
    } else {
      await positionApi.createRound(roundsDialog.positionId, {
        round_name: roundForm.round_name,
        round_type: roundForm.round_type,
        duration_minutes: roundForm.duration_minutes,
        description: roundForm.description || null,
        ai_speaker: roundForm.ai_speaker || null,
      })
      ElMessage.success('轮次添加成功')
    }
    roundFormDialog.visible = false
    positionStore.invalidateCache()
    loadPositions()
    loadRounds()
  } catch (e) {
    console.error('保存轮次失败:', e)
    ElMessage.error(e?.detail || e?.message || '保存失败')
  } finally {
    savingRounds.value = false
  }
}

const handleDeleteRound = async (round) => {
  try {
    await ElMessageBox.confirm('确认删除该轮次？', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await positionApi.deleteRound(roundsDialog.positionId, round.id)
    positionStore.invalidateCache()
    loadPositions()
    ElMessage.success('轮次已删除')
    loadRounds()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e?.detail || e?.message || '删除失败')
    }
  }
}
</script>

<style scoped lang="scss">
.position-page {
  max-width: 960px;
  margin: 0 auto;
}

.header-area {
  margin-bottom: 24px;

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title-area {
      display: flex;
      align-items: center;
      gap: 10px;

      h1 {
        font-size: 20px;
        font-weight: 600;
        color: #1f2329;
        margin: 0;
      }

      .badge {
        background: #3370ff;
        color: #fff;
        font-size: 12px;
        border-radius: 10px;
        padding: 0 8px;
        height: 20px;
        line-height: 20px;
        min-width: 20px;
        text-align: center;
      }
    }
  }

  .header-desc {
    margin: 8px 0 0;
    font-size: 14px;
    color: #8f959e;
  }
}

.position-card {
  margin-bottom: 12px;
  border-radius: 8px;
  border: 1px solid #dee0e3;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    .card-title {
      .pos-name {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 4px;

        .pos-emoji {
          font-size: 24px;
          line-height: 1;
          flex-shrink: 0;
        }

        .name-text {
          font-size: 16px;
          font-weight: 500;
          color: #1f2329;
        }
      }

      .pos-meta {
        display: flex;
        gap: 20px;
        font-size: 13px;
        color: #8f959e;

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }
    }

    .card-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }
  }
}

// ====== 可视化流程图 ======
.rounds-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;

  .rounds-hint {
    font-size: 13px;
    color: #8f959e;
  }
}

.flow-canvas {
  min-height: 120px;
  padding: 0 8px;
}

.flow-tree {
  padding: 8px 0;
}

// 连接线
.flow-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 0;

  .connector-line {
    width: 2px;
    height: 24px;
    background: linear-gradient(to bottom, #c0c4cc, #3370ff);
  }

  .connector-arrow {
    color: #3370ff;
    font-size: 16px;
    line-height: 1;
    margin-top: -2px;
  }
}

// 流程节点
.flow-node {
  display: flex;
  gap: 16px;
  align-items: stretch;
}

// 左侧时间线
.node-timeline {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 40px;
  flex-shrink: 0;
  position: relative;

  .node-dot {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    position: relative;
    z-index: 2;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);

    .dot-number {
      color: #fff;
      font-size: 15px;
      font-weight: 700;
    }

    &.dot-technical {
      background: linear-gradient(135deg, #3370ff, #5886ff);
    }
    &.dot-hr {
      background: linear-gradient(135deg, #00b578, #33c78c);
    }
    &.dot-manager {
      background: linear-gradient(135deg, #f5a623, #f7b945);
    }
    &.dot-behavioral {
      background: linear-gradient(135deg, #9b59b6, #b07cc6);
    }
    &.dot-written {
      background: linear-gradient(135deg, #8f959e, #a8adb4);
    }
    &.dot-group {
      background: linear-gradient(135deg, #e74c3c, #ec7063);
    }
    &.dot-ai_interview {
      background: linear-gradient(135deg, #673ab7, #9575cd);
    }
  }

  .timeline-line {
    width: 2px;
    flex: 1;
    background: repeating-linear-gradient(
      to bottom,
      #d0d5dd 0px,
      #d0d5dd 4px,
      transparent 4px,
      transparent 8px
    );
    position: relative;
    z-index: 1;
  }
}

// 节点卡片
.node-card {
  flex: 1;
  background: #fff;
  border: 1px solid #e8eaed;
  border-radius: 10px;
  padding: 14px 18px;
  transition: all 0.2s ease;
  margin-bottom: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

  &:hover {
    border-color: #3370ff;
    box-shadow: 0 2px 12px rgba(51, 112, 255, 0.10);
    transform: translateX(4px);
  }

  .node-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .node-title-row {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;

      .node-name {
        font-size: 15px;
        font-weight: 600;
        color: #1f2329;
        max-width: 160px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .node-duration {
        font-size: 12px;
        color: #8f959e;
        display: flex;
        align-items: center;
        gap: 3px;
      }
    }

    .node-actions {
      display: flex;
      gap: 6px;
      opacity: 0.4;
      transition: opacity 0.2s;
    }
  }

  &:hover .node-actions {
    opacity: 1;
  }

  .node-card-body {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #f5f5f5;
    font-size: 13px;
    line-height: 1.6;

    .node-desc-label {
      color: #8f959e;
    }

    .node-desc-text {
      color: #4e5969;
    }
  }

  .node-card-footer {
    margin-top: 8px;
    font-size: 12px;
    color: #c0c4cc;

    .node-participants {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
}

// 结束节点
.flow-end {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0 8px 0;

  .end-dot {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #52c41a, #73d13d);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 6px rgba(82, 196, 26, 0.3);

    .el-icon {
      color: #fff;
      font-size: 18px;
    }
  }

  .end-label {
    font-size: 14px;
    font-weight: 500;
    color: #52c41a;
  }
}

</style>

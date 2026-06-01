<template>
  <div class="feishu-page">
    <div class="card-container">

      <!-- Header -->
      <div class="header-area">
        <div class="header-top">
          <div class="title-area">
            <h1>面试报告</h1>
            <span class="badge">待定</span>
          </div>
          <div class="header-actions">
            <el-button class="lark-btn-ghost" @click="$router.push('/dashboard/interview-manage')">返回面试管理</el-button>
            <el-button class="lark-btn-primary" type="primary" @click="exportPDF">导出 PDF</el-button>
          </div>
        </div>
      </div>

      <!-- Overview Cards -->
      <div class="overview-cards">
        <div class="info-card">
          <div class="info-row">
            <span class="info-label">候选人</span>
            <span class="info-value">张某某</span>
          </div>
          <div class="info-row">
            <span class="info-label">面试官</span>
            <span class="info-value">李面试官</span>
          </div>
        </div>
        <div class="info-card">
          <div class="info-row">
            <span class="info-label">应聘岗位</span>
            <span class="info-value">Java 后端开发</span>
          </div>
          <div class="info-row">
            <span class="info-label">面试形式</span>
            <span class="info-value">线上面试</span>
          </div>
        </div>
        <div class="info-card">
          <div class="info-row">
            <span class="info-label">面试日期</span>
            <span class="info-value">2026-05-29</span>
          </div>
          <div class="info-row">
            <span class="info-label">面试时长</span>
            <span class="info-value">32 分钟</span>
          </div>
        </div>
        <div class="info-card stages-card">
          <div class="info-row">
            <span class="info-label">面试阶段</span>
          </div>
          <div class="stages-flow">
            <span class="stage-tag active">开场介绍</span>
            <span class="stage-arrow">→</span>
            <span class="stage-tag active">自我介绍</span>
            <span class="stage-arrow">→</span>
            <span class="stage-tag active">项目深挖</span>
            <span class="stage-arrow">→</span>
            <span class="stage-tag inactive">技术理论</span>
            <span class="stage-arrow">→</span>
            <span class="stage-tag inactive">文化匹配</span>
          </div>
        </div>
      </div>

      <!-- Score Summary Cards -->
      <div class="score-summary-row">
        <div class="score-card overall">
          <div class="score-icon"><el-icon><Medal /></el-icon></div>
          <div class="score-content">
            <div class="score-value">{{ overallScore }}</div>
            <div class="score-label">综合评分</div>
            <div class="score-range">参考: A/B/C/D</div>
          </div>
        </div>
        <div class="score-card match">
          <div class="score-icon"><el-icon><DataAnalysis /></el-icon></div>
          <div class="score-content">
            <div class="score-value">85%</div>
            <div class="score-label">技术匹配度</div>
            <div class="score-range">较匹配</div>
          </div>
        </div>
        <div class="score-card recommendation">
          <div class="score-icon"><el-icon><Document /></el-icon></div>
          <div class="score-content">
            <div class="score-value neutral">待定</div>
            <div class="score-label">推荐意见</div>
            <div class="score-options">
              <span class="opt">建议录用</span>
              <span class="opt selected">待定</span>
              <span class="opt">不建议</span>
            </div>
          </div>
        </div>
        <div class="score-card risk">
          <div class="score-icon"><el-icon><WarningFilled /></el-icon></div>
          <div class="score-content">
            <div class="score-value medium">中等</div>
            <div class="score-label">风险等级</div>
            <div class="risk-bar">
              <div class="risk-segment low"></div>
              <div class="risk-segment medium active"></div>
              <div class="risk-segment high"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Radar Chart + Ability Indicators -->
      <div class="section-card">
        <h2 class="section-title">能力评估</h2>
        <div class="radar-section">
          <div class="radar-chart-container">
            <div ref="radarChartRef" class="radar-chart"></div>
          </div>
          <div class="ability-list">
            <div v-for="item in abilityIndicators" :key="item.name" class="ability-item">
              <div class="ability-header">
                <span class="ability-icon" :class="item.status">{{ item.status === 'good' ? '★' : item.status === 'abnormal' ? '⚠' : '✓' }}</span>
                <span class="ability-name">{{ item.name }}</span>
                <span class="ability-score" :class="item.status">{{ item.score }}</span>
              </div>
              <div class="ability-bar-wrapper">
                <div class="ability-bar-bg">
                  <div class="ability-bar-fill" :class="item.status" :style="{ width: abilityBarWidth(item.score) }"></div>
                </div>
                <span class="ability-range">参考: A/B/C/D</span>
              </div>
              <div class="ability-desc">{{ item.desc }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stage Comparison Bar Chart -->
      <div class="section-card">
        <h2 class="section-title">各阶段表现</h2>
        <div class="stage-chart-section">
          <div class="stage-chart-container">
            <div ref="stageChartRef" class="stage-chart"></div>
          </div>
          <div class="stage-insights">
            <div class="insight-item positive">
              <span class="insight-icon">★</span>
              <span>项目深挖阶段表现最充分，技术细节回答详实</span>
            </div>
            <div class="insight-item warning">
              <span class="insight-icon">⚠</span>
              <span>技术理论阶段未覆盖，建议后续轮次补充考察</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Abnormal Findings Table -->
      <div class="section-card">
        <h2 class="section-title">
          异常发现
          <span class="section-subtitle">需关注的技术盲区与风险点</span>
        </h2>
        <el-table :data="abnormalFindings" style="width: 100%" stripe :header-cell-style="{ background: '#FAFBFC', color: '#1F2329', fontWeight: 600 }">
          <el-table-column prop="item" label="异常项目" width="120">
            <template #default="{ row }">
              <span class="abnormal-item"><el-icon><WarningFilled /></el-icon> {{ row.item }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="finding" label="异常描述" min-width="200" />
          <el-table-column prop="detail" label="详细说明" min-width="280" />
          <el-table-column prop="severity" label="严重程度" width="100">
            <template #default="{ row }">
              <el-tag :type="severityType(row.severity)" size="small">{{ row.severity }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="suggested_action" label="处理建议" min-width="200" />
        </el-table>
      </div>


      <!-- Tech Keywords -->
      <div class="section-card">
        <h2 class="section-title">技术关键词</h2>
        <div class="keywords-section">
          <div class="keyword-tags">
            <el-tag v-for="kw in techKeywords" :key="kw.text" :class="'freq-' + kw.freq" class="keyword-tag">{{ kw.text }}</el-tag>
          </div>
          <div class="keyword-legend">
            <span class="freq-dot high"></span> 高频提及
            <span class="freq-dot mid" style="margin-left: 20px;"></span> 中频
            <span class="freq-dot low" style="margin-left: 20px;"></span> 低频
          </div>
        </div>
      </div>

      <!-- Key Dialogue Highlights -->
      <div class="section-card">
        <h2 class="section-title">关键对话摘录</h2>
        <div class="dialogue-list">
          <div v-for="(d, i) in dialogueHighlights" :key="i" class="dialogue-item">
            <div class="dialogue-speaker">
              <span class="speaker-tag" :class="d.speaker === '面试官' ? 'interviewer' : 'candidate'">{{ d.speaker }}</span>
            </div>
            <div class="dialogue-content">
              <div class="dialogue-text">{{ d.content }}</div>
              <div v-if="d.evaluation" class="dialogue-eval">{{ d.evaluation }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Conclusion & Recommendation -->
      <div class="section-card conclusion-card">
        <h2 class="section-title">总检结论与建议</h2>
        <div class="conclusion-grid">
          <div class="conclusion-block strengths">
            <div class="block-title">优势</div>
            <ul>
              <li v-for="(s, i) in conclusion.strengths" :key="i">{{ s }}</li>
            </ul>
          </div>
          <div class="conclusion-block weaknesses">
            <div class="block-title">不足</div>
            <ul>
              <li v-for="(w, i) in conclusion.weaknesses" :key="i">{{ w }}</li>
            </ul>
          </div>
          <div class="conclusion-block suggestions">
            <div class="block-title">建议</div>
            <ul>
              <li v-for="(s, i) in conclusion.suggestions" :key="i">{{ s }}</li>
            </ul>
          </div>
        </div>
        <el-divider />
        <div class="final-decision">
          <div class="decision-label">综合决定</div>
          <div class="decision-options">
            <el-radio-group v-model="finalDecision" size="large">
              <el-radio-button value="recommend" class="decision-recommend">建议录用</el-radio-button>
              <el-radio-button value="neutral" class="decision-neutral">待定</el-radio-button>
              <el-radio-button value="not_recommend" class="decision-not">不建议录用</el-radio-button>
            </el-radio-group>
          </div>
        </div>
        <div class="next-focus">
          <span class="next-label">下阶段重点关注：</span>
          <el-tag v-for="f in conclusion.nextFocus" :key="f" class="focus-tag">{{ f }}</el-tag>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { Medal, DataAnalysis, Document, WarningFilled } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// ========== Mock Data ==========
const overallScore = ref('B')
const finalDecision = ref('neutral')

const abilityIndicators = [
  { name: '逻辑思维', score: 'B', range: 'A/B/C/D', status: 'normal', desc: '结构清晰，论证合理', value: 75 },
  { name: '表达沟通', score: 'B', range: 'A/B/C/D', status: 'normal', desc: '语言流畅，重点突出', value: 70 },
  { name: '内生动力', score: 'A', range: 'A/B/C/D', status: 'good', desc: '学习意愿强，有明确职业规划', value: 90 },
  { name: '技术深度', score: 'C', range: 'A/B/C/D', status: 'abnormal', desc: '停留在使用层面，缺乏原理性思考', value: 55 },
  { name: '项目匹配', score: 'B', range: 'A/B/C/D', status: 'normal', desc: '电商项目经验与岗位匹配', value: 78 },
]

const abnormalFindings = [
  { item: '技术深度', finding: 'Seata AT 模式高并发瓶颈无意识', detail: '候选人提到使用了 Seata AT 模式处理分布式事务，但被追问到高并发下 atlog 表写入压力时，未能意识到该场景下 AT 模式的性能瓶颈', severity: '中', suggested_action: '下轮面试重点考察分布式事务原理和 Seata 源码理解' },
  { item: '项目经验', finding: '个人贡献占比不明确', detail: '候选人在项目中负责订单、库存、支付等多个模块，但哪些是独立设计实现、哪些在指导下完成不够清晰', severity: '低', suggested_action: '追问具体技术方案设计过程和遇到的困难' },
  { item: '技术广度', finding: '未涉及技术理论基础考察', detail: '本次面试主要集中在项目经验层面，未覆盖 JVM、并发编程、数据结构等基础知识', severity: '中', suggested_action: '建议安排第二轮技术面补充考察' },
]

const stageData = [
  { name: '开场介绍', score: 'B', value: 70 },
  { name: '自我介绍', score: 'B', value: 75 },
  { name: '项目深挖', score: 'A', value: 88 },
  { name: '技术理论', score: '-', value: 0 },
  { name: '文化匹配', score: '-', value: 0 },
  { name: '候选人提问', score: '-', value: 0 },
  { name: '结束总结', score: '-', value: 0 },
]

const techKeywords = [
  { text: 'Java', freq: 'high' },
  { text: 'Spring Cloud', freq: 'high' },
  { text: '微服务', freq: 'high' },
  { text: 'Seata', freq: 'high' },
  { text: 'AT 模式', freq: 'mid' },
  { text: '分布式事务', freq: 'high' },
  { text: 'Redis', freq: 'mid' },
  { text: 'MySQL', freq: 'mid' },
  { text: '订单服务', freq: 'high' },
  { text: '库存服务', freq: 'high' },
  { text: '支付服务', freq: 'mid' },
  { text: '商品服务', freq: 'mid' },
  { text: '高并发', freq: 'mid' },
  { text: 'atlog 表', freq: 'low' },
  { text: '服务拆分', freq: 'mid' },
  { text: '接口化', freq: 'low' },
  { text: '电商', freq: 'high' },
  { text: '大促', freq: 'low' },
]

const dialogueHighlights = [
  { speaker: '面试官', content: '做这个项目是单体还是微服务？你负责的这个模块具体是做啥的？', evaluation: '' },
  { speaker: '候选人', content: '基于 Spring Cloud 微服务架构，拆分了商品、订单、库存、支付服务，我主要负责订单和库存', evaluation: '回答清晰，有自己的项目理解' },
  { speaker: '面试官', content: '订单和库存之间的数据一致性怎么保证的？', evaluation: '' },
  { speaker: '候选人', content: '用了 Seata 的 AT 模式处理分布式事务', evaluation: '知道工具但缺乏深入理解' },
  { speaker: '面试官', content: '那 AT 模式在高并发下会有什么问题吗？', evaluation: '' },
  { speaker: '候选人', content: '呃...这个...atlog 表写入压力会比较大', evaluation: '被追问后意识到问题，但缺乏系统性的解决方案描述' },
]

const conclusion = {
  strengths: ['技术栈（Java/Spring Cloud）与岗位高度匹配', '有完整的电商微服务项目落地经验', '沟通表达能力强，逻辑清晰', '学习意愿强，有明确职业规划'],
  weaknesses: ['技术原理理解停留在使用层面，缺乏深入思考', '高并发实战经验不足，缺乏性能优化数据', '项目难点总结能力有待加强'],
  suggestions: ['补充技术理论基础面试（JVM、并发、数据结构）', '深入考察分布式系统设计能力', '追问具体技术方案的设计过程和取舍'],
  nextFocus: ['分布式事务原理', '高并发系统设计', '性能调优经验', '源码理解深度'],
}

// ========== Chart Helpers ==========
function abilityBarWidth(score) {
  const map = { A: '85%', B: '65%', C: '45%', D: '25%' }
  return map[score] || '50%'
}

function severityType(severity) {
  const map = { '高': 'danger', '中': 'warning', '低': 'info' }
  return map[severity] || 'info'
}

// ========== Chart Refs ==========
const radarChartRef = ref(null)
const stageChartRef = ref(null)
let radarChart = null
let stageChart = null

function initRadarChart() {
  if (!radarChartRef.value) return
  radarChart = echarts.init(radarChartRef.value)
  radarChart.setOption({
    radar: {
      indicator: abilityIndicators.map(i => ({ name: i.name, max: 100 })),
      center: ['50%', '50%'],
      radius: '65%',
      axisName: {
        color: '#1F2329',
        fontSize: 13,
        fontWeight: 500,
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(51,112,255,0.02)', 'rgba(51,112,255,0.04)', 'rgba(51,112,255,0.06)', 'rgba(51,112,255,0.08)'],
        },
      },
      axisLine: { lineStyle: { color: 'rgba(0,0,0,0.1)' } },
    },
    series: [{
      type: 'radar',
      data: [{ value: abilityIndicators.map(i => i.value), name: '能力评估' }],
      areaStyle: { color: 'rgba(51,112,255,0.2)' },
      lineStyle: { color: '#3370FF', width: 2 },
      itemStyle: { color: '#3370FF' },
      symbol: 'circle',
      symbolSize: 6,
    }],
  })
}

function initStageChart() {
  if (!stageChartRef.value) return
  stageChart = echarts.init(stageChartRef.value)
  const hasValue = stageData.filter(d => d.value > 0)
  const noValue = stageData.filter(d => d.value === 0)

  stageChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '8%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: { type: 'value', max: 100, axisLabel: { show: true }, splitLine: { lineStyle: { color: '#F0F1F5' } } },
    yAxis: {
      type: 'category',
      data: stageData.map(d => {
        const hasScore = d.value > 0
        return hasScore ? `${d.name}  ${d.score}` : d.name
      }),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#1F2329', fontSize: 13, fontWeight: 500 },
    },
    series: [
      {
        type: 'bar',
        data: stageData.map(d => {
          if (d.value === 0) return { value: 0, itemStyle: { color: '#E5E6EB' } }
          const colorMap = { A: '#52C41A', B: '#3370FF', C: '#FAAD14', D: '#FF4D4F' }
          return { value: d.value, itemStyle: { color: colorMap[d.score] || '#3370FF', borderRadius: [0, 4, 4, 0] } }
        }),
        barWidth: 22,
        label: {
          show: true,
          position: 'right',
          formatter: (p) => {
            const d = stageData[p.dataIndex]
            return d.value > 0 ? d.score : '未考察'
          },
          color: '#646A73',
          fontSize: 13,
          fontWeight: 500,
        },
      },
    ],
  })
}


function initKeywordChart() {
  // 使用 el-tag 展示关键词，无需 echarts-wordcloud 插件
}

// ========== Resize Handler ==========
function handleResize() {
  radarChart?.resize()
  stageChart?.resize()
}

function exportPDF() {
  window.print()
}

onMounted(async () => {
  await nextTick()
  initRadarChart()
  initStageChart()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  radarChart?.dispose()
  stageChart?.dispose()
})
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

/* ===== Score Summary Cards ===== */
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
.score-value.medium { color: #FAAD14; }
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
.risk-segment.low { background: #52C41A; }
.risk-segment.high { background: #FF4D4F; }

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
.insight-item.positive {
  background: #E8F8E8;
}
.insight-item.warning {
  background: #FFF7E6;
}
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

/* ===== Dialogue ===== */
.dialogue-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dialogue-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: #FAFBFC;
  border-radius: 8px;
  border-left: 3px solid #E5E6EB;
}
.dialogue-item:has(.speaker-tag.interviewer) {
  border-left-color: #3370FF;
}
.dialogue-item:has(.speaker-tag.candidate) {
  border-left-color: #52C41A;
}
.dialogue-speaker {
  flex-shrink: 0;
  width: 60px;
}
.speaker-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}
.speaker-tag.interviewer { background: #E8F0FF; color: #3370FF; }
.speaker-tag.candidate { background: #E8F8E8; color: #52C41A; }
.dialogue-content { flex: 1; }
.dialogue-text {
  font-size: 14px;
  color: #1F2329;
  line-height: 1.6;
}
.dialogue-eval {
  font-size: 12px;
  color: #646A73;
  margin-top: 4px;
  padding: 4px 10px;
  background: #F0F1F5;
  border-radius: 4px;
  display: inline-block;
}

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

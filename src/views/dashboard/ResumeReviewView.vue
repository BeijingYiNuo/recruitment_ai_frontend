<template>
  <div class="feishu-page">
    <div class="card-container">
      <!-- Header: 标题 + Tabs + 右侧工具 同一行 -->
      <div class="header-area">
        <div class="filter-bar">
          <h1 class="page-title">简历审核</h1>

          <!-- Group 1: Status Tabs -->
          <div class="filter-group filter-group-tabs">
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
          </div>

          <div class="filter-group-spacer"></div>

          <!-- Group 2: Search + Date + Batch + View -->
          <div class="filter-group filter-group-right">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索候选人姓名"
              clearable
              style="width: 160px;"
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
              style="width: 240px;"
              @change="handleSearch"
            />
            <el-button size="small" type="primary" plain @click="openBatchAiReview" :loading="batchAiReviewRunning">
              <el-icon><MagicStick /></el-icon> 批量 AI 审核
            </el-button>
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
      </div>

      <!-- ====== List Mode ====== -->
      <div v-if="viewMode === 'list'" v-loading="loading" class="review-area">
        <el-empty v-if="resumes.length === 0 && !loading" description="暂无候选人简历" style="padding: 80px 0" />
        <div v-else class="list-table-wrapper">
          <div class="list-header">
            <div class="col-name">候选人</div>
            <div class="col-status">审核状态</div>
            <div class="col-ai-review">AI 建议</div>
            <div class="col-time">上传时间</div>
            <div class="col-action">操作</div>
          </div>
          <div class="list-body">
            <div
              v-for="(r, i) in resumes"
              :key="r.id"
              class="list-row"
              :class="{ even: i % 2 === 0 }"
              @click="handleRowClick(i)"
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
              <div class="col-ai-review">
                <span v-if="getAiSuggestion(r)" class="lark-tag ai-suggestion-tag" :class="resultTagClass(getAiSuggestion(r))" style="cursor:pointer;" @click.stop="viewAiReviewDetail(r)">{{ aiSuggestionLabel(getAiSuggestion(r)) }}</span>
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
          <div class="pagination-wrapper" v-if="totalCount > 0">
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

      <!-- ====== Detail Mode ====== -->
      <div v-if="viewMode === 'detail'" class="review-area" v-loading="loading">
        <el-empty v-if="resumes.length === 0 && !loading" description="暂无待审核简历" style="padding: 80px 0" />
        <template v-if="resumes.length > 0">
          <div class="split-panel" :class="{ 'is-dragging': isDragging }">
            <!-- Left Panel -->
            <div class="left-panel" :style="{ width: splitPercent + '%' }">
              <!-- 合并顶部栏：头像 + 姓名 + 状态 + 类型 + 岗位/学历 + 下载 + 缩放 -->
              <div class="left-top-bar">
                <el-avatar :size="26" class="bar-avatar">
                  {{ currentResume?.candidate_name?.charAt(0) || '?' }}
                </el-avatar>
                <span class="bar-name">{{ currentResume?.candidate_name }}</span>
                <span class="lark-tag bar-tag" :class="statusTagClass(currentResume?.review_status)">{{ statusLabel(currentResume?.review_status) }}</span>
                <span class="lark-tag tag-gray bar-tag">{{ currentResume?.file_type?.toUpperCase() }}</span>
                <span v-if="appliedPosition" class="bar-info-item">
                  <el-icon><Briefcase /></el-icon> {{ appliedPosition }}
                </span>
                <span v-if="latestEducation" class="bar-info-item">
                  <el-icon><Reading /></el-icon> {{ latestEducation.degree }} · {{ latestEducation.major }}
                </span>
                <span v-if="latestEducation?.end_date" class="bar-info-item bar-year">
                  {{ new Date(latestEducation.end_date).getFullYear() }}届
                </span>
                <div class="bar-spacer"></div>
                <el-button size="small" text type="primary" class="bar-dl-btn" @click="handleDownload">
                  <el-icon><Download /></el-icon>
                </el-button>
                <div class="bar-zoom">
                  <el-button size="small" text class="bar-zoom-btn" @click="zoomOut" :disabled="zoomLevel <= 50">
                    <el-icon><ZoomOut /></el-icon>
                  </el-button>
                  <span class="bar-zoom-level">{{ zoomLevel }}%</span>
                  <el-button size="small" text class="bar-zoom-btn" @click="zoomIn" :disabled="zoomLevel >= 200">
                    <el-icon><ZoomIn /></el-icon>
                  </el-button>
                  <el-button size="small" text class="bar-fit-btn" @click="zoomFit">适配宽度</el-button>
                </div>
              </div>

              <!-- 文件预览 -->
              <div class="file-preview" v-loading="previewLoading" element-loading-text="加载预览中...">
                <div class="preview-inner">
                  <template v-if="fileType === 'pdf' && pdfPageUrls.length">
                    <img v-for="(pageUrl, i) in pdfPageUrls" :key="i" :src="pageUrl" class="file-image" :style="previewStyle" alt="简历预览" />
                  </template>
                  <img v-else-if="isImageType && fileUrl" :src="fileUrl" class="file-image" :style="previewStyle" alt="简历预览" />
                  <div v-else class="file-fallback">
                    <el-icon :size="48" color="#8F959E"><Document /></el-icon>
                    <p>暂不支持该文件类型在线预览</p>
                  </div>
                </div>
              </div>

              <!-- 上一份 / 下一份 -->
              <div class="preview-nav">
                <el-button text :disabled="currentIndex === 0" @click="prev">
                  <el-icon><ArrowLeft /></el-icon> 上一份
                </el-button>
                <span class="preview-progress-text">{{ currentIndex + 1 }} / {{ resumes.length }}</span>
                <div class="preview-dots">
                  <span
                    v-for="(r, i) in resumes"
                    :key="r.id"
                    class="dot"
                    :class="{ active: i === currentIndex, reviewed: i < currentIndex }"
                    @click="goTo(i)"
                  />
                </div>
                <el-button text :disabled="currentIndex === resumes.length - 1" @click="next">
                  下一份 <el-icon><ArrowRight /></el-icon>
                </el-button>
              </div>
            </div>

            <!-- 可拖拽分割线 -->
            <div
              class="split-divider"
              :class="{ 'is-dragging': isDragging }"
              @mousedown.prevent="startDrag"
            ></div>

            <!-- Right Panel -->
            <div class="right-panel" :style="{ width: (100 - splitPercent) + '%' }">
              <!-- 固定顶部区域 -->
              <div class="right-panel-sticky">
                <div class="panel-header">
                  <span class="panel-title">简历详情</span>
                  <span class="position-label">应聘岗位</span>
                  <el-select
                    :model-value="currentResume?.position_id ?? null"
                    placeholder="选择岗位（选填）"
                    size="small"
                    clearable
                    filterable
                    :loading="positionLoading"
                    style="flex: 1; max-width: 260px; min-width: 120px;"
                    @change="handlePositionChange"
                  >
                    <el-option
                      v-for="pos in positions"
                      :key="pos.id"
                      :label="pos.name + (pos.department ? ' · ' + pos.department : '')"
                      :value="pos.id"
                    />
                  </el-select>
                  <el-button size="small" plain :disabled="reviewing || aiReviewLoading" @click="openAiReview">
                    <el-icon><MagicStick /></el-icon> AI审核
                  </el-button>
                </div>
                <div v-if="currentResumeAiReview" class="ai-review-summary" :class="{ collapsed: isAiReviewCollapsed }" @click="toggleAiReview">
                  <div class="ai-review-summary-header">
                    <el-icon><MagicStick /></el-icon> AI 审核意见
                    <span class="lark-tag" :class="resultTagClass(currentResumeAiReview.suggestion)" style="margin-left: 6px;">{{ aiSuggestionLabel(currentResumeAiReview.suggestion) }}</span>
                    <el-icon class="collapse-arrow"><ArrowDown /></el-icon>
                  </div>
                  <div class="ai-review-summary-body">{{ currentResumeAiReview.reason }}</div>
                  <div v-if="currentResumeAiReview.matched_points?.length" class="ai-review-points">
                    <div class="points-title points-matched">匹配点</div>
                    <div v-for="(pt, i) in currentResumeAiReview.matched_points" :key="i" class="point-item point-matched">● {{ pt }}</div>
                  </div>
                  <div v-if="currentResumeAiReview.gaps?.length" class="ai-review-points">
                    <div class="points-title points-gap">不足点</div>
                    <div v-for="(pt, i) in currentResumeAiReview.gaps" :key="i" class="point-item point-gap">● {{ pt }}</div>
                  </div>
                </div>
              </div>

              <!-- 可滚动内容区域 -->
              <div class="parsed-content" v-loading="detailLoading">
                <div class="detail-section" v-if="parsedData.educations.length">
                  <div class="section-title"><el-icon><Reading /></el-icon> 教育经历</div>
                  <div v-for="edu in parsedData.educations" :key="edu.id" class="detail-item">
                    <div class="detail-main">
                      {{ edu.school_name }}
                      <span v-if="edu.is_985" class="school-tag tag-985">985</span>
                      <span v-if="edu.is_211" class="school-tag tag-211">211</span>
                    </div>
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
    <el-dialog v-model="remarkVisible" title="备注" width="420px" destroy-on-close @close="remarkVisible = false">
      <el-input v-model="remarkText" type="textarea" :rows="8" placeholder="在此写下备注信息，边看简历边记录..." maxlength="1000" show-word-limit />
      <template #footer>
        <el-button @click="remarkVisible = false">取消</el-button>
        <el-button type="primary" class="lark-btn-primary" :loading="savingRemark" @click="handleSaveRemark">保存</el-button>
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
    <el-dialog v-model="batchAiReviewVisible" width="680px" destroy-on-close :close-on-click-modal="false" @close="batchPendingResumes = []" class="batch-dialog">
      <template #header>
        <div class="batch-dialog-header">
          <el-icon class="batch-dialog-icon"><MagicStick /></el-icon>
          <span class="batch-dialog-title">批量 AI 简历智能审核</span>
        </div>
      </template>

      <template v-if="batchAiReviewResults.length === 0">
        <!-- 蓝色提示条 -->
        <div class="batch-info-bar">
          待审核简历 <strong>{{ batchPendingResumes.length }}</strong> 份，已选 <strong>{{ batchSelectedResumeIds.length }}</strong> 份
        </div>

        <!-- 审核规则配置 -->
        <div class="batch-section">
          <div class="batch-section-title">审核规则配置</div>
          <el-form label-position="top" class="batch-form">
            <el-form-item label="岗位名称" class="batch-form-item">
              <div class="batch-field-row">
                <span class="required-star">*</span>
                <el-select
                  v-model="batchSelectedPositionId"
                  placeholder="请选择岗位"
                  clearable
                  filterable
                  class="batch-select"
                  @change="handleBatchPositionChange"
                >
                  <el-option v-for="p in positions" :key="p.id" :label="p.name" :value="p.id" />
                </el-select>
              </div>
            </el-form-item>
            <el-form-item label="岗位描述（JD）" class="batch-form-item">
              <div class="jd-field-wrap">
                <div class="jd-toolbar">
                  <span class="jd-word-count">{{ batchAiReviewForm.jd.length }} / 2000 字</span>
                  <el-button v-if="batchAiReviewForm.jd" size="small" text class="jd-clear-btn" @click="batchAiReviewForm.jd = ''">清空</el-button>
                </div>
                <el-input
                  v-model="batchAiReviewForm.jd"
                  type="textarea"
                  :rows="5"
                  placeholder="请粘贴岗位描述文本，AI 将根据 JD 中的职责、要求、偏好等信息对候选人进行综合评估"
                  maxlength="2000"
                />
              </div>
            </el-form-item>
            <el-form-item label="自定义要求" class="batch-form-item">
              <el-input
                v-model="batchAiReviewForm.custom_requirements"
                type="textarea"
                :rows="3"
                placeholder="例如：期望候选人有大厂背景、5年以上团队管理经验、熟悉微服务架构..."
              />
            </el-form-item>
            <el-form-item label="需求人数" class="batch-form-item">
              <div class="batch-field-row">
                <el-input-number
                  v-model="batchAiReviewForm.headcount"
                  :min="1"
                  :max="100"
                  controls-position="right"
                  class="batch-headcount-input"
                />
                <span class="batch-field-note">AI优先推荐匹配前 {{ batchAiReviewForm.headcount }} 位候选人</span>
              </div>
            </el-form-item>
          </el-form>
        </div>

        <div class="batch-section-divider"></div>

        <!-- 待审核候选人列表 -->
        <div class="batch-section">
          <div class="batch-section-header">
            <span class="batch-section-title">待审核候选人列表</span>
            <span class="batch-select-all" @click="handleBatchSelectAll">
              {{ allSelected ? '取消全选' : '全选' }}
            </span>
          </div>
          <div class="batch-candidate-list">
            <div
              v-for="(r, i) in batchPendingResumes"
              :key="r.id"
              class="batch-candidate-row"
              @click="toggleBatchSelect(r.id)"
            >
              <el-checkbox :model-value="batchSelectedResumeIds.includes(r.id)" class="batch-candidate-checkbox" size="small" />
              <el-avatar :size="28" class="batch-candidate-avatar">{{ r.candidate_name?.charAt(0) || '?' }}</el-avatar>
              <span class="batch-candidate-name">{{ r.candidate_name }}</span>
              <span class="lark-tag tag-info">{{ statusLabel(r.review_status) }}</span>
            </div>
            <div v-if="batchPendingResumes.length === 0" class="batch-candidate-empty">暂无待审核简历</div>
          </div>
        </div>
      </template>

      <!-- 审核结果 -->
      <template v-else>
        <div class="batch-section">
          <div class="batch-section-title">审核结果（{{ batchAiReviewResults.length }}）</div>
          <div class="batch-result-list">
            <div v-for="(item, i) in batchAiReviewResults" :key="item.resume_id" class="batch-result-row" :class="{ even: i % 2 === 0 }">
              <div class="batch-result-left">
                <span class="batch-result-index">{{ i + 1 }}.</span>
                <span class="batch-result-name">{{ item.candidate_name || ('简历 ' + item.resume_id) }}</span>
                <span v-if="item.error" class="lark-tag tag-red">失败</span>
                <span v-else class="lark-tag" :class="resultTagClass(item.result?.suggestion)">{{ aiSuggestionLabel(item.result?.suggestion) }}</span>
                <span v-if="item.result?.reason" class="batch-result-reason" :title="item.result.reason">{{ item.result.reason.slice(0, 50) }}{{ item.result.reason.length > 50 ? '...' : '' }}</span>
              </div>
              <div v-if="!item.error && !item._reviewed" class="batch-result-actions">
                <el-button size="small" class="row-action-btn pass" @click="batchApplyReview(item, 'PASS')">通过</el-button>
                <el-button size="small" class="row-action-btn pending" @click="batchApplyReview(item, 'PENDING')">待定</el-button>
                <el-button size="small" class="row-action-btn fail" @click="batchApplyReview(item, 'FAIL')">淘汰</el-button>
              </div>
              <div v-else-if="item._reviewed" class="batch-result-done">
                已{{ { PASS: '通过', PENDING: '待定', FAIL: '淘汰' }[item._decision] || '处理' }}
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="batch-footer">
          <el-button class="batch-btn-cancel" @click="batchAiReviewVisible = false; batchAiReviewResults = []">关闭</el-button>
          <el-tooltip v-if="batchSelectedResumeIds.length === 0 && batchAiReviewResults.length === 0" content="请至少勾选一位候选人" placement="top">
            <span>
              <el-button type="primary" class="batch-btn-primary" disabled>
                <el-icon><MagicStick /></el-icon> 开始AI批量审核
              </el-button>
            </span>
          </el-tooltip>
          <el-button
            v-else-if="batchAiReviewResults.length === 0"
            type="primary"
            class="batch-btn-primary"
            :loading="batchAiReviewRunning"
            @click="startBatchAiReview"
          >
            <el-icon><MagicStick /></el-icon> 开始AI批量审核
          </el-button>
          <el-button
            v-else
            type="primary"
            class="batch-btn-primary"
            @click="resetBatchReview"
          >
            <el-icon><MagicStick /></el-icon> 开始新审核
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- AI 审核详情弹窗（列表模式点击 AI 建议标签查看） -->
    <el-dialog v-model="aiReviewDetailVisible" title="AI 审核详情" width="520px" destroy-on-close @close="aiReviewDetailData = null">
      <div v-if="aiReviewDetailData" class="ai-review-result">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
          <span class="lark-tag" :class="resultTagClass(aiReviewDetailData.suggestion)">
            {{ statusLabel(aiReviewDetailData.suggestion) }}
          </span>
          <span style="font-size:13px;color:#646a73;">AI 建议</span>
        </div>
        <div style="margin-bottom:12px;font-size:14px;line-height:1.6;color:#1f2329;white-space:pre-wrap;">{{ aiReviewDetailData.reason }}</div>
        <div v-if="aiReviewDetailData.matched_points?.length" style="margin-bottom:8px;">
          <div style="font-size:13px;font-weight:600;color:#52c41a;margin-bottom:4px;">匹配点</div>
          <div v-for="(pt, i) in aiReviewDetailData.matched_points" :key="i" style="font-size:13px;color:#646a73;padding:2px 0;">● {{ pt }}</div>
        </div>
        <div v-if="aiReviewDetailData.gaps?.length">
          <div style="font-size:13px;font-weight:600;color:#ff4d4f;margin-bottom:4px;">不足点</div>
          <div v-for="(pt, i) in aiReviewDetailData.gaps" :key="i" style="font-size:13px;color:#646a73;padding:2px 0;">● {{ pt }}</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="aiReviewDetailVisible = false">关闭</el-button>
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
import { useRouter, useRoute } from 'vue-router'
import { useResumeStore } from '../../stores/resumeStore'
import { resumeApi } from '../../api/resume'
import { positionApi } from '../../api/position'
import { ElMessage } from 'element-plus'
import InterviewQuestionsFloat from '../../components/InterviewQuestionsFloat.vue'
import {
  ArrowLeft, ArrowRight, ArrowDown, Close, QuestionFilled, Check, Document, EditPen, MagicStick,
  Reading, Briefcase, Coin, Collection, List, Grid, Plus, Search,
  Download, ZoomIn, ZoomOut
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const resumeStore = useResumeStore()
const resumes = ref([])
const currentIndex = ref(0)
const fileUrl = ref('')
const previewLoading = ref(false)
const pdfPageCount = ref(0)
const pdfPageUrls = ref([])
const reviewing = ref(false)
const reviewingId = ref(null)
const remarkVisible = ref(false)
const remarkText = ref('')
const remarkMap = reactive({})
const savingRemark = ref(false)
const activeFilter = ref('null')
const detailLoading = ref(false)
const viewMode = ref('list')
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)
const timeRange = ref([])

// 分栏拖拽
const splitPercent = ref(parseFloat(localStorage.getItem('resumeSplitPercent') || '45'))
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartPercent = ref(0)

function startDrag(e) {
  isDragging.value = true
  dragStartX.value = e.clientX
  dragStartPercent.value = splitPercent.value
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function onDrag(e) {
  if (!isDragging.value) return
  const container = document.querySelector('.split-panel')
  if (!container) return
  const rect = container.getBoundingClientRect()
  const deltaX = e.clientX - dragStartX.value
  const deltaPercent = (deltaX / rect.width) * 100
  const newPercent = Math.max(25, Math.min(75, dragStartPercent.value + deltaPercent))
  splitPercent.value = newPercent
}

function stopDrag() {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  try { localStorage.setItem('resumeSplitPercent', splitPercent.value.toString()) } catch {}
}

// PDF 缩放
const zoomLevel = ref(100)
function zoomIn() { zoomLevel.value = Math.min(200, zoomLevel.value + 10) }
function zoomOut() { zoomLevel.value = Math.max(50, zoomLevel.value - 10) }
function zoomFit() { zoomLevel.value = 100 }

// 二维码隐藏
// AI 审核
const aiReviewVisible = ref(false)
const aiReviewLoading = ref(false)
const aiReviewForm = reactive({ position: '', jd: '', custom_requirements: '', headcount: 1 })
const aiReviewResult = ref(null)

// AI 审核详情弹窗（列表模式查看）
const aiReviewDetailVisible = ref(false)
const aiReviewDetailData = ref(null)

// 批量 AI 审核
const batchAiReviewVisible = ref(false)
const batchAiReviewRunning = ref(false)
const batchAiReviewForm = reactive({ position: '', jd: '', custom_requirements: '', headcount: 1 })
const batchSelectedPositionId = ref(null)
const batchSelectedResumeIds = ref([])
const batchPendingResumes = ref([])
const batchAiReviewResults = ref([])

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

// 候选人快捷摘要
const appliedPosition = computed(() => {
  if (!currentResume.value?.position_id) return ''
  const pos = positions.value.find(p => p.id === currentResume.value.position_id)
  return pos?.name || ''
})

const latestEducation = computed(() => {
  if (!parsedData.educations.length) return null
  return parsedData.educations[0]
})

const previewStyle = computed(() => ({
  transform: `scale(${zoomLevel.value / 100})`,
  transformOrigin: 'center top'
}))

// AI 审核折叠状态（按简历 ID 记忆）
const aiReviewCollapsedMap = reactive({})
const isAiReviewCollapsed = computed(() => {
  const id = currentResume.value?.id
  if (!id) return true
  return aiReviewCollapsedMap[id] !== false // 默认折叠
})
function toggleAiReview() {
  const id = currentResume.value?.id
  if (id) aiReviewCollapsedMap[id] = !isAiReviewCollapsed.value
}

function statusLabel(status) {
  return ({ PASS: '已通过', PENDING: '待定', FAIL: '已淘汰' })[status] || '待审核'
}

function aiSuggestionLabel(suggestion) {
  return ({ PASS: '通过', PENDING: '待定', FAIL: '淘汰' })[suggestion] || '待审核'
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
  console.log('[enterDetail] called', { index, currentIndex: currentIndex.value })
  saveCurrentRemark()
  currentIndex.value = index
  viewMode.value = 'detail'
  loadCurrent()
  fetchPositions()
}

// 双击检测：300ms 内再次点击同一行则为双击
let lastClickIndex = -1
let clickTimer = null
function handleRowClick(index) {
  if (lastClickIndex === index) {
    if (clickTimer) {
      clearTimeout(clickTimer)
      clickTimer = null
    }
    lastClickIndex = -1
    enterDetail(index)
  } else {
    lastClickIndex = index
    if (clickTimer) {
      clearTimeout(clickTimer)
    }
    clickTimer = setTimeout(() => {
      lastClickIndex = -1
      clickTimer = null
    }, 300)
  }
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
    // 排除解析中的简历（UPLOADED 状态），仅展示已解析完成的简历
    const res = await resumeApi.getResumes(skip, pageSize.value, getFilterParam(), searchKeyword.value, startTime, endTime, 'UPLOADED')
    const list = Array.isArray(res) ? res : (res?.items || res?.data || [])
    totalCount.value = res.total || list.length

    resumes.value = list
    currentIndex.value = 0
    await loadCurrent()
    fetchTabCounts()
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

function handlePageChange(page) {
  currentPage.value = page
  fetchResumes()
}

async function loadCurrent() {
  remarkText.value = ''
  fileUrl.value = ''

  const resume = currentResume.value
  if (!resume) {
    console.log('[loadCurrent] resume is null, clearing parsed')
    clearParsed()
    return
  }

  if (viewMode.value === 'detail') {
    previewLoading.value = true
    const currentId = resume.id
    pdfPageCount.value = 0
    pdfPageUrls.value = []
    console.log('[loadCurrent] preview start', { id: currentId, fileType: fileType.value, rawFileType: resume.file_type })
    try {
      if (fileType.value === 'pdf' || isImageType.value) {
        const token = localStorage.getItem('token')

        if (fileType.value === 'pdf') {
          let totalPages = 1
          try {
            const res = await fetch(`/api/resumes/preview/${resume.id}/page-count?token=${token}`)
            const data = await res.json()
            totalPages = data.total_pages || 1
          } catch {
            totalPages = 1
          }
          pdfPageCount.value = totalPages
          // 生成所有页 URL，滑动查看
          const urls = []
          for (let p = 1; p <= totalPages; p++) {
            urls.push(`/api/resumes/preview/${resume.id}/image?page=${p}&token=${token}`)
          }
          pdfPageUrls.value = urls
        } else {
          fileUrl.value = `/api/resumes/preview/${resume.id}?token=${token}`
        }
      } else {
        console.log('[loadCurrent] fileType not handled, fileUrl remains empty', { fileType: fileType.value })
      }
    } catch (error) {
      if (currentResume.value?.id !== currentId) return
      console.error('[loadCurrent] 预览加载失败:', error)
      ElMessage.error('简历预览加载失败')
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
    const exclude = 'UPLOADED'
    const [all, nul, pass, pending, fail] = await Promise.all([
      resumeApi.getResumes(0, 1, null, '', startTime, endTime, exclude),
      resumeApi.getResumes(0, 1, 'null', '', startTime, endTime, exclude),
      resumeApi.getResumes(0, 1, 'PASS', '', startTime, endTime, exclude),
      resumeApi.getResumes(0, 1, 'PENDING', '', startTime, endTime, exclude),
      resumeApi.getResumes(0, 1, 'FAIL', '', startTime, endTime, exclude),
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


// 下载文件
function handleDownload() {
  const resume = currentResume.value
  if (!resume) return
  const token = localStorage.getItem('token')
  const link = document.createElement('a')
  link.href = `/api/resumes/preview/${resume.id}?token=${token}`
  link.download = `${resume.candidate_name || 'resume'}.${resume.file_type || 'pdf'}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
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
    const sIdx = resumeStore.resumes.findIndex(r => r.id === resume.id)
    if (sIdx !== -1) {
      resumeStore.resumes[sIdx] = { ...resumeStore.resumes[sIdx], position_id: positionId || null }
    }
    ElMessage.success(positionId ? '岗位设置成功' : '已清除岗位选择')
  } catch (e) {
    ElMessage.error('岗位设置失败')
  }
}

// ---- AI 审核 ----
function openAiReview() {
  const resume = currentResume.value
  if (!resume) return

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

function getAiSuggestion(resume) {
  if (!resume.ai_review_data) return null
  try {
    const parsed = typeof resume.ai_review_data === 'string' ? JSON.parse(resume.ai_review_data) : resume.ai_review_data
    return parsed.suggestion || null
  } catch { return null }
}

function viewAiReviewDetail(resume) {
  if (!resume.ai_review_data) return
  try {
    const parsed = typeof resume.ai_review_data === 'string' ? JSON.parse(resume.ai_review_data) : resume.ai_review_data
    aiReviewDetailData.value = parsed
    aiReviewDetailVisible.value = true
  } catch (e) {
    ElMessage.error('AI 审核数据解析失败')
  }
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

async function openBatchAiReview() {
  try {
    const res = await resumeApi.getResumes(0, 10000, 'null', '', '', '')
    const list = Array.isArray(res) ? res : (res?.items || res?.data || [])
    if (list.length === 0) {
      ElMessage.warning('当前没有待审核的简历')
      return
    }
    batchPendingResumes.value = list
  } catch (e) {
    ElMessage.error('获取待审核简历列表失败')
    return
  }
  batchAiReviewForm.position = ''
  batchAiReviewForm.jd = ''
  batchAiReviewForm.custom_requirements = ''
  batchAiReviewForm.headcount = 1
  batchSelectedPositionId.value = null
  batchSelectedResumeIds.value = []
  batchAiReviewResults.value = []
  batchAiReviewVisible.value = true
  fetchPositions()
}

const allSelected = computed(() =>
  batchPendingResumes.value.length > 0 &&
  batchSelectedResumeIds.value.length === batchPendingResumes.value.length
)

function handleBatchSelectAll() {
  batchSelectedResumeIds.value = allSelected.value
    ? []
    : batchPendingResumes.value.map(r => r.id)
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

  const ids = [...batchSelectedResumeIds.value]
  const total = ids.length

  batchAiReviewVisible.value = false
  ElMessage.info(`已提交 ${total} 份简历的批量 AI 审核，后台处理中...`)

  try {
    const extra = batchAiReviewForm.custom_requirements || ''
    const res = await resumeApi.batchAiReviewResume({
      resume_ids: ids,
      position: batchAiReviewForm.position || '',
      jd: batchAiReviewForm.jd || '',
      custom_requirements: extra,
      headcount: batchAiReviewForm.headcount || 1,
    })
    const results = (res.results || []).map(item => ({
      resume_id: item.resume_id,
      candidate_name: item.candidate_name || batchPendingResumes.value.find(r => r.id === item.resume_id)?.candidate_name || '',
      result: item.result,
      error: item.error,
    }))
    batchAiReviewResults.value = results
    batchAiReviewVisible.value = true
    ElMessage.success(`批量 AI 审核完成，共处理 ${total} 份简历`)
  } catch (e) {
    ElMessage.error('批量 AI 审核失败: ' + (e?.detail || e?.message || '请重试'))
  } finally {
    batchAiReviewRunning.value = false
    fetchResumes()
  }
}

function resetBatchReview() {
  batchAiReviewResults.value = []
  batchSelectedResumeIds.value = []
  batchPendingResumes.value = []
  openBatchAiReview()
}

async function batchApplyReview(item, decision) {
  try {
    await resumeApi.reviewResume(item.resume_id, { decision, comment: '' })
    item._reviewed = true
    item._decision = decision
    const idx = resumes.value.findIndex(r => r.id === item.resume_id)
    if (idx !== -1) {
      resumes.value[idx].review_status = decision
    }
    // 同步到共享 store，避免面试创建弹窗读到旧状态
    const sIdx = resumeStore.resumes.findIndex(r => r.id === item.resume_id)
    if (sIdx !== -1) {
      resumeStore.resumes[sIdx] = { ...resumeStore.resumes[sIdx], review_status: decision }
    }
    fetchTabCounts()
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
    remarkText.value = remarkMap[resume.id] || resume.review_comment || ''
  }
  remarkVisible.value = true
}

async function saveCurrentRemark() {
  const resume = currentResume.value
  if (!resume) return

  remarkMap[resume.id] = remarkText.value || ''
  try {
    await resumeApi.saveRemark(resume.id, remarkText.value || '')
  } catch (e) {
    // 静默失败
  }
}

async function handleSaveRemark() {
  const resume = currentResume.value
  if (!resume) return

  savingRemark.value = true
  try {
    remarkMap[resume.id] = remarkText.value || ''
    await resumeApi.saveRemark(resume.id, remarkText.value || '')
    remarkVisible.value = false
    ElMessage.success('备注已保存')
  } catch (e) {
    ElMessage.error('备注保存失败: ' + (e?.detail || e?.message || '请重试'))
  } finally {
    savingRemark.value = false
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
    delete remarkMap[resume.id]
    resume.review_status = decision
    const idx = resumes.value.findIndex(r => r.id === resume.id)
    if (idx !== -1) {
      resumes.value[idx].review_status = decision
    }
    // 同步到共享 store，避免面试创建弹窗读到旧状态
    const sIdx = resumeStore.resumes.findIndex(r => r.id === resume.id)
    if (sIdx !== -1) {
      resumeStore.resumes[sIdx] = { ...resumeStore.resumes[sIdx], review_status: decision }
    }
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
    // 同步到共享 store
    const sIdx = resumeStore.resumes.findIndex(r => r.id === resume.id)
    if (sIdx !== -1) {
      resumeStore.resumes[sIdx] = { ...resumeStore.resumes[sIdx], review_status: decision }
    }
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
    // 同步到共享 store
    const sIdx = resumeStore.resumes.findIndex(r => r.id === resume.id)
    if (sIdx !== -1) {
      resumeStore.resumes[sIdx] = { ...resumeStore.resumes[sIdx], review_status: null }
    }
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

watch(viewMode, (mode) => {
  if (mode === 'detail' && currentResume.value) {
    loadCurrent()
  }
})

const revokeFileUrl = () => {}

onMounted(() => {
  const filterParam = route.query.filter
  if (filterParam && ['null', 'PASS', 'PENDING', 'FAIL'].includes(filterParam)) {
    activeFilter.value = filterParam
  }
  fetchResumes()
})
onUnmounted(() => revokeFileUrl())
</script>

<style scoped lang="scss">
/* ===== 全屏铺满布局 ===== */
.feishu-page {
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.card-container {
  min-height: 0;
  flex: 1;
  padding: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.header-area {
  flex-shrink: 0;
}

.review-area {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  margin-top: 16px;
}

/* ===== Header ===== */
.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1F2329;
  margin: 0 16px 0 0;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ===== Filter Bar ===== */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 8px 8px;
  flex-wrap: wrap;
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.filter-group-tabs { flex-shrink: 0; }
.filter-group-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.filter-group-spacer { flex: 1; min-width: 12px; }

/* Tabs */
.filter-tabs {
  display: flex;
  gap: 6px;
  .filter-tab {
    padding: 5px 14px;
    border-radius: 6px;
    font-size: 13px;
    color: #646a73;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
    background: #f5f6f7;
    &:hover { color: #3370ff; }
    &.active {
      background: #ffffff;
      color: #1f2329;
      font-weight: 500;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
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

/* ===== Preview Nav Dots ===== */
.preview-dots {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  .dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #dee0e3; cursor: pointer; transition: all 0.2s;
    &.active { background: #3370ff; width: 18px; border-radius: 3px; }
    &.reviewed { background: #52c41a; }
  }
}

/* ===== List Mode ===== */
.list-table-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.list-header {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  font-size: 13px;
  font-weight: 600;
  color: #646a73;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.list-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.list-row {
  display: flex;
  align-items: center;
  padding: 12px 20px;
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
.col-ai-review { flex: 0.8; font-size: 13px; }
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

.pagination-wrapper {
  flex-shrink: 0;
  padding: 12px 20px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #DEE0E3;
}

/* ===== Detail Mode - Split Panel ===== */
.split-panel {
  display: flex;
  flex: 1;
  min-height: 500px;
  max-height: 100%;
  gap: 0;
  position: relative;
  user-select: none;

  &.is-dragging {
    cursor: col-resize;
    * { pointer-events: none; }
  }
}

/* ===== Left Panel ===== */
.left-panel {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* 合并顶部栏：单行展示 */
.left-top-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafbfc;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
}
.bar-avatar {
  flex-shrink: 0;
  background: #3370ff;
}
.bar-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2329;
  flex-shrink: 0;
}
.bar-tag {
  flex-shrink: 0;
}
.bar-info-item {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: #646a73;
  flex-shrink: 0;
  .el-icon { font-size: 12px; color: #3370ff; }
}
.bar-year {
  margin-right: 4px;
}
.bar-spacer {
  flex: 1;
  min-width: 4px;
}
.bar-dl-btn {
  flex-shrink: 0;
  padding: 0 4px !important;
  font-size: 13px !important;
}
.bar-zoom {
  display: flex;
  align-items: center;
  gap: 1px;
  flex-shrink: 0;
}
.bar-zoom-btn {
  padding: 0 3px !important;
  font-size: 14px !important;
}
.bar-zoom-level {
  font-size: 12px;
  color: #646a73;
  min-width: 34px;
  text-align: center;
  flex-shrink: 0;
}
.bar-fit-btn {
  font-size: 12px !important;
  color: #3370ff !important;
  padding: 0 5px !important;
  flex-shrink: 0;
}

/* File Preview */
.file-preview {
  flex: 1;
  min-height: 0;
  background: #f5f6f7;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow: auto;
  box-shadow: inset 0 2px 8px rgba(0,0,0,0.04);
  position: relative;
}
.preview-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  min-height: 100%;
  width: 100%;
  padding: 16px;
}
.file-image {
  max-width: 100%;
  max-height: none;
  object-fit: contain;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  background-color: #fff;
  border-radius: 4px;
  transition: transform 0.15s ease;
}
.file-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #8f959e;
  font-size: 14px;
  padding: 40px;
}

/* Preview Nav (prev/next + dots + progress) */
.preview-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 20px;
  border-top: 1px solid #f0f0f0;
  background: #fff;
  flex-shrink: 0;
  flex-wrap: nowrap;
  overflow: hidden;
}
.preview-progress-text {
  font-size: 13px;
  color: #8f959e;
  flex-shrink: 0;
}

/* ===== Draggable Divider ===== */
.split-divider {
  width: 5px;
  margin: 0 -2px;
  cursor: col-resize;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
  background: transparent;
  transition: background 0.15s;

  &::before {
    content: '';
    position: absolute;
    left: 2px;
    top: 0;
    bottom: 0;
    width: 1px;
    background: #dee0e3;
  }

  &:hover, &.is-dragging {
    background: rgba(51, 112, 255, 0.08);
    &::before { background: #3370ff; width: 2px; }
  }
}

/* ===== Right Panel ===== */
.right-panel {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.right-panel-sticky {
  flex-shrink: 0;
  background: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  z-index: 5;

  .panel-header {
    padding: 10px 20px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .panel-title { font-size: 14px; font-weight: 600; color: #1f2329; flex-shrink: 0; }
}

.position-label {
  font-size: 13px;
  color: #646a73;
  white-space: nowrap;
  flex-shrink: 0;
}

.parsed-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 20px;
}

.detail-section {
  margin-bottom: 16px;
  &:last-child { margin-bottom: 0; }
}

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

.school-tag {
  display: inline-block;
  padding: 0 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
  margin-left: 6px;
  vertical-align: middle;
}
.tag-985 { background: #e8f8e8; color: #52c41a; }
.tag-211 { background: #e8f0ff; color: #3370ff; }

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

/* ===== Action Bar ===== */
.action-bar {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
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

/* ===== Status Tags ===== */
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

/* ===== AI Review ===== */
.ai-review-result {
  padding: 0 4px;
}

.ai-review-summary {
  background: #f7f8fa;
  border-radius: 8px;
  padding: 10px 12px;
  margin: 8px 12px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
  &:hover { background: #f0f2f5; }

  &.collapsed {
    .ai-review-summary-body,
    .ai-review-points {
      display: none;
    }
    .collapse-arrow {
      transform: rotate(-90deg);
    }
  }
}
.ai-review-summary-header {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: #1f2329;
  gap: 4px;
}
.collapse-arrow {
  margin-left: auto;
  font-size: 14px;
  color: #8f959e;
  transition: transform 0.2s;
  flex-shrink: 0;
}
.ai-review-summary-body {
  font-size: 13px;
  color: #646a73;
  line-height: 1.5;
  white-space: pre-wrap;
  margin-top: 6px;
}
.ai-review-points {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e8e9eb;
}
.points-title {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
}
.points-matched { color: #52c41a; }
.points-gap { color: #ff4d4f; }
.point-item {
  font-size: 12px;
  color: #646a73;
  padding: 2px 0;
  line-height: 1.5;
}
.point-matched { color: #3d9e17; }
.point-gap { color: #e84545; }

/* ===== Batch Dialog ===== */
.batch-dialog {
  :deep(.el-dialog__header) {
    padding: 16px 24px 0;
  }
  :deep(.el-dialog__body) {
    padding: 12px 24px;
  }
  :deep(.el-dialog__footer) {
    padding: 0 24px 16px;
  }
}
.batch-dialog-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.batch-dialog-icon {
  font-size: 20px;
  color: #3370ff;
}
.batch-dialog-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2329;
}

/* 蓝色提示条 */
.batch-info-bar {
  background: #eef4ff;
  border-radius: 6px;
  padding: 8px 14px;
  font-size: 13px;
  color: #3370ff;
  margin-bottom: 14px;
  strong { font-weight: 600; }
}

/* 分区通用 */
.batch-section {
  margin-bottom: 12px;
  &:last-child { margin-bottom: 0; }
}
.batch-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2329;
  margin-bottom: 10px;
}
.batch-section-divider {
  height: 1px;
  background: #e8e9eb;
  margin: 12px 0;
}

/* 表单 */
.batch-form {
  :deep(.el-form-item__label) {
    font-size: 13px;
    color: #515a6e;
    font-weight: 500;
    padding-bottom: 4px;
  }
}
.batch-form-item {
  margin-bottom: 12px !important;
  &:last-child { margin-bottom: 0 !important; }
}
.batch-field-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.required-star {
  color: #e53935;
  font-size: 16px;
  line-height: 1;
  flex-shrink: 0;
}
.batch-select {
  flex: 1;
}
.batch-headcount-input {
  width: 160px;
  :deep(.el-input-number__increase),
  :deep(.el-input-number__decrease) {
    width: 34px;
  }
}
.batch-field-note {
  font-size: 12px;
  color: #8f959e;
  white-space: nowrap;
}

/* JD 区域 */
.jd-field-wrap {
  width: 100%;
}
.jd-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}
.jd-word-count {
  font-size: 12px;
  color: #8f959e;
}
.jd-clear-btn {
  font-size: 12px !important;
  color: #3370ff !important;
  padding: 0 4px !important;
}

/* 候选人列表 */
.batch-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  .batch-section-title { margin-bottom: 0; }
}
.batch-select-all {
  font-size: 13px;
  color: #3370ff;
  cursor: pointer;
  user-select: none;
  &:hover { color: #2458d9; }
}
.batch-candidate-list {
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid #dee0e3;
  border-radius: 6px;

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-track {
    background: #f5f6f7;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: #d0d2d6;
    border-radius: 3px;
    &:hover { background: #b0b2b8; }
  }
}
.batch-candidate-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #f5f5f5;
  &:last-child { border-bottom: none; }
  &:hover { background: #f5f7ff; }
}
.batch-candidate-checkbox {
  flex-shrink: 0;
}
.batch-candidate-avatar {
  flex-shrink: 0;
  background: #3370ff;
}
.batch-candidate-name {
  flex: 1;
  color: #1f2329;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.batch-candidate-empty {
  padding: 24px 0;
  text-align: center;
  color: #8f959e;
  font-size: 14px;
}

/* 审核结果列表 */
.batch-result-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #dee0e3;
  border-radius: 6px;

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-track {
    background: #f5f6f7;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: #d0d2d6;
    border-radius: 3px;
    &:hover { background: #b0b2b8; }
  }
}
.batch-result-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 14px;
  font-size: 13px;
  border-bottom: 1px solid #f5f5f5;
  &:last-child { border-bottom: none; }
  &.even { background: #f8f9fa; }
}
.batch-result-index {
  color: #8f959e;
  font-weight: 500;
  min-width: 24px;
}
.batch-result-name {
  flex: 1;
  color: #1f2329;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.batch-result-reason {
  color: #646a73;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}
.batch-result-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.batch-result-done {
  font-size: 12px;
  color: #8f959e;
  flex-shrink: 0;
}
.batch-result-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

/* Footer */
.batch-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
.batch-btn-cancel {
  border-radius: 6px;
}
.batch-btn-primary {
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>

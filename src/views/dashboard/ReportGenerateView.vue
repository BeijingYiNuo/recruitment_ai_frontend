<template>
  <div class="feishu-page">
    <div class="card-container">

      <!-- Header Area -->
      <div class="header-area">
        <div class="header-top">
          <div class="title-area">
            <h1>面试报告生成</h1>
          </div>
        </div>
      </div>

      <!-- 功能区域 -->
      <div class="report-content">

        <el-row :gutter="24">
          <el-col :span="24">
            <!-- 上传文件并生成报告 -->
            <div class="section-card" style="height: 100%; box-sizing: border-box;">
              <h2 class="section-title">上传文件并生成报告</h2>

              <el-form label-width="160px" label-position="right">
                <el-row :gutter="24">
                  <el-col :span="12">
                    <el-form-item label="模板 DOCX (可选)">
                      <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
                        <el-button size="default" plain @click="openFileSelector('templateDocx')">从文件库选择</el-button>
                        <template v-if="reportFiles.templateDocx">
                          <span class="file-name" :title="reportFiles.templateDocx.name">{{ reportFiles.templateDocx.name }}</span>
                          <el-button link type="danger" @click="() => handleReportFileRemove('templateDocx')" style="flex-shrink: 0;">取消选择</el-button>
                        </template>
                      </div>
                    </el-form-item>
                  </el-col>

                  <el-col :span="12">
                    <el-form-item label="template.md (可选)">
                      <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
                        <el-button size="default" plain @click="openFileSelector('templateMd')">从文件库选择</el-button>
                        <template v-if="reportFiles.templateMd">
                          <span class="file-name" :title="reportFiles.templateMd.name">{{ reportFiles.templateMd.name }}</span>
                          <el-button link type="danger" @click="() => handleReportFileRemove('templateMd')" style="flex-shrink: 0;">取消选择</el-button>
                        </template>
                      </div>
                    </el-form-item>
                  </el-col>

                  <el-col :span="12">
                    <el-form-item label="jd.md (可选)">
                      <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
                        <el-button size="default" plain @click="openFileSelector('jdMd')">从文件库选择</el-button>
                        <template v-if="reportFiles.jdMd">
                          <span class="file-name" :title="reportFiles.jdMd.name">{{ reportFiles.jdMd.name }}</span>
                          <el-button link type="danger" @click="() => handleReportFileRemove('jdMd')" style="flex-shrink: 0;">取消选择</el-button>
                        </template>
                      </div>
                    </el-form-item>
                  </el-col>

                  <el-col :span="12">
                    <el-form-item label="resume.md (可选)">
                      <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
                        <el-button size="default" plain @click="openFileSelector('resumeMd')">从文件库选择</el-button>
                        <template v-if="reportFiles.resumeMd">
                          <span class="file-name" :title="reportFiles.resumeMd.name">{{ reportFiles.resumeMd.name }}</span>
                          <el-button link type="danger" @click="() => handleReportFileRemove('resumeMd')" style="flex-shrink: 0;">取消选择</el-button>
                        </template>
                      </div>
                    </el-form-item>
                  </el-col>

                  <el-col :span="12">
                    <el-form-item label="transcript.md (可选)">
                      <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
                        <el-button size="default" plain @click="openFileSelector('transcriptMd')">从文件库选择</el-button>
                        <template v-if="reportFiles.transcriptMd">
                          <span class="file-name" :title="reportFiles.transcriptMd.name">{{ reportFiles.transcriptMd.name }}</span>
                          <el-button link type="danger" @click="() => handleReportFileRemove('transcriptMd')" style="flex-shrink: 0;">取消选择</el-button>
                        </template>
                      </div>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-form-item>
                  <div class="hint-text" style="width: 100%; margin-top: 0; margin-bottom: 8px;">如果不上传某一项，服务端将使用默认示例内容。</div>
                </el-form-item>

                <el-divider border-style="dashed" />
                
                <h3 class="sub-title" style="margin-top: 0; margin-bottom: 20px;">基本信息</h3>

                <el-row :gutter="24">
                  <el-col :span="12">
                    <el-form-item label="面试时间">
                      <el-input v-model="baseInfo.interview_time" placeholder="2026年04月04日 14:00" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="面试形式">
                      <el-input v-model="baseInfo.interview_format" placeholder="线上 / 线下" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="面试官">
                      <el-input v-model="baseInfo.interviewer" placeholder="面试官姓名" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="报告输出类型">
                      <el-select v-model="requestType" style="width: 100%">
                        <el-option label="DOCX" value="docx" />
                        <el-option label="JSON" value="json" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-form-item style="margin-top: 16px;">
                  <el-button
                    type="primary"
                    class="generate-btn"
                    style="width: 200px; margin-bottom: 0;"
                    :loading="isReportGenerating"
                    @click="handleGenerateReport"
                  >
                    {{ isReportGenerating ? '生成中...' : '生成报告' }}
                  </el-button>
                  <div class="hint-text" style="width: 100%; margin-top: 8px;">生成完毕后，DOCX 文件会自动下载；选择 JSON 可查看填充后的数据结构。</div>
                </el-form-item>
              </el-form>

              <!-- JSON 结果展示区 -->
              <div v-if="reportJsonResult" class="output-area">
                <pre class="markdown-output">{{ reportJsonResult }}</pre>
              </div>
            </div>
          </el-col>
        </el-row>

      </div>
      
      <!-- 文件选择弹窗 -->
      <el-dialog v-model="fileSelectorVisible" title="选择文件" width="700px" destroy-on-close>
        <el-table :data="serverFiles" v-loading="loadingFiles" height="400px" @row-click="handleConfirmSelection" highlight-current-row stripe>
          <el-table-column prop="file_name" label="文件名" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <div style="display: flex; align-items: center; gap: 8px;">
                <el-icon><Document /></el-icon>
                <span>{{ row.file_name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="file_type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag size="small" type="info">{{ row.file_type || '未知' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="updated_at" label="更新时间" width="180">
            <template #default="{ row }">
              {{ row.updated_at ? row.updated_at.replace('T', ' ') : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click.stop="handleConfirmSelection(row)">选取</el-button>
            </template>
          </el-table-column>
        </el-table>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="fileSelectorVisible = false">取消</el-button>
            <el-button type="danger" plain @click="clearSelection">清除当前已选</el-button>
          </span>
        </template>
      </el-dialog>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Close } from '@element-plus/icons-vue'
import { fileApi } from '../../api/file'

// ==================== 状态定义 ====================
const reportFiles = reactive({
  templateDocx: null,
  templateMd: null,
  jdMd: null,
  resumeMd: null,
  transcriptMd: null
})

const baseInfo = reactive({
  interview_time: '',
  interview_format: '',
  interviewer: '',
  report_author: '',
  report_time: '',
  position: ''
})

const requestType = ref('docx')
const isReportGenerating = ref(false)
const reportJsonResult = ref('')

// --- 选择文件弹窗相关 ---
const fileSelectorVisible = ref(false)
const loadingFiles = ref(false)
const serverFiles = ref([])
const currentSelectKey = ref('')

const openFileSelector = async (key) => {
  currentSelectKey.value = key
  fileSelectorVisible.value = true
  if (serverFiles.value.length === 0) {
    loadingFiles.value = true
    try {
      const res = await fileApi.getFileList()
      let list = res.data || []
      list.sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())
      serverFiles.value = list
    } catch (e) {
      ElMessage.error('获取文件列表失败')
    } finally {
      loadingFiles.value = false
    }
  }
}

const handleConfirmSelection = (fileRow) => {
  if (!fileRow) return
  const meta = { id: fileRow.id, name: fileRow.file_name }
  reportFiles[currentSelectKey.value] = meta
  fileSelectorVisible.value = false
}

const clearSelection = () => {
  reportFiles[currentSelectKey.value] = null
  fileSelectorVisible.value = false
}

// ==================== LLM 配置 ====================
// 报告生成后端所需的 LLM 参数
const LLM_CONFIG = {
  openai_api_key: 'sk-60153691578a4f6b97d9df84ad51a495',
  openai_base_url: 'https://api.deepseek.com',
  openai_model: 'deepseek-chat'
}

// 初始化默认文件
const initDefaultFiles = async () => {
  try {
    const filesToFetch = [
      { key: 'templateDocx', url: '/template.docx', name: 'template.docx' },
      { key: 'templateMd', url: '/template.md', name: 'template.md' },
      { key: 'jdMd', url: '/jd.md', name: 'jd.md' }
    ]

    for (const item of filesToFetch) {
      const res = await fetch(item.url)
      if (res.ok) {
        const blob = await res.blob()
        // 创建 File 对象以便保留文件名并在 UI 中显示
        reportFiles[item.key] = new File([blob], item.name, { type: blob.type })
      }
    }
  } catch (error) {
    console.error('Failed to load default files:', error)
  }
}

onMounted(() => {
  initDefaultFiles()
})

const fetchRealBlob = async (fileObj) => {
  if (!fileObj) return null;
  if (fileObj instanceof Blob) return fileObj;
  if (fileObj.id) {
    return await fileApi.downloadFile(fileObj.id);
  }
  throw new Error('无效的文件对象');
}

/**
 * 获取文件并转为 Base64 字符串
 */
const fileToBase64 = async (fileObj) => {
  const file = await fetchRealBlob(fileObj);
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('无效的文件对象'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      console.log('[fileToBase64] 转换完成, 长度:', base64?.length)
      resolve(base64)
    }
    reader.onerror = (e) => {
      console.error('[fileToBase64] 读取失败:', e)
      reject(new Error('文件读取失败'))
    }
    reader.readAsDataURL(file)
  })
}

/**
 * 获取文件并读取为文本
 */
const fileToText = async (fileObj) => {
  const file = await fetchRealBlob(fileObj);
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('无效的文件对象'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

// ==================== 逻辑处理 ====================

const handleReportFile = (key, uploadFile) => {
  reportFiles[key] = uploadFile.raw
}

const handleReportFileRemove = (key) => {
  reportFiles[key] = null
}

// 生成报告 - 调用 /generate
const handleGenerateReport = async () => {
  isReportGenerating.value = true
  reportJsonResult.value = ''

  const token = localStorage.getItem('token')

  try {
    // 构建请求体（包含 LLM 配置）
    const payload = {
      request_type: requestType.value,
      ...LLM_CONFIG
    }

    // 处理可选的 DOCX 模板文件（转 Base64）
    if (reportFiles.templateDocx) {
      payload.template_docx_b64 = await fileToBase64(reportFiles.templateDocx)
    }

    // 处理可选的文本文件
    if (reportFiles.templateMd) {
      payload.template_md = await fileToText(reportFiles.templateMd)
    }
    if (reportFiles.jdMd) {
      payload.job_description = await fileToText(reportFiles.jdMd)
    }
    if (reportFiles.resumeMd) {
      payload.resume_text = await fileToText(reportFiles.resumeMd)
    }
    if (reportFiles.transcriptMd) {
      payload.transcript_text = await fileToText(reportFiles.transcriptMd)
    }

    // 处理基本信息（过滤空值）
    const filteredBaseInfo = {}
    let hasBaseInfo = false
    for (const [key, val] of Object.entries(baseInfo)) {
      if (val && val.trim()) {
        filteredBaseInfo[key] = val.trim()
        hasBaseInfo = true
      }
    }
    if (hasBaseInfo) {
      payload.base_info = filteredBaseInfo
    }

    // 使用 fetch 发送请求（需要手动处理二进制响应）
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`服务器错误 (${response.status}): ${errorText}`)
    }

    const contentType = response.headers.get('Content-Type') || ''

    // 情况 A：返回 DOCX 文件 — 触发浏览器下载
    if (
      contentType.includes('application/vnd.openxmlformats-officedocument') ||
      contentType.includes('application/octet-stream') ||
      contentType.includes('application/msword')
    ) {
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      // 尝试从 Content-Disposition 提取文件名
      const disposition = response.headers.get('Content-Disposition')
      let filename = 'interview_report.docx'
      if (disposition) {
        const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n]+)/i)
        if (match) {
          filename = decodeURIComponent(match[1])
        }
      }

      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      ElMessage.success('报告已生成，文件下载中...')
    }
    // 情况 B：返回 JSON / 文本 — 展示在页面上
    else {
      const text = await response.text()
      try {
        const json = JSON.parse(text)
        reportJsonResult.value = JSON.stringify(json, null, 2)
      } catch {
        reportJsonResult.value = text
      }
      ElMessage.success('报告数据已生成')
    }
  } catch (err) {
    console.error('[Report] Generate report failed:', err)
    ElMessage.error('报告生成失败: ' + (err.message || '网络异常'))
  } finally {
    isReportGenerating.value = false
  }
}
</script>

<style scoped lang="scss">
/* 复用飞书风格设计令牌 */
.feishu-page {
  background-color: #F5F6F7;
  padding: 16px 24px;
  min-height: calc(100vh - 60px);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
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

.header-area {
  padding: 20px 24px;
  border-bottom: 1px solid #DEE0E3;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-area h1 {
  font-size: 20px;
  font-weight: 600;
  color: #1F2329;
  margin: 0;
}

.report-content {
  padding: 24px;
  flex: 1;
}

/* 功能区卡片 */
.section-card {
  background: #FAFBFC;
  border: 1px solid #E5E6EB;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
}

.section-title {
  font-size: 17px;
  font-weight: 600;
  color: #1F2329;
  margin: 0 0 20px 0;
}

.sub-title {
  font-size: 15px;
  font-weight: 600;
  color: #1F2329;
  margin: 20px 0 16px 0;
}

/* 上传行 */
.upload-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.upload-label {
  font-size: 14px;
  font-weight: 500;
  color: #1F2329;
  white-space: nowrap;
  min-width: 140px;
}

.inline-upload {
  :deep(.el-upload-list) {
    display: none;
  }
}

.file-name {
  font-size: 14px;
  color: #646A73;
  background: #F0F1F5;
  padding: 4px 12px;
  border-radius: 4px;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 表单行 */
.form-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #1F2329;
  white-space: nowrap;
  min-width: 140px;
}

.generate-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 6px;
  background-color: #3370FF;
  border-color: #3370FF;
  margin-bottom: 12px;

  &:hover {
    background-color: #2458D9;
    border-color: #2458D9;
  }
}

.hint-text {
  font-size: 13px;
  color: #8F959E;
  margin: 0 0 16px 0;
}

/* 流式输出区域 */
.output-area {
  background: #F7F8FA;
  border: 1px solid #E5E6EB;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  scroll-behavior: smooth;
}

.markdown-output {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: #1F2329;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}

.save-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 6px;
  background-color: #3370FF;
  border-color: #3370FF;

  &:hover {
    background-color: #2458D9;
    border-color: #2458D9;
  }
}
</style>

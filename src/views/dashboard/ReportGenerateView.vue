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
          <el-col :span="10">
            <!-- 步骤 1：上传docx生成面试报告 -->
            <div class="section-card" style="height: 100%; box-sizing: border-box;">
              <h2 class="section-title">1. 上传docx生成面试报告</h2>

              <el-form label-width="130px" label-position="right">
                <el-form-item label="模板 DOCX 文件" required>
                  <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
                    <el-upload
                      ref="uploadRef"
                      :auto-upload="false"
                      :limit="1"
                      :on-change="handleFileChange"
                      :on-remove="handleFileRemove"
                      accept=".docx,.doc"
                      class="inline-upload"
                    >
                      <el-button size="default">选择文件</el-button>
                    </el-upload>
                    <span v-if="selectedFile" class="file-name">{{ selectedFile.name }}</span>
                  </div>
                  <div style="font-size: 13px; color: #e6a23c; margin-top: 4px; line-height: 1.4; width: 100%;">提示：请上传docx文件</div>
                </el-form-item>

                <el-form-item>
                  <el-button
                    type="primary"
                    class="generate-btn"
                    style="width: 200px; margin-bottom: 0px;"
                    :loading="isGenerating"
                    :disabled="!selectedFile"
                    @click="handleGenerate"
                  >
                    {{ isGenerating ? '生成中...' : '生成面试报告' }}
                  </el-button>
                  <div class="hint-text" style="width: 100%; margin-top: 8px;">生成过程将通过服务器流式返回报告内容。</div>
                </el-form-item>
              </el-form>

              <!-- 流式输出区域 -->
              <div v-if="markdownOutput" class="output-area" ref="outputAreaRef">
                <pre class="markdown-output">{{ markdownOutput }}</pre>
              </div>

              <!-- 保存按钮 -->
              <div style="display: flex; justify-content: flex-end;" v-if="markdownOutput && !isGenerating">
                <el-button
                  type="primary"
                  class="save-btn"
                  style="width: 160px;"
                  @click="handleSaveMd"
                >
                  保存为 MD
                </el-button>
              </div>
            </div>
          </el-col>

          <el-col :span="14">
            <!-- 步骤 2：上传文件并生成报告 -->
            <div class="section-card" style="height: 100%; box-sizing: border-box;">
              <h2 class="section-title">2. 上传文件并生成报告</h2>

              <el-form label-width="160px" label-position="right">
                <el-row :gutter="24">
                  <el-col :span="12">
                    <el-form-item label="模板 DOCX (可选)">
                      <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
                        <el-upload
                          :auto-upload="false"
                          :limit="1"
                          :on-change="(f) => handleReportFile('templateDocx', f)"
                          :on-remove="() => handleReportFileRemove('templateDocx')"
                          accept=".docx,.doc"
                          class="inline-upload"
                        >
                          <el-button size="default">选择文件</el-button>
                        </el-upload>
                        <span v-if="reportFiles.templateDocx" class="file-name">{{ reportFiles.templateDocx.name }}</span>
                      </div>
                    </el-form-item>
                  </el-col>

                  <el-col :span="12">
                    <el-form-item label="template.md (可选)">
                      <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
                        <el-upload
                          :auto-upload="false"
                          :limit="1"
                          :on-change="(f) => handleReportFile('templateMd', f)"
                          :on-remove="() => handleReportFileRemove('templateMd')"
                          accept=".md,.txt"
                          class="inline-upload"
                        >
                          <el-button size="default">选择文件</el-button>
                        </el-upload>
                        <span v-if="reportFiles.templateMd" class="file-name">{{ reportFiles.templateMd.name }}</span>
                      </div>
                    </el-form-item>
                  </el-col>

                  <el-col :span="12">
                    <el-form-item label="jd.md (可选)">
                      <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
                        <el-upload
                          :auto-upload="false"
                          :limit="1"
                          :on-change="(f) => handleReportFile('jdMd', f)"
                          :on-remove="() => handleReportFileRemove('jdMd')"
                          accept=".md,.txt"
                          class="inline-upload"
                        >
                          <el-button size="default">选择文件</el-button>
                        </el-upload>
                        <span v-if="reportFiles.jdMd" class="file-name">{{ reportFiles.jdMd.name }}</span>
                      </div>
                    </el-form-item>
                  </el-col>

                  <el-col :span="12">
                    <el-form-item label="resume.md (可选)">
                      <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
                        <el-upload
                          :auto-upload="false"
                          :limit="1"
                          :on-change="(f) => handleReportFile('resumeMd', f)"
                          :on-remove="() => handleReportFileRemove('resumeMd')"
                          accept=".md,.txt"
                          class="inline-upload"
                        >
                          <el-button size="default">选择文件</el-button>
                        </el-upload>
                        <span v-if="reportFiles.resumeMd" class="file-name">{{ reportFiles.resumeMd.name }}</span>
                      </div>
                    </el-form-item>
                  </el-col>

                  <el-col :span="12">
                    <el-form-item label="transcript.md (可选)">
                      <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
                        <el-upload
                          :auto-upload="false"
                          :limit="1"
                          :on-change="(f) => handleReportFile('transcriptMd', f)"
                          :on-remove="() => handleReportFileRemove('transcriptMd')"
                          accept=".md,.txt"
                          class="inline-upload"
                        >
                          <el-button size="default">选择文件</el-button>
                        </el-upload>
                        <span v-if="reportFiles.transcriptMd" class="file-name">{{ reportFiles.transcriptMd.name }}</span>
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
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

// ==================== LLM 配置 ====================
// 报告生成后端所需的 LLM 参数
const LLM_CONFIG = {
  openai_api_key: 'sk-60153691578a4f6b97d9df84ad51a495',
  openai_base_url: 'https://api.deepseek.com',
  openai_model: 'deepseek-chat'
}

// ==================== 步骤 1：流式生成 template.md ====================

const uploadRef = ref(null)
const selectedFile = ref(null)
const isGenerating = ref(false)
const markdownOutput = ref('')
const outputAreaRef = ref(null)

const handleFileChange = (uploadFile) => {
  console.log('[Step1] handleFileChange:', uploadFile, 'raw:', uploadFile.raw)
  selectedFile.value = uploadFile.raw
}

const handleFileRemove = () => {
  selectedFile.value = null
}

/**
 * 将文件读取为 Base64 字符串
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof Blob)) {
      reject(new Error('无效的文件对象'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      // reader.result 格式为 "data:application/...;base64,XXXXX"
      // 只取逗号后面的纯 Base64 部分
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
 * 将文件读取为文本
 */
const fileToText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

// 流式生成 template.md - 调用 /doc2md/stream
const handleGenerate = async () => {
  console.log('[Step1] handleGenerate 被调用, selectedFile:', selectedFile.value)
  if (!selectedFile.value) {
    ElMessage.warning('请先选择一个 DOCX 模板文件')
    return
  }

  isGenerating.value = true
  markdownOutput.value = ''

  const token = localStorage.getItem('token')

  try {
    // 将 DOCX 文件转为 Base64
    console.log('[Step1] 开始 Base64 转换...')
    const base64Str = await fileToBase64(selectedFile.value)
    console.log('[Step1] Base64 转换完成, 长度:', base64Str?.length)

    // 使用 fetch 进行流式请求（POST + JSON）
    console.log('[Step1] 发送 fetch 请求到 /api/doc2md/stream ...')
    const response = await fetch('/api/doc2md/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        template_docx_b64: base64Str,
        ...LLM_CONFIG
      })
    })

    console.log('[Step1] 收到响应, status:', response.status)

    if (!response.ok) {
      throw new Error(`服务器错误: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })

      // 直接追加流式文本（纯文本流）
      markdownOutput.value += chunk

      // 自动滚动到底部
      await nextTick()
      if (outputAreaRef.value) {
        outputAreaRef.value.scrollTop = outputAreaRef.value.scrollHeight
      }
    }

    ElMessage.success('模板生成完成')
  } catch (err) {
    console.error('[Step1] Generate failed:', err)
    ElMessage.error('生成失败: ' + (err.message || '网络异常'))
  } finally {
    isGenerating.value = false
  }
}

// 保存为 MD 文件
const handleSaveMd = () => {
  if (!markdownOutput.value) return

  const blob = new Blob([markdownOutput.value], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'template.md'
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('文件已保存')
}

// ==================== 步骤 2：上传文件并生成报告 ====================

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

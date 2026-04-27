<template>
  <div class="tab-slice-details" v-loading="loading">
    <!-- Action Bar -->
    <div class="action-bar">
      <span class="total-text">共 {{ totalCount }} 切片</span>
    </div>

    <!-- Empty State -->
    <el-empty v-if="!loading && slices.length === 0" description="暂无切片数据" />

    <!-- Slice Grid -->
    <div class="slice-grid" v-if="slices.length > 0">
      <div class="slice-card" v-for="(slice, idx) in slices" :key="slice.point_id">
        <!-- Card Header -->
        <div class="card-header">
          <span class="index-tag">#{{ idx + 1 }}</span>
          <span class="slice-id" :title="slice.point_id">ID {{ slice.point_id }}</span>
        </div>
        
        <!-- Card Content -->
        <div class="card-content">
          <div class="text-line">{{ slice.content || '(无内容)' }}</div>
          <div class="chunk-title" v-if="slice.chunk_title && slice.chunk_title !== slice.content">
            <span class="chunk-label">标题：</span>{{ slice.chunk_title }}
          </div>
        </div>

        <!-- Card Footer -->
        <div class="card-footer">
          <div class="footer-left">
            <el-icon class="file-icon" :class="slice.fileType">
              <Document />
            </el-icon>
            <span class="file-name">{{ slice.doc_name }}</span>
            <span class="dot-divider">·</span>
            <span class="char-count">字符 {{ slice.charCount }}</span>
          </div>
          <div class="footer-right">
            更新于 {{ slice.updateTimeStr }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { knowledgeApi } from '../../../api/knowledge.js'

const props = defineProps({
  collectionName: {
    type: String,
    required: true
  },
  filterDocId: {
    type: String,
    default: ''
  }
})

const loading = ref(false)
const slices = ref<any[]>([])
const docOptions = ref<any[]>([])
const totalCount = ref(0)

/**
 * 格式化 Unix 时间戳为可读字符串
 */
const formatUnixTime = (timestamp: number) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp * 1000)
  const Y = date.getFullYear()
  const M = String(date.getMonth() + 1).padStart(2, '0')
  const D = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${Y}-${M}-${D} ${h}:${m}:${s}`
}

/**
 * 根据文件类型字符串推断类型分类
 */
const getFileType = (docType: string) => {
  const t = (docType || '').toLowerCase()
  if (t.includes('pdf')) return 'pdf'
  if (t.includes('doc')) return 'doc'
  return 'other'
}

/**
 * 加载文档列表
 */
const fetchDocList = async () => {
  try {
    const res = await knowledgeApi.listDocuments(props.collectionName)
    const responseData = res.data || res || {}
    const rawList = responseData.doc_list || []
    docOptions.value = rawList.map((item: any) => ({
      doc_id: item.doc_id,
      doc_name: item.title || item.doc_name || '未命名文档',
      doc_type: item.doc_type || ''
    }))
  } catch (error) {
    console.error('获取文档列表失败:', error)
  }
}

/**
 * 加载所有文档的切片列表
 */
const fetchSlices = async () => {
  loading.value = true
  slices.value = []
  totalCount.value = 0

  try {
    if (docOptions.value.length === 0) {
      await fetchDocList()
    }

    const allPoints: any[] = []
    
    // 如果传入了 filterDocId，则只获取该文档的切片，否则获取全部
    const docsToFetch = props.filterDocId 
      ? docOptions.value.filter((doc: any) => String(doc.doc_id) === String(props.filterDocId))
      : docOptions.value

    const promises = docsToFetch.map((doc: any) =>
      knowledgeApi.listPoints(props.collectionName, doc.doc_id).catch(() => null)
    )
    const results = await Promise.all(promises)

    for (const res of results) {
      if (!res) continue
      const data = res.data || res || {}
      const pointList = data.point_list || []
      allPoints.push(...pointList)
    }
    totalCount.value = allPoints.length

    // 映射数据
    slices.value = allPoints.map((item: any) => {
      const docInfo = item.doc_info || {}
      return {
        point_id: item.point_id || '-',
        content: item.content || '',
        chunk_title: item.chunk_title || '',
        chunk_id: item.chunk_id,
        chunk_type: item.chunk_type || 'text',
        doc_id: docInfo.doc_id || '',
        doc_name: docInfo.doc_name || docInfo.title || '未命名',
        fileType: getFileType(docInfo.doc_type),
        charCount: (item.content || '').length,
        updateTime: item.update_time || item.process_time,
        updateTimeStr: formatUnixTime(item.update_time || item.process_time),
        raw: item
      }
    })
  } catch (error) {
    console.error('获取切片列表失败:', error)
    ElMessage.error('获取切片列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchDocList()
  await fetchSlices()
})
</script>

<style lang="scss" scoped>
.tab-slice-details {
  padding: 16px 24px;
  background-color: #ffffff;
}

.action-bar {
  margin-bottom: 24px;
  
  .total-text {
    font-size: 13px;
    color: #86909c;
  }
}

.slice-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
}

.slice-card {
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s;
  background-color: #ffffff;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border-color: #d9d9d9;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  
  .index-tag {
    font-size: 12px;
    color: #4e5969;
    background-color: #f2f3f5;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
  }
  
  .slice-id {
    font-size: 12px;
    color: #86909c;
    font-family: monospace;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 360px;
  }
}

.card-content {
  flex: 1;
  margin-bottom: 24px;
  
  .text-line {
    font-size: 14px;
    line-height: 1.6;
    color: #1d2129;
    word-break: break-all;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .chunk-title {
    margin-top: 8px;
    font-size: 13px;
    color: #86909c;

    .chunk-label {
      font-weight: 500;
      color: #4e5969;
    }
  }
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  
  .footer-left {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #4e5969;
    
    .file-icon {
      font-size: 14px;
      &.pdf { color: #f53f3f; }
      &.doc, &.docx { color: #165dff; }
    }
    
    .dot-divider {
      color: #c9cdd4;
    }
  }
  
  .footer-right {
    color: #86909c;
  }
}
</style>

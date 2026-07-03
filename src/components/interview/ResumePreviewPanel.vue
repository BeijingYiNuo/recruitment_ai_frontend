<template>
  <div class="resume-preview-card">
    <div class="card-header">
      <div class="header-left">
        <el-icon><Document /></el-icon>
        <h2>候选人简历预览</h2>
      </div>
      <div class="header-right">
        <el-button
          v-if="totalPages > 0"
          type="primary"
          link
          @click="openInNewTab"
          title="在新标签页打开PDF"
        >
          <el-icon><TopRight /></el-icon>
        </el-button>
      </div>
    </div>

    <div class="preview-body" v-loading="loading">
      <template v-if="imageUrls.length > 0 && !loading">
        <div class="image-container">
          <img
            v-for="(src, i) in imageUrls"
            :key="i"
            :src="src"
            class="resume-image"
            alt="简历预览"
          />
        </div>
      </template>

      <div v-else-if="!loading" class="empty-state">
        <el-icon :size="48" color="#94a3b8"><DocumentDelete /></el-icon>
        <p>暂无关联简历或预览不可用</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Document, DocumentDelete, TopRight } from '@element-plus/icons-vue'

const props = defineProps<{
  resumeId: number | null
  loading: boolean
}>()

const imageUrls = ref<string[]>([])
const totalPages = ref(0)

// 根据 resumeId 获取页数并生成所有图片 URL
async function loadImages(id: number) {
  imageUrls.value = []
  totalPages.value = 0

  const token = localStorage.getItem('token')
  if (!token) return

  // 先获取 PDF 总页数
  let pages = 1
  try {
    const res = await fetch(`/api/resumes/preview/${id}/page-count?token=${token}`)
    const data = await res.json()
    pages = data.total_pages || 1
  } catch {
    pages = 1
  }

  totalPages.value = pages

  // 生成所有页的图片 URL
  const urls: string[] = []
  for (let p = 1; p <= pages; p++) {
    urls.push(`/api/resumes/preview/${id}/image?page=${p}&token=${token}`)
  }
  imageUrls.value = urls
}

watch(
  () => props.resumeId,
  (id) => {
    if (id) {
      loadImages(id)
    } else {
      imageUrls.value = []
      totalPages.value = 0
    }
  },
  { immediate: true }
)

const openInNewTab = () => {
  const token = localStorage.getItem('token')
  if (props.resumeId && token) {
    window.open(`/api/resumes/preview/${props.resumeId}?token=${token}`, '_blank')
  }
}
</script>

<style lang="scss" scoped>
.resume-preview-card {
  background: #ffffff;
  border: 1px solid #e4e9f5;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(17, 29, 63, 0.07);
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  flex-shrink: 0;

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;

    .el-icon {
      font-size: 20px;
      color: #3370ff;
    }

    h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
    }
  }
}

.preview-body {
  flex: 1;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  min-height: 200px;
}

.image-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
}

.resume-image {
  width: 100%;
  max-width: 100%;
  height: auto;
  display: block;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #64748b;

  p {
    margin: 0;
    font-size: 14px;
  }
}
</style>

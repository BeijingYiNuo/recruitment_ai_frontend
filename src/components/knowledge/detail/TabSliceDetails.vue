<template>
  <div class="tab-slice-details">
    <!-- Action Bar -->
    <div class="action-bar">
      <div class="action-left">
        <el-button class="ghost-btn">
          <el-icon><Plus /></el-icon> 新增切片
        </el-button>
        <span class="total-text">共 3 切片</span>
      </div>
      
      <div class="action-right">
        <el-select v-model="filterDoc" placeholder="全部文档" class="filter-select">
          <el-option label="全部文档" value="all" />
          <el-option label="pdf简历.pdf" value="pdf" />
          <el-option label="doc简历.doc" value="doc" />
        </el-select>
        <el-input 
          v-model="searchKeyword" 
          placeholder="搜索切片 ID" 
          class="search-input"
          :prefix-icon="Search"
        />
        <div class="view-toggles">
          <div class="toggle-btn" :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'">
            <el-icon><Expand /></el-icon>
          </div>
          <div class="toggle-btn" :class="{ active: viewMode === 'grid' }" @click="viewMode = 'grid'">
            <el-icon><Grid /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- Slice Grid -->
    <div class="slice-grid" :class="viewMode">
      <div class="slice-card" v-for="slice in slices" :key="slice.id">
        <!-- Card Header -->
        <div class="card-header">
          <span class="index-tag">#{{ slice.index }}</span>
          <span class="slice-id">ID {{ slice.id }}</span>
        </div>
        
        <!-- Card Content -->
        <div class="card-content">
          <div class="text-line" v-for="(line, idx) in slice.content" :key="idx">{{ line }}</div>
        </div>

        <!-- Card Footer -->
        <div class="card-footer">
          <div class="footer-left">
            <el-icon class="file-icon" :class="slice.fileType">
              <Document v-if="slice.fileType === 'pdf' || slice.fileType === 'doc' || slice.fileType === 'docx'" />
            </el-icon>
            <span class="file-name">{{ slice.fileName }}</span>
            <span class="dot-divider">·</span>
            <span class="char-count">字符 {{ slice.charCount }}</span>
          </div>
          <div class="footer-right">
            更新于 {{ slice.updateTime }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Pagination -->
    <div class="pagination-footer">
      <el-pagination
        layout="prev, pager, next, sizes, jumper"
        :total="3"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="20"
        class="custom-pagination"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Search, Expand, Grid, Document } from '@element-plus/icons-vue'

const filterDoc = ref('all')
const searchKeyword = ref('')
const viewMode = ref('grid') // 'list' | 'grid'

const slices = ref([
  {
    index: 1,
    id: '271040-_sys_auto_gen_doc_id-14070803344570287666-0',
    content: ['我的简历123', '我的简历123'],
    fileType: 'doc',
    fileName: 'doc简历.doc',
    charCount: 7,
    updateTime: '2026-04-08 09:29:49'
  },
  {
    index: 2,
    id: '271040-_sys_auto_gen_doc_id-17101403853843155118-0',
    content: ['我的简历123', '我的简历123'],
    fileType: 'docx',
    fileName: 'docx简历.docx',
    charCount: 7,
    updateTime: '2026-04-08 09:29:48'
  },
  {
    index: 3,
    id: '271040-_sys_auto_gen_doc_id-6364887156866483066-0',
    content: ['我的简历123', '我的简历123', '123'],
    fileType: 'pdf',
    fileName: 'pdf简历.pdf',
    charCount: 8,
    updateTime: '2026-04-08 09:29:50'
  }
])
</script>

<style lang="scss" scoped>
.tab-slice-details {
  padding: 16px 24px;
  background-color: #ffffff;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  .action-left {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .ghost-btn {
      color: #165dff;
      border-color: #165dff;
      background: transparent;
      
      &:hover {
        background-color: #e8f3ff;
      }
    }
    
    .total-text {
      font-size: 13px;
      color: #86909c;
    }
  }
  
  .action-right {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .filter-select {
      width: 140px;
    }
    
    .search-input {
      width: 200px;
    }
    
    .view-toggles {
      display: flex;
      border: 1px solid #e5e6eb;
      border-radius: 4px;
      overflow: hidden;
      
      .toggle-btn {
        padding: 6px 10px;
        color: #86909c;
        background-color: #ffffff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &:hover {
          color: #4e5969;
          background-color: #f2f3f5;
        }
        
        &.active {
          color: #165dff;
          background-color: #e8f3ff;
        }
        
        &:first-child {
          border-right: 1px solid #e5e6eb;
        }
      }
    }
  }
}

.slice-grid {
  display: grid;
  gap: 20px;
  
  &.grid {
    grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
  }
  
  &.list {
    grid-template-columns: 1fr;
  }
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

.pagination-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 32px;
}
</style>

<template>
  <div class="tab-original-docs">
    <!-- Action Bar -->
    <div class="action-bar">
      <el-button type="primary" class="import-btn">
        <el-icon><Plus /></el-icon> 导入文档
      </el-button>
      
      <div class="search-combo">
        <el-select v-model="searchType" class="combo-select">
          <el-option label="名称" value="name" />
          <el-option label="ID" value="id" />
        </el-select>
        <el-input 
          v-model="searchKeyword" 
          placeholder="搜索文档名称" 
          class="combo-input"
        />
      </div>
    </div>

    <!-- Data Table -->
    <div class="table-container">
      <table class="custom-table">
        <thead>
          <tr>
            <th width="25%">文档名称 / ID</th>
            <th width="15%">文档状态</th>
            <th width="10%">切片数</th>
            <th width="12%">导入方式</th>
            <th width="15%">上传时间</th>
            <th width="15%">更新时间</th>
            <th width="8%" class="text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in tableData" :key="item.id">
            <td>
              <div class="file-name-col">
                <el-icon class="file-icon" :class="item.type">
                  <Document v-if="item.type === 'pdf' || item.type === 'doc' || item.type === 'docx'" />
                </el-icon>
                <div class="file-info">
                  <div class="name">{{ item.name }}</div>
                  <div class="id">文档 ID <el-icon><CopyDocument /></el-icon></div>
                </div>
              </div>
            </td>
            <td>
              <div class="status-tag">
                <span class="dot"></span>
                处理完成
              </div>
            </td>
            <td>{{ item.slices }}</td>
            <td>{{ item.method }}</td>
            <td>{{ item.uploadTime }}</td>
            <td>{{ item.updateTime }}</td>
            <td class="text-right">
              <div class="row-actions">
                <span class="action-link">切片详情</span>
                <span class="action-link">删除</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination-footer">
      <span class="total-text">共 3 条</span>
      <el-pagination
        layout="prev, pager, next"
        :total="3"
        :page-size="10"
        class="custom-pagination"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Document, CopyDocument } from '@element-plus/icons-vue'

const searchType = ref('name')
const searchKeyword = ref('')

const tableData = ref([
  {
    id: 'F01',
    name: 'pdf简历.pdf',
    type: 'pdf',
    slices: 1,
    method: '本地上传',
    uploadTime: '2026-04-08 09:29:41',
    updateTime: '2026-04-08 09:29:50'
  },
  {
    id: 'F02',
    name: 'doc简历.doc',
    type: 'doc',
    slices: 1,
    method: '本地上传',
    uploadTime: '2026-04-08 09:29:41',
    updateTime: '2026-04-08 09:29:49'
  },
  {
    id: 'F03',
    name: 'docx简历.docx',
    type: 'docx',
    slices: 1,
    method: '本地上传',
    uploadTime: '2026-04-08 09:29:41',
    updateTime: '2026-04-08 09:29:48'
  }
])
</script>

<style lang="scss" scoped>
.tab-original-docs {
  padding: 16px 24px;
  background-color: #ffffff;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.import-btn {
  background-color: #165dff;
  border-color: #165dff;
  font-weight: 500;
  
  &:hover {
    background-color: #4080ff;
    border-color: #4080ff;
  }
}

.search-combo {
  display: flex;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  overflow: hidden;
  width: 320px;
  transition: border-color 0.3s;
  
  &:hover, &:focus-within {
    border-color: #165dff;
  }
  
  .combo-select {
    width: 90px;
    
    :deep(.el-input__wrapper) {
      box-shadow: none !important;
      background-color: #f2f3f5;
      border-radius: 0;
    }
  }
  
  .combo-input {
    flex: 1;
    
    :deep(.el-input__wrapper) {
      box-shadow: none !important;
      border-left: 1px solid #e5e6eb;
      border-radius: 0;
    }
  }
}

.table-container {
  overflow-x: auto;
}

.custom-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  
  th, td {
    padding: 14px 16px;
    border-bottom: 1px solid #f0f0f0;
    text-align: left;
    color: #1d2129;
  }
  
  th {
    background-color: #f7f8fa;
    color: #4e5969;
    font-weight: 500;
  }
  
  .text-right {
    text-align: right;
  }
  
  tbody tr {
    transition: background-color 0.2s;
    &:hover {
      background-color: #f9fafb;
    }
  }
}

.file-name-col {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .file-icon {
    font-size: 20px;
    &.pdf { color: #f53f3f; }
    &.doc, &.docx { color: #165dff; }
  }
  
  .file-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    
    .name {
      font-weight: 500;
      color: #1d2129;
    }
    
    .id {
      font-size: 12px;
      color: #86909c;
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      
      &:hover {
        color: #165dff;
      }
    }
  }
}

.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #00b42a;
  
  .dot {
    width: 6px;
    height: 6px;
    background-color: #00b42a;
    border-radius: 50%;
  }
}

.row-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  
  .action-link {
    color: #165dff;
    cursor: pointer;
    font-size: 13px;
    
    &:hover {
      color: #4080ff;
    }
  }
}

.pagination-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  
  .total-text {
    font-size: 13px;
    color: #4e5969;
  }
  
  .custom-pagination {
    --el-pagination-button-bg-color: #f2f3f5;
  }
}
</style>

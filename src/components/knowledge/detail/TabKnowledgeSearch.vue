<template>
  <div class="tab-knowledge-search">
    <!-- Left Sidebar -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h3 class="title">
          <el-icon class="search-icon"><Search /></el-icon>
          知识检索
        </h3>
        <p class="desc">适合仅用知识库进行相似检索的场景，每次检索为独立检索，无多轮信息参考。</p>
      </div>

      <div class="sidebar-scroll">
        <!-- Collapse 1 -->
        <div class="custom-collapse">
          <div class="collapse-header" @click="isParamExpanded = !isParamExpanded">
            <span class="collapse-title"><span class="highlight-bar"></span>检索参数</span>
            <el-icon class="arrow-icon" :class="{ 'is-open': isParamExpanded }"><ArrowDown /></el-icon>
          </div>
          <el-collapse-transition>
            <div v-show="isParamExpanded" class="collapse-body">
              <p class="section-desc">调整检索参数，预览和调试知识库命中效果</p>
              
              <div class="form-item">
                <div class="form-label">
                  结果返回数量
                  <el-tooltip content="返回的片段数量" placement="top">
                    <el-icon class="help-icon"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </div>
                <div class="slider-row">
                  <el-slider v-model="retrievalCount" :min="1" :max="20" class="custom-slider" />
                  <el-input-number v-model="retrievalCount" controls-position="right" :min="1" :max="20" class="mini-input" />
                </div>
              </div>

              <div class="form-item row-between mt-4">
                <div class="form-label mb-0">
                  重排模型
                  <el-tooltip content="开启后进行二次重排" placement="top">
                    <el-icon class="help-icon"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </div>
                <el-switch v-model="enableRerank" />
              </div>
            </div>
          </el-collapse-transition>
        </div>

        <!-- Collapse 2 -->
        <div class="custom-collapse mt-4">
          <div class="collapse-header" @click="isMoreExpanded = !isMoreExpanded">
            <span class="collapse-title">更多参数</span>
            <el-icon class="arrow-icon" :class="{ 'is-open': isMoreExpanded }"><ArrowDown /></el-icon>
          </div>
          <el-collapse-transition>
            <div v-show="isMoreExpanded" class="collapse-body">
              <div class="form-item mt-2">
                <div class="form-label">
                  Dense Weight
                  <el-tooltip content="密集权重参数" placement="top">
                    <el-icon class="help-icon"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </div>
                <div class="slider-row">
                  <el-slider v-model="denseWeight" :min="0" :max="1" :step="0.01" class="custom-slider" />
                  <el-input-number v-model="denseWeight" controls-position="right" :min="0" :max="1" :step="0.01" class="mini-input" />
                </div>
              </div>
            </div>
          </el-collapse-transition>
        </div>
      </div>

      <!-- Bottom Fixed Buttons -->
      <div class="sidebar-footer">
        <el-button type="primary" class="full-btn">
          <el-icon class="code-icon"><Connection /></el-icon> 创建服务调用
        </el-button>
        <el-button class="full-btn mt-3">API 调用</el-button>
      </div>
    </div>

    <!-- Right Main Area -->
    <div class="main-area">
      <div class="search-container">
        <!-- Main Search Box -->
        <div class="giant-search-box">
          <div class="prefix-icons">
            <el-icon class="icon-btn"><Picture /></el-icon>
            <el-icon class="icon-btn"><ChatRound /></el-icon>
          </div>
          <input type="text" class="giant-input" placeholder="输入想要检索的内容" />
          <div class="suffix-btn">
            <el-icon><Search /></el-icon>
          </div>

          <!-- Tooltip Popover -->
          <div class="mock-tooltip" v-if="showTooltip">
            <div class="tooltip-header">
              <span>🎉 支持 @ 快速指定筛选范围</span>
            </div>
            <div class="tooltip-body">
              标签筛选体验搬到这里了！试试 @ 快速指定标签、文档、目录吧
            </div>
            <div class="tooltip-footer">
              <span class="got-it-btn" @click="showTooltip = false">知道了</span>
            </div>
            <div class="triangle"></div>
          </div>
        </div>
        
        <div class="history-link">
          <el-icon><Clock /></el-icon> 检索历史
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
  Search, ArrowDown, QuestionFilled, Connection, 
  Picture, ChatRound, Clock 
} from '@element-plus/icons-vue'

const isParamExpanded = ref(true)
const isMoreExpanded = ref(true)

const retrievalCount = ref(10)
const enableRerank = ref(false)
const denseWeight = ref(0.50)

const showTooltip = ref(true)
</script>

<style lang="scss" scoped>
.tab-knowledge-search {
  display: flex;
  height: calc(100vh - 180px);
  min-height: 600px;
  background-color: #ffffff;
}

// Sidebar Styles
.sidebar {
  width: 300px;
  flex-shrink: 0;
  border-right: 1px solid #e5e6eb;
  display: flex;
  flex-direction: column;
  background-color: #fafbfc;
}

.sidebar-header {
  padding: 24px;
  
  .title {
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #1d2129;
    
    .search-icon {
      color: #165dff;
    }
  }
  
  .desc {
    margin: 0;
    font-size: 12px;
    color: #86909c;
    line-height: 1.5;
  }
}

.sidebar-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px;
}

.custom-collapse {
  .collapse-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    cursor: pointer;
    user-select: none;
    
    .collapse-title {
      font-size: 14px;
      font-weight: 600;
      color: #1d2129;
      display: flex;
      align-items: center;
      
      .highlight-bar {
        width: 3px;
        height: 14px;
        background-color: #165dff;
        margin-right: 8px;
        border-radius: 2px;
      }
    }
    
    .arrow-icon {
      color: #86909c;
      transition: transform 0.3s;
      &.is-open {
        transform: rotate(180deg);
      }
    }
  }
  
  .collapse-body {
    padding-bottom: 16px;
  }
  
  .section-desc {
    margin: 0 0 16px;
    font-size: 12px;
    color: #86909c;
  }
}

.form-item {
  margin-bottom: 16px;
  
  .form-label {
    font-size: 13px;
    color: #1d2129;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    
    .help-icon {
      margin-left: 4px;
      color: #86909c;
      cursor: help;
    }
  }
  
  &.row-between {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .mb-0 {
    margin-bottom: 0;
  }
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .custom-slider {
    flex: 1;
  }
  
  .mini-input {
    width: 90px;
    :deep(.el-input__wrapper) {
      padding-left: 8px;
      padding-right: 32px;
    }
  }
}

.mt-2 { margin-top: 8px; }
.mt-3 { margin-top: 12px; }
.mt-4 { margin-top: 16px; }

.sidebar-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e6eb;
  background-color: #fafbfc;
  
  .full-btn {
    width: 100%;
    margin-left: 0;
    
    .code-icon {
      margin-right: 4px;
      font-size: 16px;
    }
  }
  
  .el-button--primary {
    background-color: #7c3aed;
    border-color: #7c3aed;
    &:hover {
      background-color: #8b5cf6;
      border-color: #8b5cf6;
    }
  }
}

// Right Main Area Styles
.main-area {
  flex: 1;
  display: flex;
  justify-content: center;
  position: relative;
  background-color: #ffffff;
}

.search-container {
  width: 100%;
  max-width: 680px;
  margin-top: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.giant-search-box {
  width: 100%;
  height: 56px;
  border: 1px solid #e5e6eb;
  border-radius: 28px;
  display: flex;
  align-items: center;
  padding: 0 8px 0 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  transition: all 0.3s;
  position: relative;
  
  &:focus-within {
    border-color: #7c3aed;
    box-shadow: 0 4px 20px rgba(124, 58, 237, 0.1);
  }

  .prefix-icons {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-right: 12px;
    
    .icon-btn {
      font-size: 20px;
      color: #86909c;
      cursor: pointer;
      &:hover { color: #1d2129; }
    }
  }
  
  .giant-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 16px;
    color: #1d2129;
    
    &::placeholder {
      color: #c9cdd4;
    }
  }
  
  .suffix-btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 20px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
    
    &:hover {
      filter: brightness(1.1);
    }
  }
}

.mock-tooltip {
  position: absolute;
  top: 70px;
  left: 20px;
  width: 280px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  padding: 16px;
  z-index: 10;
  border: 1px solid #f0f0f0;
  
  .triangle {
    position: absolute;
    top: -6px;
    left: 40px;
    width: 12px;
    height: 12px;
    background-color: #ffffff;
    transform: rotate(45deg);
    border-left: 1px solid #f0f0f0;
    border-top: 1px solid #f0f0f0;
  }
  
  .tooltip-header {
    font-size: 14px;
    font-weight: 500;
    color: #1d2129;
    margin-bottom: 8px;
  }
  
  .tooltip-body {
    font-size: 12px;
    color: #4e5969;
    line-height: 1.5;
    margin-bottom: 12px;
  }
  
  .tooltip-footer {
    display: flex;
    justify-content: flex-end;
    
    .got-it-btn {
      font-size: 12px;
      color: #165dff;
      cursor: pointer;
      &:hover { color: #4080ff; }
    }
  }
}

.history-link {
  margin-top: 16px;
  align-self: flex-end;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #86909c;
  cursor: pointer;
  
  &:hover {
    color: #165dff;
  }
}
</style>

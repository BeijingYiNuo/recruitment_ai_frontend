<template>
  <div class="tab-knowledge-qa">
    <!-- Left Sidebar -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h3 class="title">
          <el-icon class="qa-icon"><ChatLineRound /></el-icon>
          知识问答
          <span class="free-tag">100w tokens免费</span>
        </h3>
        <p class="desc">结合知识库检索进行大模型深度的问答场景，基于历史对话信息等多参考知识，进行专业问答。</p>
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
                  <el-tooltip content="返回的片段数量" placement="top"><el-icon class="help-icon"><QuestionFilled /></el-icon></el-tooltip>
                </div>
                <div class="slider-row">
                  <el-slider v-model="retrievalCount" :min="1" :max="20" class="custom-slider" />
                  <el-input-number v-model="retrievalCount" controls-position="right" :min="1" :max="20" class="mini-input" />
                </div>
              </div>

              <div class="form-item row-between mt-4">
                <div class="form-label mb-0">
                  重排模型
                  <el-tooltip content="开启后进行二次重排" placement="top"><el-icon class="help-icon"><QuestionFilled /></el-icon></el-tooltip>
                </div>
                <el-switch v-model="enableRerank" />
              </div>
            </div>
          </el-collapse-transition>
        </div>

        <!-- Collapse 2 -->
        <div class="custom-collapse mt-4">
          <div class="collapse-header" @click="isModelExpanded = !isModelExpanded">
            <span class="collapse-title"><span class="highlight-bar"></span>模型回答参数</span>
            <el-icon class="arrow-icon" :class="{ 'is-open': isModelExpanded }"><ArrowDown /></el-icon>
          </div>
          <el-collapse-transition>
            <div v-show="isModelExpanded" class="collapse-body">
              <p class="section-desc">调整大模型参数，自定义预览调试回复效果</p>
              
              <div class="form-item mt-2">
                <div class="form-label">选择模型</div>
                <el-select v-model="selectedModel" class="w-full">
                  <el-option label="Doubao-Seed-2.0-pro" value="doubao-seed" />
                </el-select>
              </div>
              
              <div class="form-item mt-4">
                <div class="form-label">
                  拼接邻近文本片段数量
                  <el-tooltip content="拼接上下文片段数量" placement="top"><el-icon class="help-icon"><QuestionFilled /></el-icon></el-tooltip>
                </div>
                <el-input-number v-model="concatCount" controls-position="right" :min="0" :max="10" class="w-full text-left-input" />
              </div>
              
              <div class="form-item mt-4">
                <div class="form-label">文本片段参数</div>
                <div class="setting-text">
                  已选 5/5 参数进入大模型 <span class="link">去设置</span>
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
      <!-- Chat Message Card -->
      <div class="chat-container">
        <div class="greeting-card">
          <div class="greeting-header">
            <span class="emoji">👋</span>
            <span class="greeting-title">Hi，我是知识问答助手</span>
          </div>
          <div class="greeting-body">
            我可以阅读知识库里的资料，让你检索更加的可靠准确。你可以随意提问参数进行调试，预览和测试检索的效果。
          </div>
        </div>
      </div>

      <!-- Bottom Chat Input Area -->
      <div class="chat-input-wrapper">
        <div class="chat-input-box">
          <div class="input-actions left">
            <el-icon class="action-icon"><Picture /></el-icon>
            <el-icon class="action-icon"><ChatRound /></el-icon>
            <span class="char-count">0/8000 <el-icon><InfoFilled /></el-icon></span>
          </div>
          
          <input type="text" class="chat-input" placeholder="向知识问答助手提问你的问题" />
          
          <div class="send-btn">
            <el-icon><Top /></el-icon>
          </div>
        </div>
        
        <!-- Tooltip Popover (positioned relative to input box left area) -->
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
        
        <div class="disclaimer">
          测试体验内容均由人工智能模型生成，不代表平台立场 <span>免责声明</span> <span>测试协议</span> <span>隐私政策</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
  ChatLineRound, ArrowDown, QuestionFilled, Connection, 
  Picture, ChatRound, InfoFilled, Top 
} from '@element-plus/icons-vue'

const isParamExpanded = ref(true)
const isModelExpanded = ref(true)

const retrievalCount = ref(10)
const enableRerank = ref(false)
const selectedModel = ref('doubao-seed')
const concatCount = ref(0)

const showTooltip = ref(true)
</script>

<style lang="scss" scoped>
.tab-knowledge-qa {
  display: flex;
  height: calc(100vh - 310px);
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
    flex-wrap: wrap;
    gap: 8px;
    color: #1d2129;
    
    .qa-icon {
      color: #7c3aed;
    }
  }
  
  .free-tag {
    font-size: 11px;
    color: #00b42a;
    background-color: #e8f7e8;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 500;
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

.w-full { width: 100%; }

.text-left-input {
  :deep(.el-input__inner) {
    text-align: left;
  }
}

.setting-text {
  font-size: 12px;
  color: #86909c;
  
  .link {
    color: #165dff;
    cursor: pointer;
    margin-left: 4px;
    &:hover { text-decoration: underline; }
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
  flex-direction: column;
  position: relative;
  background-color: #ffffff;
}

.chat-container {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.greeting-card {
  background-color: #f7f8fa;
  border-radius: 8px;
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
  border: 1px solid #f0f0f0;
  
  .greeting-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    
    .emoji { font-size: 18px; }
    
    .greeting-title {
      font-size: 16px;
      font-weight: 600;
      color: #1d2129;
    }
  }
  
  .greeting-body {
    font-size: 13px;
    color: #4e5969;
    line-height: 1.6;
  }
}

.chat-input-wrapper {
  padding: 0 40px 20px;
  position: relative;
}

.chat-input-box {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  border: 1px solid #e5e6eb;
  background-color: #fafbfc;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  min-height: 100px;
  transition: all 0.3s;
  
  &:focus-within {
    border-color: #165dff;
    box-shadow: 0 4px 16px rgba(22, 93, 255, 0.08);
    background-color: #ffffff;
  }
  
  .input-actions {
    display: flex;
    align-items: center;
    padding: 12px 16px 8px;
    gap: 16px;
    
    .action-icon {
      font-size: 18px;
      color: #86909c;
      cursor: pointer;
      &:hover { color: #1d2129; }
    }
    
    .char-count {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #c9cdd4;
    }
  }
  
  .chat-input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    padding: 0 16px 12px;
    font-size: 14px;
    color: #1d2129;
    resize: none;
    
    &::placeholder {
      color: #c9cdd4;
    }
  }
  
  .send-btn {
    position: absolute;
    right: 56px;
    bottom: 56px;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background-color: #165dff;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #ffffff;
    cursor: pointer;
    font-size: 16px;
    
    &:hover {
      background-color: #4080ff;
    }
  }
}

.mock-tooltip {
  position: absolute;
  top: -90px;
  left: 56px;
  width: 280px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  padding: 16px;
  z-index: 10;
  border: 1px solid #f0f0f0;
  
  .triangle {
    position: absolute;
    bottom: -6px;
    left: 20px;
    width: 12px;
    height: 12px;
    background-color: #ffffff;
    transform: rotate(45deg);
    border-right: 1px solid #f0f0f0;
    border-bottom: 1px solid #f0f0f0;
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

.disclaimer {
  text-align: center;
  font-size: 12px;
  color: #c9cdd4;
  margin-top: 12px;
  
  span {
    margin-left: 8px;
    cursor: pointer;
    &:hover { color: #86909c; }
  }
}
</style>

<template>
  <div class="container">
    <h1>面试页面</h1>
    
    <div class="user-id-display">用户ID: {{ sessionId }}</div>
    
    <div class="control-section">
      <button id="createSessionBtn" class="btn btn-secondary" @click="createSession">创建会话</button>
      <button id="startAsrBtn" class="btn btn-primary" @click="startASR" :disabled="isAsrRunning">启动ASR</button>
      <button id="stopAsrBtn" class="btn btn-danger" @click="stopASR" :disabled="!isAsrRunning">停止ASR</button>
      <button class="btn btn-secondary" @click="goBack">返回仪表盘</button>
    </div>
    
    <div class="textboxes-container">
      <div class="left-section">
        <div class="textbox-section">
          <div class="textbox-label">ASR实时语音转文本</div>
          <div id="asrTextbox" class="textbox">{{ asrText }}</div>
        </div>
      </div>
      <div class="right-section">
        <div class="textbox-section">
          <div class="textbox-label">建议追问问题</div>
          <div id="followUpBox" class="textbox">{{ followUpText }}</div>
        </div>
        <div class="textbox-section">
          <div class="textbox-label">面试者评价</div>
          <div id="evaluationBox" class="textbox">{{ evaluationText }}</div>
        </div>
      </div>
    </div>
    
    <div class="status" id="status">{{ asrStatus }}</div>
  </div>
</template>

<script>
import { interviewApi } from '../api/interview'
import { createSSEConnection } from '../utils/sse'

export default {
  name: 'InterviewView',
  data() {
    return {
      sessionId: '',
      isAsrRunning: false,
      asrText: '',
      followUpText: '',
      evaluationText: '',
      asrStatus: '就绪',
      abortController: null,
      asrBuffer: '',
      asrIndex: 0,
      asrInterval: null,
      llmBuffers: {
        followUp: '',
        evaluation: ''
      },
      llmIndices: {
        followUp: 0,
        evaluation: 0
      },
      llmIntervals: {
        followUp: null,
        evaluation: null
      },
      followUpCount: 0,
      evaluationCount: 0
    }
  },
  created() {
    // 从路由参数中获取会话ID
    if (this.$route.params.sessionId) {
      this.sessionId = this.$route.params.sessionId
    }
  },
  methods: {
    goBack() {
      // 停止ASR和SSE连接
      this.stopASR()
      this.$router.push('/dashboard')
    },
    async createSession() {
      try {
        this.asrStatus = '正在创建会话...'
        const data = await interviewApi.createSession()
        this.sessionId = data.user_id
        this.asrStatus = '会话创建成功'
      } catch (error) {
        console.error('创建会话失败:', error)
        alert('创建会话失败，请检查后端服务是否运行')
        this.asrStatus = '创建会话失败'
      }
    },
    async startASR() {
      if (!this.sessionId) {
        alert('请先创建会话')
        return
      }
      
      try {
        this.asrStatus = '正在启动ASR...'
        
        const requestData = {
          url: "wss://openspeech.bytedance.com/api/v3/sauc/bigmodel_async",
          seg_duration: 200,
          mic: true,
          use_llm: true
        }
        
        await interviewApi.startASR(this.sessionId, requestData)
        
        this.isAsrRunning = true
        this.asrStatus = 'ASR已启动'
        
        // 清空文本框
        this.asrText = ''
        this.followUpText = ''
        this.evaluationText = ''
        this.asrBuffer = ''
        this.asrIndex = 0
        if (this.asrInterval) {
          clearInterval(this.asrInterval)
        }
        this.llmBuffers = {
          followUp: '',
          evaluation: ''
        }
        this.llmIndices = {
          followUp: 0,
          evaluation: 0
        }
        this.followUpCount = 0
        this.evaluationCount = 0
        Object.values(this.llmIntervals).forEach(interval => {
          if (interval) {
            clearInterval(interval)
          }
        })
        Object.keys(this.llmIntervals).forEach(key => {
          this.llmIntervals[key] = null
        })
        
        // 启动SSE连接
        this.startSSE()
      } catch (error) {
        console.error('启动ASR失败:', error)
        alert('启动ASR失败: ' + (error.response?.data?.detail || error.message))
        this.asrStatus = '启动ASR失败'
      }
    },
    async stopASR() {
      if (!this.sessionId) {
        alert('请先创建会话')
        return
      }
      
      try {
        this.asrStatus = '正在停止ASR...'
        
        await interviewApi.stopASR(this.sessionId)
        
        this.isAsrRunning = false
        this.asrStatus = 'ASR已停止'
        
        // 关闭SSE连接
        this.stopSSE()
      } catch (error) {
        console.error('停止ASR失败:', error)
        alert('停止ASR失败: ' + (error.response?.data?.detail || error.message))
        this.asrStatus = '停止ASR失败'
      }
    },
    startSSE() {
      // 关闭之前的连接
      this.stopSSE()
      
      console.log('开始创建SSE连接:', `/asr/stream/${this.sessionId}`)
      
      // 创建新的SSE连接
      this.abortController = createSSEConnection(`/asr/stream/${this.sessionId}`, {
        onopen: async (response) => {
          if (response.ok) {
            console.log('SSE连接已建立')
            this.asrStatus = 'SSE连接已建立'
          } else {
            throw new Error(`SSE连接失败: ${response.status}`);
          }
        },
        onmessage: (event) => {
          try {
            console.log('接收到SSE数据:', event.data)
            const data = JSON.parse(event.data)
            console.log('解析后的数据:', data)
            
            if (data.type === 'asr') {
              console.log('处理ASR数据:', data.data)
              // ASR结果，使用打字机效果
              this.asrBuffer = data.data
              this.asrIndex = 0
              if (this.asrInterval) {
                clearInterval(this.asrInterval)
              }
              this.startASRTyping()
            } else if (data.type === 'llm') {
              console.log('处理LLM数据:', data.data)
              const formatted = data.data.formatted
              console.log('LLM格式化数据:', formatted)

              if (formatted?.follow_up) {
                console.log('处理follow_up:', formatted.follow_up)
                // 追加到下一行
                if (this.followUpText) {
                  this.followUpText += '\n'
                }
                // 为每个追问问题添加序号
                const questions = data.data.follow_up_questions || []
                console.log('追问问题:', questions)
                let followUpText = ''
                questions.forEach((q, index) => {
                  this.followUpCount++
                  followUpText += `${this.followUpCount}. ${q}\n`
                })
                this.llmBuffers.followUp = followUpText
                this.llmIndices.followUp = 0
                if (this.llmIntervals.followUp) {
                  clearInterval(this.llmIntervals.followUp)
                }
                this.startLLMTyping('followUp')
              }

              if (formatted?.evaluation) {
                console.log('处理evaluation:', formatted.evaluation)
                // 追加到下一行
                if (this.evaluationText) {
                  this.evaluationText += '\n'
                }
                // 为每个评价添加序号
                this.evaluationCount++
                this.llmBuffers.evaluation = `${this.evaluationCount}. ${formatted.evaluation}`
                this.llmIndices.evaluation = 0
                if (this.llmIntervals.evaluation) {
                  clearInterval(this.llmIntervals.evaluation)
                }
                this.startLLMTyping('evaluation')
              }
            } else if (data.type == "questions_stream") {

            }
          } catch (error) {
            console.error('解析SSE数据失败:', error)
            console.error('原始数据:', event.data)
          }
        },
        onerror: (error) => {
          console.error('SSE连接错误:', error)
          this.asrStatus = 'SSE连接错误'
          throw error; // 发生错误时阻止自动重试
        },
        onclose: () => {
          console.log('SSE连接已关闭')
          this.asrStatus = 'SSE连接已关闭'
        }
      })
    },
    stopSSE() {
      if (this.abortController) {
        this.abortController.abort()
        this.abortController = null
      }
      
      // 清除所有打字机效果定时器
      if (this.asrInterval) {
        clearInterval(this.asrInterval)
        this.asrInterval = null
      }
      
      Object.values(this.llmIntervals).forEach(interval => {
        if (interval) {
          clearInterval(interval)
        }
      })
      
      Object.keys(this.llmIntervals).forEach(key => {
        this.llmIntervals[key] = null
      })
    },
    startASRTyping() {
      this.asrInterval = setInterval(() => {
        if (this.asrIndex < this.asrBuffer.length) {
          // 追加到现有内容
          this.asrText += this.asrBuffer[this.asrIndex]
          // 滚动到底部
          const asrTextbox = document.getElementById('asrTextbox')
          if (asrTextbox) {
            asrTextbox.scrollTop = asrTextbox.scrollHeight
          }
          this.asrIndex++
        } else {
          clearInterval(this.asrInterval)
          this.asrInterval = null
        }
      }, 50) // 每个字之间的延迟，符合人眼阅读速度
    },
    startLLMTyping(type) {
      const targetBox = type === 'followUp' ? document.getElementById('followUpBox') : document.getElementById('evaluationBox')
      const targetText = type === 'followUp' ? 'followUpText' : 'evaluationText'
      
      this.llmIntervals[type] = setInterval(() => {
        if (this.llmIndices[type] < this.llmBuffers[type].length) {
          this[targetText] += this.llmBuffers[type][this.llmIndices[type]]
          // 滚动到底部
          if (targetBox) {
            targetBox.scrollTop = targetBox.scrollHeight
          }
          this.llmIndices[type]++
        } else {
          clearInterval(this.llmIntervals[type])
          this.llmIntervals[type] = null
        }
      }, 50) // 每个字之间的延迟，符合打字机效果
    }
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.container {
  max-width: 1200px;
  margin: 50px auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 20px;
}

 h1 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
}

.control-section {
  text-align: center;
  margin-bottom: 20px;
}

.btn {
  padding: 12px 24px;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin: 0 5px;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
}

.btn-primary:hover {
  background-color: #45a049;
}

.btn-danger {
  background-color: #f44336;
  color: white;
}

.btn-danger:hover {
  background-color: #da190b;
}

.btn-secondary {
  background-color: #2196F3;
  color: white;
}

.btn-secondary:hover {
  background-color: #1976D2;
}

.user-id-display {
  text-align: center;
  margin: 10px 0;
  font-weight: bold;
  color: #333;
}

.textboxes-container {
  display: flex;
  gap: 20px;
  height: 600px;
}

.left-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.right-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

.textbox-section {
  display: flex;
  flex-direction: column;
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  background-color: #f9f9f9;
  height: 100%;
  overflow: hidden;
}

.textbox-label {
  font-weight: bold;
  margin-bottom: 10px;
  color: #333;
  font-size: 16px;
}

.textbox {
  height: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-y: auto;
  background-color: white;
}

.status {
  margin-top: 10px;
  text-align: center;
  font-size: 14px;
  color: #666;
}

.btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .textboxes-container {
    flex-direction: column;
    height: 800px;
  }
  
  .control-section {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .btn {
    margin: 5px;
  }
}
</style>

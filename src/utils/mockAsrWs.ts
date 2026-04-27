/**
 * Mock ASR WebSocket 模拟器
 * 用于在后端不可用时，模拟 ASR 实时语音识别的 WebSocket 数据推送。
 * 支持新版数据格式：包含 speaker_id（说话人识别）和 definite（是否为完整句子）。
 *
 * 使用方式：在 InterviewAssistantView.vue 中用 startMockAsr() 替代真实 WebSocket 连接。
 */

// Mock 对话脚本：模拟一段面试对话
const mockScript = [
  // 面试官（speaker 0）开场
  { speaker: '0', segments: [
    '你好',
    '你好，请先做一下',
    '你好，请先做一下自我介绍',
    '你好，请先做一下自我介绍吧。',
  ]},
  // 候选人（speaker 1）回答
  { speaker: '1', segments: [
    '好的',
    '好的，面试官你好',
    '好的，面试官你好，我叫张三',
    '好的，面试官你好，我叫张三，目前有三年的',
    '好的，面试官你好，我叫张三，目前有三年的前端开发经验',
    '好的，面试官你好，我叫张三，目前有三年的前端开发经验，主要技术栈是 Vue 和 React。',
  ]},
  // 面试官追问
  { speaker: '0', segments: [
    '嗯',
    '嗯，你之前做过',
    '嗯，你之前做过哪些比较有挑战性',
    '嗯，你之前做过哪些比较有挑战性的项目？',
  ]},
  // 候选人回答
  { speaker: '1', segments: [
    '我之前',
    '我之前在上一家公司',
    '我之前在上一家公司负责过一个',
    '我之前在上一家公司负责过一个实时数据可视化',
    '我之前在上一家公司负责过一个实时数据可视化大屏项目',
    '我之前在上一家公司负责过一个实时数据可视化大屏项目，需要处理每秒上万条数据的',
    '我之前在上一家公司负责过一个实时数据可视化大屏项目，需要处理每秒上万条数据的实时渲染。',
  ]},
  // 面试官深挖
  { speaker: '0', segments: [
    '那这个项目',
    '那这个项目目前有没有',
    '那这个项目目前有没有对你造成',
    '那这个项目目前有没有对你造成严重的性能瓶颈？',
  ]},
  // 候选人详细回答
  { speaker: '1', segments: [
    '有的有的',
    '有的有的，当时遇到了',
    '有的有的，当时遇到了最大的挑战是',
    '有的有的，当时遇到了最大的挑战是 WebSocket 消息积压导致页面卡顿',
    '有的有的，当时遇到了最大的挑战是 WebSocket 消息积压导致页面卡顿，后来我用了',
    '有的有的，当时遇到了最大的挑战是 WebSocket 消息积压导致页面卡顿，后来我用了虚拟滚动加节流的方案解决的。',
  ]},
]

// 同时模拟 LLM streaming 数据
const mockStreamingData = [
  {
    type: 'streaming',
    data: {
      response_type: 'advice',
      index: 0,
      content: '建议追问：请详细描述虚拟滚动的实现方案，以及如何做性能对比测试？'
    }
  },
  {
    type: 'streaming',
    data: {
      response_type: 'evaluation',
      index: 0,
      content: '候选人对实时数据处理有实战经验，能清晰描述问题和解决方案，技术深度较好。'
    }
  },
  {
    type: 'streaming',
    data: {
      response_type: 'done',
      index: 0,
      content: ''
    }
  }
]

export type MockAsrHandle = {
  stop: () => void
}

/**
 * 启动 Mock ASR 数据推送
 * @param onMessage - 回调函数，模拟 WebSocket 的 onmessage 事件
 * @returns 控制句柄，包含 stop 方法
 */
export function startMockAsr(onMessage: (event: { data: string }) => void): MockAsrHandle {
  let stopped = false
  let timeoutIds: number[] = []

  const schedule = (fn: () => void, delay: number) => {
    if (stopped) return
    const id = window.setTimeout(() => {
      if (!stopped) fn()
    }, delay)
    timeoutIds.push(id)
  }

  let cumulativeDelay = 500 // 初始延迟 500ms

  for (const turn of mockScript) {
    const segments = turn.segments
    const speakerId = turn.speaker

    for (let i = 0; i < segments.length; i++) {
      const isLast = i === segments.length - 1
      const text = segments[i]
      const delay = cumulativeDelay

      schedule(() => {
        const msg = {
          type: 'asr',
          definite: isLast,
          data: {
            text,
            speaker_id: speakerId
          }
        }
        console.log('[MockASR] 发送:', JSON.stringify(msg))
        onMessage({ data: JSON.stringify(msg) })
      }, delay)

      // 每个片段间隔 400-800ms 模拟实时转写
      cumulativeDelay += isLast ? 1200 : (400 + Math.random() * 400)
    }

    // 每个说话人轮次间增加间隔
    cumulativeDelay += 600
  }

  // 在所有 ASR 数据发送完成后，推送 LLM streaming 数据
  cumulativeDelay += 1000
  for (const streamMsg of mockStreamingData) {
    const delay = cumulativeDelay
    schedule(() => {
      onMessage({ data: JSON.stringify(streamMsg) })
    }, delay)
    cumulativeDelay += 300
  }

  return {
    stop() {
      stopped = true
      timeoutIds.forEach(id => clearTimeout(id))
      timeoutIds = []
    }
  }
}

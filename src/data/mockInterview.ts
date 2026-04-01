export type InterviewInfo = {
  status: string
  statusColor: string
  timer: string
  candidateName: string
  candidateTitle: string
  currentRound: number
}

export type TranscriptItem = {
  id: string
  label: string
  question: string
  questionAt: string
  answer: string
  answerAt: string
}

export type FollowUpQuestion = {
  id: string
  priority: '高优先级' | '中优先级' | '低优先级'
  title: string
  description: string
  tags: string[]
}

export type MetricItem = {
  title: string
  text: string
  level: '优秀' | '良好' | '待提升'
}

export type EvaluationSummary = {
  score: number
  summary: string
  metrics: MetricItem[]
}

export const interviewInfo: InterviewInfo = {
  status: '进行中',
  statusColor: '#22c55e',
  timer: '24:32',
  candidateName: '张三',
  candidateTitle: '高级前端工程师',
  currentRound: 3
}

export const transcriptConversation: TranscriptItem[] = [
  {
    id: 'q1',
    label: 'Q1',
    question: '请介绍一下你在上一个项目中遇到的最大技术挑战是什么？你是如何解决的？',
    questionAt: '08:12',
    answer: '在我负责的电商平台重构项目中，最大挑战是处理高并发场景下的性能优化... 我们使用了 SSR + 缓存策略并引入 lazy-loading 等措施。',
    answerAt: '08:15'
  },
  {
    id: 'q2',
    label: 'Q2',
    question: '你提到使用了虚拟列表，能详细说说实现原理和遇到的坑吗？',
    questionAt: '15:28',
    answer: '虚拟列表核心是只渲染可视区域内的 DOM 节点。我们使用 react-window 库... 最终用了预估高度+实时测量的混合方案。',
    answerAt: '15:32'
  },
  {
    id: 'q3',
    label: 'Q3',
    question: '在团队协作中，你如何确保代码质量和项目进度的平衡？',
    questionAt: '20:45',
    answer: '我认为代码质量和进度不是对立。团队建立了完整 Code Review 机制... 优先保证核心功能。',
    answerAt: '21:00'
  }
]

export const followUpQuestions: FollowUpQuestion[] = [
  {
    id: 's1',
    priority: '高优先级',
    title: '候选人提到建立了“完整的性能指标体系”，请追问具体包含哪些核心指标？如何设定阈值和监控告警？',
    description: '考察：技术深度、系统性思维',
    tags: ['技术深度', '系统思维']
  },
  {
    id: 's2',
    priority: '中优先级',
    title: '在 Code Review 机制中，遇到意见分歧时如何处理？能否举例说明一次争议的技术决策过程？',
    description: '考察：沟通能力、团队协作',
    tags: ['沟通能力', '团队协作']
  }
]

export const evaluationSummary: EvaluationSummary = {
  score: 8.2,
  summary: '回答结构清晰，技术深度良好，展现了较强的问题解决能力和团队协作意识。',
  metrics: [
    {
      title: '技术深度',
      text: '清楚描述了虚拟列表实现原理，对性能优化有合理认识。',
      level: '优秀'
    },
    {
      title: '问题解决',
      text: '从问题识别、方案验证到迭代优化，展示了完整流程。',
      level: '优秀'
    },
    {
      title: '表达能力',
      text: '语言清晰、有条理，回答准确。',
      level: '良好'
    }
  ]
}

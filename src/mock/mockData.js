/**
 * 集中式示例数据模块 — 当 VITE_MOCK_MODE=true 时自动生效
 * 所有 API 后端不可用时返回可用的模拟数据
 */

// ============================================================
//  基础数据
// ============================================================
function randomDate(startYear = 2025, endYear = 2026) {
  const start = new Date(startYear, 0, 1).getTime()
  const end = new Date(endYear, 11, 31).getTime()
  return new Date(start + Math.random() * (end - start)).toISOString()
}

let resumeId = 1000
function nextId() { return ++resumeId }

// ============================================================
//  简历列表
// ============================================================
export function mockResumes(count = 30) {
  const names = [
    '张伟', '李娜', '王芳', '陈明', '刘洋', '赵敏', '周磊', '吴昊',
    '孙悦', '钱进', '郑爽', '冯刚', '褚晓', '卫华', '蒋涛', '沈洁',
    '韩冰', '杨柳', '朱峰', '秦风', '许可', '何平', '吕布', '施琳',
    '张杰', '孔瑞', '曹雪', '严冬', '金华', '陶然',
  ]
  const positions = ['前端工程师', '后端工程师', '产品经理', 'UI设计师', '数据分析师', '测试工程师', '运营经理', '销售主管']
  const statuses = ['', '', '', 'PENDING', 'ACCEPTED', 'REJECTED', 'PENDING', '', '', '']
  const degrees = ['本科', '硕士', '博士', '本科', '本科', '硕士', '本科', '大专']
  const schools = ['北京大学', '清华大学', '复旦大学', '浙江大学', '上海交大', '南京大学', '武汉大学', '华中科技']

  return names.slice(0, count).map((name, i) => ({
    id: nextId(),
    name,
    email: `candidate${i + 1}@example.com`,
    phone: `138${String(10000000 + i).slice(0, 8)}`,
    gender: i % 2 === 0 ? '男' : '女',
    degree: degrees[i % degrees.length],
    school: schools[i % schools.length],
    position: positions[i % positions.length],
    review_status: statuses[i % statuses.length],
    created_at: randomDate(),
    updated_at: randomDate(),
    raw_text: `${name}的简历内容：教育经历-${schools[i % schools.length]} ${degrees[i % degrees.length]}；工作经验-${positions[i % positions.length]} 3年；技能-熟练掌握相关技术栈...`,
  }))
}

// ============================================================
//  简历详情
// ============================================================
export function mockResumeDetail(id) {
  const list = mockResumes(1)
  const base = list[0]
  return {
    ...base,
    id: Number(id),
    name: '张伟',
    email: 'zhangwei@example.com',
    phone: '13800001234',
    gender: '男',
    birth_date: '1995-06-12',
    school: '北京大学',
    degree: '硕士',
    major: '计算机科学',
    position: '前端工程师',
    work_years: '3',
    review_status: 'PENDING',
    raw_text: '张伟，1995年生，北京大学计算机科学硕士。3年前端开发经验，熟悉React、Vue等主流框架...',
    created_at: '2026-03-15T10:00:00Z',
    updated_at: '2026-07-20T14:30:00Z',
  }
}

// ============================================================
//  简历子模块
// ============================================================
export function mockResumeEducations() {
  return [
    { id: 1, school: '北京大学', degree: '硕士', major: '计算机科学', start_date: '2018-09', end_date: '2021-06' },
    { id: 2, school: '武汉大学', degree: '本科', major: '软件工程', start_date: '2014-09', end_date: '2018-06' },
  ]
}

export function mockResumeWorkExperiences() {
  return [
    { id: 1, company: '字节跳动', position: '前端工程师', start_date: '2021-07', end_date: '至今', description: '负责抖音电商前端开发' },
    { id: 2, company: '美团', position: '前端实习', start_date: '2020-06', end_date: '2020-12', description: '参与商家端开发' },
  ]
}

export function mockResumeSkills() {
  return [
    { id: 1, skill_name: 'Vue.js', level: '精通' },
    { id: 2, skill_name: 'React', level: '熟练' },
    { id: 3, skill_name: 'TypeScript', level: '熟练' },
    { id: 4, skill_name: 'Node.js', level: '了解' },
  ]
}

export function mockResumeProjects() {
  return [
    { id: 1, project_name: '电商中台', role: '前端负责人', description: '基于微前端架构的电商平台' },
    { id: 2, project_name: '面试助手系统', role: '核心开发', description: 'AI面试辅助平台' },
  ]
}

// ============================================================
//  面试安排
// ============================================================
export function mockInterviewSessions(count = 15) {
  const names = ['张伟', '李娜', '王芳', '陈明', '刘洋', '赵敏', '周磊', '吴昊', '孙悦', '钱进', '郑爽', '冯刚', '褚晓', '卫华', '蒋涛']
  const positions = ['前端工程师', '后端工程师', '产品经理', 'UI设计师', '数据分析师']
  const statuses = ['scheduled', 'scheduled', 'ongoing', 'completed', 'completed', 'cancelled', 'scheduled']
  const now = new Date()

  return names.slice(0, count).map((name, i) => {
    const day = new Date(now)
    day.setDate(day.getDate() - 3 + i)
    const hour = 9 + (i % 8)
    const ds = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
    return {
      id: 200 + i,
      session_id: 200 + i,
      candidate_name: name,
      position: positions[i % positions.length],
      scheduled_start_at: `${ds}T${String(hour).padStart(2, '0')}:00:00`,
      scheduled_end_at: `${ds}T${String(hour + 1).padStart(2, '0')}:00:00`,
      status: statuses[i % statuses.length],
      session_type: i % 3 === 0 ? 'online' : 'offline',
      interview_type: i % 3 === 0 ? '线上' : '线下',
      created_at: randomDate(),
    }
  })
}

// ============================================================
//  岗位
// ============================================================
export function mockPositions() {
  return [
    { id: 1, name: '前端工程师', department: '技术部', description: '负责Web前端开发', requirement: '3年以上Vue/React经验', status: 'active', created_at: '2026-01-01T00:00:00Z' },
    { id: 2, name: '后端工程师', department: '技术部', description: '负责后端服务开发', requirement: '熟悉Java/Python/Go', status: 'active', created_at: '2026-02-01T00:00:00Z' },
    { id: 3, name: '产品经理', department: '产品部', description: '负责产品规划与设计', requirement: '3年B端产品经验', status: 'active', created_at: '2026-03-01T00:00:00Z' },
    { id: 4, name: 'UI设计师', department: '设计部', description: '负责产品界面设计', requirement: '熟练Figma', status: 'active', created_at: '2026-04-01T00:00:00Z' },
    { id: 5, name: '数据分析师', department: '数据部', description: '负责数据分析和报表', requirement: '熟悉SQL/Python', status: 'active', created_at: '2026-05-01T00:00:00Z' },
    { id: 6, name: '测试工程师', department: '技术部', description: '负责产品质量保障', requirement: '2年测试经验', status: 'active', created_at: '2026-05-15T00:00:00Z' },
    { id: 7, name: '运营经理', department: '运营部', description: '负责用户增长和运营', requirement: '3年互联网运营经验', status: 'active', created_at: '2026-06-01T00:00:00Z' },
    { id: 8, name: '销售主管', department: '销售部', description: '负责企业客户拓展', requirement: '5年B2B销售经验', status: 'active', created_at: '2026-06-15T00:00:00Z' },
  ]
}

// ============================================================
//  用户
// ============================================================
export function mockUsers() {
  return [
    { id: 1, username: 'admin', email: 'admin@yinuo.com', role: 'admin', department: '技术部', created_at: '2026-01-01T00:00:00Z' },
    { id: 2, username: 'zhangsan', email: 'zhangsan@example.com', role: 'interviewer', department: '技术部', created_at: '2026-02-01T00:00:00Z' },
    { id: 3, username: 'lisi', email: 'lisi@example.com', role: 'interviewer', department: '产品部', created_at: '2026-03-01T00:00:00Z' },
    { id: 4, username: 'wangwu', email: 'wangwu@example.com', role: 'hr', department: '人事部', created_at: '2026-04-01T00:00:00Z' },
  ]
}

export function mockUserProfile() {
  return { id: 1, username: 'admin', email: 'admin@yinuo.com', role: 'admin', department: '技术部' }
}

// ============================================================
//  文件列表
// ============================================================
export function mockFiles() {
  return [
    { id: 1, filename: '张伟_前端工程师_简历.pdf', file_type: 'resume', file_size: 245000, session_id: null, created_at: '2026-07-20T10:00:00Z', updated_at: '2026-07-20T10:00:00Z' },
    { id: 2, filename: '李娜_20260720_面试录音.mp3', file_type: 'voice', file_size: 15200000, session_id: 200, created_at: '2026-07-20T11:00:00Z', updated_at: '2026-07-20T11:00:00Z' },
    { id: 3, filename: '李娜_20260720_转写文本.txt', file_type: 'dialogue', file_size: 32000, session_id: 200, created_at: '2026-07-20T11:05:00Z', updated_at: '2026-07-20T11:05:00Z' },
    { id: 4, filename: '王芳_产品经理_简历.docx', file_type: 'resume', file_size: 180000, session_id: null, created_at: '2026-07-19T09:00:00Z', updated_at: '2026-07-19T09:00:00Z' },
    { id: 5, filename: '陈明_20260719_面试录音.wav', file_type: 'voice', file_size: 28000000, session_id: 201, created_at: '2026-07-19T14:00:00Z', updated_at: '2026-07-19T14:00:00Z' },
    { id: 6, filename: '面试评估报告_张伟_20260720.pdf', file_type: 'report', file_size: 520000, session_id: null, created_at: '2026-07-20T12:00:00Z', updated_at: '2026-07-20T12:00:00Z' },
  ]
}

// ============================================================
//  知识库
// ============================================================
export function mockKnowledgeBases() {
  return [
    { id: 1, name: '前端面试题库', description: '前端开发岗位面试题库', doc_count: 25, created_at: '2026-03-01T00:00:00Z' },
    { id: 2, name: '后端面试题库', description: '后端开发岗位面试题库', doc_count: 18, created_at: '2026-03-15T00:00:00Z' },
    { id: 3, name: '公司制度文档', description: '公司规章制度及相关文档', doc_count: 12, created_at: '2026-04-01T00:00:00Z' },
  ]
}

// ============================================================
//  面试报告
// ============================================================
export function mockReports() {
  return [
    { id: 1, candidate_name: '张伟', position: '前端工程师', score: 85, status: 'completed', report_url: '', created_at: '2026-07-20T12:00:00Z' },
    { id: 2, candidate_name: '李娜', position: '后端工程师', score: 78, status: 'completed', report_url: '', created_at: '2026-07-19T15:00:00Z' },
    { id: 3, candidate_name: '王芳', position: '产品经理', score: 91, status: 'completed', report_url: '', created_at: '2026-07-18T11:00:00Z' },
  ]
}

// ============================================================
//  URL → Mock 路由表
// ============================================================
export function getMockResponse(url) {
  // 注意：url 是 axios config 中的路径（不含 baseURL 前缀）

  // 简历详情（含子模块：educations、work-experiences 等，必须优先于普通 resumes 匹配）
  if (/resumes\/\d+\/educations/.test(url)) return mockResumeEducations()
  if (/resumes\/\d+\/work-experiences/.test(url)) return mockResumeWorkExperiences()
  if (/resumes\/\d+\/skills/.test(url)) return mockResumeSkills()
  if (/resumes\/\d+\/projects/.test(url)) return mockResumeProjects()
  if (/resumes\/\d+/.test(url)) {
    const m = url.match(/resumes\/(\d+)/)
    return mockResumeDetail(m[1])
  }
  // 简历列表
  if (/resumes/.test(url)) return mockResumes()

  // 面试安排
  if (/reserve\/sessions/.test(url)) return mockInterviewSessions()

  // 岗位
  if (/positions/.test(url)) return mockPositions()

  // 用户详情（优先于列表）
  if (/users\/\d+/.test(url)) return mockUserProfile()
  // 用户列表
  if (/users/.test(url)) return mockUsers()

  // 文件
  if (/files|file/.test(url)) return mockFiles()

  // 知识库
  if (/knowledge/.test(url)) return mockKnowledgeBases()

  // 报告
  if (/reports|report/.test(url)) return mockReports()

  // 会话详情/轮次
  if (/sessions\/\d+\/rounds/.test(url)) return []
  if (/sessions/.test(url)) return { id: 1, status: 'active', rounds: [] }

  // 默认：返回空数组（兼容各类列表请求）
  if (/list|info/.test(url)) return []
  if (/rounds/.test(url)) return []

  return null
}

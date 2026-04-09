/**
 * i18n locale dictionaries — 中英文国际化文案
 *
 * Architecture:
 *   - Flat key structure kept for backward compatibility (`t.appName`)
 *   - Keys grouped by section via comments for maintainability
 *   - `tpl()` helper for safe string interpolation: `tpl(t.deleteConfirm, { count: 3 })`
 */

export type Locale = 'en' | 'zh'

// ────────────────────────────────────────
// Message shape — grouped by UI section
// ────────────────────────────────────────

export interface Messages {
  // ── Common ──
  appName: string
  appVersion: string
  signIn: string
  signOut: string
  startAsking: string
  settings: string
  collapse: string
  adminAccess: string
  goToAdminPanel: string

  // ── HomePage Hero ──
  heroTitle1: string
  heroTitleHighlight: string
  heroSubtitle: string

  // ── HomePage Stats ──
  statMultiTextbook: string
  statDeepTrace: string
  statPageCitations: string
  statMultiModels: string

  // ── HomePage Features ──
  featuresTitle: string
  featuresSubtitle: string
  featureQATitle: string
  featureQADesc: string
  featurePDFTitle: string
  featurePDFDesc: string
  featureTraceTitle: string
  featureTraceDesc: string

  // ── HomePage How It Works ──
  howTitle: string
  howSubtitle: string
  howStep1Title: string
  howStep1Desc: string
  howStep2Title: string
  howStep2Desc: string
  howStep3Title: string
  howStep3Desc: string

  // ── HomePage CTA ──
  ctaTitle: string
  ctaSubtitle: string

  // ── LoginForm ──
  loginHeading: string
  loginSubheading: string
  emailLabel: string
  emailPlaceholder: string
  passwordLabel: string
  passwordPlaceholder: string
  signingIn: string
  loginErrorEmpty: string
  loginErrorFailed: string

  // ── Sidebar Nav ──
  navNewChat: string
  navReaders: string
  navQuestionGen: string
  navGroupChat: string
  navGroupResources: string
  navGroupAdmin: string
  navGroupDataPipeline: string
  navGroupQueryPipeline: string
  navGroupQuality: string
  navAnalytics: string
  navEvaluation: string
  navFeedback: string
  navLlms: string
  navResponseSynthesizers: string
  navAcquisition: string
  navIngestion: string
  navRetrievers: string
  navQueryEngine: string
  navSeed: string

  // ── Upload ──
  uploadPdf: string
  uploadDragDrop: string
  uploadClickBrowse: string
  uploadOr: string
  uploadDropRelease: string
  uploadProgress: string
  uploadSuccess: string
  uploadDismiss: string
  deleteConfirm: string       // uses {count}

  // ── Chat Panel ──
  chatWelcomeTitle: string
  chatWelcomeBody: string      // uses {count}
  chatWelcomeHint: string
  chatSearchAllDocs: string    // uses {count}
  chatPlaceholderSingle: string // uses {title}
  chatPlaceholderMulti: string
  chatInputHint: string
  chatSendTitle: string
  chatSearching: string
  chatJumpToLatest: string
}

// ────────────────────────────────────────
// String interpolation helper
// ────────────────────────────────────────

/**
 * Lightweight template interpolation.
 *
 * @example tpl("Delete {count} book(s)?", { count: 3 })
 *          // → "Delete 3 book(s)?"
 */
export function tpl(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  )
}

// ────────────────────────────────────────
// English
// ────────────────────────────────────────

const en: Messages = {
  // Common
  appName: 'Textbook RAG',
  appVersion: 'v2.0',
  signIn: 'Sign In',
  signOut: 'Sign Out',
  startAsking: 'Start Asking',
  settings: 'Settings',
  collapse: 'Collapse',
  adminAccess: 'Admin access?',
  goToAdminPanel: 'Go to Admin Panel →',

  // Hero
  heroTitle1: 'AI-Powered',
  heroTitleHighlight: ' Textbook Assistant',
  heroSubtitle: 'Ask questions about your textbooks and get instant, accurate answers with deep source tracing and page-level citations.',

  // Stats
  statMultiTextbook: 'Multi-Textbook Support',
  statDeepTrace: 'Deep Source Tracing',
  statPageCitations: 'Page-Level Citations',
  statMultiModels: 'Multiple AI Models',

  // Features
  featuresTitle: 'Powerful Features',
  featuresSubtitle: 'Everything you need to study smarter, not harder',
  featureQATitle: 'Intelligent Q&A',
  featureQADesc: 'Ask natural language questions and get accurate answers grounded in your actual textbook content.',
  featurePDFTitle: 'PDF Viewer with Highlights',
  featurePDFDesc: 'View your textbook side-by-side with the chat. Source passages are highlighted directly on the PDF page.',
  featureTraceTitle: 'Full Trace & Analytics',
  featureTraceDesc: 'See exactly how the AI found its answer — retrieval scores, chunk rankings, and full query trace.',

  // How It Works
  howTitle: 'How It Works',
  howSubtitle: 'Three simple steps to get started',
  howStep1Title: 'Upload Textbooks',
  howStep1Desc: 'Admin uploads PDF textbooks. The system automatically ingests, chunks, and indexes the content.',
  howStep2Title: 'Ask Questions',
  howStep2Desc: 'Type a question in natural language. The AI searches across all indexed textbook content.',
  howStep3Title: 'Get Cited Answers',
  howStep3Desc: 'Receive accurate answers with page-level citations. Click sources to jump to the exact PDF page.',

  // CTA
  ctaTitle: 'Ready to Study Smarter?',
  ctaSubtitle: 'Sign in and start asking your textbooks questions today.',

  // Login
  loginHeading: 'Textbook RAG',
  loginSubheading: 'Sign in to access your AI-powered textbook assistant',
  emailLabel: 'Email',
  emailPlaceholder: 'you@example.com',
  passwordLabel: 'Password',
  passwordPlaceholder: 'Enter your password',
  signingIn: 'Signing in...',
  loginErrorEmpty: 'Please enter both email and password',
  loginErrorFailed: 'Login failed. Please check your credentials.',

  // Sidebar Nav
  navNewChat: 'New Chat',
  navReaders: 'Library',
  navQuestionGen: 'Question Gen',
  navGroupChat: 'Chat',
  navGroupResources: 'Resources',
  navGroupAdmin: 'Admin',
  navGroupDataPipeline: 'Data Pipeline',
  navGroupQueryPipeline: 'Query Pipeline',
  navGroupQuality: 'Quality',
  navAnalytics: 'Analytics',
  navEvaluation: 'Evaluation',
  navFeedback: 'Feedback',
  navLlms: 'LLMs',
  navResponseSynthesizers: 'Prompts',
  navAcquisition: 'Import',
  navIngestion: 'Ingestion',
  navRetrievers: 'Retrievers',
  navQueryEngine: 'Query Engine',
  navSeed: 'Seed Database',

  // Upload
  uploadPdf: 'Upload PDF',
  uploadDragDrop: 'Drag & drop a PDF here',
  uploadClickBrowse: 'click to browse',
  uploadOr: 'or',
  uploadDropRelease: 'Drop file to upload',
  uploadProgress: 'Uploading',
  uploadSuccess: 'Upload complete! Processing...',
  uploadDismiss: 'Dismiss',
  deleteConfirm: 'Delete {count} book(s)? This cannot be undone.',

  // Chat Panel
  chatWelcomeTitle: 'Ottawa EcDev Research Assistant',
  chatWelcomeBody: 'Searching across {count} documents. Ask about employment, housing, inflation, or any economic indicator.',
  chatWelcomeHint: 'Browse suggested questions in the panel on the right →',
  chatSearchAllDocs: 'Searching all {count} documents',
  chatPlaceholderSingle: 'Ask about {title}...',
  chatPlaceholderMulti: 'Ask about Ottawa economic data...',
  chatInputHint: 'Enter to send · Shift+Enter for new line',
  chatSendTitle: 'Send message (Enter)',
  chatSearching: 'Searching the documents…',
  chatJumpToLatest: '↓ Jump to latest',
}

// ────────────────────────────────────────
// 简体中文
// ────────────────────────────────────────

const zh: Messages = {
  // Common
  appName: 'Textbook RAG',
  appVersion: 'v2.0',
  signIn: '登录',
  signOut: '退出登录',
  startAsking: '开始提问',
  settings: '设置',
  collapse: '收起',
  adminAccess: '管理员入口？',
  goToAdminPanel: '进入管理后台 →',

  // Hero
  heroTitle1: 'AI 驱动的',
  heroTitleHighlight: '教材智能助手',
  heroSubtitle: '向你的教材提问，获取即时、精准的答案，支持深度溯源与页码级引用。',

  // Stats
  statMultiTextbook: '多教材支持',
  statDeepTrace: '深度溯源追踪',
  statPageCitations: '页码级引用',
  statMultiModels: '多模型支持',

  // Features
  featuresTitle: '核心功能',
  featuresSubtitle: '让学习更高效、更智能',
  featureQATitle: '智能问答',
  featureQADesc: '用自然语言提问，获取基于真实教材内容的精准答案。',
  featurePDFTitle: 'PDF 高亮阅读器',
  featurePDFDesc: '聊天与教材并排显示，来源段落直接在 PDF 页面上高亮标注。',
  featureTraceTitle: '完整追踪与分析',
  featureTraceDesc: '查看 AI 如何找到答案 —— 检索评分、分块排名和完整查询追踪。',

  // How It Works
  howTitle: '使用流程',
  howSubtitle: '三步开始使用',
  howStep1Title: '上传教材',
  howStep1Desc: '管理员上传 PDF 教材，系统自动完成解析、分块和索引。',
  howStep2Title: '提出问题',
  howStep2Desc: '用自然语言输入问题，AI 将在所有已索引的教材内容中搜索。',
  howStep3Title: '获取引用答案',
  howStep3Desc: '获得带有页码级引用的精准答案，点击来源即可跳转到对应 PDF 页面。',

  // CTA
  ctaTitle: '准备好更聪明地学习了吗？',
  ctaSubtitle: '登录并立即开始向你的教材提问。',

  // Login
  loginHeading: 'Textbook RAG',
  loginSubheading: '登录以使用 AI 教材智能助手',
  emailLabel: '邮箱',
  emailPlaceholder: 'you@example.com',
  passwordLabel: '密码',
  passwordPlaceholder: '请输入密码',
  signingIn: '登录中...',
  loginErrorEmpty: '请输入邮箱和密码',
  loginErrorFailed: '登录失败，请检查您的凭据。',

  // Sidebar Nav
  navNewChat: '新对话',
  navReaders: '书库',
  navQuestionGen: 'Question Gen',
  navGroupChat: '对话',
  navGroupResources: '资源',
  navGroupAdmin: '管理',
  navGroupDataPipeline: '数据入库',
  navGroupQueryPipeline: '查询生成',
  navGroupQuality: '质量监控',
  navAnalytics: '使用统计',
  navEvaluation: '质量评估',
  navFeedback: '反馈管理',
  navLlms: 'LLMs',
  navResponseSynthesizers: '提示词',
  navAcquisition: '导入',
  navIngestion: '数据摄取',
  navRetrievers: '检索器',
  navQueryEngine: '查询引擎',
  navSeed: '数据初始化',

  // Upload
  uploadPdf: '上传 PDF',
  uploadDragDrop: '拖放 PDF 文件到此处',
  uploadClickBrowse: '点击选择文件',
  uploadOr: '或',
  uploadDropRelease: '释放文件以上传',
  uploadProgress: '正在上传',
  uploadSuccess: '上传成功！正在处理...',
  uploadDismiss: '关闭',
  deleteConfirm: '确定删除 {count} 本书？此操作不可撤销。',

  // Chat Panel
  chatWelcomeTitle: 'Ottawa 经济发展研究助手',
  chatWelcomeBody: '正在搜索 {count} 份文档。可以询问就业、住房、通货膨胀或任何经济指标。',
  chatWelcomeHint: '在右侧面板中浏览推荐问题 →',
  chatSearchAllDocs: '正在搜索全部 {count} 份文档',
  chatPlaceholderSingle: '关于《{title}》提问…',
  chatPlaceholderMulti: '关于 Ottawa 经济数据提问…',
  chatInputHint: 'Enter 发送 · Shift+Enter 换行',
  chatSendTitle: '发送消息 (Enter)',
  chatSearching: '正在搜索文档…',
  chatJumpToLatest: '↓ 跳转到最新',
}

export const messages: Record<Locale, Messages> = { en, zh }

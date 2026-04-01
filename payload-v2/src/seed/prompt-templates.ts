/**
 * seed/prompt-templates.ts — Seed data for query clarification templates.
 * Aligned with: engine_v2/response_synthesizers/
 *
 * Each template defines trigger patterns and suggested follow-up questions
 * to help users refine ambiguous queries. Stored in Prompts collection
 * with type='template'.
 */

export const promptTemplatesData = [
  {
    name: 'Definition vs Comparison',
    type: 'template',
    slug: 'disambiguation',
    description: 'Clarify whether user wants a definition or comparison',
    category: 'disambiguation',
    triggerPatterns: ['what is', 'explain', 'tell me about', '什么是', '解释'],
    clarifyPrompt:
      'Are you looking for a definition or a comparison with related concepts?',
    clarifyPromptZh: '你想了解定义，还是与相关概念的对比？',
    suggestedQuestions: [
      'Give me the definition of {topic}',
      'Compare {topic} with related concepts',
      'Explain {topic} with examples',
    ],
    suggestedQuestionsZh: [
      '给我 {topic} 的定义',
      '将 {topic} 与相关概念进行对比',
      '用示例解释 {topic}',
    ],
    answerFormat:
      'Start with a clear definition, then provide context and examples.',
    answerFormatZh: '先给出清晰定义，然后提供上下文和示例。',
    isEnabled: true,
    sortOrder: 10,
  },
  {
    name: 'Broad Topic Narrowing',
    type: 'template',
    slug: 'scope-narrowing',
    description: 'Help narrow down a broad question',
    category: 'scope',
    triggerPatterns: ['how does', 'how to', 'everything about', '怎么', '如何', '关于'],
    clarifyPrompt:
      'This is a broad topic. Which aspect are you most interested in?',
    clarifyPromptZh: '这个话题比较宽泛，你最感兴趣哪个方面？',
    suggestedQuestions: [
      'How does {topic} work internally?',
      'What are the practical applications of {topic}?',
      'What are the advantages and disadvantages of {topic}?',
      'How is {topic} different from alternatives?',
    ],
    suggestedQuestionsZh: [
      '{topic} 的内部工作原理是什么？',
      '{topic} 有哪些实际应用？',
      '{topic} 的优缺点是什么？',
      '{topic} 与替代方案有何不同？',
    ],
    answerFormat:
      'Focus on the specific aspect requested. Use sections if covering multiple sub-topics.',
    answerFormatZh: '聚焦于所问的具体方面。如涉及多个子话题，请分节回答。',
    isEnabled: true,
    sortOrder: 11,
  },
  {
    name: 'Step-by-step vs Summary',
    type: 'template',
    slug: 'format-guidance',
    description: 'Choose between walkthrough and overview',
    category: 'format',
    triggerPatterns: ['how to implement', 'steps for', 'process of', '步骤', '实现', '流程'],
    clarifyPrompt:
      'Would you like a step-by-step walkthrough or a high-level summary?',
    clarifyPromptZh: '你想要逐步详解还是高层概述？',
    suggestedQuestions: [
      'Walk me through {topic} step by step',
      'Give me a high-level summary of {topic}',
      'What are the key steps in {topic}?',
    ],
    suggestedQuestionsZh: [
      '逐步讲解 {topic}',
      '给我 {topic} 的高层概述',
      '{topic} 的关键步骤是什么？',
    ],
    answerFormat:
      'Use numbered steps for walkthroughs. Use bullet points for summaries.',
    answerFormatZh: '详解用编号步骤，概述用要点列表。',
    isEnabled: true,
    sortOrder: 12,
  },
  {
    name: 'Deeper Understanding',
    type: 'template',
    slug: 'deeper-understanding',
    description: 'Theory vs practical implications',
    category: 'followup',
    triggerPatterns: ['why', 'reason', 'cause', '为什么', '原因'],
    clarifyPrompt:
      'Do you want the theoretical reasoning or practical implications?',
    clarifyPromptZh: '你想了解理论原因还是实际影响？',
    suggestedQuestions: [
      'Why does {topic} work this way? (theory)',
      'What are the practical consequences of {topic}?',
      'What would happen if {topic} changed?',
    ],
    suggestedQuestionsZh: [
      '{topic} 为什么这样运作？（理论）',
      '{topic} 的实际后果是什么？',
      '如果 {topic} 改变了会怎样？',
    ],
    answerFormat:
      'Explain the underlying reasoning first, then discuss implications.',
    answerFormatZh: '先解释底层原因，再讨论影响。',
    isEnabled: true,
    sortOrder: 13,
  },
]

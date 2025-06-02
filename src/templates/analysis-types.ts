import type { AnalysisType } from '../types'

export const analysisTypes: Record<string, AnalysisType> = {
  content: {
    id: 'content',
    name: 'Content Analysis',
    description: 'Comprehensive analysis of text content including quality, structure, and effectiveness',
    icon: '📝',
    category: 'content',
    requiredInputs: [
      {
        name: 'content',
        type: 'text',
        required: true,
        maxLength: 50000,
        description: 'The content to analyze'
      }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['overview', 'key-points', 'quality-metrics', 'recommendations']
    },
    estimatedTime: 30,
    aiRequired: true
  },

  sentiment: {
    id: 'sentiment',
    name: 'Sentiment Analysis',
    description: 'Analyze emotional tone, sentiment polarity, and mood',
    icon: '😊',
    category: 'sentiment',
    requiredInputs: [
      {
        name: 'text',
        type: 'text',
        required: true,
        maxLength: 10000
      }
    ],
    outputFormat: {
      type: 'structured',
      schema: {
        overall: 'string',
        score: 'number',
        emotions: 'object',
        keywords: 'array'
      }
    },
    estimatedTime: 10,
    aiRequired: true
  },

  seo: {
    id: 'seo',
    name: 'SEO Analysis',
    description: 'Search engine optimization analysis and recommendations',
    icon: '🔍',
    category: 'seo',
    requiredInputs: [
      {
        name: 'content',
        type: 'html',
        required: true
      },
      {
        name: 'url',
        type: 'url',
        required: false
      },
      {
        name: 'keywords',
        type: 'text',
        required: false,
        description: 'Target keywords (comma separated)'
      }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['score', 'issues', 'recommendations', 'keyword-analysis']
    },
    estimatedTime: 45,
    aiRequired: true
  },

  readability: {
    id: 'readability',
    name: 'Readability Analysis',
    description: 'Assess reading difficulty and accessibility',
    icon: '📖',
    category: 'readability',
    requiredInputs: [
      {
        name: 'text',
        type: 'text',
        required: true
      },
      {
        name: 'targetAudience',
        type: 'text',
        required: false,
        description: 'Target audience (e.g., "general public", "experts")'
      }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['score', 'metrics', 'issues', 'suggestions']
    },
    estimatedTime: 15,
    aiRequired: true
  },

  factCheck: {
    id: 'fact-check',
    name: 'Fact Check Analysis',
    description: 'Identify factual claims for verification',
    icon: '✓',
    category: 'fact-check',
    requiredInputs: [
      {
        name: 'content',
        type: 'text',
        required: true
      }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['claims', 'sources', 'red-flags']
    },
    estimatedTime: 60,
    aiRequired: true
  },

  bias: {
    id: 'bias',
    name: 'Bias Detection',
    description: 'Detect various types of bias in content',
    icon: '⚖️',
    category: 'bias',
    requiredInputs: [
      {
        name: 'content',
        type: 'text',
        required: true
      },
      {
        name: 'context',
        type: 'text',
        required: false,
        description: 'Additional context about the content'
      }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['bias-types', 'examples', 'severity', 'recommendations']
    },
    estimatedTime: 40,
    aiRequired: true
  },

  summary: {
    id: 'summary',
    name: 'Smart Summary',
    description: 'Generate intelligent summaries with key insights',
    icon: '📋',
    category: 'content',
    requiredInputs: [
      {
        name: 'content',
        type: 'text',
        required: true
      },
      {
        name: 'length',
        type: 'text',
        required: false,
        description: 'Desired summary length (short/medium/long)'
      }
    ],
    outputFormat: {
      type: 'markdown',
      sections: ['summary', 'key-points', 'insights']
    },
    estimatedTime: 20,
    aiRequired: true
  },

  competitor: {
    id: 'competitor',
    name: 'Competitor Content Analysis',
    description: 'Compare content against competitors',
    icon: '🏆',
    category: 'content',
    requiredInputs: [
      {
        name: 'yourContent',
        type: 'text',
        required: true,
        description: 'Your content'
      },
      {
        name: 'competitorContent',
        type: 'text',
        required: true,
        description: 'Competitor content'
      }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['comparison', 'strengths', 'weaknesses', 'opportunities']
    },
    estimatedTime: 50,
    aiRequired: true
  },

  custom: {
    id: 'custom',
    name: 'Custom Analysis',
    description: 'User-defined analysis',
    icon: '🔧',
    category: 'custom',
    requiredInputs: [
      {
        name: 'input',
        type: 'text',
        required: true,
        description: 'Input to analyze'
      }
    ],
    outputFormat: {
      type: 'json'
    },
    estimatedTime: 30,
    aiRequired: true
  },

  // Backward compatibility with old module analysis types
  contentAnalysis: {
    id: 'contentAnalysis',
    name: 'Content Analysis',
    description: 'Comprehensive analysis of text content',
    icon: '📝',
    category: 'content',
    requiredInputs: [
      {
        name: 'content',
        type: 'text',
        required: true,
        maxLength: 50000
      }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['overview', 'key-points', 'quality-metrics', 'recommendations']
    },
    estimatedTime: 30,
    aiRequired: true
  },

  sentimentAnalysis: {
    id: 'sentimentAnalysis',
    name: 'Sentiment Analysis',
    description: 'Analyze emotional tone and sentiment',
    icon: '😊',
    category: 'sentiment',
    requiredInputs: [
      {
        name: 'text',
        type: 'text',
        required: true,
        maxLength: 10000
      }
    ],
    outputFormat: {
      type: 'structured',
      schema: {
        sentiment: 'string',
        score: 'number',
        aspects: 'array'
      }
    },
    estimatedTime: 10,
    aiRequired: true
  },

  seoAnalysis: {
    id: 'seoAnalysis',
    name: 'SEO Analysis',
    description: 'Search engine optimization analysis',
    icon: '🔍',
    category: 'seo',
    requiredInputs: [
      {
        name: 'title',
        type: 'text',
        required: true
      },
      {
        name: 'content',
        type: 'html',
        required: true
      },
      {
        name: 'url',
        type: 'url',
        required: false
      },
      {
        name: 'metaDescription',
        type: 'text',
        required: false
      },
      {
        name: 'keywords',
        type: 'text',
        required: false
      }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['score', 'issues', 'recommendations', 'keyword-analysis']
    },
    estimatedTime: 45,
    aiRequired: true
  },

  readabilityAnalysis: {
    id: 'readabilityAnalysis',
    name: 'Readability Analysis',
    description: 'Assess content readability and accessibility',
    icon: '📖',
    category: 'readability',
    requiredInputs: [
      {
        name: 'text',
        type: 'text',
        required: true
      },
      {
        name: 'targetAudience',
        type: 'text',
        required: false
      }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['score', 'metrics', 'issues', 'suggestions']
    },
    estimatedTime: 15,
    aiRequired: true
  },

  factCheckAnalysis: {
    id: 'factCheckAnalysis',
    name: 'Fact Check Analysis',
    description: 'Identify and verify factual claims',
    icon: '✓',
    category: 'fact-check',
    requiredInputs: [
      {
        name: 'content',
        type: 'text',
        required: true
      },
      {
        name: 'checkSources',
        type: 'text',
        required: false
      }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['claims', 'sources', 'red-flags']
    },
    estimatedTime: 60,
    aiRequired: true
  },

  biasAnalysis: {
    id: 'biasAnalysis',
    name: 'Bias Analysis',
    description: 'Detect potential biases in content',
    icon: '⚖️',
    category: 'bias',
    requiredInputs: [
      {
        name: 'content',
        type: 'text',
        required: true
      },
      {
        name: 'author',
        type: 'text',
        required: false
      },
      {
        name: 'source',
        type: 'text',
        required: false
      }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['bias-types', 'examples', 'severity', 'recommendations']
    },
    estimatedTime: 40,
    aiRequired: true
  },

  competitorAnalysis: {
    id: 'competitorAnalysis',
    name: 'Competitor Content Analysis',
    description: 'Compare content against competitors',
    icon: '🏆',
    category: 'content',
    requiredInputs: [
      {
        name: 'yourContent',
        type: 'text',
        required: true
      },
      {
        name: 'competitorContent',
        type: 'text',
        required: true
      }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['comparison', 'strengths', 'weaknesses', 'opportunities']
    },
    estimatedTime: 50,
    aiRequired: true
  },

  customAnalysis: {
    id: 'customAnalysis',
    name: 'Custom Analysis',
    description: 'User-defined analysis',
    icon: '🔧',
    category: 'custom',
    requiredInputs: [
      {
        name: 'input',
        type: 'text',
        required: true
      },
      {
        name: 'customPrompt',
        type: 'text',
        required: true
      },
      {
        name: 'additionalInstructions',
        type: 'text',
        required: false
      }
    ],
    outputFormat: {
      type: 'json'
    },
    estimatedTime: 30,
    aiRequired: true
  },

  // Special analysis types for Insight Buddy compatibility
  summarize: {
    id: 'summarize',
    name: 'Tóm tắt',
    description: 'Tóm tắt ngắn gọn nội dung đoạn văn',
    icon: '📝',
    category: 'content',
    requiredInputs: [
      { name: 'text', type: 'text', required: true },
      { name: 'context', type: 'text', required: false }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['summary', 'keyPoints']
    },
    estimatedTime: 3,
    aiRequired: true
  },

  explain: {
    id: 'explain',
    name: 'Giải thích thuật ngữ',
    description: 'Giải thích các thuật ngữ khó hiểu trong văn bản',
    icon: '💡',
    category: 'content',
    requiredInputs: [
      { name: 'text', type: 'text', required: true },
      { name: 'context', type: 'text', required: false }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['terms', 'explanations']
    },
    estimatedTime: 5,
    aiRequired: true
  },

  critique: {
    id: 'critique',
    name: 'Đặt câu hỏi phản biện',
    description: 'Tạo câu hỏi phản biện sâu sắc về nội dung',
    icon: '🤔',
    category: 'content',
    requiredInputs: [
      { name: 'text', type: 'text', required: true },
      { name: 'context', type: 'text', required: false }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['questions', 'reasoning']
    },
    estimatedTime: 5,
    aiRequired: true
  },

  contextDictionary: {
    id: 'context',
    name: 'Từ điển ngữ cảnh',
    description: 'Giải thích từ ngữ trong ngữ cảnh cụ thể',
    icon: '📚',
    category: 'content',
    requiredInputs: [
      { name: 'text', type: 'text', required: true },
      { name: 'context', type: 'text', required: false }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['definitions', 'usage']
    },
    estimatedTime: 3,
    aiRequired: true
  },

  biasCheck: {
    id: 'bias',
    name: 'Kiểm tra thiên vị',
    description: 'Phát hiện ngôn ngữ thiên vị và cảm xúc',
    icon: '⚖️',
    category: 'bias',
    requiredInputs: [
      { name: 'text', type: 'text', required: true },
      { name: 'author', type: 'text', required: false },
      { name: 'source', type: 'text', required: false }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['biasTypes', 'examples', 'neutralAlternatives']
    },
    estimatedTime: 5,
    aiRequired: true
  },

  expand: {
    id: 'expand',
    name: 'Mở rộng kiến thức',
    description: 'Gợi ý từ khóa và chủ đề liên quan để tìm hiểu thêm',
    icon: '➕',
    category: 'content',
    requiredInputs: [
      { name: 'text', type: 'text', required: true },
      { name: 'context', type: 'text', required: false }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['keywords', 'relatedTopics', 'recommendations']
    },
    estimatedTime: 3,
    aiRequired: true
  },

  quickSummary: {
    id: 'quickSummary',
    name: 'Tóm tắt nhanh',
    description: 'Tóm tắt cực ngắn trong 1 câu',
    icon: '⚡',
    category: 'content',
    requiredInputs: [
      { name: 'text', type: 'text', required: true }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['summary']
    },
    estimatedTime: 1,
    aiRequired: true
  }
}
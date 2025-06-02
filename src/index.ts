// Core exports
export { AnalysisEngine } from './core/analysis-engine'
export { TemplateEngine } from './core/template-engine'
export { NLPProcessor } from './core/nlp-processor'
export { CacheManager } from './core/cache-manager'
export { ResultParser } from './core/result-parser'
export { ResultFormatter } from './core/result-formatter'

// Builder exports
export {
  createAnalysis,
  createBulkAnalysis,
  createStreamAnalysis,
  createCollaborativeAnalysis,
  createAnalysisPipeline,
  createSEOAnalyzer,
  createQualityAnalyzer,
  createStrategyAnalyzer,
  createSocialMediaAnalysis,
  createCustomAnalysis,
  BulkAnalyzer,
  StreamAnalyzer,
  CollaborativeAnalyzer,
  PipelineAnalyzer
} from './builders'

// Template exports
export {
  analysisTypes,
  promptTemplates,
  getPromptTemplate,
  getAnalysisType,
  getInsightPrompt,
  formatInsightResponse,
  insightAnalysisTypes,
  insightPromptTemplates,
  compileTemplate
} from './templates'

// Type exports
export * from './types'

// Utility exports
export * from './utilities'

// Configuration presets
export const AnalysisPresets = {
  development: {
    ai: {
      provider: 'mock' as const,
      cache: {
        enabled: true,
        ttl: 600000,
        maxSize: 100
      }
    },
    nlp: {
      enableSentiment: true,
      enableLanguageDetection: true,
      enableEntityExtraction: true,
      enableKeywordExtraction: true
    },
    cache: {
      strategy: 'exact' as const,
      ttl: 600000,
      maxSize: 100
    },
    performance: {
      enableProfiling: true,
      enableMetrics: true,
      maxConcurrency: 5
    }
  },

  production: {
    ai: {
      provider: 'openai' as const,
      model: 'gpt-3.5-turbo',
      cache: {
        enabled: true,
        ttl: 3600000,
        maxSize: 500
      }
    },
    nlp: {
      enableSentiment: true,
      enableLanguageDetection: true,
      enableEntityExtraction: true,
      enableKeywordExtraction: true
    },
    cache: {
      strategy: 'semantic' as const,
      ttl: 3600000,
      maxSize: 500,
      similarityThreshold: 0.85
    },
    performance: {
      enableProfiling: false,
      enableMetrics: true,
      maxConcurrency: 10
    }
  },

  highPerformance: {
    ai: {
      provider: 'openai' as const,
      model: 'gpt-3.5-turbo',
      cache: {
        enabled: true,
        ttl: 7200000,
        maxSize: 1000
      },
      rateLimit: {
        requestsPerMinute: 100,
        concurrent: 10
      }
    },
    nlp: {
      enableSentiment: true,
      enableLanguageDetection: true,
      enableEntityExtraction: false, // Disable for speed
      enableKeywordExtraction: true
    },
    cache: {
      strategy: 'fuzzy' as const,
      ttl: 7200000,
      maxSize: 1000,
      similarityThreshold: 0.7
    },
    performance: {
      enableProfiling: false,
      enableMetrics: true,
      maxConcurrency: 20
    }
  },

  insightBuddy: {
    ai: {
      provider: 'openai' as const,
      model: 'gpt-3.5-turbo',
      cache: {
        enabled: true,
        ttl: 1800000 // 30 minutes
      }
    },
    nlp: {
      enableSentiment: true,
      enableLanguageDetection: true,
      enableEntityExtraction: false,
      enableKeywordExtraction: false
    },
    cache: {
      strategy: 'exact' as const,
      ttl: 1800000,
      maxSize: 50
    },
    performance: {
      enableProfiling: false,
      enableMetrics: false,
      maxConcurrency: 3
    }
  }
} as const

// Quick start functions

/**
 * Create a simple text analyzer
 */
export async function createTextAnalyzer(apiKey: string, provider: 'openai' | 'anthropic' | 'google' = 'openai') {
  return createAnalysis({
    ai: {
      provider,
      apiKey
    },
    nlp: {
      enableSentiment: true,
      enableKeywordExtraction: true,
      enableReadability: true
    }
  })
}

/**
 * Create an insight analyzer (for Insight Buddy compatibility)
 */
export async function createInsightAnalyzer(apiKey: string) {
  return createAnalysis({
    ...AnalysisPresets.insightBuddy,
    ai: {
      ...AnalysisPresets.insightBuddy.ai,
      apiKey
    }
  })
}

// Version
export const VERSION = '1.0.0'

// Re-export for backward compatibility
export { AnalysisEngine as analysisEngine } from './core/analysis-engine'
export { ResponseParser } from './core/result-parser'
export { ResultFormatter } from './core/result-formatter'

// Export types that were in the old module
export type {
  AnalysisType,
  AnalysisInput,
  AnalysisOutput,
  AnalysisRequest,
  AnalysisOptions,
  AnalysisResult,
  AnalysisSection,
  Recommendation,
  Source,
  PromptTemplate,
  PromptVariable,
  Example
} from './types'
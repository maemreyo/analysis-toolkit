import { AnalysisEngine } from '../core/analysis-engine'
import type { 
  AnalysisConfig, 
  BulkAnalysisConfig,
  StreamAnalysisConfig,
  CollaborativeAnalysisConfig,
  AnalysisPipelineConfig,
  DeepPartial
} from '../types'
import { BulkAnalyzer } from './bulk-analyzer'
import { StreamAnalyzer } from './stream-analyzer'
import { CollaborativeAnalyzer } from './collaborative-analyzer'
import { PipelineAnalyzer } from './pipeline-analyzer'
import { SpecializedAnalyzers } from './specialized-analyzers'

/**
 * Create a standard analysis engine
 */
export async function createAnalysis(config: DeepPartial<AnalysisConfig>): Promise<AnalysisEngine> {
  // Ensure AI config is provided
  if (!config.ai) {
    throw new Error('AI configuration is required')
  }

  const fullConfig: AnalysisConfig = {
    ai: config.ai as any,
    nlp: {
      enableSentiment: true,
      enableLanguageDetection: true,
      enableEntityExtraction: true,
      enableKeywordExtraction: true,
      ...config.nlp
    },
    templates: config.templates,
    cache: {
      strategy: 'exact',
      ttl: 3600000,
      maxSize: 100,
      ...config.cache
    },
    performance: {
      enableMetrics: true,
      maxConcurrency: 5,
      ...config.performance
    },
    output: {
      format: 'json',
      includeMetrics: true,
      ...config.output
    }
  }

  return new AnalysisEngine(fullConfig)
}

/**
 * Create a bulk analyzer for processing multiple contents
 */
export async function createBulkAnalysis(config: BulkAnalysisConfig): Promise<BulkAnalyzer> {
  const engine = await createAnalysis({
    ai: config.ai,
    performance: {
      maxConcurrency: config.processing?.concurrency || 3
    }
  })

  return new BulkAnalyzer(engine, config)
}

/**
 * Create a stream analyzer for real-time analysis
 */
export async function createStreamAnalysis(config: StreamAnalysisConfig): Promise<StreamAnalyzer> {
  const engine = await createAnalysis({
    ai: config.ai,
    cache: {
      strategy: 'fuzzy' // Better for streaming
    }
  })

  return new StreamAnalyzer(engine, config)
}

/**
 * Create a collaborative analyzer using multiple providers
 */
export async function createCollaborativeAnalysis(config: CollaborativeAnalysisConfig): Promise<CollaborativeAnalyzer> {
  const engines: Array<{ engine: AnalysisEngine; weight: number }> = []

  for (const provider of config.providers) {
    const engine = await createAnalysis({
      ai: {
        ...provider.config,
        provider: provider.provider as any
      }
    })
    
    engines.push({
      engine,
      weight: provider.weight
    })
  }

  return new CollaborativeAnalyzer(engines, config.consensus)
}

/**
 * Create an analysis pipeline
 */
export async function createAnalysisPipeline(config: AnalysisPipelineConfig): Promise<PipelineAnalyzer> {
  const engine = await createAnalysis({
    ai: config.ai
  })

  return new PipelineAnalyzer(engine, config)
}

/**
 * Create specialized analyzers
 */
export async function createSEOAnalyzer(config: DeepPartial<AnalysisConfig>) {
  const analyzer = await createAnalysis({
    ...config,
    templates: {
      ...config.templates,
      customTemplates: {
        seoAudit: SpecializedAnalyzers.seoAuditTemplate,
        ...config.templates?.customTemplates
      }
    }
  })

  return {
    analyzer,
    analyzeSEOContent: async (content: string, options?: any) => {
      return analyzer.analyze({
        type: 'seo',
        inputs: { content, ...options }
      })
    },
    auditSEO: async (url: string, content: string, keywords: string[]) => {
      return analyzer.runTemplate('seoAudit', {
        url,
        content,
        keywords
      })
    }
  }
}

export async function createQualityAnalyzer(config: DeepPartial<AnalysisConfig>) {
  const analyzer = await createAnalysis({
    ...config,
    nlp: {
      ...config.nlp,
      enablePOSTagging: true // Enable for quality analysis
    }
  })

  return {
    analyzer,
    analyzeWritingQuality: async (text: string, options?: any) => {
      return analyzer.analyze({
        type: 'readability',
        inputs: { text, ...options },
        options: {
          includeNLP: true,
          includeStructure: true,
          includeRecommendations: true
        }
      })
    }
  }
}

export async function createStrategyAnalyzer(config: DeepPartial<AnalysisConfig>) {
  const analyzer = await createAnalysis({
    ...config,
    templates: {
      ...config.templates,
      customTemplates: {
        contentStrategy: SpecializedAnalyzers.contentStrategyTemplate,
        ...config.templates?.customTemplates
      }
    }
  })

  return {
    analyzer,
    analyzeContentStrategy: async (contents: any[], brand: any, goals: string[]) => {
      return analyzer.runTemplate('contentStrategy', {
        contents,
        brand,
        goals
      })
    }
  }
}

export async function createSocialMediaAnalysis(config: DeepPartial<AnalysisConfig>) {
  const analyzer = await createAnalysis({
    ...config,
    templates: {
      ...config.templates,
      customTemplates: {
        socialMedia: SpecializedAnalyzers.socialMediaTemplate,
        ...config.templates?.customTemplates
      }
    }
  })

  return {
    analyzer,
    analyzePosts: async (posts: any[], options?: any) => {
      const results = await Promise.all(
        posts.map(post => analyzer.runTemplate('socialMedia', {
          content: post.content,
          platform: post.platform,
          ...options
        }))
      )

      return {
        individual: results,
        summary: await analyzer.analyze({
          type: 'summary',
          inputs: {
            content: results.map(r => r.output).join('\n\n')
          }
        })
      }
    }
  }
}

/**
 * Create a custom analyzer with user-defined configuration
 */
export async function createCustomAnalysis(config: {
  ai: any
  customEngines: Record<string, any>
}) {
  const analyzer = await createAnalysis({
    ai: config.ai
  })

  // Register custom engines
  Object.entries(config.customEngines).forEach(([id, engine]) => {
    analyzer.registerAnalysisType({
      id,
      name: engine.name || id,
      description: engine.description || 'Custom analysis',
      category: 'custom',
      requiredInputs: engine.inputs || [{ name: 'input', type: 'text', required: true }],
      outputFormat: { type: 'json' },
      aiRequired: true
    }, {
      id,
      name: id,
      description: 'Custom template',
      template: engine.template,
      variables: engine.variables || [],
      category: 'custom'
    })
  })

  return {
    analyzer,
    runCustomAnalysis: async (engineId: string, input: any) => {
      return analyzer.analyze({
        type: engineId,
        inputs: typeof input === 'string' ? { input } : input
      })
    }
  }
}

// Export convenience functions
export { AnalysisEngine }
export { BulkAnalyzer }
export { StreamAnalyzer }
export { CollaborativeAnalyzer }
export { PipelineAnalyzer }
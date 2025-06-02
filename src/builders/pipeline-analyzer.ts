import type {
  AnalysisEngine,
  AnalysisPipelineConfig,
  AnalysisPipelineStep,
  AnalysisResult
} from '../types'

export class PipelineAnalyzer {
  private engine: AnalysisEngine
  private config: AnalysisPipelineConfig

  constructor(engine: AnalysisEngine, config: AnalysisPipelineConfig) {
    this.engine = engine
    this.config = config
  }

  /**
   * Process content through the pipeline
   */
  async process(input: string | any): Promise<any> {
    let currentData = typeof input === 'string' ? { text: input } : input
    const context: Record<string, any> = {
      originalInput: input,
      stepResults: {}
    }

    for (let i = 0; i < this.config.steps.length; i++) {
      const step = this.config.steps[i]
      
      try {
        currentData = await this.executeStep(step, currentData, context)
        context.stepResults[step.name] = currentData
      } catch (error) {
        console.error(`Pipeline step '${step.name}' failed:`, error)
        
        if (this.config.errorHandling === 'stop') {
          throw error
        } else if (this.config.errorHandling === 'retry') {
          // Retry logic
          let retryCount = 0
          const maxRetries = this.config.maxRetries || 3
          
          while (retryCount < maxRetries) {
            try {
              currentData = await this.executeStep(step, currentData, context)
              context.stepResults[step.name] = currentData
              break
            } catch (retryError) {
              retryCount++
              if (retryCount >= maxRetries) {
                if (this.config.errorHandling === 'continue') {
                  console.warn(`Skipping failed step '${step.name}' after ${maxRetries} retries`)
                  continue
                } else {
                  throw retryError
                }
              }
              // Wait before retry
              await this.delay(1000 * retryCount)
            }
          }
        }
        // If errorHandling is 'continue', just log and continue
      }
    }

    return currentData
  }

  /**
   * Execute a single pipeline step
   */
  private async executeStep(
    step: AnalysisPipelineStep,
    input: any,
    context: Record<string, any>
  ): Promise<any> {
    switch (step.type) {
      case 'preprocessing':
        return this.preprocessingStep(input, step.config)
      
      case 'nlp':
        return this.nlpStep(input, step.config)
      
      case 'ai':
        return this.aiStep(input, step, context)
      
      case 'hybrid':
        return this.hybridStep(input, step, context)
      
      case 'custom':
        if (!step.processor) {
          throw new Error(`Custom step '${step.name}' missing processor function`)
        }
        return step.processor(input, context)
      
      case 'postprocessing':
        return this.postprocessingStep(input, step.config)
      
      default:
        throw new Error(`Unknown step type: ${step.type}`)
    }
  }

  /**
   * Preprocessing step
   */
  private async preprocessingStep(input: any, config?: any): Promise<any> {
    let text = typeof input === 'string' ? input : input.text || JSON.stringify(input)
    
    // Apply preprocessing
    if (config?.normalizeText) {
      // Normalize whitespace
      text = text.replace(/\s+/g, ' ').trim()
      
      // Normalize quotes
      text = text.replace(/[""]/g, '"').replace(/['']/g, "'")
      
      // Remove extra punctuation
      text = text.replace(/([.!?])\1+/g, '$1')
    }
    
    if (config?.enableCleaning) {
      // Remove URLs
      text = text.replace(/https?:\/\/[^\s]+/g, '[URL]')
      
      // Remove email addresses
      text = text.replace(/\S+@\S+/g, '[EMAIL]')
      
      // Remove special characters (keep basic punctuation)
      text = text.replace(/[^\w\s.,!?;:'"()-]/g, '')
    }
    
    if (config?.lowercase) {
      text = text.toLowerCase()
    }
    
    return typeof input === 'string' ? text : { ...input, text }
  }

  /**
   * NLP analysis step
   */
  private async nlpStep(input: any, config?: any): Promise<any> {
    const text = typeof input === 'string' ? input : input.text
    
    // Run NLP analysis through engine
    const result = await this.engine.analyze({
      type: 'content',
      inputs: { content: text },
      options: {
        includeNLP: true,
        includeStructure: true,
        includeReadability: true,
        includeKeywords: config?.enableKeywords !== false,
        includeRecommendations: false,
        depth: 'quick'
      }
    })
    
    // Extract NLP results
    const nlpData = {
      ...input,
      nlp: result.nlpAnalysis,
      structure: result.structure,
      keywords: result.nlpAnalysis?.keywords?.slice(0, config?.maxKeywords || 10)
    }
    
    return nlpData
  }

  /**
   * AI analysis step
   */
  private async aiStep(
    input: any,
    step: AnalysisPipelineStep,
    context: Record<string, any>
  ): Promise<any> {
    const text = typeof input === 'string' ? input : input.text
    
    // Use template if specified
    if (step.template) {
      const result = await this.engine.runTemplate(step.template, {
        text,
        ...input,
        context: context.stepResults
      }, step.config)
      
      return {
        ...input,
        [step.name]: result.output || result
      }
    }
    
    // Otherwise run standard analysis
    const result = await this.engine.analyze({
      type: step.config?.analysisType || 'content',
      inputs: { content: text, ...input },
      options: {
        ...step.config,
        depth: step.config?.detailed ? 'detailed' : 'standard'
      }
    })
    
    return {
      ...input,
      [step.name]: {
        summary: result.aiAnalysis?.summary,
        keyPoints: result.aiAnalysis?.keyPoints,
        sentiment: result.aiAnalysis?.sentiment,
        themes: result.aiAnalysis?.themes,
        output: result.output
      }
    }
  }

  /**
   * Hybrid step combining NLP and AI
   */
  private async hybridStep(
    input: any,
    step: AnalysisPipelineStep,
    context: Record<string, any>
  ): Promise<any> {
    // Run both NLP and AI analysis
    const nlpResult = await this.nlpStep(input, step.config)
    const aiResult = await this.aiStep(nlpResult, step, context)
    
    // Combine results
    const combined = {
      ...aiResult,
      hybrid: {
        // Combine keywords from both
        keywords: this.combineKeywords(
          nlpResult.keywords || [],
          aiResult[step.name]?.keywords || []
        ),
        
        // Use AI sentiment but include NLP sentiment score
        sentiment: {
          label: aiResult[step.name]?.sentiment || 'neutral',
          nlpScore: nlpResult.nlp?.sentiment?.score || 0,
          confidence: this.calculateSentimentConfidence(
            aiResult[step.name]?.sentiment,
            nlpResult.nlp?.sentiment
          )
        },
        
        // Merge insights
        insights: [
          ...(aiResult[step.name]?.keyPoints || []),
          ...(nlpResult.nlp?.keywords?.slice(0, 3).map(k => `Key term: ${k.word}`) || [])
        ]
      }
    }
    
    return combined
  }

  /**
   * Postprocessing step
   */
  private async postprocessingStep(input: any, config?: any): Promise<any> {
    let result = { ...input }
    
    // Format output
    if (config?.format) {
      switch (config.format) {
        case 'summary':
          result = this.formatAsSummary(result)
          break
        case 'report':
          result = this.formatAsReport(result)
          break
        case 'insights':
          result = this.extractInsights(result)
          break
      }
    }
    
    // Filter fields
    if (config?.includeOnly && Array.isArray(config.includeOnly)) {
      const filtered: any = {}
      config.includeOnly.forEach((field: string) => {
        if (field in result) {
          filtered[field] = result[field]
        }
      })
      result = filtered
    }
    
    // Remove fields
    if (config?.exclude && Array.isArray(config.exclude)) {
      config.exclude.forEach((field: string) => {
        delete result[field]
      })
    }
    
    return result
  }

  /**
   * Combine keywords from different sources
   */
  private combineKeywords(nlpKeywords: any[], aiKeywords: any[]): any[] {
    const keywordMap = new Map<string, any>()
    
    // Add NLP keywords
    nlpKeywords.forEach(keyword => {
      keywordMap.set(keyword.word.toLowerCase(), {
        word: keyword.word,
        relevance: keyword.relevance,
        source: 'nlp'
      })
    })
    
    // Add or merge AI keywords
    aiKeywords.forEach(keyword => {
      const key = keyword.toLowerCase()
      const existing = keywordMap.get(key)
      
      if (existing) {
        existing.relevance = (existing.relevance + 1) / 2
        existing.source = 'both'
      } else {
        keywordMap.set(key, {
          word: keyword,
          relevance: 0.7,
          source: 'ai'
        })
      }
    })
    
    return Array.from(keywordMap.values())
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10)
  }

  /**
   * Calculate sentiment confidence
   */
  private calculateSentimentConfidence(aiSentiment?: string, nlpSentiment?: any): number {
    if (!aiSentiment || !nlpSentiment) return 0.5
    
    // Map AI sentiment to score
    const aiScore = aiSentiment === 'positive' ? 1 : aiSentiment === 'negative' ? -1 : 0
    
    // Compare with NLP score
    const nlpScore = nlpSentiment.score
    const nlpNormalized = nlpScore > 0 ? 1 : nlpScore < 0 ? -1 : 0
    
    // If they agree, high confidence
    if (aiScore === nlpNormalized) {
      return 0.9
    }
    
    // If they disagree completely, low confidence
    if (aiScore * nlpNormalized < 0) {
      return 0.3
    }
    
    // Partial agreement
    return 0.6
  }

  /**
   * Format result as summary
   */
  private formatAsSummary(data: any): any {
    const summary = {
      text: data.text?.substring(0, 100) + '...',
      summary: '',
      highlights: [] as string[]
    }
    
    // Collect summaries from all steps
    Object.values(data).forEach(value => {
      if (typeof value === 'object' && value !== null) {
        if (value.summary) {
          summary.summary += value.summary + ' '
        }
        if (value.keyPoints) {
          summary.highlights.push(...value.keyPoints)
        }
      }
    })
    
    summary.summary = summary.summary.trim()
    summary.highlights = summary.highlights.slice(0, 5)
    
    return summary
  }

  /**
   * Format result as report
   */
  private formatAsReport(data: any): any {
    const report = {
      title: 'Analysis Report',
      date: new Date().toISOString(),
      sections: [] as any[]
    }
    
    // Create sections from pipeline results
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && key !== 'text') {
        report.sections.push({
          name: key.charAt(0).toUpperCase() + key.slice(1),
          content: value
        })
      }
    })
    
    return report
  }

  /**
   * Extract key insights
   */
  private extractInsights(data: any): any {
    const insights = {
      mainInsights: [] as string[],
      themes: [] as string[],
      recommendations: [] as string[],
      metrics: {} as any
    }
    
    // Collect insights from all steps
    Object.values(data).forEach(value => {
      if (typeof value === 'object' && value !== null) {
        if (value.keyPoints) {
          insights.mainInsights.push(...value.keyPoints)
        }
        if (value.themes) {
          insights.themes.push(...value.themes)
        }
        if (value.recommendations) {
          insights.recommendations.push(...value.recommendations.map((r: any) => r.title))
        }
        if (value.sentiment) {
          insights.metrics.sentiment = value.sentiment
        }
      }
    })
    
    // Deduplicate
    insights.mainInsights = [...new Set(insights.mainInsights)].slice(0, 5)
    insights.themes = [...new Set(insights.themes)].slice(0, 5)
    insights.recommendations = [...new Set(insights.recommendations)].slice(0, 5)
    
    return insights
  }

  /**
   * Helper delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Add step to pipeline
   */
  addStep(step: AnalysisPipelineStep, position?: number) {
    if (position !== undefined) {
      this.config.steps.splice(position, 0, step)
    } else {
      this.config.steps.push(step)
    }
  }

  /**
   * Remove step from pipeline
   */
  removeStep(stepName: string) {
    this.config.steps = this.config.steps.filter(s => s.name !== stepName)
  }

  /**
   * Get pipeline configuration
   */
  getConfig(): AnalysisPipelineConfig {
    return this.config
  }

  /**
   * Create a simplified pipeline
   */
  static createSimplePipeline(steps: string[]): AnalysisPipelineStep[] {
    const stepTemplates: Record<string, AnalysisPipelineStep> = {
      'clean': {
        name: 'cleaning',
        type: 'preprocessing',
        config: { enableCleaning: true, normalizeText: true }
      },
      'nlp': {
        name: 'nlp-analysis',
        type: 'nlp',
        config: { enableKeywords: true }
      },
      'sentiment': {
        name: 'sentiment',
        type: 'ai',
        template: 'sentimentAnalysis'
      },
      'summary': {
        name: 'summary',
        type: 'ai',
        template: 'summarize'
      },
      'insights': {
        name: 'insights',
        type: 'postprocessing',
        config: { format: 'insights' }
      }
    }
    
    return steps.map(step => stepTemplates[step] || {
      name: step,
      type: 'ai',
      config: { analysisType: step }
    })
  }
}
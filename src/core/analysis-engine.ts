import { v4 as uuidv4 } from 'uuid'
import { AIEngine } from '@matthew.ngo/ai-toolkit'
import type { 
  AnalysisRequest, 
  AnalysisResult, 
  AnalysisType,
  AnalysisConfig,
  PromptTemplate,
  AIAnalysisResult,
  NLPAnalysisResult,
  StructureAnalysis,
  PerformanceMetrics
} from '../types'
import { TemplateEngine } from './template-engine'
import { NLPProcessor } from './nlp-processor'
import { CacheManager } from './cache-manager'
import { ResultParser } from './result-parser'
import { ResultFormatter } from './result-formatter'
import { analysisTypes } from '../templates/analysis-types'
import { promptTemplates } from '../templates'
import EventEmitter from 'events'

export class AnalysisEngine extends EventEmitter {
  private aiEngine: AIEngine
  private templateEngine: TemplateEngine
  private nlpProcessor: NLPProcessor
  private cacheManager: CacheManager
  private resultParser: ResultParser
  private resultFormatter: ResultFormatter
  private config: AnalysisConfig
  private activeAnalyses: Map<string, AnalysisResult> = new Map()
  private analysisHistory: AnalysisResult[] = []
  private maxHistorySize: number = 100

  constructor(config: AnalysisConfig) {
    super()
    this.config = config

    // Initialize AI Engine from ai-toolkit
    this.aiEngine = new AIEngine({
      ...config.ai,
      cache: {
        ...config.ai.cache,
        enabled: config.cache?.strategy !== undefined
      }
    })

    // Initialize components
    this.templateEngine = new TemplateEngine({
      customTemplates: config.templates?.customTemplates,
      helpers: config.templates?.templateHelpers,
      partials: config.templates?.templatePartials
    })

    this.nlpProcessor = new NLPProcessor(config.nlp || {})
    this.cacheManager = new CacheManager(config.cache || {})
    this.resultParser = new ResultParser()
    this.resultFormatter = new ResultFormatter(config.output || {})
  }

  /**
   * Run an analysis based on type and inputs
   */
  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    const analysisId = uuidv4()
    const analysisType = analysisTypes[request.type]

    if (!analysisType) {
      throw new Error(`Unknown analysis type: ${request.type}`)
    }

    // Validate inputs
    this.validateInputs(request.inputs, analysisType)

    // Create initial result
    const result: AnalysisResult = {
      id: analysisId,
      type: request.type,
      status: 'pending',
      inputs: request.inputs,
      metadata: {
        startedAt: new Date()
      }
    }

    this.activeAnalyses.set(analysisId, result)
    this.emit('analysis-start', { id: analysisId, type: request.type })

    try {
      // Check cache
      const cacheKey = this.cacheManager.generateKey(request)
      const cachedResult = await this.cacheManager.get(cacheKey)
      
      if (cachedResult) {
        this.emit('cache-hit', { id: analysisId, key: cacheKey })
        result.status = 'completed'
        Object.assign(result, cachedResult)
        return result
      }

      this.emit('cache-miss', { id: analysisId, key: cacheKey })

      // Update status
      result.status = 'processing'

      // Perform analysis
      const analysisOutput = await this.performAnalysis(request, analysisType)

      // Update result
      Object.assign(result, analysisOutput)
      result.status = 'completed'
      result.metadata.completedAt = new Date()
      result.metadata.duration = Date.now() - result.metadata.startedAt.getTime()

      // Cache result
      await this.cacheManager.set(cacheKey, analysisOutput)

      // Store in history
      this.addToHistory(result)

      this.emit('analysis-complete', { 
        id: analysisId, 
        duration: result.metadata.duration,
        tokensUsed: result.metadata.tokensUsed
      })

      return result

    } catch (error: any) {
      result.status = 'failed'
      result.metadata.error = error.message
      result.metadata.completedAt = new Date()

      this.addToHistory(result)
      this.emit('analysis-error', { id: analysisId, error: error.message })
      
      throw error

    } finally {
      this.activeAnalyses.delete(analysisId)
    }
  }

  /**
   * Perform the actual analysis
   */
  private async performAnalysis(
    request: AnalysisRequest,
    analysisType: AnalysisType
  ): Promise<Partial<AnalysisResult>> {
    const startTime = Date.now()
    const performanceMetrics: PerformanceMetrics = {
      processingTime: 0,
      tokensUsed: 0,
      cacheHit: false,
      providers: []
    }

    // Get appropriate prompt template
    const template = promptTemplates[request.type] || promptTemplates.customAnalysis

    // Compile prompt with inputs
    const prompt = this.templateEngine.compile(template, request)

    // Run AI analysis
    const aiStartTime = Date.now()
    const aiResponse = await this.aiEngine.generateText(prompt, {
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: this.getSystemPrompt(analysisType)
    })
    
    const aiTime = Date.now() - aiStartTime
    performanceMetrics.providers?.push({
      provider: 'ai',
      time: aiTime,
      tokens: 0 // Will be updated from aiEngine stats
    })

    // Parse AI response
    const parsedResult = this.resultParser.parseAnalysisResponse(
      aiResponse,
      request.type,
      analysisType.outputFormat.type
    )

    // Create AI analysis result
    const aiAnalysis: AIAnalysisResult = {
      summary: parsedResult.summary || '',
      keyPoints: parsedResult.keyPoints || [],
      sentiment: parsedResult.sentiment || 'neutral',
      tone: parsedResult.tone || '',
      themes: parsedResult.themes || [],
      customAnalysis: parsedResult.customAnalysis
    }

    // Run NLP analysis if enabled
    let nlpAnalysis: NLPAnalysisResult | undefined
    let structure: StructureAnalysis | undefined

    if (request.options?.includeNLP !== false && this.config.nlp) {
      const nlpStartTime = Date.now()
      
      const inputText = request.inputs.text || request.inputs.content || ''
      nlpAnalysis = await this.nlpProcessor.analyze(inputText)
      
      const nlpTime = Date.now() - nlpStartTime
      performanceMetrics.providers?.push({
        provider: 'nlp',
        time: nlpTime,
        tokens: 0
      })
    }

    // Calculate structure analysis
    if (request.options?.includeStructure !== false) {
      const inputText = request.inputs.text || request.inputs.content || ''
      structure = this.calculateStructure(inputText)
    }

    // Update performance metrics
    performanceMetrics.processingTime = Date.now() - startTime

    // Get token usage from AI engine
    const aiStats = this.aiEngine.getStats()
    performanceMetrics.tokensUsed = aiStats.usage?.tokensUsed || 0

    return {
      ...parsedResult,
      aiAnalysis,
      nlpAnalysis,
      structure,
      performance: performanceMetrics
    }
  }

  /**
   * Calculate text structure analysis
   */
  private calculateStructure(text: string): StructureAnalysis {
    const words = text.split(/\s+/).filter(w => w.length > 0)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0)
    
    const avgSentenceLength = sentences.length > 0 
      ? words.length / sentences.length 
      : 0
      
    const avgWordLength = words.length > 0
      ? words.reduce((sum, word) => sum + word.length, 0) / words.length
      : 0

    // Determine complexity based on various factors
    let complexity: 'simple' | 'moderate' | 'complex' = 'moderate'
    if (avgSentenceLength < 10 && avgWordLength < 5) {
      complexity = 'simple'
    } else if (avgSentenceLength > 25 || avgWordLength > 7) {
      complexity = 'complex'
    }

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      averageSentenceLength: Math.round(avgSentenceLength * 10) / 10,
      averageWordLength: Math.round(avgWordLength * 10) / 10,
      complexity
    }
  }

  /**
   * Run multiple analyses in parallel
   */
  async analyzeMultiple(requests: AnalysisRequest[]): Promise<AnalysisResult[]> {
    const promises = requests.map(request => this.analyze(request))
    return Promise.all(promises)
  }

  /**
   * Stream analysis results (for long-running analyses)
   */
  async *analyzeStream(request: AnalysisRequest): AsyncGenerator<Partial<AnalysisResult>> {
    const analysisId = uuidv4()
    const analysisType = analysisTypes[request.type]

    if (!analysisType) {
      throw new Error(`Unknown analysis type: ${request.type}`)
    }

    // Initial result
    yield {
      id: analysisId,
      type: request.type,
      status: 'pending',
      inputs: request.inputs,
      metadata: { startedAt: new Date() }
    }

    try {
      yield { status: 'processing' }

      // Get template and compile prompt
      const template = promptTemplates[request.type] || promptTemplates.customAnalysis
      const prompt = this.templateEngine.compile(template, request)

      // Stream AI response
      const stream = this.aiEngine.generateStream(prompt, {
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt: this.getSystemPrompt(analysisType)
      })

      let fullResponse = ''
      for await (const chunk of stream) {
        fullResponse += chunk

        // Periodically parse and yield partial results
        if (fullResponse.length % 500 === 0) {
          const partial = this.resultParser.parseAnalysisResponse(
            fullResponse,
            request.type,
            analysisType.outputFormat.type
          )
          yield partial
        }
      }

      // Final parse
      const finalResult = this.resultParser.parseAnalysisResponse(
        fullResponse,
        request.type,
        analysisType.outputFormat.type
      )

      yield {
        ...finalResult,
        status: 'completed',
        metadata: {
          completedAt: new Date()
        }
      }

    } catch (error: any) {
      yield {
        status: 'failed',
        metadata: {
          error: error.message,
          completedAt: new Date()
        }
      }
    }
  }

  /**
   * Run analysis with custom template
   */
  async runTemplate(
    templateName: string,
    variables: Record<string, any>,
    options?: AnalysisRequest['options']
  ): Promise<AnalysisResult> {
    const template = this.templateEngine.getTemplate(templateName)
    if (!template) {
      throw new Error(`Template not found: ${templateName}`)
    }

    const request: AnalysisRequest = {
      type: 'custom',
      inputs: variables,
      options: {
        ...options,
        customPrompt: template.template
      }
    }

    return this.analyze(request)
  }

  /**
   * Get analysis by ID
   */
  getAnalysis(id: string): AnalysisResult | undefined {
    // Check active analyses
    const active = this.activeAnalyses.get(id)
    if (active) return active

    // Check history
    return this.analysisHistory.find(a => a.id === id)
  }

  /**
   * Get analysis history
   */
  getHistory(options?: {
    type?: string
    status?: string
    limit?: number
    offset?: number
  }): AnalysisResult[] {
    let results = [...this.analysisHistory]

    if (options?.type) {
      results = results.filter(r => r.type === options.type)
    }

    if (options?.status) {
      results = results.filter(r => r.status === options.status)
    }

    if (options?.offset) {
      results = results.slice(options.offset)
    }

    if (options?.limit) {
      results = results.slice(0, options.limit)
    }

    return results
  }

  /**
   * Clear analysis history
   */
  clearHistory() {
    this.analysisHistory = []
  }

  /**
   * Get available analysis types
   */
  getAvailableTypes(): AnalysisType[] {
    return Object.values(analysisTypes)
  }

  /**
   * Get analysis type by ID
   */
  getAnalysisType(id: string): AnalysisType | undefined {
    return analysisTypes[id]
  }

  /**
   * Register custom analysis type
   */
  registerAnalysisType(type: AnalysisType, template?: PromptTemplate) {
    analysisTypes[type.id] = type

    if (template) {
      this.templateEngine.registerTemplate(template.id, template)
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    const aiStats = this.aiEngine.getStats()
    const cacheStats = this.cacheManager.getStats()
    const nlpStats = this.nlpProcessor.getStats()

    return {
      ai: aiStats,
      cache: cacheStats,
      nlp: nlpStats,
      history: {
        total: this.analysisHistory.length,
        completed: this.analysisHistory.filter(a => a.status === 'completed').length,
        failed: this.analysisHistory.filter(a => a.status === 'failed').length
      }
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    const health = {
      status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
      components: {
        ai: { status: 'healthy', message: '' },
        nlp: { status: 'healthy', message: '' },
        cache: { status: 'healthy', message: '' }
      },
      issues: [] as string[],
      recommendations: [] as string[]
    }

    // Check AI engine
    try {
      const aiStats = this.aiEngine.getStats()
      if (aiStats.health?.status === 'degraded') {
        health.components.ai.status = 'degraded'
        health.components.ai.message = 'AI service experiencing issues'
        health.issues.push('AI service degraded')
      }
    } catch (error: any) {
      health.components.ai.status = 'unhealthy'
      health.components.ai.message = error.message
      health.issues.push('AI service unavailable')
    }

    // Check NLP processor
    if (!this.nlpProcessor.isAvailable()) {
      health.components.nlp.status = 'degraded'
      health.components.nlp.message = 'Some NLP features unavailable'
      health.issues.push('Limited NLP functionality')
    }

    // Check cache
    const cacheStats = this.cacheManager.getStats()
    if (cacheStats.errorRate > 0.1) {
      health.components.cache.status = 'degraded'
      health.components.cache.message = 'High cache error rate'
      health.issues.push('Cache performance degraded')
    }

    // Determine overall health
    const componentStatuses = Object.values(health.components).map(c => c.status)
    if (componentStatuses.includes('unhealthy')) {
      health.status = 'unhealthy'
    } else if (componentStatuses.includes('degraded')) {
      health.status = 'degraded'
    }

    // Add recommendations
    if (health.status !== 'healthy') {
      health.recommendations.push('Check service logs for errors')
      if (health.components.ai.status !== 'healthy') {
        health.recommendations.push('Verify AI provider API keys and limits')
      }
      if (health.components.cache.status !== 'healthy') {
        health.recommendations.push('Clear cache or increase cache size')
      }
    }

    return health
  }

  // Private methods

  private validateInputs(inputs: Record<string, any>, analysisType: AnalysisType) {
    for (const input of analysisType.requiredInputs) {
      if (input.required && !inputs[input.name]) {
        throw new Error(`Missing required input: ${input.name}`)
      }

      if (input.maxLength && inputs[input.name]?.length > input.maxLength) {
        throw new Error(`Input "${input.name}" exceeds maximum length of ${input.maxLength}`)
      }
    }
  }

  private getSystemPrompt(analysisType: AnalysisType): string {
    return `You are an expert analyst specializing in ${analysisType.name}.
Provide detailed, actionable insights based on the input provided.
Structure your response clearly with appropriate sections and formatting.
Be objective, thorough, and highlight both strengths and areas for improvement.`
  }

  private addToHistory(result: AnalysisResult) {
    this.analysisHistory.unshift(result)

    // Trim history if needed
    if (this.analysisHistory.length > this.maxHistorySize) {
      this.analysisHistory = this.analysisHistory.slice(0, this.maxHistorySize)
    }
  }
}
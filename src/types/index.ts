import { z } from 'zod'
import type { AIConfig, GenerateOptions, AIResponse } from '@matthew.ngo/ai-toolkit'

// Analysis Types (backward compatible with old module)
export interface AnalysisType {
  id: string
  name: string
  description: string
  icon?: string
  category: 'content' | 'sentiment' | 'seo' | 'readability' | 'fact-check' | 'bias' | 'custom'
  requiredInputs: AnalysisInput[]
  outputFormat: AnalysisOutput
  estimatedTime?: number // in seconds
  aiRequired: boolean
}

export interface AnalysisInput {
  name: string
  type: 'text' | 'url' | 'html' | 'image' | 'document'
  required: boolean
  maxLength?: number
  description?: string
}

export interface AnalysisOutput {
  type: 'structured' | 'markdown' | 'html' | 'json'
  schema?: Record<string, any>
  sections?: string[]
}

export interface AnalysisRequest {
  type: string
  inputs: Record<string, any>
  options?: AnalysisOptions
}

export interface AnalysisOptions {
  language?: string
  depth?: 'quick' | 'standard' | 'detailed'
  includeRecommendations?: boolean
  includeSources?: boolean
  customPrompt?: string
  // New options for enhanced analysis
  includeNLP?: boolean
  includeReadability?: boolean
  includeKeywords?: boolean
  includeStructure?: boolean
  customAnalysis?: string[]
}

export interface AnalysisResult {
  id: string
  type: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  inputs: Record<string, any>
  output?: any
  metadata: {
    startedAt: Date
    completedAt?: Date
    duration?: number
    tokensUsed?: number
    model?: string
    error?: string
  }
  sections?: AnalysisSection[]
  recommendations?: Recommendation[]
  sources?: Source[]
  // New fields for enhanced results
  aiAnalysis?: AIAnalysisResult
  nlpAnalysis?: NLPAnalysisResult
  structure?: StructureAnalysis
  performance?: PerformanceMetrics
}

export interface AnalysisSection {
  id: string
  title: string
  content: string | any
  type: 'text' | 'chart' | 'table' | 'list' | 'metric'
  order: number
  highlight?: boolean
}

export interface Recommendation {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  category: string
  actionable: boolean
  impact?: string
}

export interface Source {
  title: string
  url?: string
  author?: string
  date?: Date
  relevance: number
}

// Enhanced Analysis Types
export interface AIAnalysisResult {
  summary: string
  keyPoints: string[]
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'
  tone: string
  themes: string[]
  customAnalysis?: Record<string, any>
}

export interface NLPAnalysisResult {
  sentiment: {
    score: number
    comparative: number
    calculation?: Array<{
      word: string
      score: number
    }>
  }
  language: string
  readability: {
    grade: number
    score: number
    difficulty: 'simple' | 'moderate' | 'complex'
    metrics?: {
      flesch?: number
      fleschKincaid?: number
      gunningFog?: number
      smog?: number
      ari?: number
      colemanLiau?: number
    }
  }
  keywords: Array<{
    word: string
    count: number
    relevance: number
    positions?: number[]
  }>
  entities: Array<{
    text: string
    type: 'person' | 'place' | 'organization' | 'date' | 'other'
    confidence: number
    positions?: number[]
  }>
  pos?: Array<{
    word: string
    tag: string
  }>
}

export interface StructureAnalysis {
  wordCount: number
  sentenceCount: number
  paragraphCount: number
  averageSentenceLength: number
  averageWordLength: number
  complexity: 'simple' | 'moderate' | 'complex'
  headings?: Array<{
    level: number
    text: string
    position: number
  }>
}

export interface PerformanceMetrics {
  processingTime: number
  tokensUsed: number
  cacheHit: boolean
  providers?: Array<{
    provider: string
    time: number
    tokens: number
  }>
}

// Template System Types
export interface PromptTemplate {
  id: string
  name: string
  description: string
  template: string
  variables: PromptVariable[]
  category: string
  examples?: Example[]
  helpers?: string[]
  partials?: string[]
}

export interface PromptVariable {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required: boolean
  default?: any
  description?: string
  validation?: (value: any) => boolean
}

export interface Example {
  inputs: Record<string, any>
  output: string
}

// Analysis Configuration Types
export interface AnalysisConfig {
  // AI Provider Configuration (from ai-toolkit)
  ai: AIConfig
  
  // NLP Configuration
  nlp?: {
    enableSentiment?: boolean
    enableLanguageDetection?: boolean
    enableEntityExtraction?: boolean
    enableKeywordExtraction?: boolean
    enablePOSTagging?: boolean
    customNLPEngines?: Record<string, NLPEngine>
  }
  
  // Template Configuration
  templates?: {
    customTemplates?: Record<string, string>
    templateHelpers?: Record<string, Function>
    templatePartials?: Record<string, string>
  }
  
  // Caching Configuration
  cache?: {
    strategy?: 'exact' | 'semantic' | 'fuzzy'
    ttl?: number
    maxSize?: number
    similarityThreshold?: number
    invalidateOn?: string[]
  }
  
  // Performance Configuration
  performance?: {
    enableProfiling?: boolean
    enableMetrics?: boolean
    maxConcurrency?: number
    timeoutMs?: number
  }
  
  // Output Configuration
  output?: {
    format?: 'json' | 'markdown' | 'html' | 'yaml'
    includeRawData?: boolean
    includeMetrics?: boolean
    sanitizeHTML?: boolean
  }
}

// Analyzer Types
export interface BaseAnalyzer {
  analyze(input: string, options?: AnalysisOptions): Promise<AnalysisResult>
  validateInput(input: string): boolean
  getName(): string
  getDescription(): string
}

export interface TextAnalyzer extends BaseAnalyzer {
  analyzeText(text: string, options?: AnalysisOptions): Promise<AnalysisResult>
  analyzeMultiple(texts: string[], options?: AnalysisOptions): Promise<AnalysisResult[]>
}

// Bulk Analysis Types
export interface BulkAnalysisConfig {
  ai: AIConfig
  processing: {
    batchSize?: number
    concurrency?: number
    retryFailed?: boolean
    timeout?: number
  }
}

export interface BulkAnalysisContent {
  id: string
  text: string
  metadata?: Record<string, any>
}

export interface BulkAnalysisResult {
  individual: AnalysisResult[]
  comparative?: {
    trends: string[]
    outliers: Array<{ id: string; reason: string }>
    recommendations: string[]
    summary: string
  }
  report?: {
    html: string
    markdown: string
    json: any
  }
}

// Stream Analysis Types
export interface StreamAnalysisConfig {
  ai: AIConfig
  streaming: {
    chunkSize?: number
    overlap?: number
    realTimeUpdates?: boolean
  }
}

export interface StreamAnalysisUpdate {
  progress: number
  insights: string[]
  currentChunk?: number
  totalChunks?: number
  isComplete: boolean
  finalResult?: AnalysisResult
}

// Pipeline Types
export interface AnalysisPipelineStep {
  name: string
  type: 'preprocessing' | 'nlp' | 'ai' | 'hybrid' | 'custom' | 'postprocessing'
  template?: string
  config?: Record<string, any>
  processor?: (input: any, context?: any) => Promise<any>
}

export interface AnalysisPipelineConfig {
  ai: AIConfig
  steps: AnalysisPipelineStep[]
  errorHandling?: 'stop' | 'continue' | 'retry'
  maxRetries?: number
}

// Collaborative Analysis Types
export interface CollaborativeAnalysisConfig {
  providers: Array<{
    provider: string
    weight: number
    config?: Partial<AIConfig>
  }>
  consensus: {
    method: 'weighted-average' | 'voting' | 'expert-selection'
    requireAgreement?: number
    conflictResolution?: 'expert-review' | 'highest-confidence' | 'weighted-merge'
  }
}

// NLP Engine Interface
export interface NLPEngine {
  name: string
  process(text: string): Promise<any>
  isAvailable(): boolean
}

// Validation Schemas
export const AnalysisRequestSchema = z.object({
  type: z.string(),
  inputs: z.record(z.any()),
  options: z.object({
    language: z.string().optional(),
    depth: z.enum(['quick', 'standard', 'detailed']).optional(),
    includeRecommendations: z.boolean().optional(),
    includeSources: z.boolean().optional(),
    customPrompt: z.string().optional(),
    includeNLP: z.boolean().optional(),
    includeReadability: z.boolean().optional(),
    includeKeywords: z.boolean().optional(),
    includeStructure: z.boolean().optional(),
    customAnalysis: z.array(z.string()).optional()
  }).optional()
})

export const AnalysisConfigSchema = z.object({
  ai: z.any(), // From ai-toolkit
  nlp: z.object({
    enableSentiment: z.boolean().optional(),
    enableLanguageDetection: z.boolean().optional(),
    enableEntityExtraction: z.boolean().optional(),
    enableKeywordExtraction: z.boolean().optional(),
    enablePOSTagging: z.boolean().optional()
  }).optional(),
  cache: z.object({
    strategy: z.enum(['exact', 'semantic', 'fuzzy']).optional(),
    ttl: z.number().optional(),
    maxSize: z.number().optional(),
    similarityThreshold: z.number().optional(),
    invalidateOn: z.array(z.string()).optional()
  }).optional(),
  performance: z.object({
    enableProfiling: z.boolean().optional(),
    enableMetrics: z.boolean().optional(),
    maxConcurrency: z.number().optional(),
    timeoutMs: z.number().optional()
  }).optional(),
  output: z.object({
    format: z.enum(['json', 'markdown', 'html', 'yaml']).optional(),
    includeRawData: z.boolean().optional(),
    includeMetrics: z.boolean().optional(),
    sanitizeHTML: z.boolean().optional()
  }).optional()
})

// Export utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type AnalysisEventType = 
  | 'analysis-start'
  | 'analysis-complete'
  | 'analysis-error'
  | 'cache-hit'
  | 'cache-miss'
  | 'provider-switch'

export interface AnalysisEvent {
  type: AnalysisEventType
  timestamp: Date
  data: Record<string, any>
}
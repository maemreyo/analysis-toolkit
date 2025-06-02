# Analysis Module - Feature Specification

## 🎯 Overview

The Analysis Module is a comprehensive text and content analysis toolkit built on top of the AI Toolkit. It provides intelligent analysis capabilities using multiple AI providers with advanced text processing, template systems, and result formatting.

## 🏗️ Architecture

```
@matthew.ngo/analysis-toolkit
├── Core Analysis Engine (built on @matthew.ngo/ai-toolkit)
├── Advanced Text Processing (natural, sentiment, compromise)
├── Template System (handlebars)
├── Result Parsing & Formatting (marked, sanitize-html)
├── Validation System (zod)
├── Smart Caching (lru-cache)
└── Performance Monitoring (perf-hooks)
```

## 📦 Dependencies

### Core Dependencies
```bash
# AI Foundation
@matthew.ngo/ai-toolkit

# Text Processing & NLP
natural           # NLP library
sentiment         # Sentiment analysis
compromise        # Lightweight NLP
franc            # Language detection

# Template Engine
handlebars       # Powerful templating
@types/handlebars

# Parsing & Formatting
marked           # Markdown parser
turndown         # HTML to Markdown
js-yaml          # YAML parser
sanitize-html    # HTML sanitizer
highlight.js     # Syntax highlighting

# Validation & Schema
zod              # TypeScript-first validation

# Caching & Performance
lru-cache        # LRU cache implementation
perf-hooks       # Performance monitoring

# Error Handling
verror           # Rich error objects
```

## 🚀 Core Features

### 1. **TEXT ANALYSIS ENGINE**

```typescript
import { createAnalysis } from '@matthew.ngo/analysis-toolkit'

const analysis = await createAnalysis({
  ai: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY
  },
  nlp: {
    enableSentiment: true,
    enableLanguageDetection: true,
    enableEntityExtraction: true
  }
})

// Multi-dimensional text analysis
const result = await analysis.analyzeText("Your content here", {
  includeReadability: true,
  includeSentiment: true,
  includeKeywords: true,
  includeStructure: true,
  customPrompts: ['Analyze writing style', 'Extract main themes']
})
```

**Output Structure:**
```typescript
interface AnalysisResult {
  // AI-Powered Analysis
  aiAnalysis: {
    summary: string
    keyPoints: string[]
    sentiment: 'positive' | 'negative' | 'neutral'
    tone: string
    themes: string[]
    customAnalysis: Record<string, string>
  }
  
  // NLP Analysis
  nlpAnalysis: {
    sentiment: { score: number, comparative: number }
    language: string
    readability: {
      grade: number
      score: number
      difficulty: string
    }
    keywords: Array<{ word: string, count: number, relevance: number }>
    entities: Array<{ text: string, type: string, confidence: number }>
  }
  
  // Structure Analysis
  structure: {
    wordCount: number
    sentenceCount: number
    paragraphCount: number
    averageSentenceLength: number
    complexity: 'simple' | 'moderate' | 'complex'
  }
  
  // Performance Metrics
  performance: {
    processingTime: number
    tokensUsed: number
    cacheHit: boolean
  }
}
```

### 2. **TEMPLATE-BASED ANALYSIS**

```typescript
// Define analysis templates
const templates = {
  contentAudit: `
Analyze this {{contentType}} content:

Content: {{content}}

Please provide:
1. Content Quality Score (1-10)
2. SEO Optimization Level
3. Readability Assessment
4. Improvement Recommendations
{{#if targetAudience}}
5. Audience Alignment for: {{targetAudience}}
{{/if}}
`,

  competitorAnalysis: `
Compare these contents:

Primary Content: {{primaryContent}}
Competitor Content: {{competitorContent}}

Analysis Framework:
- Strengths and Weaknesses
- Content Gap Analysis
- Differentiation Opportunities
- Strategic Recommendations
`
}

// Use templates
const analyzer = await createAnalysis({
  ai: { /* config */ },
  templates: templates
})

const result = await analyzer.runTemplate('contentAudit', {
  contentType: 'blog post',
  content: 'Your content...',
  targetAudience: 'developers'
})
```

### 3. **BULK ANALYSIS PROCESSOR**

```typescript
// Analyze multiple pieces of content
const bulkAnalyzer = await createBulkAnalysis({
  ai: { /* config */ },
  processing: {
    batchSize: 5,
    concurrency: 3,
    retryFailed: true
  }
})

const contents = [
  { id: '1', text: 'Content 1...', metadata: { type: 'article' } },
  { id: '2', text: 'Content 2...', metadata: { type: 'blog' } },
  // ... more content
]

const results = await bulkAnalyzer.processContents(contents, {
  analysisType: 'comprehensive',
  includeComparison: true,
  generateReport: true
})

// Results include individual analysis + comparative insights
interface BulkAnalysisResult {
  individual: AnalysisResult[]
  comparative: {
    trends: string[]
    outliers: Array<{ id: string, reason: string }>
    recommendations: string[]
    summary: string
  }
  report: {
    html: string
    markdown: string
    json: object
  }
}
```

### 4. **SPECIALIZED ANALYZERS**

#### Content Strategy Analyzer
```typescript
const strategyAnalyzer = await createStrategyAnalyzer({
  ai: { /* config */ },
  focus: 'content-marketing'
})

const strategy = await strategyAnalyzer.analyzeContentStrategy({
  contents: contentArray,
  brand: {
    voice: 'professional',
    values: ['innovation', 'reliability'],
    targetMarkets: ['B2B SaaS', 'Enterprise']
  },
  goals: ['thought leadership', 'lead generation']
})
```

#### SEO Content Analyzer
```typescript
const seoAnalyzer = await createSEOAnalyzer({
  ai: { /* config */ },
  seo: {
    enableKeywordAnalysis: true,
    enableStructureCheck: true,
    enableCompetitorComparison: true
  }
})

const seoResult = await seoAnalyzer.analyzeSEOContent(content, {
  targetKeywords: ['ai toolkit', 'javascript ai'],
  competitorUrls: ['competitor1.com', 'competitor2.com'],
  searchIntent: 'informational'
})
```

#### Writing Quality Analyzer
```typescript
const qualityAnalyzer = await createQualityAnalyzer({
  ai: { /* config */ },
  quality: {
    checkGrammar: true,
    checkStyle: true,
    checkCoherence: true,
    styleGuide: 'academic' // or 'business', 'casual', 'technical'
  }
})

const qualityResult = await qualityAnalyzer.analyzeWritingQuality(text, {
  improvementSuggestions: true,
  rewriteSuggestions: true,
  scoreBreakdown: true
})
```

### 5. **REAL-TIME ANALYSIS STREAM**

```typescript
// Stream analysis for long content
const streamAnalyzer = await createStreamAnalysis({
  ai: { /* config */ },
  streaming: {
    chunkSize: 1000, // characters
    overlap: 200,    // character overlap between chunks
    realTimeUpdates: true
  }
})

// Process content in chunks with real-time updates
for await (const update of streamAnalyzer.analyzeStream(longContent)) {
  console.log(`Progress: ${update.progress}%`)
  console.log(`Current insights: ${update.insights}`)
  
  if (update.isComplete) {
    console.log('Final result:', update.finalResult)
  }
}
```

### 6. **CUSTOM ANALYSIS ENGINES**

```typescript
// Create custom analysis engine
const customAnalyzer = await createCustomAnalysis({
  ai: { /* config */ },
  customEngines: {
    brandVoice: {
      template: 'Analyze brand voice consistency...',
      validators: [
        z.object({
          consistency: z.number().min(0).max(10),
          recommendations: z.array(z.string())
        })
      ],
      postProcessors: [(result) => enhanceBrandAnalysis(result)]
    },
    
    technicalAccuracy: {
      template: 'Verify technical accuracy...',
      requiresExpertReview: true,
      confidenceThreshold: 0.8
    }
  }
})

const brandResult = await customAnalyzer.runCustomAnalysis('brandVoice', content)
```

## 🎨 Advanced Features

### 1. **MULTI-FORMAT SUPPORT**

```typescript
// Support various input formats
const multiAnalyzer = await createAnalysis({
  ai: { /* config */ },
  formats: {
    markdown: true,
    html: true,
    yaml: true,
    json: true,
    plainText: true
  }
})

// Auto-detect and process different formats
const results = await Promise.all([
  multiAnalyzer.analyzeMarkdown(markdownContent),
  multiAnalyzer.analyzeHTML(htmlContent),
  multiAnalyzer.analyzeStructuredData(yamlContent),
  multiAnalyzer.analyzeJSON(jsonContent)
])
```

### 2. **INTELLIGENT CACHING**

```typescript
// Smart caching based on content similarity
const cachedAnalyzer = await createAnalysis({
  ai: { /* config */ },
  cache: {
    strategy: 'semantic', // or 'exact', 'fuzzy'
    ttl: 3600000, // 1 hour
    maxSize: 500, // MB
    similarityThreshold: 0.85, // for semantic caching
    invalidateOn: ['content-change', 'template-update']
  }
})

// Automatic cache optimization
const result = await cachedAnalyzer.analyzeText(content)
// Similar content will hit cache, reducing API costs
```

### 3. **ANALYSIS PIPELINES**

```typescript
// Create analysis pipelines
const pipeline = await createAnalysisPipeline({
  ai: { /* config */ },
  steps: [
    {
      name: 'preprocessing',
      type: 'nlp',
      config: { enableCleaning: true, normalizeText: true }
    },
    {
      name: 'sentiment',
      type: 'ai',
      template: 'sentimentAnalysis',
      config: { detailed: true }
    },
    {
      name: 'keywords',
      type: 'hybrid', // combines NLP + AI
      config: { minRelevance: 0.6 }
    },
    {
      name: 'summary',
      type: 'ai',
      template: 'summarization',
      config: { maxLength: 200 }
    },
    {
      name: 'postprocessing',
      type: 'custom',
      processor: (results) => formatResults(results)
    }
  ]
})

const pipelineResult = await pipeline.process(content)
```

### 4. **COLLABORATIVE ANALYSIS**

```typescript
// Multi-provider analysis with consensus
const collaborativeAnalyzer = await createCollaborativeAnalysis({
  providers: [
    { provider: 'openai', weight: 0.4 },
    { provider: 'anthropic', weight: 0.4 },
    { provider: 'google', weight: 0.2 }
  ],
  consensus: {
    method: 'weighted-average',
    requireAgreement: 0.7, // 70% agreement threshold
    conflictResolution: 'expert-review'
  }
})

const consensusResult = await collaborativeAnalyzer.analyze(content)
// Results include individual provider outputs + consensus analysis
```

## 🔧 Configuration & Setup

### Basic Configuration
```typescript
interface AnalysisConfig {
  // AI Provider Configuration (inherits from ai-toolkit)
  ai: AIConfig
  
  // NLP Configuration
  nlp?: {
    enableSentiment?: boolean
    enableLanguageDetection?: boolean
    enableEntityExtraction?: boolean
    enableKeywordExtraction?: boolean
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
```

### Environment Setup
```bash
# .env
# AI Provider Keys (from ai-toolkit)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Analysis Module Specific
ANALYSIS_CACHE_ENABLED=true
ANALYSIS_CACHE_TTL=3600000
ANALYSIS_MAX_CONCURRENCY=5
ANALYSIS_ENABLE_PROFILING=true

# NLP Configuration
NLP_ENABLE_SENTIMENT=true
NLP_ENABLE_LANGUAGE_DETECTION=true
NLP_LANGUAGE_MODELS_PATH=./models
```

## 🧪 Testing & Development

### Mock Analysis Provider
```typescript
// For testing and development
const mockAnalyzer = await createAnalysis({
  ai: {
    provider: 'mock',
    responses: new Map([
      ['sentiment analysis', { sentiment: 'positive', confidence: 0.8 }],
      ['keyword extraction', { keywords: ['test', 'analysis'] }]
    ])
  },
  nlp: { enableAll: false } // Use only AI responses
})
```

### Testing Utilities
```typescript
import { AnalysisTestUtils } from '@matthew.ngo/analysis-toolkit/testing'

describe('Content Analysis', () => {
  const testUtils = new AnalysisTestUtils()
  
  it('should analyze sentiment correctly', async () => {
    const mockContent = testUtils.generateTestContent('positive')
    const result = await analyzer.analyzeText(mockContent)
    
    expect(result.aiAnalysis.sentiment).toBe('positive')
    expect(result.nlpAnalysis.sentiment.score).toBeGreaterThan(0)
  })
})
```

## 📊 Performance & Monitoring

### Built-in Analytics
```typescript
// Get analysis statistics
const stats = analyzer.getStats()
console.log({
  totalAnalyses: stats.usage.count,
  averageProcessingTime: stats.performance.averageLatency,
  cacheHitRate: stats.cache.hitRate,
  tokensUsed: stats.ai.tokensUsed,
  costEstimate: stats.ai.costEstimate,
  accuracy: stats.quality.accuracyScore
})

// Monitor performance
analyzer.on('analysis-complete', (event) => {
  console.log(`Analysis completed in ${event.duration}ms`)
  console.log(`Tokens used: ${event.tokensUsed}`)
  console.log(`Cache hit: ${event.cacheHit}`)
})
```

### Health Monitoring
```typescript
const health = await analyzer.healthCheck()
if (health.status === 'degraded') {
  console.warn('Analysis service issues:', health.issues)
  console.log('Recommendations:', health.recommendations)
}
```

## 🚀 Deployment & Production

### Production Configuration
```typescript
const prodAnalyzer = await createAnalysis({
  ai: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    rateLimit: { requestsPerMinute: 120 },
    retry: { maxAttempts: 3 }
  },
  cache: {
    strategy: 'semantic',
    ttl: 7200000, // 2 hours
    maxSize: 1000 // 1GB
  },
  performance: {
    enableProfiling: false, // Disable in production
    enableMetrics: true,
    maxConcurrency: 10
  }
})
```

### Scaling Considerations
- Use Redis for distributed caching
- Implement queue system for bulk processing
- Monitor API rate limits across providers
- Set up alerts for performance degradation

## 📚 Examples & Use Cases

### Blog Content Optimization
```typescript
const blogAnalyzer = await createAnalysis({
  ai: { provider: 'openai', apiKey: process.env.OPENAI_API_KEY },
  templates: {
    blogOptimization: `
    Analyze this blog post for:
    1. SEO optimization opportunities
    2. Reader engagement potential
    3. Content structure improvements
    4. Call-to-action effectiveness
    
    Blog Post: {{content}}
    Target Keywords: {{keywords}}
    `
  }
})

const optimization = await blogAnalyzer.runTemplate('blogOptimization', {
  content: blogPost,
  keywords: ['AI development', 'JavaScript AI']
})
```

### Social Media Content Analysis
```typescript
const socialAnalyzer = await createSocialMediaAnalysis({
  ai: { provider: 'anthropic', apiKey: process.env.ANTHROPIC_API_KEY },
  platforms: ['twitter', 'linkedin', 'instagram'],
  metrics: ['engagement', 'reach', 'sentiment']
})

const socialResults = await socialAnalyzer.analyzePosts(posts, {
  optimizeForPlatform: true,
  suggestHashtags: true,
  checkBrandVoice: true
})
```

## 🎯 Roadmap

### Phase 1: Core Implementation
- ✅ Basic text analysis engine
- ✅ Template system integration
- ✅ NLP pipeline setup
- ✅ Caching implementation

### Phase 2: Advanced Features
- 🔄 Multi-provider consensus
- 🔄 Real-time streaming analysis
- 🔄 Custom analysis engines
- 🔄 Bulk processing optimization

### Phase 3: Specialization
- 📋 Industry-specific analyzers
- 📋 Multi-language support
- 📋 Visual content analysis
- 📋 Audio/video analysis integration

### Phase 4: Enterprise Features
- 📋 On-premise deployment
- 📋 Advanced security features
- 📋 Custom model integration
- 📋 Enterprise analytics dashboard
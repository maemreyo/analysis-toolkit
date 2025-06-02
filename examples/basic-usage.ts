import { 
  createAnalysis, 
  createTextAnalyzer,
  createInsightAnalyzer,
  AnalysisPresets 
} from '@matthew.ngo/analysis-toolkit'

// Example 1: Basic Text Analysis
async function basicTextAnalysis() {
  console.log('=== Basic Text Analysis ===')
  
  // Create analyzer with OpenAI
  const analyzer = await createTextAnalyzer(process.env.OPENAI_API_KEY!, 'openai')
  
  const text = `
    Artificial Intelligence is transforming the way we interact with technology. 
    From voice assistants to autonomous vehicles, AI is becoming increasingly 
    integrated into our daily lives. However, this rapid advancement also raises 
    important questions about privacy, ethics, and the future of work.
  `
  
  // Analyze text with all features
  const result = await analyzer.analyze({
    type: 'content',
    inputs: { content: text },
    options: {
      includeNLP: true,
      includeReadability: true,
      includeKeywords: true,
      includeStructure: true,
      includeRecommendations: true
    }
  })
  
  console.log('Summary:', result.aiAnalysis?.summary)
  console.log('Sentiment:', result.aiAnalysis?.sentiment)
  console.log('Key Points:', result.aiAnalysis?.keyPoints)
  console.log('Readability Grade:', result.nlpAnalysis?.readability.grade)
  console.log('Top Keywords:', result.nlpAnalysis?.keywords?.slice(0, 5))
  console.log('Word Count:', result.structure?.wordCount)
}

// Example 2: SEO Analysis
async function seoAnalysis() {
  console.log('\n=== SEO Analysis ===')
  
  const analyzer = await createAnalysis({
    ai: {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY!
    }
  })
  
  const result = await analyzer.analyze({
    type: 'seo',
    inputs: {
      title: 'Ultimate Guide to AI-Powered Content Analysis',
      metaDescription: 'Learn how AI can transform your content strategy with advanced analysis techniques.',
      content: '<h1>AI-Powered Content Analysis</h1><p>Content analysis has evolved...</p>',
      keywords: 'AI content analysis, content strategy, AI tools'
    }
  })
  
  console.log('SEO Score:', result.output?.score)
  console.log('Issues:', result.output?.issues)
  console.log('Recommendations:', result.recommendations)
}

// Example 3: Bulk Content Analysis
async function bulkAnalysis() {
  console.log('\n=== Bulk Content Analysis ===')
  
  const { createBulkAnalysis } = await import('@matthew.ngo/analysis-toolkit')
  
  const bulkAnalyzer = await createBulkAnalysis({
    ai: {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY!
    },
    processing: {
      batchSize: 3,
      concurrency: 2,
      retryFailed: true
    }
  })
  
  const contents = [
    { id: '1', text: 'First article about AI...', metadata: { category: 'tech' } },
    { id: '2', text: 'Second article about ML...', metadata: { category: 'tech' } },
    { id: '3', text: 'Third article about ethics...', metadata: { category: 'philosophy' } }
  ]
  
  const results = await bulkAnalyzer.processContents(contents, {
    analysisType: 'content',
    includeComparison: true,
    generateReport: true
  })
  
  console.log('Analyzed:', results.individual.length, 'articles')
  console.log('Trends:', results.comparative?.trends)
  console.log('Report available:', !!results.report)
}

// Example 4: Streaming Analysis
async function streamingAnalysis() {
  console.log('\n=== Streaming Analysis ===')
  
  const { createStreamAnalysis } = await import('@matthew.ngo/analysis-toolkit')
  
  const streamAnalyzer = await createStreamAnalysis({
    ai: {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY!
    },
    streaming: {
      chunkSize: 500,
      overlap: 100,
      realTimeUpdates: true
    }
  })
  
  const longText = `
    [Imagine this is a very long article with thousands of words...]
    ${Array(10).fill('Lorem ipsum dolor sit amet...').join(' ')}
  `
  
  // Process with progress updates
  await streamAnalyzer.analyzeWithProgress(
    longText,
    (update) => {
      console.log(`Progress: ${update.progress}%`)
      if (update.insights.length > 0) {
        console.log('Latest insight:', update.insights[update.insights.length - 1])
      }
    }
  )
}

// Example 5: Custom Analysis Template
async function customAnalysis() {
  console.log('\n=== Custom Analysis ===')
  
  const analyzer = await createAnalysis({
    ai: {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY!
    },
    templates: {
      customTemplates: {
        toneAnalysis: `
          Analyze the tone of this text:
          {{text}}
          
          Identify:
          1. Primary tone (formal/informal/neutral)
          2. Emotional undertones
          3. Author's attitude
          4. Audience appropriateness
          
          Format as JSON.
        `
      }
    }
  })
  
  const result = await analyzer.runTemplate('toneAnalysis', {
    text: 'We are thrilled to announce our groundbreaking new product!'
  })
  
  console.log('Tone Analysis:', result.output)
}

// Example 6: Insight Buddy Compatible Analysis
async function insightBuddyAnalysis() {
  console.log('\n=== Insight Buddy Analysis ===')
  
  const analyzer = await createInsightAnalyzer(process.env.OPENAI_API_KEY!)
  
  const text = 'Quantum computing represents a paradigm shift in computational power...'
  
  // Quick summary
  const summary = await analyzer.analyze({
    type: 'summarize',
    inputs: { text }
  })
  console.log('Summary:', summary.output)
  
  // Explain terms
  const explanation = await analyzer.analyze({
    type: 'explain',
    inputs: { text }
  })
  console.log('Terms explained:', explanation.output)
  
  // Critical questions
  const critique = await analyzer.analyze({
    type: 'critique',
    inputs: { text }
  })
  console.log('Critical questions:', critique.output)
}

// Example 7: React Hook Usage (for React apps)
function ReactExample() {
  /*
  import { useTextAnalysis } from '@matthew.ngo/analysis-toolkit/react'
  
  function MyComponent() {
    const { analyzeText, summarize, loading, result } = useTextAnalysis({
      ai: {
        provider: 'openai',
        apiKey: process.env.REACT_APP_OPENAI_API_KEY
      }
    })
    
    const handleAnalyze = async () => {
      const result = await analyzeText('Your text here...', {
        includeSentiment: true,
        includeKeywords: true
      })
      console.log(result)
    }
    
    return (
      <div>
        <button onClick={handleAnalyze} disabled={loading}>
          Analyze Text
        </button>
        {result && (
          <div>
            <h3>Analysis Results</h3>
            <p>Sentiment: {result.aiAnalysis?.sentiment}</p>
            <p>Summary: {result.aiAnalysis?.summary}</p>
          </div>
        )}
      </div>
    )
  }
  */
}

// Run examples
async function runExamples() {
  try {
    await basicTextAnalysis()
    await seoAnalysis()
    await bulkAnalysis()
    await streamingAnalysis()
    await customAnalysis()
    await insightBuddyAnalysis()
  } catch (error) {
    console.error('Example failed:', error)
  }
}

// Check if running directly
if (require.main === module) {
  runExamples()
}

export {
  basicTextAnalysis,
  seoAnalysis,
  bulkAnalysis,
  streamingAnalysis,
  customAnalysis,
  insightBuddyAnalysis
}
import type {
  AnalysisEngine,
  StreamAnalysisConfig,
  StreamAnalysisUpdate,
  AnalysisResult
} from '../types'

export class StreamAnalyzer {
  private engine: AnalysisEngine
  private config: StreamAnalysisConfig

  constructor(engine: AnalysisEngine, config: StreamAnalysisConfig) {
    this.engine = engine
    this.config = config
  }

  /**
   * Analyze content in streaming chunks
   */
  async *analyzeStream(content: string): AsyncGenerator<StreamAnalysisUpdate> {
    const chunkSize = this.config.streaming?.chunkSize || 1000
    const overlap = this.config.streaming?.overlap || 200
    const chunks = this.splitIntoChunks(content, chunkSize, overlap)
    
    const insights: string[] = []
    const chunkResults: Partial<AnalysisResult>[] = []
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const progress = ((i + 1) / chunks.length) * 100
      
      // Analyze chunk
      const chunkResult = await this.analyzeChunk(chunk, i)
      chunkResults.push(chunkResult)
      
      // Extract insights from chunk
      const chunkInsights = this.extractInsights(chunkResult)
      insights.push(...chunkInsights)
      
      // Yield update
      yield {
        progress: Math.round(progress),
        insights: [...insights], // Return all insights so far
        currentChunk: i + 1,
        totalChunks: chunks.length,
        isComplete: false
      }
      
      // Add delay for real-time effect if configured
      if (this.config.streaming?.realTimeUpdates) {
        await this.delay(100)
      }
    }
    
    // Combine chunk results for final analysis
    const finalResult = await this.combineChunkResults(chunkResults, content)
    
    // Yield final update
    yield {
      progress: 100,
      insights,
      currentChunk: chunks.length,
      totalChunks: chunks.length,
      isComplete: true,
      finalResult
    }
  }

  /**
   * Split content into overlapping chunks
   */
  private splitIntoChunks(content: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = []
    let start = 0
    
    while (start < content.length) {
      const end = Math.min(start + chunkSize, content.length)
      chunks.push(content.substring(start, end))
      
      // Move to next chunk with overlap
      start = end - overlap
      
      // Ensure we don't create tiny last chunks
      if (content.length - start < chunkSize / 2 && start < content.length) {
        chunks[chunks.length - 1] = content.substring(start - overlap)
        break
      }
    }
    
    return chunks
  }

  /**
   * Analyze a single chunk
   */
  private async analyzeChunk(chunk: string, chunkIndex: number): Promise<Partial<AnalysisResult>> {
    try {
      // Use quick analysis for chunks
      const result = await this.engine.analyze({
        type: 'summary',
        inputs: { content: chunk },
        options: {
          depth: 'quick',
          includeNLP: false, // Skip NLP for chunks to improve speed
          customPrompt: `Analyze this text chunk (part ${chunkIndex + 1}). Extract key insights and important information.`
        }
      })
      
      return result
    } catch (error) {
      console.error(`Failed to analyze chunk ${chunkIndex}:`, error)
      return {
        status: 'failed',
        metadata: { error: error.message }
      }
    }
  }

  /**
   * Extract insights from chunk result
   */
  private extractInsights(result: Partial<AnalysisResult>): string[] {
    const insights: string[] = []
    
    // Extract from AI analysis
    if (result.aiAnalysis) {
      if (result.aiAnalysis.summary) {
        insights.push(result.aiAnalysis.summary)
      }
      if (result.aiAnalysis.keyPoints) {
        insights.push(...result.aiAnalysis.keyPoints)
      }
    }
    
    // Extract from sections
    if (result.sections) {
      result.sections.forEach(section => {
        if (section.type === 'text' && typeof section.content === 'string') {
          // Extract first sentence as insight
          const firstSentence = section.content.match(/^[^.!?]+[.!?]/)
          if (firstSentence) {
            insights.push(firstSentence[0])
          }
        }
      })
    }
    
    // Extract from output
    if (result.output?.insights) {
      insights.push(...result.output.insights)
    }
    
    return insights.filter((insight, index, self) => 
      insight && self.indexOf(insight) === index // Remove duplicates
    ).slice(0, 5) // Limit insights per chunk
  }

  /**
   * Combine chunk results into final analysis
   */
  private async combineChunkResults(
    chunkResults: Partial<AnalysisResult>[],
    fullContent: string
  ): Promise<AnalysisResult> {
    // Extract all insights from chunks
    const allInsights: string[] = []
    const allThemes: string[] = []
    const sentiments: string[] = []
    
    chunkResults.forEach(result => {
      if (result.aiAnalysis) {
        if (result.aiAnalysis.keyPoints) {
          allInsights.push(...result.aiAnalysis.keyPoints)
        }
        if (result.aiAnalysis.themes) {
          allThemes.push(...result.aiAnalysis.themes)
        }
        if (result.aiAnalysis.sentiment) {
          sentiments.push(result.aiAnalysis.sentiment)
        }
      }
    })
    
    // Deduplicate and limit
    const uniqueInsights = Array.from(new Set(allInsights)).slice(0, 10)
    const uniqueThemes = Array.from(new Set(allThemes)).slice(0, 5)
    
    // Determine overall sentiment
    const sentimentCounts = sentiments.reduce((acc, sentiment) => {
      acc[sentiment] = (acc[sentiment] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const overallSentiment = Object.entries(sentimentCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral'
    
    // Create combined analysis prompt
    const combinedPrompt = `
Based on the chunk analyses, provide a comprehensive summary of the entire content.

Key insights from chunks:
${uniqueInsights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}

Themes identified:
${uniqueThemes.join(', ')}

Overall sentiment trend: ${overallSentiment}

Create a cohesive summary that ties together these insights.
`
    
    // Run final comprehensive analysis
    const finalResult = await this.engine.analyze({
      type: 'summary',
      inputs: {
        content: fullContent.substring(0, 5000), // Use truncated version for final analysis
        chunkInsights: uniqueInsights,
        themes: uniqueThemes
      },
      options: {
        depth: 'standard',
        customPrompt: combinedPrompt,
        includeNLP: true,
        includeStructure: true
      }
    })
    
    // Merge chunk insights into final result
    if (finalResult.aiAnalysis) {
      finalResult.aiAnalysis.keyPoints = [
        ...(finalResult.aiAnalysis.keyPoints || []),
        ...uniqueInsights
      ].slice(0, 10)
      
      finalResult.aiAnalysis.themes = [
        ...(finalResult.aiAnalysis.themes || []),
        ...uniqueThemes
      ].slice(0, 5)
    }
    
    return finalResult
  }

  /**
   * Helper to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Stream analysis with progress callback
   */
  async analyzeWithProgress(
    content: string,
    onProgress: (update: StreamAnalysisUpdate) => void
  ): Promise<AnalysisResult> {
    let finalResult: AnalysisResult | undefined
    
    for await (const update of this.analyzeStream(content)) {
      onProgress(update)
      
      if (update.isComplete && update.finalResult) {
        finalResult = update.finalResult
      }
    }
    
    if (!finalResult) {
      throw new Error('Stream analysis failed to produce final result')
    }
    
    return finalResult
  }

  /**
   * Update streaming configuration
   */
  updateConfig(config: Partial<StreamAnalysisConfig['streaming']>) {
    this.config.streaming = {
      ...this.config.streaming,
      ...config
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): StreamAnalysisConfig {
    return this.config
  }
}
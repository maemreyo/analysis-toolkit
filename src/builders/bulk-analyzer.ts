import type { 
  AnalysisEngine,
  BulkAnalysisConfig,
  BulkAnalysisContent,
  BulkAnalysisResult,
  AnalysisResult,
  AnalysisRequest
} from '../types'

export class BulkAnalyzer {
  private engine: AnalysisEngine
  private config: BulkAnalysisConfig

  constructor(engine: AnalysisEngine, config: BulkAnalysisConfig) {
    this.engine = engine
    this.config = config
  }

  /**
   * Process multiple contents in batches
   */
  async processContents(
    contents: BulkAnalysisContent[],
    options?: {
      analysisType?: string
      includeComparison?: boolean
      generateReport?: boolean
    }
  ): Promise<BulkAnalysisResult> {
    const batchSize = this.config.processing?.batchSize || 5
    const results: AnalysisResult[] = []
    
    // Process in batches
    for (let i = 0; i < contents.length; i += batchSize) {
      const batch = contents.slice(i, i + batchSize)
      const batchResults = await this.processBatch(batch, options?.analysisType || 'content')
      
      if (this.config.processing?.retryFailed) {
        // Retry failed analyses
        for (let j = 0; j < batchResults.length; j++) {
          if (batchResults[j].status === 'failed') {
            const retryResult = await this.retryAnalysis(batch[j], options?.analysisType || 'content')
            if (retryResult.status === 'completed') {
              batchResults[j] = retryResult
            }
          }
        }
      }
      
      results.push(...batchResults)
    }

    // Generate comparative analysis if requested
    let comparative
    if (options?.includeComparison) {
      comparative = await this.generateComparativeAnalysis(results, contents)
    }

    // Generate report if requested
    let report
    if (options?.generateReport) {
      report = await this.generateReport(results, comparative)
    }

    return {
      individual: results,
      comparative,
      report
    }
  }

  /**
   * Process a batch of contents
   */
  private async processBatch(
    batch: BulkAnalysisContent[],
    analysisType: string
  ): Promise<AnalysisResult[]> {
    const requests: AnalysisRequest[] = batch.map(content => ({
      type: analysisType,
      inputs: {
        content: content.text,
        metadata: content.metadata
      },
      options: {
        depth: 'standard',
        includeRecommendations: true
      }
    }))

    return this.engine.analyzeMultiple(requests)
  }

  /**
   * Retry failed analysis
   */
  private async retryAnalysis(
    content: BulkAnalysisContent,
    analysisType: string
  ): Promise<AnalysisResult> {
    return this.engine.analyze({
      type: analysisType,
      inputs: {
        content: content.text,
        metadata: content.metadata
      },
      options: {
        depth: 'quick' // Use quick analysis for retry
      }
    })
  }

  /**
   * Generate comparative analysis
   */
  private async generateComparativeAnalysis(
    results: AnalysisResult[],
    contents: BulkAnalysisContent[]
  ): Promise<BulkAnalysisResult['comparative']> {
    // Extract themes from all results
    const allThemes = new Set<string>()
    const allSentiments: string[] = []
    const qualityScores: number[] = []

    results.forEach(result => {
      if (result.aiAnalysis?.themes) {
        result.aiAnalysis.themes.forEach(theme => allThemes.add(theme))
      }
      if (result.aiAnalysis?.sentiment) {
        allSentiments.push(result.aiAnalysis.sentiment)
      }
      // Extract quality scores from custom analysis
      if (result.output?.qualityScore) {
        qualityScores.push(result.output.qualityScore)
      }
    })

    // Identify trends
    const trends: string[] = []
    
    // Sentiment trend
    const positiveSentiments = allSentiments.filter(s => s === 'positive').length
    const negativeSentiments = allSentiments.filter(s => s === 'negative').length
    
    if (positiveSentiments > allSentiments.length * 0.7) {
      trends.push('Overall positive sentiment across content')
    } else if (negativeSentiments > allSentiments.length * 0.7) {
      trends.push('Overall negative sentiment across content')
    } else {
      trends.push('Mixed sentiment across content')
    }

    // Theme trends
    const commonThemes = Array.from(allThemes).filter(theme => {
      const count = results.filter(r => r.aiAnalysis?.themes?.includes(theme)).length
      return count > results.length * 0.5
    })
    
    if (commonThemes.length > 0) {
      trends.push(`Common themes: ${commonThemes.join(', ')}`)
    }

    // Identify outliers
    const outliers: Array<{ id: string; reason: string }> = []
    
    // Quality outliers
    if (qualityScores.length > 0) {
      const avgQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
      const stdDev = Math.sqrt(
        qualityScores.reduce((sum, score) => sum + Math.pow(score - avgQuality, 2), 0) / qualityScores.length
      )
      
      results.forEach((result, index) => {
        const score = result.output?.qualityScore
        if (score && Math.abs(score - avgQuality) > 2 * stdDev) {
          outliers.push({
            id: contents[index].id,
            reason: `Quality score (${score}) significantly differs from average (${avgQuality.toFixed(1)})`
          })
        }
      })
    }

    // Generate recommendations
    const recommendations: string[] = []
    
    if (commonThemes.length > 3) {
      recommendations.push('Consider diversifying content themes to avoid repetition')
    }
    
    if (outliers.length > 0) {
      recommendations.push('Review outlier content for quality improvements or strategic differentiation')
    }
    
    if (allSentiments.length > 0 && positiveSentiments < allSentiments.length * 0.3) {
      recommendations.push('Consider adjusting tone to be more positive and engaging')
    }

    // Generate summary
    const summary = `Analyzed ${results.length} pieces of content. ${trends.join('. ')}. Found ${outliers.length} outliers.`

    return {
      trends,
      outliers,
      recommendations,
      summary
    }
  }

  /**
   * Generate analysis report
   */
  private async generateReport(
    results: AnalysisResult[],
    comparative?: BulkAnalysisResult['comparative']
  ): Promise<BulkAnalysisResult['report']> {
    // Create markdown report
    let markdown = '# Bulk Analysis Report\n\n'
    markdown += `**Date:** ${new Date().toLocaleString()}\n`
    markdown += `**Total Items Analyzed:** ${results.length}\n\n`

    // Summary section
    if (comparative) {
      markdown += '## Executive Summary\n\n'
      markdown += `${comparative.summary}\n\n`
      
      markdown += '### Key Trends\n\n'
      comparative.trends.forEach(trend => {
        markdown += `- ${trend}\n`
      })
      markdown += '\n'
      
      if (comparative.outliers.length > 0) {
        markdown += '### Outliers\n\n'
        comparative.outliers.forEach(outlier => {
          markdown += `- **${outlier.id}**: ${outlier.reason}\n`
        })
        markdown += '\n'
      }
      
      markdown += '### Recommendations\n\n'
      comparative.recommendations.forEach((rec, index) => {
        markdown += `${index + 1}. ${rec}\n`
      })
      markdown += '\n'
    }

    // Individual results summary
    markdown += '## Individual Analysis Summary\n\n'
    
    const successfulResults = results.filter(r => r.status === 'completed')
    const failedResults = results.filter(r => r.status === 'failed')
    
    markdown += `- **Successful:** ${successfulResults.length}\n`
    markdown += `- **Failed:** ${failedResults.length}\n\n`

    // Performance metrics
    const totalProcessingTime = results.reduce((sum, r) => sum + (r.metadata.duration || 0), 0)
    const avgProcessingTime = totalProcessingTime / results.length
    
    markdown += '### Performance Metrics\n\n'
    markdown += `- **Total Processing Time:** ${(totalProcessingTime / 1000).toFixed(2)}s\n`
    markdown += `- **Average Processing Time:** ${(avgProcessingTime / 1000).toFixed(2)}s per item\n\n`

    // Convert to HTML
    const { marked } = await import('marked')
    const html = await marked(markdown)

    // Create JSON summary
    const json = {
      metadata: {
        date: new Date().toISOString(),
        totalItems: results.length,
        successful: successfulResults.length,
        failed: failedResults.length
      },
      comparative,
      performance: {
        totalProcessingTime,
        averageProcessingTime: avgProcessingTime
      },
      results: results.map(r => ({
        id: r.id,
        status: r.status,
        summary: r.aiAnalysis?.summary || r.output?.summary || 'No summary available',
        sentiment: r.aiAnalysis?.sentiment,
        themes: r.aiAnalysis?.themes,
        processingTime: r.metadata.duration
      }))
    }

    return {
      html,
      markdown,
      json
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<BulkAnalysisConfig['processing']>) {
    this.config.processing = {
      ...this.config.processing,
      ...config
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): BulkAnalysisConfig {
    return this.config
  }
}
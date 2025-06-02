import type { AnalysisEngine, AnalysisResult, AnalysisRequest } from '../types'

export interface ConsensusConfig {
  method: 'weighted-average' | 'voting' | 'expert-selection'
  requireAgreement?: number
  conflictResolution?: 'expert-review' | 'highest-confidence' | 'weighted-merge'
}

interface ProviderEngine {
  engine: AnalysisEngine
  weight: number
}

export class CollaborativeAnalyzer {
  private engines: ProviderEngine[]
  private consensus: ConsensusConfig

  constructor(engines: ProviderEngine[], consensus: ConsensusConfig) {
    this.engines = engines
    this.consensus = consensus
  }

  /**
   * Analyze content using multiple providers
   */
  async analyze(request: AnalysisRequest): Promise<AnalysisResult & {
    providerResults?: AnalysisResult[]
    consensusMetadata?: any
  }> {
    // Run analysis on all providers in parallel
    const providerPromises = this.engines.map(async ({ engine, weight }) => {
      try {
        const result = await engine.analyze(request)
        return { result, weight, success: true }
      } catch (error) {
        console.error('Provider failed:', error)
        return { result: null, weight, success: false, error }
      }
    })

    const providerResponses = await Promise.all(providerPromises)
    
    // Filter successful responses
    const successfulResponses = providerResponses.filter(r => r.success && r.result)
    
    if (successfulResponses.length === 0) {
      throw new Error('All providers failed to analyze content')
    }

    // Extract results
    const providerResults = successfulResponses.map(r => r.result!)
    const weights = successfulResponses.map(r => r.weight)

    // Apply consensus method
    let consensusResult: AnalysisResult
    let consensusMetadata: any = {}

    switch (this.consensus.method) {
      case 'weighted-average':
        consensusResult = await this.weightedAverageConsensus(providerResults, weights)
        break
      case 'voting':
        consensusResult = await this.votingConsensus(providerResults)
        break
      case 'expert-selection':
        consensusResult = await this.expertSelectionConsensus(providerResults, weights)
        break
      default:
        consensusResult = providerResults[0]
    }

    // Check agreement if required
    if (this.consensus.requireAgreement) {
      const agreementScore = this.calculateAgreement(providerResults)
      consensusMetadata.agreementScore = agreementScore
      
      if (agreementScore < this.consensus.requireAgreement) {
        consensusMetadata.lowAgreement = true
        
        // Apply conflict resolution
        if (this.consensus.conflictResolution) {
          consensusResult = await this.resolveConflicts(
            providerResults,
            weights,
            this.consensus.conflictResolution
          )
        }
      }
    }

    // Add provider results and metadata
    return {
      ...consensusResult,
      providerResults,
      consensusMetadata
    }
  }

  /**
   * Weighted average consensus
   */
  private async weightedAverageConsensus(
    results: AnalysisResult[],
    weights: number[]
  ): Promise<AnalysisResult> {
    // Normalize weights
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    const normalizedWeights = weights.map(w => w / totalWeight)

    // Start with the highest weighted result as base
    const maxWeightIndex = weights.indexOf(Math.max(...weights))
    const baseResult = { ...results[maxWeightIndex] }

    // Merge AI analysis
    if (baseResult.aiAnalysis) {
      // Merge sentiments with weights
      const sentimentScores: Record<string, number> = {}
      results.forEach((result, i) => {
        if (result.aiAnalysis?.sentiment) {
          const sentiment = result.aiAnalysis.sentiment
          sentimentScores[sentiment] = (sentimentScores[sentiment] || 0) + normalizedWeights[i]
        }
      })
      
      // Select sentiment with highest weighted score
      const topSentiment = Object.entries(sentimentScores)
        .sort((a, b) => b[1] - a[1])[0]?.[0] as any
      
      baseResult.aiAnalysis.sentiment = topSentiment || 'neutral'

      // Merge key points
      const allKeyPoints: Map<string, number> = new Map()
      results.forEach((result, i) => {
        result.aiAnalysis?.keyPoints?.forEach(point => {
          const current = allKeyPoints.get(point) || 0
          allKeyPoints.set(point, current + normalizedWeights[i])
        })
      })
      
      // Select top weighted key points
      baseResult.aiAnalysis.keyPoints = Array.from(allKeyPoints.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([point]) => point)

      // Merge themes similarly
      const allThemes: Map<string, number> = new Map()
      results.forEach((result, i) => {
        result.aiAnalysis?.themes?.forEach(theme => {
          const current = allThemes.get(theme) || 0
          allThemes.set(theme, current + normalizedWeights[i])
        })
      })
      
      baseResult.aiAnalysis.themes = Array.from(allThemes.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([theme]) => theme)
    }

    // Merge recommendations
    if (results.some(r => r.recommendations)) {
      const allRecommendations: Map<string, { rec: any; weight: number }> = new Map()
      
      results.forEach((result, i) => {
        result.recommendations?.forEach(rec => {
          const key = rec.title
          const existing = allRecommendations.get(key)
          
          if (existing) {
            existing.weight += normalizedWeights[i]
          } else {
            allRecommendations.set(key, { rec, weight: normalizedWeights[i] })
          }
        })
      })
      
      // Select recommendations that appear in multiple providers or have high weight
      baseResult.recommendations = Array.from(allRecommendations.entries())
        .filter(([_, { weight }]) => weight > 0.3)
        .sort((a, b) => b[1].weight - a[1].weight)
        .slice(0, 10)
        .map(([_, { rec }]) => rec)
    }

    return baseResult
  }

  /**
   * Voting-based consensus
   */
  private async votingConsensus(results: AnalysisResult[]): Promise<AnalysisResult> {
    // For voting, each provider gets equal vote
    const votes: Record<string, number> = {}
    
    // Vote on sentiment
    const sentimentVotes: Record<string, number> = {}
    results.forEach(result => {
      if (result.aiAnalysis?.sentiment) {
        sentimentVotes[result.aiAnalysis.sentiment] = 
          (sentimentVotes[result.aiAnalysis.sentiment] || 0) + 1
      }
    })
    
    // Create consensus result based on majority votes
    const majorityResult = { ...results[0] }
    
    if (majorityResult.aiAnalysis) {
      // Set sentiment to most voted
      const topSentiment = Object.entries(sentimentVotes)
        .sort((a, b) => b[1] - a[1])[0]?.[0] as any
      
      majorityResult.aiAnalysis.sentiment = topSentiment || 'neutral'
      
      // Collect all key points and themes that appear in majority
      const keyPointVotes: Map<string, number> = new Map()
      const themeVotes: Map<string, number> = new Map()
      
      results.forEach(result => {
        result.aiAnalysis?.keyPoints?.forEach(point => {
          keyPointVotes.set(point, (keyPointVotes.get(point) || 0) + 1)
        })
        
        result.aiAnalysis?.themes?.forEach(theme => {
          themeVotes.set(theme, (themeVotes.get(theme) || 0) + 1)
        })
      })
      
      const majorityThreshold = results.length / 2
      
      majorityResult.aiAnalysis.keyPoints = Array.from(keyPointVotes.entries())
        .filter(([_, votes]) => votes >= majorityThreshold)
        .map(([point]) => point)
      
      majorityResult.aiAnalysis.themes = Array.from(themeVotes.entries())
        .filter(([_, votes]) => votes >= majorityThreshold)
        .map(([theme]) => theme)
    }
    
    return majorityResult
  }

  /**
   * Expert selection consensus
   */
  private async expertSelectionConsensus(
    results: AnalysisResult[],
    weights: number[]
  ): Promise<AnalysisResult> {
    // Select result from provider with highest weight (expert)
    const maxWeightIndex = weights.indexOf(Math.max(...weights))
    const expertResult = { ...results[maxWeightIndex] }
    
    // Enhance expert result with insights from other providers
    const otherResults = results.filter((_, i) => i !== maxWeightIndex)
    
    if (expertResult.aiAnalysis && otherResults.length > 0) {
      // Add unique insights from other providers
      const expertKeyPoints = new Set(expertResult.aiAnalysis.keyPoints || [])
      const additionalKeyPoints: string[] = []
      
      otherResults.forEach(result => {
        result.aiAnalysis?.keyPoints?.forEach(point => {
          if (!expertKeyPoints.has(point) && additionalKeyPoints.length < 3) {
            additionalKeyPoints.push(point)
          }
        })
      })
      
      if (additionalKeyPoints.length > 0) {
        expertResult.aiAnalysis.keyPoints = [
          ...(expertResult.aiAnalysis.keyPoints || []),
          ...additionalKeyPoints
        ]
      }
    }
    
    return expertResult
  }

  /**
   * Calculate agreement score between results
   */
  private calculateAgreement(results: AnalysisResult[]): number {
    if (results.length < 2) return 1
    
    let agreementScore = 0
    let comparisons = 0
    
    // Compare sentiments
    const sentiments = results
      .map(r => r.aiAnalysis?.sentiment)
      .filter(s => s !== undefined)
    
    if (sentiments.length > 1) {
      const uniqueSentiments = new Set(sentiments)
      agreementScore += (sentiments.length - uniqueSentiments.size + 1) / sentiments.length
      comparisons++
    }
    
    // Compare themes overlap
    const themeSets = results
      .map(r => new Set(r.aiAnalysis?.themes || []))
      .filter(s => s.size > 0)
    
    if (themeSets.length > 1) {
      let themeOverlap = 0
      for (let i = 0; i < themeSets.length - 1; i++) {
        for (let j = i + 1; j < themeSets.length; j++) {
          const intersection = new Set([...themeSets[i]].filter(x => themeSets[j].has(x)))
          const union = new Set([...themeSets[i], ...themeSets[j]])
          themeOverlap += intersection.size / union.size
        }
      }
      agreementScore += themeOverlap / (themeSets.length * (themeSets.length - 1) / 2)
      comparisons++
    }
    
    return comparisons > 0 ? agreementScore / comparisons : 1
  }

  /**
   * Resolve conflicts between results
   */
  private async resolveConflicts(
    results: AnalysisResult[],
    weights: number[],
    method: string
  ): Promise<AnalysisResult> {
    switch (method) {
      case 'highest-confidence':
        // Select result with highest confidence/quality score
        let highestConfidenceIndex = 0
        let highestScore = 0
        
        results.forEach((result, i) => {
          const score = this.calculateConfidenceScore(result) * weights[i]
          if (score > highestScore) {
            highestScore = score
            highestConfidenceIndex = i
          }
        })
        
        return results[highestConfidenceIndex]
      
      case 'weighted-merge':
        // Use weighted average with conflict resolution
        return this.weightedAverageConsensus(results, weights)
      
      case 'expert-review':
      default:
        // Use expert selection
        return this.expertSelectionConsensus(results, weights)
    }
  }

  /**
   * Calculate confidence score for a result
   */
  private calculateConfidenceScore(result: AnalysisResult): number {
    let score = 0
    let factors = 0
    
    // Check completeness
    if (result.aiAnalysis?.summary) { score += 1; factors++ }
    if (result.aiAnalysis?.keyPoints?.length) { score += 1; factors++ }
    if (result.aiAnalysis?.themes?.length) { score += 1; factors++ }
    if (result.recommendations?.length) { score += 1; factors++ }
    if (result.sections?.length) { score += 1; factors++ }
    
    // Check for errors
    if (result.status === 'completed') { score += 1; factors++ }
    if (!result.metadata.error) { score += 1; factors++ }
    
    return factors > 0 ? score / factors : 0
  }

  /**
   * Analyze with specific consensus method
   */
  async analyzeWithMethod(
    request: AnalysisRequest,
    method: ConsensusConfig['method']
  ): Promise<AnalysisResult> {
    const originalMethod = this.consensus.method
    this.consensus.method = method
    
    try {
      return await this.analyze(request)
    } finally {
      this.consensus.method = originalMethod
    }
  }

  /**
   * Get provider statistics
   */
  getProviderStats() {
    return this.engines.map((engine, i) => ({
      index: i,
      weight: engine.weight,
      stats: engine.engine.getStats()
    }))
  }
}
import { useState, useCallback, useRef, useEffect } from 'react'
import { AnalysisEngine } from '../core/analysis-engine'
import { createAnalysis } from '../builders'
import type {
  AnalysisConfig,
  AnalysisRequest,
  AnalysisResult,
  AnalysisOptions,
  StreamAnalysisUpdate,
  BulkAnalysisContent,
  BulkAnalysisResult
} from '../types'

/**
 * Hook for basic analysis operations
 */
export function useAnalysis(config?: Partial<AnalysisConfig>) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const engineRef = useRef<AnalysisEngine | null>(null)

  useEffect(() => {
    if (config?.ai) {
      createAnalysis(config).then(engine => {
        engineRef.current = engine
      }).catch(err => {
        setError(new Error(`Failed to initialize analysis engine: ${err.message}`))
      })
    }
  }, []) // Only initialize once

  const analyze = useCallback(async (
    type: string,
    inputs: Record<string, any>,
    options?: AnalysisOptions
  ) => {
    if (!engineRef.current) {
      const error = new Error('Analysis engine not initialized. Provide AI config.')
      setError(error)
      throw error
    }

    setLoading(true)
    setError(null)

    try {
      const request: AnalysisRequest = { type, inputs, options }
      const analysisResult = await engineRef.current.analyze(request)
      setResult(analysisResult)
      return analysisResult
    } catch (err: any) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const analyzeMultiple = useCallback(async (requests: AnalysisRequest[]) => {
    if (!engineRef.current) {
      const error = new Error('Analysis engine not initialized')
      setError(error)
      throw error
    }

    setLoading(true)
    setError(null)

    try {
      const results = await engineRef.current.analyzeMultiple(requests)
      return results
    } catch (err: any) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const runTemplate = useCallback(async (
    templateName: string,
    variables: Record<string, any>,
    options?: AnalysisOptions
  ) => {
    if (!engineRef.current) {
      const error = new Error('Analysis engine not initialized')
      setError(error)
      throw error
    }

    setLoading(true)
    setError(null)

    try {
      const result = await engineRef.current.runTemplate(templateName, variables, options)
      setResult(result)
      return result
    } catch (err: any) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return {
    analyze,
    analyzeMultiple,
    runTemplate,
    result,
    loading,
    error,
    clear,
    engine: engineRef.current
  }
}

/**
 * Hook for streaming analysis
 */
export function useAnalysisStream(config?: Partial<AnalysisConfig>) {
  const [result, setResult] = useState<Partial<AnalysisResult> | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [progress, setProgress] = useState(0)
  const [insights, setInsights] = useState<string[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)
  const engineRef = useRef<AnalysisEngine | null>(null)

  useEffect(() => {
    if (config?.ai) {
      createAnalysis(config).then(engine => {
        engineRef.current = engine
      }).catch(err => {
        setError(new Error(`Failed to initialize analysis engine: ${err.message}`))
      })
    }
  }, [])

  const startStream = useCallback(async (request: AnalysisRequest) => {
    if (!engineRef.current) {
      const error = new Error('Analysis engine not initialized')
      setError(error)
      throw error
    }

    setStreaming(true)
    setError(null)
    setResult(null)
    setProgress(0)
    setInsights([])

    abortControllerRef.current = new AbortController()

    try {
      const stream = engineRef.current.analyzeStream(request)

      for await (const partial of stream) {
        if (abortControllerRef.current?.signal.aborted) {
          break
        }

        setResult(current => ({ ...current, ...partial }))
        
        // Update progress and insights if available
        if ('progress' in partial) {
          const update = partial as unknown as StreamAnalysisUpdate
          setProgress(update.progress)
          setInsights(update.insights)
        }
      }
    } catch (err: any) {
      setError(err)
    } finally {
      setStreaming(false)
    }
  }, [])

  const stopStream = useCallback(() => {
    abortControllerRef.current?.abort()
    setStreaming(false)
  }, [])

  return {
    result,
    streaming,
    error,
    progress,
    insights,
    startStream,
    stopStream
  }
}

/**
 * Hook for text analysis with all features
 */
export function useTextAnalysis(config?: Partial<AnalysisConfig>) {
  const { analyze, ...analysisState } = useAnalysis(config)

  const analyzeText = useCallback(async (
    text: string,
    options?: {
      includeReadability?: boolean
      includeSentiment?: boolean
      includeKeywords?: boolean
      includeStructure?: boolean
      customAnalysis?: string[]
    }
  ) => {
    return analyze('content', { content: text }, {
      includeNLP: true,
      includeReadability: options?.includeReadability,
      includeKeywords: options?.includeKeywords,
      includeStructure: options?.includeStructure,
      customAnalysis: options?.customAnalysis
    })
  }, [analyze])

  const summarize = useCallback(async (text: string, length?: 'short' | 'medium' | 'long') => {
    return analyze('summary', { content: text, length })
  }, [analyze])

  const checkBias = useCallback(async (text: string, context?: string) => {
    return analyze('bias', { content: text, context })
  }, [analyze])

  const analyzeSentiment = useCallback(async (text: string) => {
    return analyze('sentiment', { text })
  }, [analyze])

  const factCheck = useCallback(async (text: string) => {
    return analyze('factCheck', { content: text })
  }, [analyze])

  return {
    ...analysisState,
    analyzeText,
    summarize,
    checkBias,
    analyzeSentiment,
    factCheck
  }
}

/**
 * Hook for bulk analysis
 */
export function useBulkAnalysis(config?: Partial<AnalysisConfig>) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [result, setResult] = useState<BulkAnalysisResult | null>(null)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const engineRef = useRef<any>(null)

  useEffect(() => {
    if (config?.ai) {
      import('../builders').then(({ createBulkAnalysis }) => {
        createBulkAnalysis({
          ai: config.ai!,
          processing: {
            batchSize: 5,
            concurrency: 3,
            retryFailed: true
          }
        }).then(bulkAnalyzer => {
          engineRef.current = bulkAnalyzer
        }).catch(err => {
          setError(new Error(`Failed to initialize bulk analyzer: ${err.message}`))
        })
      })
    }
  }, [])

  const processContents = useCallback(async (
    contents: BulkAnalysisContent[],
    options?: {
      analysisType?: string
      includeComparison?: boolean
      generateReport?: boolean
    }
  ) => {
    if (!engineRef.current) {
      const error = new Error('Bulk analyzer not initialized')
      setError(error)
      throw error
    }

    setLoading(true)
    setError(null)
    setProgress({ current: 0, total: contents.length })

    try {
      // TODO: Add progress tracking
      const bulkResult = await engineRef.current.processContents(contents, options)
      setResult(bulkResult)
      return bulkResult
    } catch (err: any) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    processContents,
    result,
    loading,
    error,
    progress
  }
}

/**
 * Hook for SEO analysis
 */
export function useSEOAnalysis(config?: Partial<AnalysisConfig>) {
  const { analyze, ...state } = useAnalysis(config)

  const analyzeSEO = useCallback(async (
    content: string,
    options: {
      url?: string
      title?: string
      metaDescription?: string
      keywords?: string[]
    } = {}
  ) => {
    return analyze('seo', {
      content,
      url: options.url,
      title: options.title,
      metaDescription: options.metaDescription,
      keywords: options.keywords?.join(', ')
    })
  }, [analyze])

  return {
    ...state,
    analyzeSEO
  }
}

/**
 * Hook for content comparison
 */
export function useContentComparison(config?: Partial<AnalysisConfig>) {
  const { analyze, ...state } = useAnalysis(config)

  const compareContent = useCallback(async (
    yourContent: string,
    competitorContent: string
  ) => {
    return analyze('competitor', {
      yourContent,
      competitorContent
    })
  }, [analyze])

  return {
    ...state,
    compareContent
  }
}

/**
 * Hook for custom analysis templates
 */
export function useCustomAnalysis(config?: Partial<AnalysisConfig>) {
  const { runTemplate, ...state } = useAnalysis(config)
  const [templates, setTemplates] = useState<string[]>([])

  useEffect(() => {
    if (state.engine) {
      const engine = state.engine as AnalysisEngine
      const availableTypes = engine.getAvailableTypes()
      setTemplates(availableTypes.filter(t => t.category === 'custom').map(t => t.id))
    }
  }, [state.engine])

  const runCustom = useCallback(async (
    templateName: string,
    variables: Record<string, any>
  ) => {
    return runTemplate(templateName, variables)
  }, [runTemplate])

  return {
    ...state,
    runCustom,
    availableTemplates: templates
  }
}

/**
 * Hook for analysis history
 */
export function useAnalysisHistory(engine?: AnalysisEngine) {
  const [history, setHistory] = useState<AnalysisResult[]>([])

  const loadHistory = useCallback(async (options?: {
    type?: string
    status?: string
    limit?: number
  }) => {
    if (!engine) return []
    
    const results = engine.getHistory(options)
    setHistory(results)
    return results
  }, [engine])

  const clearHistory = useCallback(() => {
    if (!engine) return
    engine.clearHistory()
    setHistory([])
  }, [engine])

  const getAnalysis = useCallback((id: string) => {
    if (!engine) return null
    return engine.getAnalysis(id)
  }, [engine])

  useEffect(() => {
    if (engine) {
      loadHistory({ limit: 50 })
    }
  }, [engine, loadHistory])

  return {
    history,
    loadHistory,
    clearHistory,
    getAnalysis
  }
}

/**
 * Hook for insight buddy compatibility
 */
export function useInsightAnalysis(config?: Partial<AnalysisConfig>) {
  const { analyze, ...state } = useAnalysis(config)

  const summarize = useCallback(async (text: string, context?: string) => {
    return analyze('summarize', { text, context })
  }, [analyze])

  const explain = useCallback(async (text: string, context?: string) => {
    return analyze('explain', { text, context })
  }, [analyze])

  const critique = useCallback(async (text: string, context?: string) => {
    return analyze('critique', { text, context })
  }, [analyze])

  const expandKnowledge = useCallback(async (text: string, context?: string) => {
    return analyze('expand', { text, context })
  }, [analyze])

  const quickSummary = useCallback(async (text: string) => {
    return analyze('quickSummary', { text })
  }, [analyze])

  return {
    ...state,
    summarize,
    explain,
    critique,
    expandKnowledge,
    quickSummary
  }
}
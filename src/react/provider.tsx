import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { AnalysisEngine } from '../core/analysis-engine'
import { createAnalysis } from '../builders'
import type { AnalysisConfig, AnalysisResult, AnalysisType } from '../types'

interface AnalysisContextValue {
  engine: AnalysisEngine | null
  availableTypes: AnalysisType[]
  history: AnalysisResult[]
  loading: boolean
  error: Error | null
  getAnalysis: (id: string) => AnalysisResult | undefined
  clearHistory: () => void
  updateConfig: (config: Partial<AnalysisConfig>) => Promise<void>
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null)

interface AnalysisProviderProps {
  children: ReactNode
  config: Partial<AnalysisConfig>
  onError?: (error: Error) => void
}

export function AnalysisProvider({ children, config, onError }: AnalysisProviderProps) {
  const [engine, setEngine] = useState<AnalysisEngine | null>(null)
  const [availableTypes, setAvailableTypes] = useState<AnalysisType[]>([])
  const [history, setHistory] = useState<AnalysisResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const initializeEngine = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!config.ai) {
          throw new Error('AI configuration is required for AnalysisProvider')
        }

        const analysisEngine = await createAnalysis(config)
        setEngine(analysisEngine)

        // Load available types
        setAvailableTypes(analysisEngine.getAvailableTypes())

        // Load initial history
        setHistory(analysisEngine.getHistory({ limit: 50 }))

        // Listen to analysis events
        analysisEngine.on('analysis-complete', () => {
          // Refresh history when new analysis completes
          setHistory(analysisEngine.getHistory({ limit: 50 }))
        })

        analysisEngine.on('analysis-error', (event) => {
          const error = new Error(event.error)
          setError(error)
          onError?.(error)
        })

      } catch (err: any) {
        setError(err)
        onError?.(err)
      } finally {
        setLoading(false)
      }
    }

    initializeEngine()
  }, []) // Only initialize once

  const getAnalysis = (id: string) => {
    return engine?.getAnalysis(id)
  }

  const clearHistory = () => {
    engine?.clearHistory()
    setHistory([])
  }

  const updateConfig = async (newConfig: Partial<AnalysisConfig>) => {
    if (!engine) return

    try {
      // For now, we need to recreate the engine with new config
      // In future, we could add updateConfig method to engine
      const mergedConfig = { ...config, ...newConfig }
      const newEngine = await createAnalysis(mergedConfig)
      
      setEngine(newEngine)
      setAvailableTypes(newEngine.getAvailableTypes())
      setHistory(newEngine.getHistory({ limit: 50 }))
    } catch (err: any) {
      setError(err)
      onError?.(err)
    }
  }

  const value: AnalysisContextValue = {
    engine,
    availableTypes,
    history,
    loading,
    error,
    getAnalysis,
    clearHistory,
    updateConfig
  }

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  )
}

export function useAnalysisContext() {
  const context = useContext(AnalysisContext)
  if (!context) {
    throw new Error('useAnalysisContext must be used within AnalysisProvider')
  }
  return context
}
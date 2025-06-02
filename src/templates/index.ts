export { analysisTypes } from './analysis-types'
export { promptTemplates } from './prompt-templates'

// Re-export utility functions for backward compatibility
export { compileTemplate } from '../utilities/template-helpers'

// Export template-related functions
export function getPromptTemplate(analysisType: string): string | undefined {
  const { promptTemplates } = require('./prompt-templates')
  const template = promptTemplates[analysisType]
  return template?.template
}

export function getAnalysisType(typeId: string) {
  const { analysisTypes } = require('./analysis-types')
  return analysisTypes[typeId]
}

// Insight template helpers (backward compatibility)
export function getInsightPrompt(analysisType: string, inputs: Record<string, any>): string {
  const { promptTemplates } = require('./prompt-templates')
  const template = promptTemplates[analysisType]
  
  if (!template) {
    throw new Error(`Unknown analysis type: ${analysisType}`)
  }

  // Simple template replacement for backward compatibility
  let prompt = template.template

  Object.entries(inputs).forEach(([key, value]) => {
    // Handle conditional blocks
    const conditionalRegex = new RegExp(`{{#if ${key}}}([\\s\\S]*?){{/if}}`, 'g')
    prompt = prompt.replace(conditionalRegex, value ? '$1' : '')

    // Replace variables
    const variableRegex = new RegExp(`{{${key}}}`, 'g')
    prompt = prompt.replace(variableRegex, value || '')
  })

  return prompt.trim()
}

export function formatInsightResponse(analysisType: string, aiResponse: string): any {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(aiResponse)
    return parsed
  } catch {
    // If not JSON, format based on type
    switch (analysisType) {
      case 'quickSummary':
        return {
          summary: aiResponse.trim(),
          type: 'quick'
        }

      case 'summarize':
        return {
          summary: aiResponse,
          keyPoints: [],
          confidence: 0.8
        }

      case 'critique':
        return {
          questions: [{
            question: aiResponse,
            category: 'general',
            reasoning: 'AI generated question',
            importance: 'medium'
          }],
          overallAssessment: ''
        }

      default:
        return {
          output: aiResponse,
          type: analysisType
        }
    }
  }
}

// Export all insight-related types and templates for backward compatibility
export const insightAnalysisTypes = {
  summarize: analysisTypes.summarize,
  explain: analysisTypes.explain,
  critique: analysisTypes.critique,
  contextDictionary: analysisTypes.contextDictionary,
  biasCheck: analysisTypes.biasCheck,
  expand: analysisTypes.expand,
  quickSummary: analysisTypes.quickSummary
} as const

export const insightPromptTemplates = {
  summarize: promptTemplates.summarize,
  explain: promptTemplates.explain,
  critique: promptTemplates.critique,
  biasCheck: promptTemplates.biasCheck,
  expand: promptTemplates.expand,
  quickSummary: promptTemplates.quickSummary
} as const
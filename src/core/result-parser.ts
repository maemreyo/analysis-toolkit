import { marked } from 'marked'
import * as yaml from 'js-yaml'
import type { AnalysisResult, AnalysisSection, Recommendation } from '../types'

export class ResultParser {
  /**
   * Parse AI response into structured analysis result
   */
  parseAnalysisResponse(
    response: string,
    analysisType: string,
    format: 'structured' | 'markdown' | 'html' | 'json'
  ): Partial<AnalysisResult> {
    // Try to extract JSON from response first
    const jsonData = this.extractJSON(response)
    if (jsonData) {
      return this.parseJsonResponse(jsonData)
    }

    // Otherwise parse based on format
    switch (format) {
      case 'structured':
        return this.parseStructuredResponse(response, analysisType)
      case 'markdown':
        return this.parseMarkdownResponse(response)
      case 'json':
        return this.tryParseJson(response)
      case 'html':
        return this.parseHtmlResponse(response)
      default:
        return { output: response }
    }
  }

  /**
   * Extract JSON from mixed text response
   */
  private extractJSON(response: string): any | null {
    // Try to find JSON blocks in various formats
    const patterns = [
      /```json\n?([\s\S]*?)\n?```/,
      /```\n?([\s\S]*?)\n?```/,
      /\{[\s\S]*\}/
    ]

    for (const pattern of patterns) {
      const match = response.match(pattern)
      if (match) {
        try {
          const jsonStr = match[1] || match[0]
          return JSON.parse(jsonStr)
        } catch {
          continue
        }
      }
    }

    return null
  }

  /**
   * Parse structured response
   */
  private parseStructuredResponse(response: string, analysisType: string): Partial<AnalysisResult> {
    const sections: AnalysisSection[] = []
    const recommendations: Recommendation[] = []

    // Split response into sections based on headers
    const sectionRegex = /^#+\s+(.+)$/gm
    const parts = response.split(sectionRegex)

    for (let i = 1; i < parts.length; i += 2) {
      const title = parts[i].trim()
      const content = parts[i + 1]?.trim() || ''

      // Check if this is a recommendations section
      if (title.toLowerCase().includes('recommendation')) {
        recommendations.push(...this.extractRecommendations(content))
      } else {
        sections.push({
          id: `section-${i}`,
          title,
          content: this.parseContent(content, analysisType),
          type: this.detectSectionType(content),
          order: Math.floor(i / 2)
        })
      }
    }

    // Extract summary if present
    const summary = this.extractSummary(response)

    // Extract key points
    const keyPoints = this.extractKeyPoints(response)

    // Extract sentiment
    const sentiment = this.extractSentiment(response)

    // Extract themes
    const themes = this.extractThemes(response)

    return { 
      sections, 
      recommendations,
      summary,
      keyPoints,
      sentiment,
      themes,
      tone: this.extractTone(response)
    }
  }

  /**
   * Parse content based on patterns
   */
  private parseContent(content: string, analysisType: string): any {
    // Check for specific patterns

    // Metrics pattern (e.g., "Score: 8/10")
    const metricsRegex = /^(.+?):\s*(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+))?$/gm
    const metrics: Record<string, any> = {}
    let match

    while ((match = metricsRegex.exec(content)) !== null) {
      const [, label, value, max] = match
      metrics[label.toLowerCase().replace(/\s+/g, '_')] = {
        value: parseFloat(value),
        max: max ? parseFloat(max) : undefined
      }
    }

    if (Object.keys(metrics).length > 0) {
      return { type: 'metrics', data: metrics, text: content }
    }

    // List pattern
    const listRegex = /^[\-\*\d+\.]\s+(.+)$/gm
    const listItems: string[] = []

    while ((match = listRegex.exec(content)) !== null) {
      listItems.push(match[1])
    }

    if (listItems.length > 0) {
      return { type: 'list', items: listItems }
    }

    // Table pattern (simple markdown tables)
    if (content.includes('|') && content.includes('---')) {
      return this.parseTable(content)
    }

    // Default: return as text
    return content
  }

  /**
   * Detect section type based on content
   */
  private detectSectionType(content: string): 'text' | 'chart' | 'table' | 'list' | 'metric' {
    if (typeof content === 'object') {
      if (content.type === 'metrics') return 'metric'
      if (content.type === 'list') return 'list'
      if (content.type === 'table') return 'table'
    }

    // Check content patterns
    if (content.includes('|') && content.includes('---')) return 'table'
    if (/^[\-\*\d+\.]\s+/m.test(content)) return 'list'
    if (/^\w+:\s*\d+/m.test(content)) return 'metric'

    return 'text'
  }

  /**
   * Extract recommendations from content
   */
  private extractRecommendations(content: string): Recommendation[] {
    const recommendations: Recommendation[] = []

    // Split by line breaks or list items
    const lines = content.split(/\n+/)

    lines.forEach((line, index) => {
      const trimmed = line.replace(/^[\-\*\d+\.]\s+/, '').trim()
      if (!trimmed) return

      // Try to extract priority from the line
      let priority: 'low' | 'medium' | 'high' = 'medium'
      let title = trimmed
      let description = ''

      // Check for priority indicators
      if (/high\s*priority|critical|urgent/i.test(trimmed)) {
        priority = 'high'
      } else if (/low\s*priority|minor|optional/i.test(trimmed)) {
        priority = 'low'
      }

      // Split title and description if there's a colon
      const colonIndex = trimmed.indexOf(':')
      if (colonIndex > 0) {
        title = trimmed.substring(0, colonIndex).trim()
        description = trimmed.substring(colonIndex + 1).trim()
      }

      recommendations.push({
        id: `rec-${index}`,
        title,
        description,
        priority,
        category: 'general',
        actionable: true
      })
    })

    return recommendations
  }

  /**
   * Parse markdown table
   */
  private parseTable(content: string): any {
    const lines = content.trim().split('\n')
    const headers: string[] = []
    const rows: any[] = []

    lines.forEach((line, index) => {
      if (line.includes('---')) return // Skip separator

      const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell)

      if (index === 0) {
        headers.push(...cells)
      } else {
        const row: Record<string, string> = {}
        cells.forEach((cell, i) => {
          row[headers[i] || `col${i}`] = cell
        })
        rows.push(row)
      }
    })

    return { type: 'table', headers, rows }
  }

  /**
   * Parse markdown response
   */
  private parseMarkdownResponse(response: string): Partial<AnalysisResult> {
    const html = marked(response)
    
    return {
      output: response,
      sections: [{
        id: 'markdown-content',
        title: 'Analysis',
        content: html,
        type: 'text',
        order: 0
      }]
    }
  }

  /**
   * Try to parse JSON response
   */
  private tryParseJson(response: string): Partial<AnalysisResult> {
    try {
      const parsed = JSON.parse(response)
      return this.parseJsonResponse(parsed)
    } catch (error) {
      console.error('Failed to parse JSON response:', error)
      return { output: response }
    }
  }

  /**
   * Parse JSON response into structured result
   */
  private parseJsonResponse(data: any): Partial<AnalysisResult> {
    const result: Partial<AnalysisResult> = {
      output: data
    }

    // Extract known fields
    if (data.summary) result.summary = data.summary
    if (data.keyPoints) result.keyPoints = data.keyPoints
    if (data.sentiment) result.sentiment = data.sentiment
    if (data.tone) result.tone = data.tone
    if (data.themes) result.themes = data.themes

    // Extract sections
    if (data.sections && Array.isArray(data.sections)) {
      result.sections = data.sections.map((section: any, index: number) => ({
        id: section.id || `section-${index}`,
        title: section.title || `Section ${index + 1}`,
        content: section.content,
        type: section.type || 'text',
        order: section.order || index
      }))
    }

    // Extract recommendations
    if (data.recommendations && Array.isArray(data.recommendations)) {
      result.recommendations = data.recommendations.map((rec: any, index: number) => ({
        id: rec.id || `rec-${index}`,
        title: rec.title || rec.name || 'Recommendation',
        description: rec.description || rec.details || '',
        priority: rec.priority || 'medium',
        category: rec.category || 'general',
        actionable: rec.actionable !== false,
        impact: rec.impact
      }))
    }

    // Store any custom analysis fields
    result.customAnalysis = {}
    Object.keys(data).forEach(key => {
      if (!['summary', 'keyPoints', 'sentiment', 'tone', 'themes', 'sections', 'recommendations'].includes(key)) {
        result.customAnalysis![key] = data[key]
      }
    })

    return result
  }

  /**
   * Parse HTML response
   */
  private parseHtmlResponse(response: string): Partial<AnalysisResult> {
    // For security, we don't actually parse HTML on server
    // Just return the HTML as output
    return {
      output: response,
      sections: [{
        id: 'html-content',
        title: 'Analysis',
        content: response,
        type: 'text',
        order: 0
      }]
    }
  }

  /**
   * Extract summary from response
   */
  private extractSummary(response: string): string {
    // Look for summary section
    const summaryMatch = response.match(/summary[:\s]*(.+?)(?:\n|$)/i)
    if (summaryMatch) {
      return summaryMatch[1].trim()
    }

    // Extract first paragraph as summary
    const paragraphs = response.split(/\n\n+/)
    if (paragraphs.length > 0) {
      return paragraphs[0].substring(0, 200) + '...'
    }

    return ''
  }

  /**
   * Extract key points from response
   */
  private extractKeyPoints(response: string): string[] {
    const keyPoints: string[] = []

    // Look for key points section
    const keyPointsMatch = response.match(/key\s*points?[:\s]*(.+?)(?:\n\n|$)/is)
    if (keyPointsMatch) {
      const content = keyPointsMatch[1]
      const lines = content.split(/\n/)
      
      lines.forEach(line => {
        const cleaned = line.replace(/^[\-\*\d+\.]\s+/, '').trim()
        if (cleaned) {
          keyPoints.push(cleaned)
        }
      })
    }

    return keyPoints
  }

  /**
   * Extract sentiment from response
   */
  private extractSentiment(response: string): 'positive' | 'negative' | 'neutral' | 'mixed' {
    const sentimentMatch = response.match(/sentiment[:\s]*(\w+)/i)
    if (sentimentMatch) {
      const sentiment = sentimentMatch[1].toLowerCase()
      if (['positive', 'negative', 'neutral', 'mixed'].includes(sentiment)) {
        return sentiment as any
      }
    }

    // Simple keyword-based sentiment detection
    const positive = /positive|good|excellent|great|beneficial/gi
    const negative = /negative|bad|poor|harmful|problematic/gi
    
    const posMatches = (response.match(positive) || []).length
    const negMatches = (response.match(negative) || []).length

    if (posMatches > negMatches * 2) return 'positive'
    if (negMatches > posMatches * 2) return 'negative'
    if (posMatches > 0 && negMatches > 0) return 'mixed'
    
    return 'neutral'
  }

  /**
   * Extract tone from response
   */
  private extractTone(response: string): string {
    const toneMatch = response.match(/tone[:\s]*(\w+)/i)
    if (toneMatch) {
      return toneMatch[1]
    }

    // Simple tone detection based on language patterns
    if (/formal|professional|academic/i.test(response)) return 'formal'
    if (/casual|friendly|conversational/i.test(response)) return 'casual'
    if (/technical|scientific|specialized/i.test(response)) return 'technical'
    
    return 'neutral'
  }

  /**
   * Extract themes from response
   */
  private extractThemes(response: string): string[] {
    const themes: string[] = []

    // Look for themes section
    const themesMatch = response.match(/themes?[:\s]*(.+?)(?:\n\n|$)/is)
    if (themesMatch) {
      const content = themesMatch[1]
      const items = content.split(/[,\n]/)
      
      items.forEach(item => {
        const cleaned = item.replace(/^[\-\*\d+\.]\s+/, '').trim()
        if (cleaned && cleaned.length < 50) {
          themes.push(cleaned)
        }
      })
    }

    return themes
  }

  /**
   * Parse YAML response
   */
  parseYamlResponse(response: string): any {
    try {
      // Extract YAML from code blocks if present
      const yamlMatch = response.match(/```yaml\n?([\s\S]*?)\n?```/)
      const yamlStr = yamlMatch ? yamlMatch[1] : response

      return yaml.load(yamlStr)
    } catch (error) {
      console.error('Failed to parse YAML:', error)
      return null
    }
  }

  /**
   * Extract metrics from analysis result
   */
  static extractMetrics(result: AnalysisResult): Record<string, any> {
    const metrics: Record<string, any> = {}

    result.sections?.forEach(section => {
      if (section.type === 'metric' && typeof section.content === 'object') {
        Object.assign(metrics, section.content.data)
      }
    })

    return metrics
  }

  /**
   * Extract all recommendations
   */
  static extractRecommendations(result: AnalysisResult): Recommendation[] {
    return result.recommendations || []
  }
}
import { marked } from 'marked'
import TurndownService from 'turndown'
import * as yaml from 'js-yaml'
import sanitizeHtml from 'sanitize-html'
import hljs from 'highlight.js'
import type { AnalysisResult, AnalysisSection, Recommendation } from '../types'

export interface FormatterConfig {
  format?: 'json' | 'markdown' | 'html' | 'yaml'
  includeRawData?: boolean
  includeMetrics?: boolean
  sanitizeHTML?: boolean
}

export interface FormattedResult {
  id: string
  type: string
  status: string
  summary?: string
  sections?: FormattedSection[]
  metrics?: FormattedMetrics
  recommendations?: FormattedRecommendation[]
  sources?: any[]
  metadata?: FormattedMetadata
  raw?: any
}

export interface FormattedSection extends AnalysisSection {
  formatted?: string | any
}

export interface FormattedMetrics {
  primary: any[]
  secondary: any[]
}

export interface FormattedRecommendation extends Recommendation {
  icon?: string
  color?: string
}

export interface FormattedMetadata {
  duration?: string
  tokensUsed?: string
  model?: string
  completedAt?: string
}

export class ResultFormatter {
  private config: Required<FormatterConfig>
  private turndown: TurndownService

  constructor(config: FormatterConfig = {}) {
    this.config = {
      format: config.format || 'json',
      includeRawData: config.includeRawData ?? false,
      includeMetrics: config.includeMetrics ?? true,
      sanitizeHTML: config.sanitizeHTML ?? true
    }

    // Initialize Turndown for HTML to Markdown conversion
    this.turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    })

    // Configure marked for Markdown to HTML
    marked.setOptions({
      highlight: (code, lang) => {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value
        }
        return code
      }
    })
  }

  /**
   * Format analysis result based on configuration
   */
  format(result: AnalysisResult, format?: FormatterConfig['format']): string | any {
    const targetFormat = format || this.config.format

    switch (targetFormat) {
      case 'json':
        return this.formatAsJSON(result)
      case 'markdown':
        return this.formatAsMarkdown(result)
      case 'html':
        return this.formatAsHTML(result)
      case 'yaml':
        return this.formatAsYAML(result)
      default:
        return result
    }
  }

  /**
   * Format for UI display
   */
  formatForUI(result: AnalysisResult): FormattedResult {
    const formatted: FormattedResult = {
      id: result.id,
      type: result.type,
      status: result.status
    }

    // Add summary
    if (result.aiAnalysis?.summary) {
      formatted.summary = result.aiAnalysis.summary
    } else if (result.output?.summary) {
      formatted.summary = result.output.summary
    } else {
      formatted.summary = this.generateSummary(result)
    }

    // Format sections
    if (result.sections) {
      formatted.sections = this.formatSections(result.sections)
    }

    // Format metrics
    if (this.config.includeMetrics) {
      formatted.metrics = this.formatMetrics(result)
    }

    // Format recommendations
    if (result.recommendations) {
      formatted.recommendations = this.formatRecommendations(result.recommendations)
    }

    // Format metadata
    formatted.metadata = this.formatMetadata(result.metadata)

    // Include raw data if requested
    if (this.config.includeRawData) {
      formatted.raw = result
    }

    return formatted
  }

  /**
   * Format as JSON
   */
  private formatAsJSON(result: AnalysisResult): string {
    const formatted = this.formatForUI(result)
    return JSON.stringify(formatted, null, 2)
  }

  /**
   * Format as Markdown
   */
  private formatAsMarkdown(result: AnalysisResult): string {
    let markdown = `# ${result.type} Analysis\n\n`

    // Add metadata
    markdown += `**Status:** ${result.status}\n`
    if (result.metadata.completedAt) {
      markdown += `**Date:** ${new Date(result.metadata.completedAt).toLocaleString()}\n`
    }
    if (result.metadata.duration) {
      markdown += `**Duration:** ${(result.metadata.duration / 1000).toFixed(2)}s\n`
    }
    markdown += '\n'

    // Add summary
    if (result.aiAnalysis?.summary) {
      markdown += `## Summary\n\n${result.aiAnalysis.summary}\n\n`
    }

    // Add key points
    if (result.aiAnalysis?.keyPoints && result.aiAnalysis.keyPoints.length > 0) {
      markdown += `## Key Points\n\n`
      result.aiAnalysis.keyPoints.forEach(point => {
        markdown += `- ${point}\n`
      })
      markdown += '\n'
    }

    // Add analysis details
    if (result.aiAnalysis) {
      if (result.aiAnalysis.sentiment) {
        markdown += `**Sentiment:** ${result.aiAnalysis.sentiment}\n`
      }
      if (result.aiAnalysis.tone) {
        markdown += `**Tone:** ${result.aiAnalysis.tone}\n`
      }
      if (result.aiAnalysis.themes && result.aiAnalysis.themes.length > 0) {
        markdown += `**Themes:** ${result.aiAnalysis.themes.join(', ')}\n`
      }
      markdown += '\n'
    }

    // Add NLP analysis
    if (result.nlpAnalysis) {
      markdown += `## Language Analysis\n\n`
      markdown += `- **Language:** ${result.nlpAnalysis.language}\n`
      markdown += `- **Readability Grade:** ${result.nlpAnalysis.readability.grade}\n`
      markdown += `- **Difficulty:** ${result.nlpAnalysis.readability.difficulty}\n`
      markdown += `- **Sentiment Score:** ${result.nlpAnalysis.sentiment.score}\n\n`

      if (result.nlpAnalysis.keywords.length > 0) {
        markdown += `### Top Keywords\n\n`
        result.nlpAnalysis.keywords.slice(0, 10).forEach(keyword => {
          markdown += `- **${keyword.word}** (relevance: ${(keyword.relevance * 100).toFixed(1)}%)\n`
        })
        markdown += '\n'
      }
    }

    // Add structure analysis
    if (result.structure) {
      markdown += `## Structure Analysis\n\n`
      markdown += `- **Words:** ${result.structure.wordCount}\n`
      markdown += `- **Sentences:** ${result.structure.sentenceCount}\n`
      markdown += `- **Paragraphs:** ${result.structure.paragraphCount}\n`
      markdown += `- **Avg. Sentence Length:** ${result.structure.averageSentenceLength} words\n`
      markdown += `- **Complexity:** ${result.structure.complexity}\n\n`
    }

    // Add sections
    if (result.sections) {
      result.sections.forEach(section => {
        markdown += `## ${section.title}\n\n`
        
        if (typeof section.content === 'string') {
          markdown += `${section.content}\n\n`
        } else if (section.content.type === 'list' && section.content.items) {
          section.content.items.forEach((item: string) => {
            markdown += `- ${item}\n`
          })
          markdown += '\n'
        } else if (section.content.type === 'table') {
          markdown += this.formatTableAsMarkdown(section.content)
          markdown += '\n'
        } else {
          markdown += `${JSON.stringify(section.content, null, 2)}\n\n`
        }
      })
    }

    // Add recommendations
    if (result.recommendations && result.recommendations.length > 0) {
      markdown += `## Recommendations\n\n`
      result.recommendations.forEach(rec => {
        const priorityEmoji = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢'
        markdown += `### ${priorityEmoji} ${rec.title}\n\n`
        markdown += `${rec.description}\n\n`
        if (rec.impact) {
          markdown += `**Impact:** ${rec.impact}\n\n`
        }
      })
    }

    return markdown
  }

  /**
   * Format as HTML
   */
  private formatAsHTML(result: AnalysisResult): string {
    const markdown = this.formatAsMarkdown(result)
    let html = marked(markdown) as string

    if (this.config.sanitizeHTML) {
      html = sanitizeHtml(html, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          code: ['class']
        }
      })
    }

    // Wrap in a styled container
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${result.type} Analysis</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 { color: #2c3e50; }
    h1 { border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    h2 { margin-top: 30px; }
    pre { background: #f4f4f4; padding: 10px; border-radius: 4px; overflow-x: auto; }
    code { background: #f4f4f4; padding: 2px 4px; border-radius: 2px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; font-weight: bold; }
    .high-priority { color: #e74c3c; }
    .medium-priority { color: #f39c12; }
    .low-priority { color: #27ae60; }
    .metric { display: inline-block; margin: 10px; padding: 10px; background: #ecf0f1; border-radius: 4px; }
    .metric-value { font-size: 24px; font-weight: bold; color: #3498db; }
    .metric-label { font-size: 12px; color: #7f8c8d; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`
  }

  /**
   * Format as YAML
   */
  private formatAsYAML(result: AnalysisResult): string {
    const formatted = this.formatForUI(result)
    return yaml.dump(formatted, {
      indent: 2,
      lineWidth: 80,
      noRefs: true
    })
  }

  /**
   * Generate summary from result
   */
  private generateSummary(result: AnalysisResult): string {
    const parts: string[] = []

    if (result.sections && result.sections.length > 0) {
      const firstSection = result.sections[0]
      if (typeof firstSection.content === 'string') {
        parts.push(firstSection.content.substring(0, 150) + '...')
      }
    }

    if (result.output && typeof result.output === 'string') {
      parts.push(result.output.substring(0, 150) + '...')
    }

    return parts.join(' ') || 'Analysis completed successfully.'
  }

  /**
   * Format sections
   */
  private formatSections(sections: AnalysisSection[]): FormattedSection[] {
    return sections.map(section => ({
      ...section,
      formatted: this.formatSectionContent(section)
    }))
  }

  /**
   * Format section content
   */
  private formatSectionContent(section: AnalysisSection): string | any {
    if (typeof section.content === 'string') {
      return section.content
    }

    switch (section.type) {
      case 'metric':
        return this.formatMetricContent(section.content)
      case 'list':
        return this.formatListContent(section.content)
      case 'table':
        return this.formatTableContent(section.content)
      case 'chart':
        return section.content // Return as-is for charts
      default:
        return JSON.stringify(section.content, null, 2)
    }
  }

  /**
   * Format metric content
   */
  private formatMetricContent(content: any): string {
    if (!content.data) return JSON.stringify(content)

    const metrics = Object.entries(content.data).map(([key, value]: [string, any]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      const displayValue = value.max ? `${value.value}/${value.max}` : value.value
      return `${label}: ${displayValue}`
    })

    return metrics.join('\n')
  }

  /**
   * Format list content
   */
  private formatListContent(content: any): string {
    if (!content.items || !Array.isArray(content.items)) return JSON.stringify(content)
    return content.items.map((item: string) => `• ${item}`).join('\n')
  }

  /**
   * Format table content
   */
  private formatTableContent(content: any): string {
    if (!content.headers || !content.rows) return JSON.stringify(content)
    return this.formatTableAsMarkdown(content)
  }

  /**
   * Format table as markdown
   */
  private formatTableAsMarkdown(table: any): string {
    if (!table.headers || !table.rows) return ''

    let markdown = '| ' + table.headers.join(' | ') + ' |\n'
    markdown += '| ' + table.headers.map(() => '---').join(' | ') + ' |\n'

    table.rows.forEach((row: any) => {
      const cells = table.headers.map((header: string) => row[header] || '')
      markdown += '| ' + cells.join(' | ') + ' |\n'
    })

    return markdown
  }

  /**
   * Format metrics
   */
  private formatMetrics(result: AnalysisResult): FormattedMetrics {
    const metrics: FormattedMetrics = {
      primary: [],
      secondary: []
    }

    // Extract metrics from sections
    result.sections?.forEach(section => {
      if (section.type === 'metric' && section.content?.data) {
        const formattedMetrics = Object.entries(section.content.data).map(([key, value]: [string, any]) => ({
          label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          value: value.value,
          max: value.max,
          format: value.value < 1 ? 'percentage' : 'number'
        }))

        // First 3 are primary, rest are secondary
        metrics.primary.push(...formattedMetrics.slice(0, 3))
        metrics.secondary.push(...formattedMetrics.slice(3))
      }
    })

    // Add performance metrics if available
    if (result.performance) {
      metrics.secondary.push({
        label: 'Processing Time',
        value: result.performance.processingTime,
        format: 'duration'
      })
      
      if (result.performance.tokensUsed) {
        metrics.secondary.push({
          label: 'Tokens Used',
          value: result.performance.tokensUsed,
          format: 'number'
        })
      }
    }

    return metrics
  }

  /**
   * Format recommendations
   */
  private formatRecommendations(recommendations: Recommendation[]): FormattedRecommendation[] {
    return recommendations
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })
      .map(rec => ({
        ...rec,
        icon: this.getRecommendationIcon(rec),
        color: this.getRecommendationColor(rec.priority)
      }))
  }

  /**
   * Get recommendation icon
   */
  private getRecommendationIcon(rec: Recommendation): string {
    if (rec.priority === 'high') return '🔴'
    if (rec.priority === 'medium') return '🟡'
    return '🟢'
  }

  /**
   * Get recommendation color
   */
  private getRecommendationColor(priority: string): string {
    switch (priority) {
      case 'high': return 'red'
      case 'medium': return 'yellow'
      case 'low': return 'green'
      default: return 'gray'
    }
  }

  /**
   * Format metadata
   */
  private formatMetadata(metadata: AnalysisResult['metadata']): FormattedMetadata {
    return {
      duration: metadata.duration ? `${(metadata.duration / 1000).toFixed(2)}s` : undefined,
      tokensUsed: metadata.tokensUsed?.toLocaleString(),
      model: metadata.model,
      completedAt: metadata.completedAt ? new Date(metadata.completedAt).toLocaleString() : undefined
    }
  }

  /**
   * Export analysis result in various formats
   */
  export(result: AnalysisResult, format: 'pdf' | 'html' | 'markdown' | 'json'): string | Blob {
    switch (format) {
      case 'markdown':
        return this.formatAsMarkdown(result)
      case 'html':
        return this.formatAsHTML(result)
      case 'json':
        return this.formatAsJSON(result)
      case 'pdf':
        // PDF generation would require additional library
        // For now, return HTML that can be printed to PDF
        return new Blob([this.formatAsHTML(result)], { type: 'text/html' })
      default:
        return JSON.stringify(result)
    }
  }

  /**
   * Update formatter configuration
   */
  updateConfig(config: Partial<FormatterConfig>) {
    Object.assign(this.config, config)
  }

  /**
   * Get current configuration
   */
  getConfig(): FormatterConfig {
    return { ...this.config }
  }
}
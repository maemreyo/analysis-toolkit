import Handlebars from 'handlebars'
import type { PromptTemplate, AnalysisRequest } from '../types'
import { promptTemplates } from '../templates'

export interface TemplateEngineConfig {
  customTemplates?: Record<string, string>
  helpers?: Record<string, Function>
  partials?: Record<string, string>
}

export class TemplateEngine {
  private handlebars: typeof Handlebars
  private templates: Map<string, PromptTemplate> = new Map()
  private compiledTemplates: Map<string, HandlebarsTemplateDelegate> = new Map()

  constructor(config: TemplateEngineConfig = {}) {
    // Create a new Handlebars instance
    this.handlebars = Handlebars.create()

    // Register default helpers
    this.registerDefaultHelpers()

    // Register custom helpers
    if (config.helpers) {
      Object.entries(config.helpers).forEach(([name, helper]) => {
        this.handlebars.registerHelper(name, helper)
      })
    }

    // Register partials
    if (config.partials) {
      Object.entries(config.partials).forEach(([name, partial]) => {
        this.handlebars.registerPartial(name, partial)
      })
    }

    // Load default templates
    Object.entries(promptTemplates).forEach(([id, template]) => {
      this.templates.set(id, template)
    })

    // Load custom templates
    if (config.customTemplates) {
      Object.entries(config.customTemplates).forEach(([id, templateStr]) => {
        this.templates.set(id, {
          id,
          name: `Custom: ${id}`,
          description: 'Custom template',
          template: templateStr,
          variables: [],
          category: 'custom'
        })
      })
    }
  }

  /**
   * Register default Handlebars helpers
   */
  private registerDefaultHelpers() {
    // Conditional helpers
    this.handlebars.registerHelper('eq', (a: any, b: any) => a === b)
    this.handlebars.registerHelper('ne', (a: any, b: any) => a !== b)
    this.handlebars.registerHelper('lt', (a: any, b: any) => a < b)
    this.handlebars.registerHelper('gt', (a: any, b: any) => a > b)
    this.handlebars.registerHelper('lte', (a: any, b: any) => a <= b)
    this.handlebars.registerHelper('gte', (a: any, b: any) => a >= b)
    this.handlebars.registerHelper('and', (a: any, b: any) => a && b)
    this.handlebars.registerHelper('or', (a: any, b: any) => a || b)
    this.handlebars.registerHelper('not', (a: any) => !a)

    // String helpers
    this.handlebars.registerHelper('uppercase', (str: string) => str?.toUpperCase())
    this.handlebars.registerHelper('lowercase', (str: string) => str?.toLowerCase())
    this.handlebars.registerHelper('capitalize', (str: string) => {
      if (!str) return ''
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    })
    this.handlebars.registerHelper('trim', (str: string) => str?.trim())
    this.handlebars.registerHelper('substring', (str: string, start: number, end: number) => {
      return str?.substring(start, end)
    })
    this.handlebars.registerHelper('replace', (str: string, find: string, replace: string) => {
      return str?.replace(new RegExp(find, 'g'), replace)
    })

    // Array helpers
    this.handlebars.registerHelper('join', (array: any[], separator: string) => {
      return Array.isArray(array) ? array.join(separator || ', ') : ''
    })
    this.handlebars.registerHelper('first', (array: any[]) => {
      return Array.isArray(array) ? array[0] : undefined
    })
    this.handlebars.registerHelper('last', (array: any[]) => {
      return Array.isArray(array) ? array[array.length - 1] : undefined
    })
    this.handlebars.registerHelper('length', (array: any[]) => {
      return Array.isArray(array) ? array.length : 0
    })
    this.handlebars.registerHelper('contains', (array: any[], value: any) => {
      return Array.isArray(array) && array.includes(value)
    })

    // Number helpers
    this.handlebars.registerHelper('add', (a: number, b: number) => a + b)
    this.handlebars.registerHelper('subtract', (a: number, b: number) => a - b)
    this.handlebars.registerHelper('multiply', (a: number, b: number) => a * b)
    this.handlebars.registerHelper('divide', (a: number, b: number) => a / b)
    this.handlebars.registerHelper('round', (num: number, decimals: number = 0) => {
      return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
    })

    // Date helpers
    this.handlebars.registerHelper('formatDate', (date: Date | string, format: string) => {
      const d = new Date(date)
      if (isNaN(d.getTime())) return ''
      
      // Simple date formatting
      const formats: Record<string, string> = {
        'YYYY-MM-DD': d.toISOString().split('T')[0],
        'MM/DD/YYYY': `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`,
        'full': d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      }
      
      return formats[format] || d.toISOString()
    })

    // JSON helpers
    this.handlebars.registerHelper('json', (obj: any) => {
      return JSON.stringify(obj, null, 2)
    })
    this.handlebars.registerHelper('jsonParse', (str: string) => {
      try {
        return JSON.parse(str)
      } catch {
        return null
      }
    })

    // Custom analysis helpers
    this.handlebars.registerHelper('wordCount', (text: string) => {
      return text ? text.split(/\s+/).filter(w => w.length > 0).length : 0
    })
    this.handlebars.registerHelper('sentenceCount', (text: string) => {
      return text ? text.split(/[.!?]+/).filter(s => s.trim().length > 0).length : 0
    })
    this.handlebars.registerHelper('truncate', (text: string, length: number, suffix: string = '...') => {
      if (!text || text.length <= length) return text
      return text.substring(0, length - suffix.length) + suffix
    })
  }

  /**
   * Compile a template with variables
   */
  compile(template: PromptTemplate, request: AnalysisRequest): string {
    const variables: Record<string, any> = {
      ...request.inputs,
      ...request.options
    }

    // Add default values
    template.variables.forEach(variable => {
      if (variable.default !== undefined && variables[variable.name] === undefined) {
        variables[variable.name] = variable.default
      }
    })

    // Get or compile template
    let compiledTemplate = this.compiledTemplates.get(template.id)
    if (!compiledTemplate) {
      compiledTemplate = this.handlebars.compile(template.template)
      this.compiledTemplates.set(template.id, compiledTemplate)
    }

    // Execute template
    return compiledTemplate(variables)
  }

  /**
   * Compile a raw template string
   */
  compileString(templateStr: string, variables: Record<string, any>): string {
    const compiledTemplate = this.handlebars.compile(templateStr)
    return compiledTemplate(variables)
  }

  /**
   * Register a new template
   */
  registerTemplate(id: string, template: PromptTemplate) {
    this.templates.set(id, template)
    // Clear compiled version to force recompilation
    this.compiledTemplates.delete(id)
  }

  /**
   * Register a helper function
   */
  registerHelper(name: string, helper: Function) {
    this.handlebars.registerHelper(name, helper)
  }

  /**
   * Register a partial template
   */
  registerPartial(name: string, partial: string) {
    this.handlebars.registerPartial(name, partial)
  }

  /**
   * Get a template by ID
   */
  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id)
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category)
  }

  /**
   * Validate template variables
   */
  validateVariables(templateId: string, variables: Record<string, any>): {
    valid: boolean
    errors: string[]
  } {
    const template = this.templates.get(templateId)
    if (!template) {
      return { valid: false, errors: ['Template not found'] }
    }

    const errors: string[] = []

    template.variables.forEach(variable => {
      const value = variables[variable.name]

      // Check required
      if (variable.required && (value === undefined || value === null || value === '')) {
        errors.push(`Variable '${variable.name}' is required`)
      }

      // Check type
      if (value !== undefined && value !== null) {
        const actualType = Array.isArray(value) ? 'array' : typeof value
        if (actualType !== variable.type) {
          errors.push(`Variable '${variable.name}' should be of type '${variable.type}' but got '${actualType}'`)
        }
      }

      // Run custom validation
      if (variable.validation && value !== undefined) {
        try {
          const isValid = variable.validation(value)
          if (!isValid) {
            errors.push(`Variable '${variable.name}' failed custom validation`)
          }
        } catch (error: any) {
          errors.push(`Variable '${variable.name}' validation error: ${error.message}`)
        }
      }
    })

    return { valid: errors.length === 0, errors }
  }

  /**
   * Preview a template with sample data
   */
  previewTemplate(templateId: string, sampleData?: Record<string, any>): string {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error('Template not found')
    }

    // Use example data if available
    const data = sampleData || (template.examples?.[0]?.inputs) || {}

    // Add defaults for missing required variables
    template.variables.forEach(variable => {
      if (variable.required && !(variable.name in data)) {
        switch (variable.type) {
          case 'string':
            data[variable.name] = `[${variable.name}]`
            break
          case 'number':
            data[variable.name] = 0
            break
          case 'boolean':
            data[variable.name] = false
            break
          case 'array':
            data[variable.name] = []
            break
          case 'object':
            data[variable.name] = {}
            break
        }
      }
    })

    return this.compile(template, {
      type: 'preview',
      inputs: data,
      options: {}
    })
  }

  /**
   * Export templates for backup
   */
  exportTemplates(): Record<string, PromptTemplate> {
    const templates: Record<string, PromptTemplate> = {}
    this.templates.forEach((template, id) => {
      templates[id] = template
    })
    return templates
  }

  /**
   * Import templates from backup
   */
  importTemplates(templates: Record<string, PromptTemplate>) {
    Object.entries(templates).forEach(([id, template]) => {
      this.registerTemplate(id, template)
    })
  }

  /**
   * Clear all custom templates
   */
  clearCustomTemplates() {
    // Remove only custom category templates
    const customTemplateIds = Array.from(this.templates.entries())
      .filter(([_, template]) => template.category === 'custom')
      .map(([id]) => id)

    customTemplateIds.forEach(id => {
      this.templates.delete(id)
      this.compiledTemplates.delete(id)
    })
  }
}
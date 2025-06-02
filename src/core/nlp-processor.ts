import * as natural from 'natural'
import Sentiment from 'sentiment'
import nlp from 'compromise'
import { franc } from 'franc'
import type { NLPAnalysisResult, NLPEngine } from '../types'

export interface NLPProcessorConfig {
  enableSentiment?: boolean
  enableLanguageDetection?: boolean
  enableEntityExtraction?: boolean
  enableKeywordExtraction?: boolean
  enablePOSTagging?: boolean
  customNLPEngines?: Record<string, NLPEngine>
}

export class NLPProcessor {
  private config: NLPProcessorConfig
  private sentiment: Sentiment
  private tokenizer: natural.WordTokenizer
  private tfidf: natural.TfIdf
  private customEngines: Map<string, NLPEngine> = new Map()
  private stats = {
    totalProcessed: 0,
    averageProcessingTime: 0,
    languagesDetected: new Map<string, number>()
  }

  constructor(config: NLPProcessorConfig = {}) {
    this.config = {
      enableSentiment: true,
      enableLanguageDetection: true,
      enableEntityExtraction: true,
      enableKeywordExtraction: true,
      enablePOSTagging: false,
      ...config
    }

    // Initialize NLP components
    this.sentiment = new Sentiment()
    this.tokenizer = new natural.WordTokenizer()
    this.tfidf = new natural.TfIdf()

    // Register custom engines
    if (config.customNLPEngines) {
      Object.entries(config.customNLPEngines).forEach(([name, engine]) => {
        this.customEngines.set(name, engine)
      })
    }
  }

  /**
   * Analyze text with all enabled NLP features
   */
  async analyze(text: string): Promise<NLPAnalysisResult> {
    const startTime = Date.now()

    // Run all analyses in parallel where possible
    const [
      sentimentResult,
      language,
      readability,
      keywords,
      entities,
      posData
    ] = await Promise.all([
      this.config.enableSentiment ? this.analyzeSentiment(text) : null,
      this.config.enableLanguageDetection ? this.detectLanguage(text) : 'en',
      this.analyzeReadability(text),
      this.config.enableKeywordExtraction ? this.extractKeywords(text) : [],
      this.config.enableEntityExtraction ? this.extractEntities(text) : [],
      this.config.enablePOSTagging ? this.tagPOS(text) : []
    ])

    // Update stats
    this.stats.totalProcessed++
    const processingTime = Date.now() - startTime
    this.stats.averageProcessingTime = 
      (this.stats.averageProcessingTime * (this.stats.totalProcessed - 1) + processingTime) / 
      this.stats.totalProcessed

    if (language) {
      this.stats.languagesDetected.set(
        language, 
        (this.stats.languagesDetected.get(language) || 0) + 1
      )
    }

    return {
      sentiment: sentimentResult || {
        score: 0,
        comparative: 0,
        calculation: []
      },
      language: language || 'unknown',
      readability,
      keywords,
      entities,
      pos: posData
    }
  }

  /**
   * Analyze sentiment using multiple approaches
   */
  private async analyzeSentiment(text: string): Promise<NLPAnalysisResult['sentiment']> {
    // Use sentiment library
    const result = this.sentiment.analyze(text)

    // Extract positive and negative words with scores
    const calculation = [
      ...result.positive.map(word => ({ word, score: 1 })),
      ...result.negative.map(word => ({ word, score: -1 }))
    ]

    return {
      score: result.score,
      comparative: result.comparative,
      calculation
    }
  }

  /**
   * Detect language using franc
   */
  private async detectLanguage(text: string): Promise<string> {
    const detected = franc(text)
    
    // Convert ISO 639-3 to ISO 639-1 for common languages
    const languageMap: Record<string, string> = {
      'eng': 'en',
      'spa': 'es',
      'fra': 'fr',
      'deu': 'de',
      'ita': 'it',
      'por': 'pt',
      'rus': 'ru',
      'jpn': 'ja',
      'kor': 'ko',
      'zho': 'zh',
      'ara': 'ar',
      'hin': 'hi',
      'vie': 'vi'
    }

    return languageMap[detected] || detected
  }

  /**
   * Analyze readability using various metrics
   */
  private async analyzeReadability(text: string): Promise<NLPAnalysisResult['readability']> {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = text.split(/\s+/).filter(w => w.length > 0)
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0)

    // Calculate readability metrics
    const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0
    const avgSyllablesPerWord = words.length > 0 ? syllables / words.length : 0

    // Flesch Reading Ease
    const flesch = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord

    // Flesch-Kincaid Grade Level
    const fleschKincaid = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59

    // Gunning Fog Index
    const complexWords = words.filter(word => this.countSyllables(word) > 2).length
    const fogIndex = 0.4 * (avgWordsPerSentence + 100 * (complexWords / words.length))

    // SMOG Index
    const smog = Math.sqrt(complexWords * (30 / sentences.length)) + 3.1291

    // Automated Readability Index
    const avgCharsPerWord = words.reduce((sum, word) => sum + word.length, 0) / words.length
    const ari = 4.71 * avgCharsPerWord + 0.5 * avgWordsPerSentence - 21.43

    // Coleman-Liau Index
    const lettersPerHundredWords = (avgCharsPerWord * 100)
    const sentencesPerHundredWords = sentences.length / words.length * 100
    const colemanLiau = 0.0588 * lettersPerHundredWords - 0.296 * sentencesPerHundredWords - 15.8

    // Determine overall grade and difficulty
    const averageGrade = (fleschKincaid + fogIndex + smog + ari + colemanLiau) / 5
    const score = Math.max(0, Math.min(100, flesch))
    
    let difficulty: 'simple' | 'moderate' | 'complex' = 'moderate'
    if (averageGrade < 6) difficulty = 'simple'
    else if (averageGrade > 12) difficulty = 'complex'

    return {
      grade: Math.round(averageGrade * 10) / 10,
      score: Math.round(score),
      difficulty,
      metrics: {
        flesch: Math.round(flesch * 10) / 10,
        fleschKincaid: Math.round(fleschKincaid * 10) / 10,
        gunningFog: Math.round(fogIndex * 10) / 10,
        smog: Math.round(smog * 10) / 10,
        ari: Math.round(ari * 10) / 10,
        colemanLiau: Math.round(colemanLiau * 10) / 10
      }
    }
  }

  /**
   * Extract keywords using TF-IDF
   */
  private async extractKeywords(text: string): Promise<NLPAnalysisResult['keywords']> {
    // Add document to TF-IDF
    this.tfidf = new natural.TfIdf()
    this.tfidf.addDocument(text)

    const keywords: Array<{
      word: string
      count: number
      relevance: number
      positions?: number[]
    }> = []

    // Get terms with their TF-IDF scores
    const terms = new Map<string, { tfidf: number; positions: number[] }>()
    
    this.tfidf.listTerms(0).forEach(item => {
      if (item.term.length > 2 && !this.isStopWord(item.term)) {
        terms.set(item.term, {
          tfidf: item.tfidf,
          positions: this.findWordPositions(text, item.term)
        })
      }
    })

    // Count word frequencies
    const wordCounts = new Map<string, number>()
    const words = this.tokenizer.tokenize(text.toLowerCase())
    words.forEach(word => {
      if (word.length > 2 && !this.isStopWord(word)) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
      }
    })

    // Combine TF-IDF with frequency
    terms.forEach((data, term) => {
      const count = wordCounts.get(term) || 1
      keywords.push({
        word: term,
        count,
        relevance: Math.min(1, data.tfidf / 10), // Normalize relevance
        positions: data.positions
      })
    })

    // Sort by relevance and return top keywords
    return keywords
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 20)
  }

  /**
   * Extract named entities using compromise
   */
  private async extractEntities(text: string): Promise<NLPAnalysisResult['entities']> {
    const doc = nlp(text)
    const entities: NLPAnalysisResult['entities'] = []

    // Extract people
    doc.people().forEach(person => {
      entities.push({
        text: person.text(),
        type: 'person',
        confidence: 0.8,
        positions: [person.offset().start]
      })
    })

    // Extract places
    doc.places().forEach(place => {
      entities.push({
        text: place.text(),
        type: 'place',
        confidence: 0.8,
        positions: [place.offset().start]
      })
    })

    // Extract organizations
    doc.organizations().forEach(org => {
      entities.push({
        text: org.text(),
        type: 'organization',
        confidence: 0.8,
        positions: [org.offset().start]
      })
    })

    // Extract dates
    doc.dates().forEach(date => {
      entities.push({
        text: date.text(),
        type: 'date',
        confidence: 0.9,
        positions: [date.offset().start]
      })
    })

    // Remove duplicates
    const seen = new Set<string>()
    return entities.filter(entity => {
      const key = `${entity.text}-${entity.type}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  /**
   * Tag parts of speech
   */
  private async tagPOS(text: string): Promise<NLPAnalysisResult['pos']> {
    if (!this.config.enablePOSTagging) return []

    const words = this.tokenizer.tokenize(text)
    const tagged = natural.BrillPOSTagger.tag(words)

    return tagged.map(([word, tag]) => ({ word, tag }))
  }

  /**
   * Count syllables in a word (approximation)
   */
  private countSyllables(word: string): number {
    word = word.toLowerCase()
    let count = 0
    let previousWasVowel = false

    for (let i = 0; i < word.length; i++) {
      const isVowel = /[aeiouy]/.test(word[i])
      if (isVowel && !previousWasVowel) {
        count++
      }
      previousWasVowel = isVowel
    }

    // Adjust for silent e
    if (word.endsWith('e')) {
      count--
    }

    // Ensure at least one syllable
    return Math.max(1, count)
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
      'in', 'with', 'to', 'for', 'of', 'as', 'by', 'that', 'this',
      'it', 'from', 'be', 'are', 'was', 'were', 'been', 'have', 'has',
      'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could',
      'may', 'might', 'must', 'can', 'could', 'shall', 'should', 'ought'
    ])

    return stopWords.has(word.toLowerCase())
  }

  /**
   * Find positions of a word in text
   */
  private findWordPositions(text: string, word: string): number[] {
    const positions: number[] = []
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    let match

    while ((match = regex.exec(text)) !== null) {
      positions.push(match.index)
    }

    return positions
  }

  /**
   * Process text with custom NLP engine
   */
  async processWithCustomEngine(engineName: string, text: string): Promise<any> {
    const engine = this.customEngines.get(engineName)
    if (!engine) {
      throw new Error(`Custom NLP engine not found: ${engineName}`)
    }

    if (!engine.isAvailable()) {
      throw new Error(`Custom NLP engine not available: ${engineName}`)
    }

    return engine.process(text)
  }

  /**
   * Get available NLP features
   */
  getAvailableFeatures(): string[] {
    const features: string[] = []

    if (this.config.enableSentiment) features.push('sentiment')
    if (this.config.enableLanguageDetection) features.push('language')
    if (this.config.enableEntityExtraction) features.push('entities')
    if (this.config.enableKeywordExtraction) features.push('keywords')
    if (this.config.enablePOSTagging) features.push('pos')
    features.push('readability') // Always available

    // Add custom engines
    this.customEngines.forEach((_, name) => {
      features.push(`custom:${name}`)
    })

    return features
  }

  /**
   * Check if NLP processor is available
   */
  isAvailable(): boolean {
    try {
      // Test basic functionality
      this.tokenizer.tokenize('test')
      return true
    } catch {
      return false
    }
  }

  /**
   * Get NLP statistics
   */
  getStats() {
    const topLanguages = Array.from(this.stats.languagesDetected.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([lang, count]) => ({ language: lang, count }))

    return {
      totalProcessed: this.stats.totalProcessed,
      averageProcessingTime: Math.round(this.stats.averageProcessingTime),
      topLanguages,
      availableFeatures: this.getAvailableFeatures(),
      customEngines: Array.from(this.customEngines.keys())
    }
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalProcessed: 0,
      averageProcessingTime: 0,
      languagesDetected: new Map()
    }
  }
}
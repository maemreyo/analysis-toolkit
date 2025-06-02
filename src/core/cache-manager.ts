import { LRUCache } from 'lru-cache'
import crypto from 'crypto'
import type { AnalysisRequest } from '../types'

export interface CacheConfig {
  strategy?: 'exact' | 'semantic' | 'fuzzy'
  ttl?: number
  maxSize?: number
  similarityThreshold?: number
  invalidateOn?: string[]
}

interface CacheEntry {
  key: string
  value: any
  timestamp: number
  hits: number
  metadata?: Record<string, any>
  embedding?: number[]
}

export class CacheManager {
  private cache: LRUCache<string, CacheEntry>
  private config: Required<CacheConfig>
  private embeddings: Map<string, number[]> = new Map()
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    errorRate: 0,
    errors: 0,
    total: 0
  }

  constructor(config: CacheConfig = {}) {
    this.config = {
      strategy: config.strategy || 'exact',
      ttl: config.ttl || 3600000, // 1 hour default
      maxSize: config.maxSize || 100, // 100MB default
      similarityThreshold: config.similarityThreshold || 0.85,
      invalidateOn: config.invalidateOn || []
    }

    // Convert MB to bytes
    const maxSizeBytes = this.config.maxSize * 1024 * 1024

    this.cache = new LRUCache<string, CacheEntry>({
      max: 1000, // Max number of items
      maxSize: maxSizeBytes,
      sizeCalculation: (entry) => {
        // Estimate size of cached entry
        return JSON.stringify(entry).length
      },
      ttl: this.config.ttl,
      updateAgeOnGet: true,
      updateAgeOnHas: false,
      dispose: () => {
        this.stats.evictions++
      }
    })
  }

  /**
   * Generate cache key based on request
   */
  generateKey(request: AnalysisRequest): string {
    const keyData = {
      type: request.type,
      inputs: this.normalizeInputs(request.inputs),
      options: this.normalizeOptions(request.options)
    }

    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex')

    return `analysis:${request.type}:${hash}`
  }

  /**
   * Get value from cache
   */
  async get(key: string): Promise<any | null> {
    this.stats.total++

    try {
      if (this.config.strategy === 'exact') {
        return this.getExact(key)
      } else if (this.config.strategy === 'semantic') {
        return this.getSemantic(key)
      } else if (this.config.strategy === 'fuzzy') {
        return this.getFuzzy(key)
      }
    } catch (error) {
      this.stats.errors++
      this.stats.errorRate = this.stats.errors / this.stats.total
      return null
    }

    return null
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, metadata?: Record<string, any>): Promise<void> {
    try {
      const entry: CacheEntry = {
        key,
        value,
        timestamp: Date.now(),
        hits: 0,
        metadata
      }

      // Generate embedding for semantic caching
      if (this.config.strategy === 'semantic') {
        entry.embedding = await this.generateEmbedding(key)
        this.embeddings.set(key, entry.embedding)
      }

      this.cache.set(key, entry)
    } catch (error) {
      this.stats.errors++
      this.stats.errorRate = this.stats.errors / this.stats.total
    }
  }

  /**
   * Exact match cache retrieval
   */
  private getExact(key: string): any | null {
    const entry = this.cache.get(key)

    if (entry) {
      this.stats.hits++
      entry.hits++
      return entry.value
    }

    this.stats.misses++
    return null
  }

  /**
   * Semantic similarity cache retrieval
   */
  private async getSemantic(key: string): Promise<any | null> {
    // First try exact match
    const exactMatch = this.getExact(key)
    if (exactMatch) return exactMatch

    // Generate embedding for query
    const queryEmbedding = await this.generateEmbedding(key)

    // Find most similar cached entry
    let bestMatch: { key: string; similarity: number } | null = null
    let bestSimilarity = 0

    for (const [cachedKey, cachedEmbedding] of this.embeddings) {
      const similarity = this.cosineSimilarity(queryEmbedding, cachedEmbedding)
      
      if (similarity > bestSimilarity && similarity >= this.config.similarityThreshold) {
        bestSimilarity = similarity
        bestMatch = { key: cachedKey, similarity }
      }
    }

    if (bestMatch) {
      const entry = this.cache.get(bestMatch.key)
      if (entry) {
        this.stats.hits++
        entry.hits++
        return entry.value
      }
    }

    this.stats.misses++
    return null
  }

  /**
   * Fuzzy match cache retrieval
   */
  private getFuzzy(key: string): any | null {
    // First try exact match
    const exactMatch = this.getExact(key)
    if (exactMatch) return exactMatch

    // Try to find similar keys
    const allKeys = Array.from(this.cache.keys())
    const keyParts = key.split(':')
    
    for (const cachedKey of allKeys) {
      const cachedKeyParts = cachedKey.split(':')
      
      // Check if type matches
      if (keyParts[1] === cachedKeyParts[1]) {
        // Check hash similarity (simple prefix match)
        const hashSimilarity = this.getHashSimilarity(keyParts[2], cachedKeyParts[2])
        
        if (hashSimilarity >= this.config.similarityThreshold) {
          const entry = this.cache.get(cachedKey)
          if (entry) {
            this.stats.hits++
            entry.hits++
            return entry.value
          }
        }
      }
    }

    this.stats.misses++
    return null
  }

  /**
   * Generate embedding for semantic caching (simplified)
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Simple character-based embedding for demonstration
    // In production, use proper text embeddings from AI provider
    const chars = text.slice(0, 100).split('')
    const embedding = new Array(128).fill(0)
    
    chars.forEach((char, i) => {
      const index = i % embedding.length
      embedding[index] += char.charCodeAt(0) / 255
    })

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    return embedding.map(val => val / magnitude)
  }

  /**
   * Calculate cosine similarity between embeddings
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
    }

    return dotProduct // Assuming normalized vectors
  }

  /**
   * Get hash similarity (simple prefix match)
   */
  private getHashSimilarity(hash1: string, hash2: string): number {
    let matchingChars = 0
    const minLength = Math.min(hash1.length, hash2.length)

    for (let i = 0; i < minLength; i++) {
      if (hash1[i] === hash2[i]) {
        matchingChars++
      } else {
        break
      }
    }

    return matchingChars / minLength
  }

  /**
   * Normalize inputs for consistent caching
   */
  private normalizeInputs(inputs: Record<string, any>): Record<string, any> {
    const normalized: Record<string, any> = {}
    
    // Sort keys
    const sortedKeys = Object.keys(inputs).sort()
    
    sortedKeys.forEach(key => {
      const value = inputs[key]
      
      // Normalize strings (trim, lowercase for certain fields)
      if (typeof value === 'string') {
        normalized[key] = value.trim()
      }
      // Sort arrays for consistent hashing
      else if (Array.isArray(value)) {
        normalized[key] = [...value].sort()
      }
      // Recursively normalize objects
      else if (typeof value === 'object' && value !== null) {
        normalized[key] = this.normalizeInputs(value)
      }
      else {
        normalized[key] = value
      }
    })

    return normalized
  }

  /**
   * Normalize options for consistent caching
   */
  private normalizeOptions(options?: Record<string, any>): Record<string, any> {
    if (!options) return {}
    
    // Remove volatile options that shouldn't affect caching
    const { customPrompt, ...cacheableOptions } = options
    
    return this.normalizeInputs(cacheableOptions)
  }

  /**
   * Invalidate cache entries
   */
  invalidate(pattern?: string) {
    if (!pattern) {
      // Clear all
      this.cache.clear()
      this.embeddings.clear()
      return
    }

    // Invalidate matching keys
    const keys = Array.from(this.cache.keys())
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key)
        this.embeddings.delete(key)
      }
    })
  }

  /**
   * Invalidate based on event
   */
  invalidateOnEvent(event: string) {
    if (this.config.invalidateOn.includes(event)) {
      this.invalidate()
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.total > 0
      ? this.stats.hits / this.stats.total
      : 0

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      evictions: this.stats.evictions,
      size: this.cache.size,
      maxSize: this.cache.maxSize,
      errorRate: Math.round(this.stats.errorRate * 100) / 100,
      strategy: this.config.strategy
    }
  }

  /**
   * Get cache entries info
   */
  getEntries(): Array<{
    key: string
    hits: number
    age: number
    size: number
  }> {
    const entries: Array<{
      key: string
      hits: number
      age: number
      size: number
    }> = []

    this.cache.forEach((entry, key) => {
      entries.push({
        key,
        hits: entry.hits,
        age: Date.now() - entry.timestamp,
        size: JSON.stringify(entry).length
      })
    })

    return entries.sort((a, b) => b.hits - a.hits)
  }

  /**
   * Optimize cache by removing low-value entries
   */
  optimize() {
    const entries = this.getEntries()
    const averageHits = entries.reduce((sum, e) => sum + e.hits, 0) / entries.length

    // Remove entries with below-average hits and old age
    entries.forEach(entry => {
      if (entry.hits < averageHits * 0.5 && entry.age > this.config.ttl * 0.5) {
        this.cache.delete(entry.key)
        this.embeddings.delete(entry.key)
      }
    })
  }

  /**
   * Export cache for backup
   */
  export(): Array<{
    key: string
    value: any
    metadata?: Record<string, any>
  }> {
    const data: Array<any> = []

    this.cache.forEach((entry, key) => {
      data.push({
        key,
        value: entry.value,
        metadata: entry.metadata
      })
    })

    return data
  }

  /**
   * Import cache from backup
   */
  async import(data: Array<{
    key: string
    value: any
    metadata?: Record<string, any>
  }>) {
    for (const item of data) {
      await this.set(item.key, item.value, item.metadata)
    }
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear()
    this.embeddings.clear()
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      errorRate: 0,
      errors: 0,
      total: 0
    }
  }
}
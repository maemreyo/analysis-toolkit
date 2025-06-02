import * as natural from 'natural'

/**
 * Extract keywords from text using TF-IDF
 */
export function extractKeywords(
  text: string,
  options: {
    maxKeywords?: number
    minLength?: number
    stopWords?: string[]
  } = {}
): Array<{ word: string; score: number }> {
  const {
    maxKeywords = 10,
    minLength = 3,
    stopWords = defaultStopWords
  } = options

  const tfidf = new natural.TfIdf()
  tfidf.addDocument(text)

  const keywords: Array<{ word: string; score: number }> = []

  tfidf.listTerms(0).forEach((item: any) => {
    if (
      item.term.length >= minLength &&
      !stopWords.includes(item.term.toLowerCase())
    ) {
      keywords.push({
        word: item.term,
        score: item.tfidf
      })
    }
  })

  return keywords
    .sort((a, b) => b.score - a.score)
    .slice(0, maxKeywords)
}

/**
 * Calculate readability metrics
 */
export function calculateReadability(text: string): {
  fleschScore: number
  gradeLevel: number
  readingTime: number
} {
  const sentences = splitIntoSentences(text)
  const words = tokenizeText(text)
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0)

  const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0
  const avgSyllablesPerWord = words.length > 0 ? syllables / words.length : 0

  // Flesch Reading Ease
  const fleschScore = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord

  // Flesch-Kincaid Grade Level
  const gradeLevel = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59

  // Reading time (avg 200 words per minute)
  const readingTime = Math.ceil(words.length / 200)

  return {
    fleschScore: Math.max(0, Math.min(100, fleschScore)),
    gradeLevel: Math.max(0, gradeLevel),
    readingTime
  }
}

/**
 * Split text into sentences
 */
export function splitIntoSentences(text: string): string[] {
  // Use natural's sentence tokenizer
  const sentenceTokenizer = new natural.SentenceTokenizer()
  return sentenceTokenizer.tokenize(text)
}

/**
 * Tokenize text into words
 */
export function tokenizeText(
  text: string,
  options: {
    lowercase?: boolean
    removeNumbers?: boolean
    removePunctuation?: boolean
  } = {}
): string[] {
  const {
    lowercase = true,
    removeNumbers = false,
    removePunctuation = true
  } = options

  let processedText = text
  
  if (lowercase) {
    processedText = processedText.toLowerCase()
  }

  const tokenizer = new natural.WordTokenizer()
  let tokens = tokenizer.tokenize(processedText)

  if (removeNumbers) {
    tokens = tokens.filter(token => !/^\d+$/.test(token))
  }

  if (removePunctuation) {
    tokens = tokens.filter(token => /\w/.test(token))
  }

  return tokens
}

/**
 * Normalize text for consistent processing
 */
export function normalizeText(
  text: string,
  options: {
    removeUrls?: boolean
    removeEmails?: boolean
    removeExtraSpaces?: boolean
    removeDiacritics?: boolean
    expandContractions?: boolean
  } = {}
): string {
  const {
    removeUrls = true,
    removeEmails = true,
    removeExtraSpaces = true,
    removeDiacritics = false,
    expandContractions = true
  } = options

  let normalized = text

  // Remove URLs
  if (removeUrls) {
    normalized = normalized.replace(/https?:\/\/[^\s]+/g, '')
  }

  // Remove emails
  if (removeEmails) {
    normalized = normalized.replace(/\S+@\S+\.\S+/g, '')
  }

  // Expand contractions
  if (expandContractions) {
    normalized = expandContractions(normalized)
  }

  // Remove diacritics
  if (removeDiacritics) {
    normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }

  // Remove extra spaces
  if (removeExtraSpaces) {
    normalized = normalized.replace(/\s+/g, ' ').trim()
  }

  return normalized
}

/**
 * Count syllables in a word
 */
export function countSyllables(word: string): number {
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

  // Adjust for common patterns
  if (word.endsWith('le') && word.length > 2) {
    count++
  }

  // Ensure at least one syllable
  return Math.max(1, count)
}

/**
 * Extract n-grams from text
 */
export function extractNGrams(
  text: string,
  n: number,
  options: {
    caseSensitive?: boolean
    padding?: boolean
  } = {}
): string[] {
  const { caseSensitive = false, padding = false } = options
  
  const processedText = caseSensitive ? text : text.toLowerCase()
  const tokens = tokenizeText(processedText, { lowercase: !caseSensitive })
  
  if (padding) {
    // Add padding tokens
    const paddingToken = '<PAD>'
    for (let i = 0; i < n - 1; i++) {
      tokens.unshift(paddingToken)
      tokens.push(paddingToken)
    }
  }
  
  const ngrams: string[] = []
  
  for (let i = 0; i <= tokens.length - n; i++) {
    const ngram = tokens.slice(i, i + n).join(' ')
    ngrams.push(ngram)
  }
  
  return ngrams
}

/**
 * Calculate text similarity using Jaccard similarity
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  const tokens1 = new Set(tokenizeText(text1))
  const tokens2 = new Set(tokenizeText(text2))
  
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)))
  const union = new Set([...tokens1, ...tokens2])
  
  return intersection.size / union.size
}

/**
 * Extract text statistics
 */
export function getTextStatistics(text: string): {
  characterCount: number
  wordCount: number
  sentenceCount: number
  paragraphCount: number
  averageWordLength: number
  averageSentenceLength: number
  uniqueWords: number
  lexicalDiversity: number
} {
  const words = tokenizeText(text)
  const sentences = splitIntoSentences(text)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0)
  const uniqueWords = new Set(words.map(w => w.toLowerCase()))
  
  const totalWordLength = words.reduce((sum, word) => sum + word.length, 0)
  
  return {
    characterCount: text.length,
    wordCount: words.length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    averageWordLength: words.length > 0 ? totalWordLength / words.length : 0,
    averageSentenceLength: sentences.length > 0 ? words.length / sentences.length : 0,
    uniqueWords: uniqueWords.size,
    lexicalDiversity: words.length > 0 ? uniqueWords.size / words.length : 0
  }
}

/**
 * Chunk text into smaller pieces
 */
export function chunkText(
  text: string,
  options: {
    chunkSize?: number
    chunkOverlap?: number
    separators?: string[]
    preserveSentences?: boolean
  } = {}
): string[] {
  const {
    chunkSize = 1000,
    chunkOverlap = 200,
    separators = ['\n\n', '\n', '. ', ', '],
    preserveSentences = true
  } = options

  if (preserveSentences) {
    const sentences = splitIntoSentences(text)
    const chunks: string[] = []
    let currentChunk = ''
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize && currentChunk) {
        chunks.push(currentChunk.trim())
        
        // Add overlap
        if (chunkOverlap > 0) {
          const overlapText = currentChunk.slice(-chunkOverlap)
          currentChunk = overlapText + ' ' + sentence
        } else {
          currentChunk = sentence
        }
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim())
    }
    
    return chunks
  }
  
  // Simple character-based chunking
  const chunks: string[] = []
  let start = 0
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    chunks.push(text.substring(start, end))
    start = end - chunkOverlap
  }
  
  return chunks
}

/**
 * Expand contractions in text
 */
function expandContractions(text: string): string {
  const contractions: Record<string, string> = {
    "can't": "cannot",
    "won't": "will not",
    "n't": " not",
    "'re": " are",
    "'ve": " have",
    "'ll": " will",
    "'d": " would",
    "'m": " am",
    "let's": "let us",
    "it's": "it is",
    "what's": "what is",
    "that's": "that is",
    "there's": "there is",
    "here's": "here is",
    "where's": "where is",
    "who's": "who is",
    "how's": "how is",
    "she's": "she is",
    "he's": "he is"
  }
  
  let expanded = text
  Object.entries(contractions).forEach(([contraction, expansion]) => {
    const regex = new RegExp(contraction, 'gi')
    expanded = expanded.replace(regex, expansion)
  })
  
  return expanded
}

// Default stop words
const defaultStopWords = [
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to',
  'was', 'will', 'with', 'the', 'this', 'these', 'they', 'those', 'which',
  'who', 'whom', 'whose', 'what', 'where', 'when', 'why', 'how', 'all',
  'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  'can', 'could', 'may', 'might', 'must', 'shall', 'should', 'would', 'do',
  'does', 'did', 'have', 'had', 'having', 'i', 'me', 'my', 'myself', 'we',
  'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves'
]
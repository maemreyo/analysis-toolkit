import type { PromptTemplate } from '../types'

export const promptTemplates: Record<string, PromptTemplate> = {
  contentAnalysis: {
    id: 'content-analysis',
    name: 'Content Analysis',
    description: 'Comprehensive analysis of text content',
    category: 'content',
    template: `Analyze the following content and provide a comprehensive analysis:

Content: {{content}}

Please analyze the following aspects:
1. Main Topic and Theme
2. Key Points and Arguments
3. Writing Style and Tone
4. Target Audience
5. Strengths and Weaknesses
6. Overall Quality Score (1-10)

{{#if includeRecommendations}}
Also provide specific recommendations for improvement.
{{/if}}

Format your response as a structured analysis with clear sections.`,
    variables: [
      {
        name: 'content',
        type: 'string',
        required: true,
        description: 'The content to analyze'
      },
      {
        name: 'includeRecommendations',
        type: 'boolean',
        required: false,
        default: true,
        description: 'Whether to include improvement recommendations'
      }
    ]
  },

  sentimentAnalysis: {
    id: 'sentiment-analysis',
    name: 'Sentiment Analysis',
    description: 'Analyze emotional tone and sentiment',
    category: 'sentiment',
    template: `Perform a detailed sentiment analysis on the following text:

Text: {{text}}

Analyze:
1. Overall Sentiment (Positive/Negative/Neutral) with confidence score
2. Emotional Tone (Professional/Casual/Formal/Informal/etc.)
3. Detected Emotions (Joy, Anger, Sadness, Fear, Surprise, etc.) with intensities
4. Sentiment Progression (if text is long enough)
5. Key Phrases Contributing to Sentiment

{{#if contextualFactors}}
Consider these contextual factors: {{contextualFactors}}
{{/if}}

Provide specific examples from the text to support your analysis.`,
    variables: [
      {
        name: 'text',
        type: 'string',
        required: true,
        description: 'Text to analyze for sentiment'
      },
      {
        name: 'contextualFactors',
        type: 'string',
        required: false,
        description: 'Additional context to consider'
      }
    ]
  },

  seoAnalysis: {
    id: 'seo-analysis',
    name: 'SEO Analysis',
    description: 'Search engine optimization analysis',
    category: 'seo',
    template: `Perform an SEO analysis for the following content:

URL: {{url}}
Title: {{title}}
Meta Description: {{metaDescription}}
Content: {{content}}

Analyze:
1. Title Tag Optimization (length, keywords, appeal)
2. Meta Description Quality
3. Keyword Usage and Density
4. Content Structure (headings, paragraphs)
5. Readability Score
6. Internal/External Link Analysis
7. Image Alt Text Usage
8. Schema Markup Recommendations

Target Keywords: {{#if keywords}}{{keywords}}{{else}}Identify from content{{/if}}

Provide specific recommendations with priority levels.`,
    variables: [
      {
        name: 'url',
        type: 'string',
        required: false,
        description: 'Page URL'
      },
      {
        name: 'title',
        type: 'string',
        required: true,
        description: 'Page title'
      },
      {
        name: 'metaDescription',
        type: 'string',
        required: false,
        description: 'Meta description'
      },
      {
        name: 'content',
        type: 'string',
        required: true,
        description: 'Page content'
      },
      {
        name: 'keywords',
        type: 'array',
        required: false,
        description: 'Target keywords'
      }
    ]
  },

  readabilityAnalysis: {
    id: 'readability-analysis',
    name: 'Readability Analysis',
    description: 'Assess content readability and accessibility',
    category: 'readability',
    template: `Analyze the readability of the following text:

Text: {{text}}

Provide analysis on:
1. Reading Level (Grade level)
2. Sentence Complexity
   - Average sentence length
   - Complex sentence ratio
3. Vocabulary Difficulty
   - Common vs. uncommon words
   - Technical jargon usage
4. Paragraph Structure
5. Clarity and Coherence
6. Accessibility Issues

Target Audience: {{#if targetAudience}}{{targetAudience}}{{else}}General public{{/if}}

Suggest specific improvements to enhance readability.`,
    variables: [
      {
        name: 'text',
        type: 'string',
        required: true,
        description: 'Text to analyze'
      },
      {
        name: 'targetAudience',
        type: 'string',
        required: false,
        description: 'Intended audience'
      }
    ]
  },

  factCheckAnalysis: {
    id: 'fact-check-analysis',
    name: 'Fact Check Analysis',
    description: 'Identify and verify factual claims',
    category: 'fact-check',
    template: `Identify and analyze factual claims in the following content:

Content: {{content}}

For each claim:
1. Extract the specific claim
2. Categorize claim type (statistical, historical, scientific, etc.)
3. Assess verifiability (can be fact-checked vs. opinion)
4. Identify what evidence would be needed to verify
5. Flag potential red flags or suspicious claims

{{#if checkSources}}
Also evaluate the credibility of any cited sources.
{{/if}}

Focus on claims that are:
- Specific and measurable
- Potentially misleading if false
- Central to the argument

Do not attempt to verify the claims, only identify and categorize them.`,
    variables: [
      {
        name: 'content',
        type: 'string',
        required: true,
        description: 'Content to analyze for claims'
      },
      {
        name: 'checkSources',
        type: 'boolean',
        required: false,
        default: true,
        description: 'Whether to evaluate source credibility'
      }
    ]
  },

  biasAnalysis: {
    id: 'bias-analysis',
    name: 'Bias Analysis',
    description: 'Detect potential biases in content',
    category: 'bias',
    template: `Analyze the following content for potential biases:

Content: {{content}}
{{#if author}}Author: {{author}}{{/if}}
{{#if source}}Source: {{source}}{{/if}}

Examine for:
1. Political Bias (left/center/right leaning)
2. Confirmation Bias Indicators
3. Selection Bias in Examples/Data
4. Language Bias (loaded words, framing)
5. Cultural or Regional Bias
6. Gender, Race, or Other Demographic Bias
7. Commercial or Financial Bias

For each detected bias:
- Provide specific examples
- Rate severity (minor/moderate/significant)
- Suggest neutral alternatives

Note: Aim for objective analysis without introducing your own biases.`,
    variables: [
      {
        name: 'content',
        type: 'string',
        required: true,
        description: 'Content to analyze'
      },
      {
        name: 'author',
        type: 'string',
        required: false,
        description: 'Content author'
      },
      {
        name: 'source',
        type: 'string',
        required: false,
        description: 'Content source'
      }
    ]
  },

  competitorAnalysis: {
    id: 'competitor-analysis',
    name: 'Competitor Content Analysis',
    description: 'Compare content against competitors',
    category: 'content',
    template: `Compare and analyze the following content pieces:

Your Content:
{{yourContent}}

Competitor Content:
{{competitorContent}}

Analyze:
1. Content Depth and Coverage
2. Unique Value Propositions
3. Writing Quality and Style
4. SEO Optimization Comparison
5. Visual and Media Usage
6. Call-to-Action Effectiveness
7. Audience Engagement Potential

Provide:
- Strengths of each piece
- Areas where competitor excels
- Opportunities for improvement
- Specific recommendations to outperform`,
    variables: [
      {
        name: 'yourContent',
        type: 'string',
        required: true,
        description: 'Your content'
      },
      {
        name: 'competitorContent',
        type: 'string',
        required: true,
        description: 'Competitor content'
      }
    ]
  },

  customAnalysis: {
    id: 'custom-analysis',
    name: 'Custom Analysis',
    description: 'User-defined analysis',
    category: 'custom',
    template: `{{customPrompt}}

Input: {{input}}

{{#if additionalInstructions}}
Additional Instructions: {{additionalInstructions}}
{{/if}}`,
    variables: [
      {
        name: 'customPrompt',
        type: 'string',
        required: true,
        description: 'Custom analysis prompt'
      },
      {
        name: 'input',
        type: 'string',
        required: true,
        description: 'Input to analyze'
      },
      {
        name: 'additionalInstructions',
        type: 'string',
        required: false,
        description: 'Additional instructions'
      }
    ]
  },

  // Templates for enhanced analysis features
  comprehensiveAnalysis: {
    id: 'comprehensive-analysis',
    name: 'Comprehensive Analysis',
    description: 'Multi-dimensional analysis with AI and NLP',
    category: 'content',
    template: `Perform a comprehensive analysis of the following content:

Content: {{content}}

Analysis Requirements:
1. Content Analysis
   - Main themes and topics
   - Key arguments and supporting evidence
   - Logical flow and structure
   - Writing style and voice

2. Quality Assessment
   - Clarity and coherence (1-10)
   - Depth of analysis (1-10)
   - Factual accuracy concerns
   - Originality and insights

3. Audience Analysis
   - Target audience identification
   - Appropriateness for audience
   - Engagement potential
   - Call-to-action effectiveness

4. Technical Analysis
   - Grammar and spelling issues
   - Sentence variety
   - Vocabulary level
   - Technical accuracy (if applicable)

5. Strategic Insights
   - Strengths to leverage
   - Weaknesses to address
   - Opportunities for enhancement
   - Competitive positioning

{{#if customAnalysis}}
6. Custom Analysis Points:
{{#each customAnalysis}}
   - {{this}}
{{/each}}
{{/if}}

Provide a detailed, structured response with specific examples and actionable recommendations.`,
    variables: [
      {
        name: 'content',
        type: 'string',
        required: true,
        description: 'Content to analyze'
      },
      {
        name: 'customAnalysis',
        type: 'array',
        required: false,
        description: 'Additional analysis points'
      }
    ]
  },

  // Insight Buddy compatible templates
  summarize: {
    id: 'summarize',
    name: 'Tóm tắt nội dung',
    description: 'Tạo tóm tắt ngắn gọn cho đoạn văn',
    category: 'summary',
    template: `Bạn là một trợ lý AI chuyên tóm tắt nội dung. Hãy tóm tắt đoạn văn sau một cách ngắn gọn và chính xác.

{{#if context}}
Ngữ cảnh: {{context}}
{{/if}}

Đoạn văn cần tóm tắt:
"""
{{text}}
"""

Yêu cầu:
1. Tóm tắt trong 2-3 câu chính
2. Giữ lại ý chính quan trọng nhất
3. Liệt kê 3-5 điểm chính (bullet points)
4. Ngôn ngữ rõ ràng, dễ hiểu

Định dạng output:
{
  "summary": "Tóm tắt ngắn gọn ở đây",
  "keyPoints": [
    "Điểm chính 1",
    "Điểm chính 2",
    "Điểm chính 3"
  ],
  "confidence": 0.95
}`,
    variables: [
      { name: 'text', type: 'string', required: true },
      { name: 'context', type: 'string', required: false }
    ]
  },

  explain: {
    id: 'explain',
    name: 'Giải thích thuật ngữ',
    description: 'Giải thích các thuật ngữ khó hiểu',
    category: 'explanation',
    template: `Bạn là một chuyên gia giải thích thuật ngữ. Hãy tìm và giải thích các thuật ngữ khó hiểu trong đoạn văn sau.

{{#if context}}
Ngữ cảnh: {{context}}
{{/if}}

Đoạn văn:
"""
{{text}}
"""

Yêu cầu:
1. Xác định các thuật ngữ chuyên môn, từ khó, hoặc khái niệm phức tạp
2. Giải thích mỗi thuật ngữ một cách đơn giản, dễ hiểu
3. Đưa ra ví dụ minh họa nếu cần
4. Giải thích phù hợp với người đọc phổ thông

Định dạng output:
{
  "terms": [
    {
      "term": "Thuật ngữ 1",
      "explanation": "Giải thích đơn giản",
      "example": "Ví dụ minh họa (nếu có)"
    }
  ],
  "summary": "Tóm tắt chung về các thuật ngữ đã giải thích"
}`,
    variables: [
      { name: 'text', type: 'string', required: true },
      { name: 'context', type: 'string', required: false }
    ]
  },

  critique: {
    id: 'critique',
    name: 'Câu hỏi phản biện',
    description: 'Tạo câu hỏi phản biện sâu sắc',
    category: 'critical-thinking',
    template: `Bạn là một nhà tư duy phản biện. Hãy đặt ra các câu hỏi phản biện sâu sắc về nội dung sau.

{{#if context}}
Ngữ cảnh: {{context}}
{{/if}}

Nội dung cần phân tích:
"""
{{text}}
"""

Yêu cầu:
1. Đặt 3-5 câu hỏi phản biện sâu sắc
2. Tập trung vào: logic, bằng chứng, giả định, và hệ quả
3. Mỗi câu hỏi kèm theo lý do tại sao nó quan trọng
4. Câu hỏi phải mang tính xây dựng, không phá hoại

Định dạng output:
{
  "questions": [
    {
      "question": "Câu hỏi phản biện",
      "category": "logic|evidence|assumption|implication",
      "reasoning": "Tại sao câu hỏi này quan trọng",
      "importance": "high|medium|low"
    }
  ],
  "overallAssessment": "Đánh giá tổng quan về độ tin cậy và logic của nội dung"
}`,
    variables: [
      { name: 'text', type: 'string', required: true },
      { name: 'context', type: 'string', required: false }
    ]
  },

  biasCheck: {
    id: 'bias-check',
    name: 'Kiểm tra thiên vị',
    description: 'Phát hiện ngôn ngữ thiên vị',
    category: 'bias-detection',
    template: `Bạn là chuyên gia phân tích ngôn ngữ và phát hiện thiên vị. Hãy phân tích đoạn văn sau.

{{#if author}}
Tác giả: {{author}}
{{/if}}
{{#if source}}
Nguồn: {{source}}
{{/if}}

Văn bản cần phân tích:
"""
{{text}}
"""

Yêu cầu:
1. Xác định các loại thiên vị (xác nhận, lựa chọn, cảm xúc, văn hóa, v.v.)
2. Trích dẫn cụ thể các ví dụ từ văn bản
3. Đánh giá mức độ nghiêm trọng của thiên vị
4. Đề xuất cách diễn đạt trung lập hơn

Định dạng output:
{
  "biasTypes": [
    {
      "type": "confirmation|selection|emotional|cultural|political",
      "severity": "low|medium|high",
      "description": "Mô tả loại thiên vị"
    }
  ],
  "examples": [
    {
      "original": "Câu/cụm từ thiên vị",
      "issue": "Vấn đề gì với câu này",
      "neutral": "Cách diễn đạt trung lập hơn"
    }
  ],
  "overallScore": 0.7,
  "recommendation": "Khuyến nghị chung"
}`,
    variables: [
      { name: 'text', type: 'string', required: true },
      { name: 'author', type: 'string', required: false },
      { name: 'source', type: 'string', required: false }
    ]
  },

  expand: {
    id: 'expand',
    name: 'Mở rộng kiến thức',
    description: 'Gợi ý từ khóa và chủ đề liên quan',
    category: 'expansion',
    template: `Bạn là một trợ lý nghiên cứu. Hãy gợi ý các từ khóa và chủ đề liên quan để người đọc có thể tìm hiểu thêm.

{{#if context}}
Ngữ cảnh: {{context}}
{{/if}}

Nội dung:
"""
{{text}}
"""

Yêu cầu:
1. Xác định 5-10 từ khóa quan trọng để tìm kiếm
2. Gợi ý 3-5 chủ đề liên quan để nghiên cứu thêm
3. Đề xuất các góc nhìn khác nhau về vấn đề
4. Gợi ý nguồn tham khảo uy tín (nếu có thể)

Định dạng output:
{
  "keywords": [
    {
      "term": "Từ khóa",
      "relevance": "high|medium|low",
      "searchQuery": "Gợi ý cách tìm kiếm"
    }
  ],
  "relatedTopics": [
    {
      "topic": "Chủ đề liên quan",
      "description": "Mô tả ngắn",
      "whyRelevant": "Tại sao nên tìm hiểu"
    }
  ],
  "perspectives": [
    "Góc nhìn 1: ...",
    "Góc nhìn 2: ..."
  ],
  "recommendations": [
    "Gợi ý tìm hiểu thêm 1",
    "Gợi ý tìm hiểu thêm 2"
  ]
}`,
    variables: [
      { name: 'text', type: 'string', required: true },
      { name: 'context', type: 'string', required: false }
    ]
  },

  quickSummary: {
    id: 'quickSummary',
    name: 'Tóm tắt nhanh',
    description: 'Tóm tắt cực ngắn trong 1 câu',
    category: 'quick',
    template: `Tóm tắt đoạn văn sau trong MỘT câu duy nhất, ngắn gọn nhất có thể:

"""
{{text}}
"""

Chỉ trả về một câu tóm tắt, không giải thích thêm.`,
    variables: [
      { name: 'text', type: 'string', required: true }
    ]
  }
}
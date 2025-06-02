export const SpecializedAnalyzers = {
  // SEO Audit Template
  seoAuditTemplate: `
Perform a comprehensive SEO audit for the following content:

URL: {{url}}
Content: {{content}}
Target Keywords: {{#each keywords}}{{this}}, {{/each}}

Analyze:

1. **Technical SEO**
   - URL structure and optimization
   - Meta tags quality and optimization
   - Header tag hierarchy (H1-H6)
   - Internal linking structure
   - Page load performance implications

2. **Content SEO**
   - Keyword density and distribution
   - Content relevance to target keywords
   - Content depth and comprehensiveness
   - Readability and user engagement factors
   - Content freshness indicators

3. **On-Page Optimization**
   - Title tag optimization (length, keywords, clickability)
   - Meta description effectiveness
   - Image alt text usage
   - Schema markup recommendations
   - Mobile optimization considerations

4. **Competitive Analysis**
   - Content gap identification
   - Unique value proposition
   - Competitive advantages/disadvantages

5. **User Experience Signals**
   - Content structure and scannability
   - Call-to-action effectiveness
   - User intent alignment

Provide:
- Overall SEO Score (0-100)
- Critical issues that need immediate attention
- Quick wins for immediate improvement
- Long-term optimization strategies
- Specific examples and actionable recommendations

Format the response with clear sections and priority levels (High/Medium/Low) for each recommendation.
`,

  // Content Strategy Template
  contentStrategyTemplate: `
Analyze the following content portfolio and provide strategic recommendations:

Content Pieces:
{{#each contents}}
- Title: {{this.title}}
  Topic: {{this.topic}}
  Performance: {{this.performance}}
{{/each}}

Brand Information:
- Voice: {{brand.voice}}
- Values: {{#each brand.values}}{{this}}, {{/each}}
- Target Markets: {{#each brand.targetMarkets}}{{this}}, {{/each}}

Strategic Goals:
{{#each goals}}
- {{this}}
{{/each}}

Provide a comprehensive content strategy analysis including:

1. **Content Portfolio Assessment**
   - Topic coverage analysis
   - Content mix evaluation
   - Performance patterns identification
   - Content gaps and opportunities

2. **Audience Alignment**
   - Target audience mapping
   - Content-audience fit analysis
   - Engagement optimization opportunities
   - Persona-based recommendations

3. **Brand Consistency**
   - Voice and tone alignment score
   - Brand values representation
   - Messaging consistency analysis
   - Brand differentiation opportunities

4. **Strategic Recommendations**
   - Priority content topics for next quarter
   - Content format diversification suggestions
   - Distribution channel optimization
   - Resource allocation recommendations

5. **Performance Optimization**
   - High-performing content patterns
   - Underperforming content improvement strategies
   - KPI-based optimization tactics
   - Testing and iteration framework

6. **Competitive Positioning**
   - Market differentiation opportunities
   - Thought leadership angles
   - Unique content approaches
   - Strategic partnerships potential

Provide specific, actionable recommendations with timelines and expected impact.
`,

  // Social Media Analysis Template
  socialMediaTemplate: `
Analyze the following social media content:

Platform: {{platform}}
Content: {{content}}

{{#if optimizeForPlatform}}
Platform-Specific Requirements:
- Character limits
- Hashtag best practices
- Optimal posting times
- Platform algorithm considerations
{{/if}}

{{#if suggestHashtags}}
Current Hashtags: {{#each hashtags}}#{{this}} {{/each}}
{{/if}}

{{#if checkBrandVoice}}
Brand Voice Guidelines: {{brandVoice}}
{{/if}}

Analyze:

1. **Content Quality**
   - Message clarity and impact
   - Visual appeal (if applicable)
   - Hook effectiveness
   - Call-to-action strength

2. **Platform Optimization**
   - Platform-specific best practices adherence
   - Format optimization
   - Timing recommendations
   - Algorithm-friendly elements

3. **Engagement Potential**
   - Shareability factor
   - Comment-worthy elements
   - Emotional triggers
   - Community building aspects

4. **Hashtag Strategy**
   - Hashtag relevance and reach
   - Trending opportunities
   - Niche vs. broad hashtags balance
   - Hashtag performance predictions

5. **Brand Alignment**
   - Voice consistency
   - Value communication
   - Visual brand adherence
   - Messaging alignment

Provide:
- Engagement Score (0-10)
- Optimized version of the content
- Recommended hashtags (10-15)
- Best posting time recommendation
- A/B testing suggestions
`,

  // Email Campaign Analysis Template
  emailCampaignTemplate: `
Analyze the following email campaign content:

Subject Line: {{subjectLine}}
Preview Text: {{previewText}}
Email Body: {{emailBody}}
Target Audience: {{targetAudience}}
Campaign Goal: {{campaignGoal}}

Perform a comprehensive analysis covering:

1. **Subject Line Effectiveness**
   - Open rate prediction
   - Emotional appeal
   - Urgency/curiosity factors
   - Spam trigger assessment
   - A/B testing variations

2. **Email Content Analysis**
   - Message clarity and flow
   - Value proposition strength
   - Storytelling effectiveness
   - Visual hierarchy assessment
   - Mobile optimization considerations

3. **Call-to-Action Optimization**
   - CTA visibility and placement
   - Action verb effectiveness
   - Button design recommendations
   - Multiple CTA strategy

4. **Personalization Opportunities**
   - Dynamic content suggestions
   - Segmentation strategies
   - Behavioral trigger recommendations
   - Customization potential

5. **Deliverability Factors**
   - Spam score estimation
   - Technical compliance
   - List hygiene indicators
   - Authentication recommendations

6. **Performance Predictions**
   - Expected open rate
   - Predicted click-through rate
   - Conversion likelihood
   - Unsubscribe risk assessment

Provide specific improvements with before/after examples and expected impact metrics.
`,

  // Competitor Intelligence Template
  competitorIntelligenceTemplate: `
Analyze the competitive landscape based on the following:

Your Company: {{company}}
Competitors: {{#each competitors}}{{this}}, {{/each}}
Market Segment: {{marketSegment}}
Analysis Focus: {{analysisFocus}}

Conduct a comprehensive competitive intelligence analysis:

1. **Market Positioning**
   - Unique value propositions comparison
   - Market share insights
   - Brand perception analysis
   - Positioning gaps and opportunities

2. **Content Strategy Comparison**
   - Content themes and topics
   - Publishing frequency and consistency
   - Content format preferences
   - Engagement metrics comparison

3. **Messaging Analysis**
   - Key messages and claims
   - Tone and voice comparison
   - Storytelling approaches
   - Emotional appeal strategies

4. **Digital Presence Audit**
   - Website user experience
   - SEO performance indicators
   - Social media effectiveness
   - Email marketing sophistication

5. **Innovation and Trends**
   - Emerging strategies adoption
   - Technology utilization
   - Customer experience innovations
   - Market trend responsiveness

6. **Strengths and Weaknesses**
   - Competitor advantages
   - Exploitable weaknesses
   - Market opportunities
   - Potential threats

7. **Strategic Recommendations**
   - Differentiation strategies
   - Competitive advantages to leverage
   - Market gaps to fill
   - Partnership or acquisition opportunities

Provide actionable intelligence with specific examples and implementation priorities.
`,

  // Conversion Optimization Template
  conversionOptimizationTemplate: `
Analyze the following content for conversion optimization:

Page Type: {{pageType}}
Current Conversion Rate: {{conversionRate}}
Target Action: {{targetAction}}
Content: {{content}}
User Journey Stage: {{journeyStage}}

Perform a detailed conversion optimization analysis:

1. **User Psychology Analysis**
   - Motivation triggers identification
   - Friction points assessment
   - Trust signals evaluation
   - Urgency and scarcity elements

2. **Content Effectiveness**
   - Value proposition clarity
   - Benefit vs. feature balance
   - Social proof utilization
   - Risk reversal strategies

3. **Call-to-Action Optimization**
   - CTA copy effectiveness
   - Placement optimization
   - Visual prominence
   - Multiple CTA strategy

4. **Page Layout Analysis**
   - Visual hierarchy assessment
   - Distraction minimization
   - Flow optimization
   - Mobile responsiveness

5. **Trust and Credibility**
   - Authority indicators
   - Security badges placement
   - Testimonial effectiveness
   - Guarantee prominence

6. **Technical Factors**
   - Page speed impact
   - Form optimization
   - Error handling
   - Cross-browser compatibility

7. **A/B Testing Recommendations**
   - High-impact test ideas
   - Testing prioritization
   - Success metrics definition
   - Implementation roadmap

Provide specific optimization tactics with expected conversion lift for each recommendation.
`,

  // Brand Voice Analysis Template
  brandVoiceTemplate: `
Analyze the following content for brand voice consistency:

Content Sample: {{content}}
Brand Guidelines:
- Personality Traits: {{#each brandPersonality}}{{this}}, {{/each}}
- Tone Attributes: {{#each toneAttributes}}{{this}}, {{/each}}
- Target Audience: {{targetAudience}}
- Brand Values: {{#each brandValues}}{{this}}, {{/each}}

Conduct a comprehensive brand voice analysis:

1. **Voice Consistency Score**
   - Overall alignment percentage
   - Consistency across sections
   - Deviation identification
   - Pattern analysis

2. **Personality Expression**
   - Trait manifestation assessment
   - Authenticity evaluation
   - Personality strength rating
   - Missing personality elements

3. **Tone Appropriateness**
   - Audience alignment
   - Context suitability
   - Emotional resonance
   - Tone variation analysis

4. **Language Analysis**
   - Vocabulary appropriateness
   - Sentence structure patterns
   - Jargon usage assessment
   - Readability alignment

5. **Brand Values Communication**
   - Value expression clarity
   - Implicit vs. explicit communication
   - Value prioritization
   - Authenticity assessment

6. **Differentiation Factors**
   - Unique voice elements
   - Memorable phrases or patterns
   - Competitive distinctiveness
   - Ownable language territory

7. **Improvement Recommendations**
   - Specific phrase alternatives
   - Tone adjustment suggestions
   - Vocabulary enhancements
   - Structural improvements

Provide before/after examples and a voice consistency scorecard.
`
}
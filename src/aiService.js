import OpenAI from 'openai';
import Groq from 'groq-sdk';

// Initialize both clients
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER || 'openai';

console.log(`🤖 AI Provider selected: ${AI_PROVIDER.toUpperCase()}`);

// Generate contextual suggestions using selected AI provider
export const generateContextualSuggestions = async (questionText, companyContext) => {
  try {
    const { industry, companySize, companyName } = companyContext;
    
    console.log(`🔧 ${AI_PROVIDER.toUpperCase()} Service - Input:`, { industry, companySize, companyName, questionText });
    
    if (!industry) {
      console.error('❌ No industry provided to AI service');
      return [];
    }
    
    const systemPrompt = `You are an expert in the ${industry} industry. Generate quick response suggestions for this business assessment question.

Company Context:
- Industry: ${industry}
- Company Size: ${companySize || 'Mid-size'}
- Company Name: ${companyName || 'Company'}

Question: ${questionText}

Generate 4 HIGHLY SPECIFIC response options that are relevant ONLY to the ${industry} industry.
Use industry-specific terminology, challenges, systems, and goals that are common in ${industry}.
Each suggestion should be 4-10 words maximum.
Make them realistic and actionable for a ${industry} company.

IMPORTANT: Return ONLY a valid JSON array of 4 strings. No explanation, no markdown, no extra text.
Format: ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4"]`;

    console.log(`📤 Sending to ${AI_PROVIDER.toUpperCase()} with prompt length:`, systemPrompt.length);

    let response;
    
    if (AI_PROVIDER === 'openai') {
      // Use OpenAI (GPT-4)
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Fast and cost-effective
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate the industry-specific suggestions now.' }
        ],
        temperature: 0.7,
        max_tokens: 200,
      });
      response = completion.choices[0]?.message?.content || '[]';
    } else {
      // Use Groq (LLaMA)
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate the industry-specific suggestions now.' }
        ],
        temperature: 0.7,
        max_tokens: 200,
      });
      response = completion.choices[0]?.message?.content || '[]';
    }

    console.log(`📥 Raw ${AI_PROVIDER.toUpperCase()} response:`, response);
    
    // Parse JSON response
    let jsonStr = response.trim();
    
    // Remove markdown code blocks if present
    if (jsonStr.includes('```')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }
    
    // Extract JSON array
    const match = jsonStr.match(/\[.*\]/s);
    if (match) {
      jsonStr = match[0];
    }
    
    console.log('🧹 Cleaned JSON string:', jsonStr);
    
    const suggestions = JSON.parse(jsonStr);
    console.log('✅ Parsed suggestions:', suggestions);
    
    if (Array.isArray(suggestions) && suggestions.length > 0) {
      console.log(`✨ Generated ${suggestions.length} ${industry}-specific suggestions:`, suggestions);
      return suggestions;
    }
    
    console.warn('⚠️ Parsed result is not a valid array or empty');
    return [];
  } catch (error) {
    console.error(`❌ ${AI_PROVIDER.toUpperCase()} suggestions error:`, error);
    console.error('Error details:', error.message);
    return [];
  }
};

// Extract contact info
export const extractContactInfo = async (userMessage) => {
  try {
    const systemPrompt = `Extract the person's name and email from the following message. 
Return ONLY a JSON object with "name" and "email" fields. If you can't find either, use null.
Example: {"name": "John Doe", "email": "john@example.com"}`;

    let response;
    
    if (AI_PROVIDER === 'openai') {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3,
        max_tokens: 100,
      });
      response = completion.choices[0]?.message?.content || '{}';
    } else {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3,
        max_tokens: 100,
      });
      response = completion.choices[0]?.message?.content || '{}';
    }
    
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Contact extraction error:', error);
    return { name: null, email: null };
  }
};

// Extract company info
export const extractCompanyInfo = async (userMessage) => {
  try {
    const systemPrompt = `Extract company information from the following message. 
Return ONLY a JSON object with "companyName", "industry", and "companySize" fields.
For industry, identify the EXACT industry name as mentioned (e.g., "Oil & Gas", "Renewable Energy", "Manufacturing", etc.)
For companySize, categorize into: Small (1-50), Medium (51-500), Large (501+), Enterprise (5000+)
Be flexible and capture any industry mentioned by the user exactly as stated.
If you can't find a field, use null.
Example: {"companyName": "SolarTech", "industry": "Renewable Energy", "companySize": "Medium (51-500)"}`;

    let response;
    
    if (AI_PROVIDER === 'openai') {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3,
        max_tokens: 150,
      });
      response = completion.choices[0]?.message?.content || '{}';
    } else {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3,
        max_tokens: 150,
      });
      response = completion.choices[0]?.message?.content || '{}';
    }
    
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Company info extraction error:', error);
    return { companyName: null, industry: null, companySize: null };
  }
};

// Generate next question transition
export const generateNextQuestion = async (sectionTitle, questionText, previousAnswer, allContext) => {
  try {
    const systemPrompt = `You are guiding a business transformation assessment. 
Generate a natural transition that:
1. Briefly acknowledges their previous answer (1 sentence)
2. Leads into the next question smoothly

Current Section: ${sectionTitle}
Next Question: ${questionText}
Their Last Answer: ${previousAnswer}

Keep it conversational and under 3 sentences total.`;

    let response;
    
    if (AI_PROVIDER === 'openai') {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate the transition.' }
        ],
        temperature: 0.8,
        max_tokens: 150,
      });
      response = completion.choices[0]?.message?.content || questionText;
    } else {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate the transition.' }
        ],
        temperature: 0.8,
        max_tokens: 150,
      });
      response = completion.choices[0]?.message?.content || questionText;
    }
    
    return response;
  } catch (error) {
    console.error('Question generation error:', error);
    return questionText;
  }
};

// Summarize section
export const summarizeSection = async (sectionTitle, responses) => {
  try {
    const systemPrompt = `Provide a brief, encouraging 1-sentence summary acknowledging what was covered in the ${sectionTitle} section.`;
    const responsesText = Object.values(responses).join(' | ');

    let response;
    
    if (AI_PROVIDER === 'openai') {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: responsesText }
        ],
        temperature: 0.7,
        max_tokens: 100,
      });
      response = completion.choices[0]?.message?.content || `Great work on ${sectionTitle}!`;
    } else {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: responsesText }
        ],
        temperature: 0.7,
        max_tokens: 100,
      });
      response = completion.choices[0]?.message?.content || `Great work on ${sectionTitle}!`;
    }
    
    return response;
  } catch (error) {
    console.error('Summary error:', error);
    return `Great work on ${sectionTitle}!`;
  }
};

// Generate comprehensive transformation proposal
export const generateTransformationProposal = async (companyContext, allResponses, sections) => {
  try {
    const { companyName, industry, companySize } = companyContext;
    
    console.log('📊 Generating transformation proposal for:', companyName);
    
    // Format all responses into a structured text
    let responsesSummary = '';
    sections.forEach((section, sIdx) => {
      responsesSummary += `\n\n${section.title}:\n`;
      section.questions.forEach((question, qIdx) => {
        const key = `section_${sIdx}_q_${qIdx}`;
        const answer = allResponses[key] || 'Not answered';
        responsesSummary += `Q: ${question}\nA: ${answer}\n\n`;
      });
    });
    
    const systemPrompt = `You are a senior digital transformation consultant with expertise in ${industry}. 
    
Analyze the following business assessment and create a comprehensive, actionable transformation proposal.

Company Profile:
- Name: ${companyName}
- Industry: ${industry}
- Size: ${companySize}

Assessment Responses:
${responsesSummary}

Generate a DETAILED proposal with the following sections:

## 1. EXECUTIVE SUMMARY
Write 2-3 paragraphs that:
- Highlight the key business challenges identified
- Present the transformation opportunity
- State the expected business impact
- Be specific to ${industry} industry context

## 2. OBJECTIVES
List 5-7 specific, measurable objectives that the transformation will achieve. Each should:
- Start with action verbs (Develop, Implement, Create, Enhance, etc.)
- Be specific to their stated goals and challenges
- Be measurable and time-bound
- Address their pain points directly

## 3. RECOMMENDED SOLUTIONS & DELIVERABLES
For each major solution area, provide:
- **Solution Name**: Brief description
- **Key Deliverables**: 
  - Specific outputs (systems, dashboards, models, reports)
  - Technologies/platforms to be implemented
  - Integration points with existing systems
- **Business Value**: How this addresses their challenges

Cover areas like:
- AI/ML implementations
- Process automation
- Data infrastructure
- Analytics & BI
- System integrations

## 4. IMPLEMENTATION TIMELINE
Break down into 4 phases with specific durations:
- **Phase 1** (Quick Wins): 2-4 weeks - What will be delivered
- **Phase 2** (Foundation): 6-8 weeks - What will be built
- **Phase 3** (Scale): 8-12 weeks - What will be expanded
- **Phase 4** (Optimization): 4-6 weeks - Testing, training, deployment

For each phase, list 3-5 specific activities or milestones.

## 5. KEY PERFORMANCE INDICATORS (KPIs)
Provide 7-10 specific KPIs with:
- **KPI Name**: Clear metric
- **Current Baseline**: Estimate based on their responses
- **Target**: Specific improvement goal
- **Measurement Method**: How it will be tracked
- **Timeline**: When target will be achieved

Group KPIs by category:
- Operational Efficiency
- Financial Impact
- Quality/Performance
- Customer/User Satisfaction
- Risk & Compliance

## 6. DATA REQUIREMENTS
List specific data needs:
- Historical data needed for analysis
- Real-time data sources to be integrated
- Data quality requirements
- Compliance and security considerations
- Existing systems to connect with

## 7. RISKS & ASSUMPTIONS
**Risks** (4-6 items):
- Technical risks
- Organizational risks
- Data/integration challenges
- Timeline/resource risks
- Mitigation strategies for each

**Assumptions** (4-6 items):
- About client resources and support
- About existing infrastructure
- About stakeholder availability
- About data access and quality

## 8. ESTIMATED IMPACT & ROI
Provide specific estimates:
- Cost savings (annual, %)
- Efficiency improvements (time saved, % reduction)
- Revenue opportunities (if applicable)
- Risk reduction (quantified)
- ROI timeline and payback period

## 9. REQUIRED RESOURCES & INVESTMENT
- Team composition needed
- Technology/software costs
- Training and change management
- Ongoing support requirements

## 10. NEXT STEPS
Immediate actions in priority order (5-7 items):
1. [Action] - [Who] - [Timeframe]
2. [Action] - [Who] - [Timeframe]
etc.

Format in clean markdown. Be SPECIFIC to ${industry}. Use their actual pain points and goals from responses. Make it actionable and implementable.`;

    let response;
    
    if (AI_PROVIDER === 'openai') {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o', // Use the full model for better proposals
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate the comprehensive, detailed transformation proposal based on the assessment. Be thorough and specific.' }
        ],
        temperature: 0.7,
        max_tokens: 4096, // Increased for comprehensive proposal
      });
      response = completion.choices[0]?.message?.content || '';
    } else {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate the comprehensive, detailed transformation proposal based on the assessment. Be thorough and specific.' }
        ],
        temperature: 0.7,
        max_tokens: 4096,
      });
      response = completion.choices[0]?.message?.content || '';
    }
    
    console.log('✅ Proposal generated successfully');
    return response;
  } catch (error) {
    console.error('❌ Proposal generation error:', error);
    throw error;
  }
};


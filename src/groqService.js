import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true // Required for client-side usage
});

export const analyzeResponse = async (userMessage, context) => {
  try {
    const systemPrompt = `You are a helpful AI assistant conducting a business transformation assessment. 
Your role is to:
1. Acknowledge the user's response naturally and conversationally
2. Extract key information from their answer
3. Guide them to the next question smoothly

Context: ${context}

Respond in a friendly, professional manner. Keep responses concise (2-3 sentences max).`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 200,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Groq API Error:', error);
    return null;
  }
};

export const extractContactInfo = async (userMessage) => {
  try {
    const systemPrompt = `Extract the person's name and email from the following message. 
Return ONLY a JSON object with "name" and "email" fields. If you can't find either, use null.
Example: {"name": "John Doe", "email": "john@example.com"}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 100,
    });

    const response = completion.choices[0]?.message?.content || '{}';
    
    // Try to parse JSON, handling potential markdown code blocks
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Groq extraction error:', error);
    return { name: null, email: null };
  }
};

export const extractCompanyInfo = async (userMessage) => {
  try {
    const systemPrompt = `Extract company information from the following message. 
Return ONLY a JSON object with "companyName", "industry", and "companySize" fields.
For industry, identify the EXACT industry name as mentioned (e.g., "Energy", "Renewable Energy", "Solar", "Oil & Gas", "Manufacturing", etc.)
For companySize, categorize into: Small (1-50), Medium (51-500), Large (501+), Enterprise (5000+)
Be flexible and capture any industry mentioned by the user exactly as stated.
If you can't find a field, use null.
Example: {"companyName": "SolarTech", "industry": "Renewable Energy", "companySize": "Medium (51-500)"}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 150,
    });

    const response = completion.choices[0]?.message?.content || '{}';
    
    // Try to parse JSON, handling potential markdown code blocks
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Groq company info extraction error:', error);
    return { companyName: null, industry: null, companySize: null };
  }
};

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

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate the transition.' }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 150,
    });

    return completion.choices[0]?.message?.content || questionText;
  } catch (error) {
    console.error('Groq question generation error:', error);
    return questionText; // Fallback to original question
  }
};

export const summarizeSection = async (sectionTitle, responses) => {
  try {
    const systemPrompt = `Provide a brief, encouraging 1-sentence summary acknowledging what was covered in the ${sectionTitle} section.`;

    const responsesText = Object.values(responses).join(' | ');

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: responsesText }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 100,
    });

    return completion.choices[0]?.message?.content || `Great work on ${sectionTitle}!`;
  } catch (error) {
    console.error('Groq summary error:', error);
    return `Great work on ${sectionTitle}!`;
  }
};

export const generateContextualSuggestions = async (questionText, companyContext) => {
  try {
    const { industry, companySize, companyName } = companyContext;
    
    console.log('🔧 Groq Service - Input:', { industry, companySize, companyName, questionText });
    
    if (!industry) {
      console.error('❌ No industry provided to Groq service');
      return [];
    }
    
    const systemPrompt = `You are an expert in the ${industry} industry. Generate quick response suggestions for this business assessment question.

Company Context:
- Industry: ${industry}
- Company Size: ${companySize || 'Mid-size'}
- Company Name: ${companyName || 'Company'}

Question: ${questionText}

Generate 4 HIGHLY SPECIFIC response options that are relevant ONLY to the ${industry} industry.
Use industry-specific terminology, challenges, systems, and goals.
Each suggestion should be 4-10 words maximum.
Make them realistic and actionable for a ${industry} company.

Return ONLY a valid JSON array of 4 strings. No explanation, no markdown.
Format: ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4"]`;

    console.log('📤 Sending to Groq with prompt length:', systemPrompt.length);

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate the industry-specific suggestions now.' }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 200,
    });

    const response = completion.choices[0]?.message?.content || '[]';
    console.log('📥 Raw Groq response:', response);
    
    // Try to parse JSON, handling potential markdown code blocks
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }
    
    // Additional cleanup
    jsonStr = jsonStr.replace(/^[^[]*/, '').replace(/[^\]]*$/, '');
    console.log('🧹 Cleaned JSON string:', jsonStr);
    
    const suggestions = JSON.parse(jsonStr);
    console.log('✅ Parsed suggestions:', suggestions);
    
    if (Array.isArray(suggestions) && suggestions.length > 0) {
      console.log(`✨ Generated ${suggestions.length} ${industry} suggestions:`, suggestions);
      return suggestions;
    }
    
    console.warn('⚠️ Parsed result is not a valid array or empty');
    return [];
  } catch (error) {
    console.error('❌ Groq suggestions error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    return []; // Return empty array on error, fallback to generic
  }
};


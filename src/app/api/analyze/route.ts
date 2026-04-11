import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
    try {
        const { content } = await req.json()

        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 })
        }

        const model = genAI.getGenerativeModel({ model: 'gemma-3-4b-it' })

        const prompt = `You are an emotional intelligence analyst and personal development coach for a journaling app. Analyze the following journal entry and return ONLY a valid JSON object with no markdown formatting, no code blocks, no extra text.

The JSON must have this exact structure:
{
  "emotions": ["emotion1", "emotion2", "emotion3"],
  "themes": ["theme1", "theme2"],
  "sentiment_score": 0.0,
  "reflection_prompt": "A thoughtful follow-up question addressed directly to the person",
  "coaching": {
    "diagnosis": "One sentence addressed directly to the person about the core pattern or challenge in this entry (use 'you'/'your', never 'the user')",
    "framework": "Name and briefly explain a real psychology, philosophy, or productivity concept that applies (e.g., Maslow's hierarchy, CBT cognitive distortions, Eisenhower matrix, Stoic dichotomy of control, habit loop theory, Kaizen, growth mindset, Parkinson's law, Pomodoro technique, journaling science, etc.)",
    "action": "One specific, concrete action someone could try — framed as a suggestion, not a command",
    "why": "One sentence explaining why this action works, grounded in the framework above"
  }
}

Rules:
- "emotions": array of 2-4 detected emotions (e.g., "joy", "anxiety", "gratitude", "frustration")
- "themes": array of 1-3 recurring themes (e.g., "work stress", "personal growth", "relationships")
- "sentiment_score": float from -1.0 (very negative) to 1.0 (very positive), 0.0 is neutral
- "reflection_prompt": one thoughtful question that helps the person go deeper — addressed directly to them using "you"
- "coaching": an object with exactly 4 keys: diagnosis, framework, action, why
  - "diagnosis": speak directly to the person about what they are actually sitting with, not surface-level. Use "you" and "your". Never write "the user".
  - "framework": reference a REAL concept from psychology, philosophy, neuroscience, or productivity research. Be specific — name the theory, the researcher, or the book. Do NOT make up frameworks.
  - "action": a concrete suggestion someone could try — specific enough to be actionable, framed gently (e.g., "You might try…", "One option is…"). Not a command.
  - "why": connect the suggestion back to the framework. Explain the mechanism.

Important: The insights should feel like they come from someone who has genuinely read and understood this specific entry — not a generic template. Introduce real concepts the person may not have encountered. The goal is to leave them feeling understood, not prescribed to.

Journal entry:
"""
${content}
"""`

        const result = await model.generateContent(prompt)
        const response = result.response
        const text = response.text()

        // Clean potential markdown formatting
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

        let analysis
        try {
            analysis = JSON.parse(cleanedText)
        } catch {
            console.error('Failed to parse Gemini response as JSON:', cleanedText)
            return NextResponse.json({ error: 'Invalid response from AI model' }, { status: 500 })
        }

        // Validate the shape matches what the client expects
        if (
            !Array.isArray(analysis.emotions) ||
            !Array.isArray(analysis.themes) ||
            typeof analysis.sentiment_score !== 'number' ||
            typeof analysis.reflection_prompt !== 'string'
        ) {
            console.error('Gemini response missing required fields:', analysis)
            return NextResponse.json({ error: 'Unexpected response structure from AI model' }, { status: 500 })
        }

        // Validate coaching object — provide fallback if model fails to generate it
        if (
            !analysis.coaching ||
            typeof analysis.coaching.diagnosis !== 'string' ||
            typeof analysis.coaching.framework !== 'string' ||
            typeof analysis.coaching.action !== 'string' ||
            typeof analysis.coaching.why !== 'string'
        ) {
            analysis.coaching = {
                diagnosis: 'Unable to generate coaching for this entry.',
                framework: 'Try writing a longer, more detailed entry for better analysis.',
                action: 'Re-read what you wrote and add 2-3 more sentences about how you feel.',
                why: 'More context helps the AI identify specific patterns and give targeted advice.'
            }
        }

        // Clamp sentiment_score to [-1, 1] in case the model goes out of range
        analysis.sentiment_score = Math.max(-1, Math.min(1, analysis.sentiment_score))

        return NextResponse.json(analysis)
    } catch (error) {
        console.error('Gemini analysis error:', error)

        // Detect rate-limit / quota errors from the Gemini API
        const message = error instanceof Error ? error.message : String(error)
        const isRateLimit = message.includes('429') ||
            message.includes('RESOURCE_EXHAUSTED') ||
            message.includes('quota') ||
            message.includes('retryDelay')

        // Extract suggested retry delay if present (e.g. "retryDelay":"48s")
        const retryMatch = message.match(/retryDelay[":\s]+([0-9]+)s/)
        const retryAfter = retryMatch ? parseInt(retryMatch[1]) : 60

        if (isRateLimit) {
            return NextResponse.json(
                { error: `Rate limit reached. Please wait ${retryAfter} seconds before trying again.`, retryAfter },
                { status: 429, headers: { 'Retry-After': String(retryAfter) } }
            )
        }

        return NextResponse.json(
            { error: 'Failed to analyze entry' },
            { status: 500 }
        )
    }
}

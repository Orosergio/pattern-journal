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

        const prompt = `You are an emotional intelligence analyst for a journaling app. Analyze the following journal entry and return ONLY a valid JSON object with no markdown formatting, no code blocks, no extra text.

The JSON must have this exact structure:
{
  "emotions": ["emotion1", "emotion2", "emotion3"],
  "themes": ["theme1", "theme2"],
  "sentiment_score": 0.0,
  "reflection_prompt": "A thoughtful follow-up question"
}

Rules:
- "emotions": array of 2-4 detected emotions (e.g., "joy", "anxiety", "gratitude", "frustration")
- "themes": array of 1-3 recurring themes (e.g., "work stress", "personal growth", "relationships")
- "sentiment_score": float from -1.0 (very negative) to 1.0 (very positive), 0.0 is neutral
- "reflection_prompt": one thoughtful question that helps the user reflect deeper

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
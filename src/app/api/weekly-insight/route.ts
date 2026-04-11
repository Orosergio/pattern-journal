import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

interface EntryInput {
  content: string
  emotions: string[]
  themes: string[]
  sentiment_score: number
  created_at: string
}

export async function POST(req: NextRequest) {
  try {
    const { entries, dateLabel, startDate, endDate }: {
      entries: EntryInput[];
      dateLabel?: string;
      startDate?: string;
      endDate?: string;
    } = await req.json()

    if (!entries || entries.length === 0) {
      return NextResponse.json({ error: 'No entries provided' }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: 'gemma-3-4b-it' })

    const entrySummaries = entries
      .map((e, i) => {
        const date = new Date(e.created_at).toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric'
        })
        return `Entry ${i + 1} (${date}, sentiment: ${e.sentiment_score.toFixed(2)}):\n"${e.content}"\nEmotions: ${e.emotions.join(', ')}\nThemes: ${e.themes.join(', ')}`
      })
      .join('\n\n---\n\n')

    const periodDescription = dateLabel && startDate && endDate
      ? `${dateLabel} (${startDate} to ${endDate})`
      : "the selected period";

    const prompt = `You are an emotional intelligence coach analyzing journal entries. Based on the ${entries.length} entries from ${periodDescription} below, generate a thoughtful insight report. Return ONLY a valid JSON object with no markdown formatting, no code blocks, no extra text.

The JSON must have this exact structure:
{
  "emotional_trajectory": "A 2-3 sentence narrative describing how the user's emotional state evolved across the week",
  "sentiment_trend": "improving",
  "dominant_emotions": ["emotion1", "emotion2", "emotion3"],
  "patterns": ["pattern1", "pattern2", "pattern3"],
  "habits": {
    "good": ["positive habit 1", "positive habit 2"],
    "concerning": ["concerning pattern 1"]
  },
  "recommendations": [
    { "title": "Short title", "body": "1-2 sentence actionable suggestion" },
    { "title": "Short title", "body": "1-2 sentence actionable suggestion" },
    { "title": "Short title", "body": "1-2 sentence actionable suggestion" }
  ]
}

Rules:
- "emotional_trajectory": warm, empathetic narrative (2-3 sentences) covering the full period from ${startDate ?? "start"} to ${endDate ?? "end"}
- "sentiment_trend": must be exactly one of: "improving", "declining", "stable"
- "dominant_emotions": 2-4 most frequent emotions across entries
- "patterns": 2-4 recurring behavioral or emotional patterns you observe
- "habits.good": exactly 2 positive patterns or behaviors to reinforce
- "habits.concerning": exactly 1-2 patterns worth watching (look for subtle ones like avoidance, venting without resolution, over-reliance on external validation, etc. — there is always at least one worth noting)
- "recommendations": exactly 3 actionable, specific suggestions grounded in what you observe from this specific period

Journal entries from ${periodDescription}:
---
${entrySummaries}
---`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    let insight
    try {
      insight = JSON.parse(cleanedText)
    } catch {
      console.error('Failed to parse weekly insight response:', cleanedText)
      return NextResponse.json({ error: 'Invalid response from AI model' }, { status: 500 })
    }

    // Validate required fields
    if (
      typeof insight.emotional_trajectory !== 'string' ||
      !['improving', 'declining', 'stable'].includes(insight.sentiment_trend) ||
      !Array.isArray(insight.dominant_emotions) ||
      !Array.isArray(insight.patterns) ||
      !insight.habits ||
      !Array.isArray(insight.recommendations)
    ) {
      console.error('Weekly insight missing required fields:', insight)
      return NextResponse.json({ error: 'Unexpected response structure from AI model' }, { status: 500 })
    }

    return NextResponse.json(insight)
  } catch (error) {
    console.error('Weekly insight error:', error)

    const message = error instanceof Error ? error.message : String(error)
    const isRateLimit =
      message.includes('429') ||
      message.includes('RESOURCE_EXHAUSTED') ||
      message.includes('quota') ||
      message.includes('retryDelay')

    const retryMatch = message.match(/retryDelay[":\s]+([0-9]+)s/)
    const retryAfter = retryMatch ? parseInt(retryMatch[1]) : 60

    if (isRateLimit) {
      return NextResponse.json(
        { error: `Rate limit reached. Please wait ${retryAfter} seconds.`, retryAfter },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

    return NextResponse.json({ error: 'Failed to generate weekly insight' }, { status: 500 })
  }
}

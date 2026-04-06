"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface AnalysisResult {
    emotions: string[];
    themes: string[];
    sentiment_score: number;
    reflection_prompt: string;
}

export default function JournalEntry({ userId }: { userId: string }) {
    const [content, setContent] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");
    const [retryCountdown, setRetryCountdown] = useState(0);

    const handleSubmit = async () => {
        if (content.trim().length < 20) {
            setError("Write at least 20 characters for meaningful analysis.");
            return;
        }

        setAnalyzing(true);
        setError("");
        setAnalysis(null);
        setSaved(false);

        try {
            // Call Gemini API route
            const res = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });

            if (res.status === 429) {
                const body = await res.json().catch(() => ({}));
                const wait = body.retryAfter ?? 60;
                setError(body.error ?? `Rate limit reached. Please wait ${wait}s.`);
                setRetryCountdown(wait);
                const interval = setInterval(() => {
                    setRetryCountdown((c) => {
                        if (c <= 1) { clearInterval(interval); return 0; }
                        return c - 1;
                    });
                }, 1000);
                return;
            }
            if (!res.ok) throw new Error("Analysis failed");

            const result: AnalysisResult = await res.json();
            setAnalysis(result);

            // Save to Supabase
            const { error: dbError } = await supabase.from("entries").insert({
                user_id: userId,
                content,
                emotions: result.emotions,
                themes: result.themes,
                sentiment_score: result.sentiment_score,
                reflection_prompt: result.reflection_prompt,
            });

            if (dbError) throw dbError;

            setSaved(true);
            // Content is intentionally NOT cleared here so the user can still
            // read what they wrote alongside the analysis result.
        } catch (err) {
            console.error(err);
            setError("Something went wrong. Try again.");
        } finally {
            setAnalyzing(false);
        }
    };

    const getSentimentColor = (score: number) => {
        if (score > 0.3) return "text-emerald-400";
        if (score < -0.3) return "text-red-400";
        return "text-yellow-400";
    };

    const getSentimentLabel = (score: number) => {
        if (score > 0.5) return "Very Positive";
        if (score > 0.2) return "Positive";
        if (score > -0.2) return "Neutral";
        if (score > -0.5) return "Negative";
        return "Very Negative";
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold mb-2">How are you feeling today?</h2>
                <p className="text-gray-400 text-sm">Write freely. AI will detect patterns in your emotions.</p>
            </div>

            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Today I felt..."
                className="w-full h-48 bg-gray-900 border border-gray-800 rounded-lg p-4 text-gray-100 placeholder-gray-600 resize-none focus:outline-none focus:border-emerald-400/50 transition-colors"
            />

            <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">{content.length} characters</span>
                <button
                    onClick={handleSubmit}
                    disabled={analyzing || content.trim().length < 20 || retryCountdown > 0}
                    className="bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    {analyzing ? "Analyzing..." : retryCountdown > 0 ? `Retry in ${retryCountdown}s` : "Analyze & Save"}
                </button>
            </div>

            {error && (
                <p className="text-red-400 text-sm">
                    {error}{retryCountdown > 0 ? ` (${retryCountdown}s remaining)` : ""}
                </p>
            )}

            {analysis && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
                    <h3 className="font-semibold text-lg">Analysis</h3>

                    <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Emotions detected</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {analysis.emotions.map((emotion) => (
                                <span key={emotion} className="bg-emerald-400/10 text-emerald-400 px-3 py-1 rounded-full text-sm">
                                    {emotion}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Themes</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {analysis.themes.map((theme) => (
                                <span key={theme} className="bg-violet-400/10 text-violet-400 px-3 py-1 rounded-full text-sm">
                                    {theme}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Sentiment</span>
                        <p className={`text-lg font-medium ${getSentimentColor(analysis.sentiment_score)}`}>
                            {getSentimentLabel(analysis.sentiment_score)} ({analysis.sentiment_score.toFixed(2)})
                        </p>
                    </div>

                    <div className="border-t border-gray-800 pt-4">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Reflection prompt</span>
                        <p className="text-gray-300 mt-1 italic">{analysis.reflection_prompt}</p>
                    </div>

                    {saved && (
                        <div className="flex items-center justify-between">
                            <p className="text-emerald-400 text-sm">Entry saved successfully.</p>
                            <button
                                onClick={() => { setContent(""); setAnalysis(null); setSaved(false); }}
                                className="text-sm text-gray-500 hover:text-gray-300 transition-colors underline"
                            >
                                Write new entry
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
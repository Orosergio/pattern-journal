"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format } from "date-fns";

interface Entry {
    id: string;
    emotions: string[];
    themes: string[];
    sentiment_score: number;
    created_at: string;
}

export default function Dashboard({ userId }: { userId: string }) {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchEntries = async () => {
            const { data, error: dbError } = await supabase
                .from("entries")
                .select("id, emotions, themes, sentiment_score, created_at")
                .eq("user_id", userId)
                .order("created_at", { ascending: true })
                .limit(30);

            if (dbError) {
                setError("Failed to load dashboard data. Please try again.");
            } else {
                setEntries(data || []);
            }
            setLoading(false);
        };
        fetchEntries();
    }, [userId]);

    if (loading) return <div className="text-gray-400 animate-pulse">Loading dashboard...</div>;

    if (error) return <div className="text-red-400 text-sm py-4">{error}</div>;

    if (entries.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400">No entries yet. Start writing to see your emotional patterns.</p>
            </div>
        );
    }

    // Sentiment over time chart data
    const chartData = entries.map((e) => ({
        date: format(new Date(e.created_at), "MMM d"),
        sentiment: e.sentiment_score,
    }));

    // Emotion frequency
    const emotionCounts: Record<string, number> = {};
    entries.forEach((e) => {
        e.emotions?.forEach((emotion: string) => {
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        });
    });
    const topEmotions = Object.entries(emotionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    // Theme frequency
    const themeCounts: Record<string, number> = {};
    entries.forEach((e) => {
        e.themes?.forEach((theme: string) => {
            themeCounts[theme] = (themeCounts[theme] || 0) + 1;
        });
    });
    const topThemes = Object.entries(themeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

    // Average sentiment
    const avgSentiment = entries.length > 0
        ? entries.reduce((sum, e) => sum + (e.sentiment_score ?? 0), 0) / entries.length
        : 0;

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-semibold">Your Emotional Patterns</h2>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Total Entries</span>
                    <p className="text-2xl font-bold mt-1">{entries.length}</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Avg Sentiment</span>
                    <p className={`text-2xl font-bold mt-1 ${avgSentiment > 0.3 ? "text-emerald-400" : avgSentiment < -0.3 ? "text-red-400" : "text-yellow-400"}`}>
                        {avgSentiment.toFixed(2)}
                    </p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Top Emotion</span>
                    <p className="text-2xl font-bold mt-1 text-emerald-400">{topEmotions[0]?.[0] || "—"}</p>
                </div>
            </div>

            {/* Sentiment chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="font-medium mb-4">Sentiment Over Time</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                        <YAxis domain={[-1, 1]} stroke="#6b7280" fontSize={12} />
                        <Tooltip
                            contentStyle={{ backgroundColor: "#111827", border: "1px solid #1f2937", borderRadius: "8px" }}
                            labelStyle={{ color: "#9ca3af" }}
                        />
                        <Line type="monotone" dataKey="sentiment" stroke="#34d399" strokeWidth={2} dot={{ fill: "#34d399", r: 4 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Top emotions */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="font-medium mb-3">Most Frequent Emotions</h3>
                <div className="space-y-2">
                    {topEmotions.map(([emotion, count]) => (
                        <div key={emotion} className="flex items-center gap-3">
                            <div className="flex-1">
                                <div className="flex justify-between text-sm mb-1">
                                    <span>{emotion}</span>
                                    <span className="text-gray-500">{count}x</span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-400 rounded-full"
                                        style={{ width: `${(count / topEmotions[0][1]) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top themes */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="font-medium mb-3">Recurring Themes</h3>
                <div className="flex flex-wrap gap-2">
                    {topThemes.map(([theme, count]) => (
                        <span key={theme} className="bg-violet-400/10 text-violet-400 px-3 py-1.5 rounded-full text-sm">
                            {theme} ({count})
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
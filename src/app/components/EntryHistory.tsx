"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

interface Entry {
    id: string;
    content: string;
    emotions: string[];
    themes: string[];
    sentiment_score: number;
    reflection_prompt: string;
    created_at: string;
}

export default function EntryHistory({ userId }: { userId: string }) {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchEntries = async () => {
            const { data, error: dbError } = await supabase
                .from("entries")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(20);

            if (dbError) {
                setError("Failed to load entries. Please try again.");
            } else {
                setEntries(data || []);
            }
            setLoading(false);
        };
        fetchEntries();
    }, [userId]);

    if (loading) return <div className="text-gray-400 animate-pulse">Loading entries...</div>;

    if (error) return <div className="text-red-400 text-sm py-4">{error}</div>;

    if (entries.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400">No entries yet. Start writing to build your history.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Entry History</h2>
            {entries.map((entry) => (
                <div key={entry.id} className="bg-gray-900 border border-gray-800 rounded-lg p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                            {format(new Date(entry.created_at), "MMMM d, yyyy · h:mm a")}
                        </span>
                        <span className={`text-sm font-medium ${entry.sentiment_score > 0.3 ? "text-emerald-400" : entry.sentiment_score < -0.3 ? "text-red-400" : "text-yellow-400"
                            }`}>
                            {entry.sentiment_score != null ? entry.sentiment_score.toFixed(2) : "—"}
                        </span>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{entry.content}</p>
                    <div className="flex flex-wrap gap-2">
                        {entry.emotions?.map((e: string) => (
                            <span key={`${entry.id}-emotion-${e}`} className="bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded-full text-xs">{e}</span>
                        ))}
                        {entry.themes?.map((t: string) => (
                            <span key={`${entry.id}-theme-${t}`} className="bg-violet-400/10 text-violet-400 px-2 py-0.5 rounded-full text-xs">{t}</span>
                        ))}
                    </div>
                    {entry.reflection_prompt && (
                        <p className="text-gray-500 text-sm italic border-t border-gray-800 pt-3">{entry.reflection_prompt}</p>
                    )}
                </div>
            ))}
        </div>
    );
}
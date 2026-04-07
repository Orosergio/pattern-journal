"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { format, differenceInCalendarDays, subDays, startOfDay, parseISO } from "date-fns";

interface Entry {
  id: string;
  emotions: string[];
  themes: string[];
  sentiment_score: number;
  created_at: string;
}

function calcStreaks(entries: Entry[]) {
  if (entries.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // Unique calendar dates (UTC-local) sorted descending
  const uniqueDates = Array.from(
    new Set(entries.map((e) => format(new Date(e.created_at), "yyyy-MM-dd")))
  ).sort((a, b) => b.localeCompare(a));

  // Current streak: consecutive days ending today or yesterday
  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  let currentStreak = 0;

  if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
    currentStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = parseISO(uniqueDates[i - 1]);
      const curr = parseISO(uniqueDates[i]);
      if (differenceInCalendarDays(prev, curr) === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Longest streak
  let longestStreak = 1;
  let runStreak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = parseISO(uniqueDates[i - 1]);
    const curr = parseISO(uniqueDates[i]);
    if (differenceInCalendarDays(prev, curr) === 1) {
      runStreak++;
      longestStreak = Math.max(longestStreak, runStreak);
    } else {
      runStreak = 1;
    }
  }

  return { currentStreak, longestStreak };
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
        .order("created_at", { ascending: false })
        .limit(90);

      if (dbError) {
        setError("Failed to load entries.");
        console.error(dbError);
      }
      setEntries(data || []);
      setLoading(false);
    };
    fetchEntries();
  }, [userId]);

  const streakStats = useMemo(() => calcStreaks(entries), [entries]);

  // Count unique calendar DAYS with at least 1 entry in the past 7 days
  const daysJournaledThisWeek = useMemo(() => {
    const since = startOfDay(subDays(new Date(), 6)).getTime();
    const uniqueDays = new Set(
      entries
        .filter((e) => new Date(e.created_at).getTime() >= since)
        .map((e) => format(new Date(e.created_at), "yyyy-MM-dd"))
    );
    return uniqueDays.size;
  }, [entries]);

  const weeklyConsistency = Math.min(100, Math.round((daysJournaledThisWeek / 7) * 100));

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn 0.3s ease" }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            height: i === 1 ? 60 : i === 2 ? 80 : i === 3 ? 280 : 160,
            background: "var(--bg-card)", borderRadius: 16,
            border: "1px solid var(--border)",
            backgroundImage: "linear-gradient(90deg, var(--bg-card) 0%, var(--bg-card-hover) 50%, var(--bg-card) 100%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite"
          }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: "var(--rose-dim)", border: "1px solid rgba(251,113,133,0.15)",
        borderRadius: 12, padding: 16, fontSize: 13, color: "var(--rose)"
      }}>{error}</div>
    );
  }

  if (entries.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px", animation: "fadeIn 0.4s ease" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <h3 style={{ fontFamily: "var(--serif)", fontSize: 24, fontWeight: 400, marginBottom: 8 }}>
          No patterns yet
        </h3>
        <p style={{ color: "var(--text-dim)", fontSize: 14, maxWidth: 360, margin: "0 auto" }}>
          Start writing journal entries to see your emotional patterns emerge over time.
        </p>
      </div>
    );
  }

  // Chart uses last 30 entries sorted ascending for display
  const chartEntries = [...entries].reverse().slice(0, 30);
  // If all entries are on the same calendar day, show time instead of the date
  const uniqueChartDays = new Set(chartEntries.map((e) => format(new Date(e.created_at), "yyyy-MM-dd")));
  const chartDateFormat = uniqueChartDays.size <= 1 ? "h:mm a" : "MMM d";
  const chartData = chartEntries.map((e) => ({
    date: format(new Date(e.created_at), chartDateFormat),
    sentiment: e.sentiment_score ?? 0,
  }));

  const emotionCounts: Record<string, number> = {};
  entries.forEach((e) => {
    e.emotions?.forEach((emotion: string) => {
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });
  });
  const topEmotions = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const themeCounts: Record<string, number> = {};
  entries.forEach((e) => {
    e.themes?.forEach((theme: string) => {
      themeCounts[theme] = (themeCounts[theme] || 0) + 1;
    });
  });
  const topThemes = Object.entries(themeCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const avgSentiment = entries.reduce((sum, e) => sum + (e.sentiment_score ?? 0), 0) / entries.length;

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return "var(--accent)";
    if (score < -0.3) return "var(--rose)";
    return "var(--amber)";
  };

  const tagColors = [
    { bg: "var(--accent-dim)", color: "var(--accent)", border: "rgba(110,231,183,0.15)" },
    { bg: "var(--violet-dim)", color: "var(--violet)", border: "rgba(167,139,250,0.15)" },
    { bg: "var(--rose-dim)", color: "var(--rose)", border: "rgba(251,113,133,0.15)" },
    { bg: "var(--amber-dim)", color: "var(--amber)", border: "rgba(251,191,36,0.15)" },
  ];

  const streakCards = [
    {
      label: "Current Streak",
      value: `${streakStats.currentStreak}d`,
      icon: "🔥",
      color: streakStats.currentStreak > 0 ? "var(--amber)" : "var(--text-dim)",
      bg: streakStats.currentStreak > 0 ? "var(--amber-dim)" : "transparent",
    },
    {
      label: "Longest Streak",
      value: `${streakStats.longestStreak}d`,
      icon: "🏆",
      color: "var(--violet)",
      bg: "var(--violet-dim)",
    },
    {
      label: "This Week",
      value: `${daysJournaledThisWeek}/7 days`,
      icon: "📅",
      color: "var(--accent)",
      bg: "var(--accent-dim)",
    },
    {
      label: "Consistency",
      value: `${weeklyConsistency}%`,
      icon: "📈",
      color: weeklyConsistency >= 70 ? "var(--accent)" : weeklyConsistency >= 40 ? "var(--amber)" : "var(--rose)",
      bg: weeklyConsistency >= 70 ? "var(--accent-dim)" : weeklyConsistency >= 40 ? "var(--amber-dim)" : "var(--rose-dim)",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "slideUp 0.4s ease" }}>
      {/* Title */}
      <h2 style={{ fontFamily: "var(--serif)", fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 400, lineHeight: 1.2 }}>
        Your Emotional Patterns
      </h2>

      {/* Streak Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
        {streakCards.map((card) => (
          <div key={card.label} style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 14, padding: "16px 18px",
            display: "flex", flexDirection: "column", gap: 6,
            transition: "all 0.2s",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)", fontWeight: 600 }}>
                {card.label}
              </span>
              <span style={{ fontSize: 16 }}>{card.icon}</span>
            </div>
            <div style={{
              fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em",
              color: card.color,
            }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "Total Entries", value: entries.length.toString(), color: "var(--text)" },
          { label: "Avg Sentiment", value: avgSentiment.toFixed(2), color: getSentimentColor(avgSentiment) },
          { label: "Top Emotion", value: topEmotions[0]?.[0] || "—", color: "var(--accent)" },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 14, padding: "20px 24px",
            transition: "all 0.2s"
          }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)", fontWeight: 600, marginBottom: 6 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: stat.color, letterSpacing: "-0.02em" }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px 24px 16px" }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)", fontWeight: 600, marginBottom: 20 }}>
          Sentiment Over Time
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis domain={[-1, 1]} stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} width={35} />
            <ReferenceLine y={0} stroke="var(--border-light)" strokeDasharray="3 3" />
            <Tooltip
              contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 13, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}
              labelStyle={{ color: "var(--text-dim)" }}
              itemStyle={{ color: "var(--accent)" }}
            />
            <Line type="monotone" dataKey="sentiment" stroke="var(--accent)" strokeWidth={2}
              dot={{ fill: "var(--accent)", r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "var(--accent)", strokeWidth: 2, stroke: "var(--bg)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Emotions */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)", fontWeight: 600, marginBottom: 16 }}>
          Most Frequent Emotions
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {topEmotions.map(([emotion, count], i) => (
            <div key={`${emotion}-${i}`} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 500, minWidth: 100, color: "var(--text-muted)" }}>{emotion}</span>
              <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${(count / topEmotions[0][1]) * 100}%`,
                  background: tagColors[i % tagColors.length].color,
                  borderRadius: 3,
                  transition: "width 0.5s ease"
                }} />
              </div>
              <span style={{ fontSize: 12, color: "var(--text-dim)", minWidth: 24, textAlign: "right" }}>{count}×</span>
            </div>
          ))}
        </div>
      </div>

      {/* Themes */}
      {topThemes.length > 0 && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)", fontWeight: 600, marginBottom: 16 }}>
            Recurring Themes
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {topThemes.map(([theme, count], i) => (
              <span key={`${theme}-${i}`} style={{
                padding: "8px 16px", borderRadius: 100,
                fontSize: 13, fontWeight: 500,
                background: tagColors[i % tagColors.length].bg,
                color: tagColors[i % tagColors.length].color,
                border: `1px solid ${tagColors[i % tagColors.length].border}`,
              }}>
                {theme} ({count})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

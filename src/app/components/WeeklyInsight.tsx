"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { format, subDays, startOfDay } from "date-fns";

interface Entry {
  content: string;
  emotions: string[];
  themes: string[];
  sentiment_score: number;
  created_at: string;
}

interface Recommendation {
  title: string;
  body: string;
}

interface WeeklyInsightData {
  emotional_trajectory: string;
  sentiment_trend: "improving" | "declining" | "stable";
  dominant_emotions: string[];
  patterns: string[];
  habits: {
    good: string[];
    concerning: string[];
  };
  recommendations: Recommendation[];
}

const trendConfig = {
  improving: {
    label: "Improving",
    icon: "📈",
    color: "var(--accent)",
    bg: "var(--accent-dim)",
    border: "rgba(110,231,183,0.2)",
  },
  declining: {
    label: "Declining",
    icon: "📉",
    color: "var(--rose)",
    bg: "var(--rose-dim)",
    border: "rgba(251,113,133,0.2)",
  },
  stable: {
    label: "Stable",
    icon: "〰️",
    color: "var(--amber)",
    bg: "var(--amber-dim)",
    border: "rgba(251,191,36,0.2)",
  },
};

const STEPS = [
  "Gathering your entries…",
  "Detecting emotional patterns…",
  "Analyzing habits & behaviors…",
  "Crafting recommendations…",
];

export default function WeeklyInsight({ userId }: { userId: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [insight, setInsight] = useState<WeeklyInsightData | null>(null);
  const [error, setError] = useState("");
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  const [step, setStep] = useState(0);

  // Fetch last 7 days of entries
  useEffect(() => {
    const fetchEntries = async () => {
      const since = startOfDay(subDays(new Date(), 6)).toISOString();
      const { data, error: dbError } = await supabase
        .from("entries")
        .select("content, emotions, themes, sentiment_score, created_at")
        .eq("user_id", userId)
        .gte("created_at", since)
        .order("created_at", { ascending: true });

      if (dbError) console.error(dbError);
      setEntries(data || []);
      setLoadingEntries(false);
    };
    fetchEntries();
  }, [userId]);

  const generate = async () => {
    if (entries.length < 1) return;
    setGenerating(true);
    setError("");
    setStep(0);

    // Animate steps
    const stepInterval = setInterval(() => {
      setStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 1800);

    try {
      const res = await fetch("/api/weekly-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });

      if (res.status === 429) {
        const d = await res.json();
        setError(`Rate limit reached. Please wait ${d.retryAfter || 60}s.`);
        return;
      }
      if (!res.ok) throw new Error("Generation failed");

      const data: WeeklyInsightData = await res.json();
      setInsight(data);
      setLastGenerated(new Date());
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      clearInterval(stepInterval);
      setGenerating(false);
    }
  };

  const tagColors = [
    { bg: "var(--accent-dim)", color: "var(--accent)", border: "rgba(110,231,183,0.15)" },
    { bg: "var(--violet-dim)", color: "var(--violet)", border: "rgba(167,139,250,0.15)" },
    { bg: "var(--rose-dim)", color: "var(--rose)", border: "rgba(251,113,133,0.15)" },
    { bg: "var(--amber-dim)", color: "var(--amber)", border: "rgba(251,191,36,0.15)" },
  ];

  // Loading state (fetching entries)
  if (loadingEntries) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[1, 2].map((i) => (
          <div
            key={i}
            style={{
              height: i === 1 ? 80 : 240,
              background: "var(--bg-card)",
              borderRadius: 16,
              border: "1px solid var(--border)",
              backgroundImage:
                "linear-gradient(90deg, var(--bg-card) 0%, var(--bg-card-hover) 50%, var(--bg-card) 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
            }}
          />
        ))}
      </div>
    );
  }

  // Not enough entries state
  if (!insight && entries.length < 2) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "slideUp 0.4s ease" }}>
        <div>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 400, marginBottom: 8 }}>
            Weekly Insight
          </h2>
          <p style={{ color: "var(--text-dim)", fontSize: 14 }}>
            Past 7 days · {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </p>
        </div>
        <div
          style={{
            textAlign: "center",
            padding: "80px 24px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 20,
          }}
        >
          <div style={{ fontSize: 52, marginBottom: 20 }}>✨</div>
          <h3 style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 400, marginBottom: 10 }}>
            Keep writing to unlock insights
          </h3>
          <p style={{ color: "var(--text-dim)", fontSize: 14, maxWidth: 360, margin: "0 auto", lineHeight: 1.6 }}>
            Write at least 2 journal entries this week to generate your personalized pattern report.
          </p>
          <div
            style={{
              marginTop: 24,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 100,
              background: "var(--accent-dim)",
              border: "1px solid rgba(110,231,183,0.15)",
              fontSize: 13,
              color: "var(--accent)",
              fontWeight: 500,
            }}
          >
            {entries.length} / 2 entries this week
          </div>
        </div>
      </div>
    );
  }

  // Generating state
  if (generating) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fadeIn 0.3s ease" }}>
        <div>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 400, marginBottom: 8 }}>
            Weekly Insight
          </h2>
        </div>
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            padding: "60px 40px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 32,
          }}
        >
          {/* Animated orb */}
          <div style={{ position: "relative", width: 72, height: 72 }}>
            <div
              style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: "radial-gradient(circle at 40% 40%, var(--accent), transparent 70%)",
                opacity: 0.15,
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
            <div
              style={{
                width: 72, height: 72, borderRadius: "50%",
                border: "2px solid var(--border)",
                borderTopColor: "var(--accent)",
                animation: "spin 1.2s linear infinite",
              }}
            />
            <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 24 }}>✨</span>
          </div>

          <div>
            <p style={{ color: "var(--text)", fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
              Analyzing your week…
            </p>
            <p
              style={{
                color: "var(--accent)",
                fontSize: 13,
                fontStyle: "italic",
                transition: "opacity 0.4s",
                minHeight: 20,
              }}
            >
              {STEPS[step]}
            </p>
          </div>

          {/* Step dots */}
          <div style={{ display: "flex", gap: 8 }}>
            {STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: i <= step ? "var(--accent)" : "var(--border)",
                  transition: "background 0.4s",
                }}
              />
            ))}
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{transform:scale(1);opacity:.15} 50%{transform:scale(1.4);opacity:.3} }`}</style>
      </div>
    );
  }

  const firstDate = entries.length > 0 ? new Date(entries[0].created_at) : null;
  const lastDate = entries.length > 0 ? new Date(entries[entries.length - 1].created_at) : null;
  const sameDay =
    firstDate && lastDate && format(firstDate, "yyyy-MM-dd") === format(lastDate, "yyyy-MM-dd");
  const dateRange = firstDate
    ? sameDay
      ? format(firstDate, "MMM d, yyyy")
      : `${format(firstDate, "MMM d")} – ${format(lastDate!, "MMM d, yyyy")}`
    : "Last 7 days";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "slideUp 0.4s ease" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 400, marginBottom: 6 }}>
            {insight ? "Your Week in Review" : "Weekly Insight"}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "var(--text-dim)", fontSize: 13 }}>{dateRange}</span>
            <span style={{
              padding: "2px 10px", borderRadius: 100, fontSize: 12, fontWeight: 500,
              background: "var(--accent-dim)", color: "var(--accent)",
              border: "1px solid rgba(110,231,183,0.15)"
            }}>
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <button
            onClick={generate}
            disabled={generating}
            style={{
              padding: "10px 22px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "var(--sans)",
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s",
            }}
          >
            <span>✨</span>
            {insight ? "Regenerate" : "Generate Insight"}
          </button>
          {lastGenerated && (
            <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
              Generated {format(lastGenerated, "h:mm a")}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div style={{
          background: "var(--rose-dim)", border: "1px solid rgba(251,113,133,0.15)",
          borderRadius: 10, padding: "12px 16px",
          fontSize: 13, color: "var(--rose)",
        }}>
          {error}
        </div>
      )}

      {/* Prompt to generate */}
      {!insight && !generating && (
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 20, padding: "60px 40px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
          <h3 style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 400, marginBottom: 10 }}>
            Ready to reflect?
          </h3>
          <p style={{ color: "var(--text-dim)", fontSize: 14, maxWidth: 380, margin: "0 auto", lineHeight: 1.6 }}>
            You have {entries.length} {entries.length === 1 ? "entry" : "entries"} from this week. Generate your personalized insight report to discover patterns, habits, and what to do next.
          </p>
        </div>
      )}

      {/* INSIGHT SECTIONS */}
      {insight && (
        <>
          {/* Trajectory + Trend */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 18, padding: "24px 28px",
            display: "flex", flexDirection: "column", gap: 16,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{
                fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em",
                color: "var(--text-dim)", fontWeight: 600,
              }}>Emotional Trajectory</span>
              {(() => {
                const t = trendConfig[insight.sentiment_trend];
                return (
                  <span style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "4px 14px", borderRadius: 100,
                    fontSize: 13, fontWeight: 600,
                    background: t.bg, color: t.color, border: `1px solid ${t.border}`,
                  }}>
                    {t.icon} {t.label}
                  </span>
                );
              })()}
            </div>
            <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.7 }}>
              {insight.emotional_trajectory}
            </p>
            {/* Dominant emotions */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {insight.dominant_emotions.map((e, i) => {
                const c = tagColors[i % tagColors.length];
                return (
                  <span key={e} style={{
                    padding: "5px 14px", borderRadius: 100,
                    fontSize: 13, fontWeight: 500,
                    background: c.bg, color: c.color, border: `1px solid ${c.border}`,
                  }}>{e}</span>
                );
              })}
            </div>
          </div>

          {/* Patterns */}
          {insight.patterns.length > 0 && (
            <div style={{
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: 18, padding: "24px 28px",
            }}>
              <div style={{
                fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em",
                color: "var(--text-dim)", fontWeight: 600, marginBottom: 16,
              }}>Identified Patterns</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {insight.patterns.map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                      background: "var(--violet-dim)", border: "1px solid rgba(167,139,250,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, color: "var(--violet)", marginTop: 1,
                    }}>{i + 1}</div>
                    <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, paddingTop: 2 }}>{p}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Habits — stacked vertically so they're always equal width */}
          {(insight.habits.good.length > 0 || insight.habits.concerning.length > 0) && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Good habits */}
              {insight.habits.good.length > 0 && (
                <div style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderLeft: "3px solid var(--accent)",
                  borderRadius: 14, padding: "18px 22px",
                  display: "flex", flexDirection: "column", gap: 12,
                }}>
                  <div style={{
                    fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em",
                    color: "var(--accent)", fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>✅ Strengths</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {insight.habits.good.map((h, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <span style={{ color: "var(--accent)", fontSize: 13, marginTop: 2, flexShrink: 0 }}>→</span>
                        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>{h}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Concerning habits */}
              {insight.habits.concerning.length > 0 && (
                <div style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderLeft: "3px solid var(--amber)",
                  borderRadius: 14, padding: "18px 22px",
                  display: "flex", flexDirection: "column", gap: 12,
                }}>
                  <div style={{
                    fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em",
                    color: "var(--amber)", fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>⚠️ Watch Out</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {insight.habits.concerning.map((h, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <span style={{ color: "var(--amber)", fontSize: 13, marginTop: 2, flexShrink: 0 }}>→</span>
                        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>{h}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 18, padding: "24px 28px",
          }}>
            <div style={{
              fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em",
              color: "var(--text-dim)", fontWeight: 600, marginBottom: 20,
            }}>3 Actionable Recommendations</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {insight.recommendations.map((r, i) => (
                <div key={i} style={{
                  display: "flex", gap: 16, alignItems: "flex-start",
                  padding: "16px 18px",
                  background: "var(--bg-input)",
                  borderRadius: 12,
                  borderLeft: `3px solid ${tagColors[i % tagColors.length].color}`,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: tagColors[i % tagColors.length].bg,
                    border: `1px solid ${tagColors[i % tagColors.length].border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, color: tagColors[i % tagColors.length].color,
                  }}>{i + 1}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                      {r.title}
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.6 }}>{r.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import type { DateRange } from "@/app/page";

interface Entry {
  id: string;
  content: string;
  emotions: string[];
  themes: string[];
  sentiment_score: number;
  reflection_prompt: string;
  created_at: string;
}

const VISIBLE_TAG_LIMIT = 6;

const emotionColors = [
  { bg: "var(--rose-dim)", color: "var(--rose)", border: "rgba(196,125,90,0.15)" },
  { bg: "var(--amber-dim)", color: "var(--amber)", border: "rgba(184,146,58,0.15)" },
  { bg: "rgba(251,146,60,0.08)", color: "#fb923c", border: "rgba(251,146,60,0.15)" },
  { bg: "rgba(56,189,248,0.08)", color: "#38bdf8", border: "rgba(56,189,248,0.15)" },
];

const topicColors = [
  { bg: "var(--violet-dim)", color: "var(--violet)", border: "rgba(138,112,148,0.15)" },
  { bg: "var(--accent-dim)", color: "var(--accent)", border: "rgba(124,154,130,0.15)" },
  { bg: "rgba(96,165,250,0.08)", color: "#60a5fa", border: "rgba(96,165,250,0.15)" },
  { bg: "rgba(192,132,252,0.08)", color: "#c084fc", border: "rgba(192,132,252,0.15)" },
];

const PAGE_SIZE = 10;

export default function EntryHistory({ userId, dateRange }: { userId: string; dateRange: DateRange }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTag, setSelectedTag] = useState<{ value: string; type: "emotion" | "topic" } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllEmotions, setShowAllEmotions] = useState(false);
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setLoading(true);
    setError("");
    // Reset view state when range changes
    setSelectedTag(null);
    setSearchQuery("");
    setVisibleCount(PAGE_SIZE);
    const fetchEntries = async () => {
      const { data, error: dbError } = await supabase
        .from("entries")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", dateRange.start.toISOString())
        .lte("created_at", dateRange.end.toISOString())
        .order("created_at", { ascending: false })
        .limit(500);

      if (dbError) {
        setError("Failed to load entries.");
        console.error(dbError);
      }
      setEntries(data || []);
      setLoading(false);
    };
    fetchEntries();
  }, [userId, dateRange]);

  // Theme frequency
  const themeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach((e) => {
      e.themes?.forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  // Emotion frequency
  const emotionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach((e) => {
      e.emotions?.forEach((em) => {
        counts[em] = (counts[em] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  // Sentiment trend
  const sentimentTrend = useMemo(() => {
    if (entries.length < 4) return null;
    const half = Math.ceil(entries.length / 2);
    const avg = (arr: Entry[]) =>
      arr.reduce((s, e) => s + (e.sentiment_score ?? 0), 0) / arr.length;
    const diff = avg(entries.slice(0, half)) - avg(entries.slice(half));
    if (diff > 0.1) return { label: "Improving", color: "var(--accent)", icon: "↗" };
    if (diff < -0.1) return { label: "Declining", color: "var(--rose)", icon: "↘" };
    return { label: "Stable", color: "var(--amber)", icon: "→" };
  }, [entries]);

  // Filter entries by selected tag AND search query
  const filteredEntries = useMemo(() => {
    let result = entries;

    if (selectedTag) {
      if (selectedTag.type === "emotion") {
        result = result.filter((e) => e.emotions?.includes(selectedTag.value));
      } else {
        result = result.filter((e) => e.themes?.includes(selectedTag.value));
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((e) =>
        e.content?.toLowerCase().includes(q) ||
        e.emotions?.some((em) => em.toLowerCase().includes(q)) ||
        e.themes?.some((t) => t.toLowerCase().includes(q))
      );
    }

    return result;
  }, [entries, selectedTag, searchQuery]);

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return "var(--accent)";
    if (score < -0.3) return "var(--rose)";
    return "var(--amber)";
  };

  const handleTagClick = (value: string, type: "emotion" | "topic") => {
    if (selectedTag?.value === value && selectedTag?.type === type) {
      setSelectedTag(null);
    } else {
      setSelectedTag({ value, type });
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn 0.3s ease" }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            height: 140,
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
        background: "var(--rose-dim)", border: "1px solid rgba(196,125,90,0.15)",
        borderRadius: 12, padding: 16, fontSize: 13, color: "var(--rose)"
      }}>{error}</div>
    );
  }

  if (entries.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px", animation: "fadeIn 0.4s ease" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
        <h3 style={{ fontFamily: "var(--serif)", fontSize: 24, fontWeight: 400, marginBottom: 8 }}>
          No entries yet
        </h3>
        <p style={{ color: "var(--text-dim)", fontSize: 14, maxWidth: 360, margin: "0 auto" }}>
          Start writing to build your journal history.
        </p>
      </div>
    );
  }

  const visibleEmotions = showAllEmotions ? emotionCounts : emotionCounts.slice(0, VISIBLE_TAG_LIMIT);
  const hiddenEmotionCount = emotionCounts.length - VISIBLE_TAG_LIMIT;

  const visibleTopics = showAllTopics ? themeCounts : themeCounts.slice(0, VISIBLE_TAG_LIMIT);
  const hiddenTopicCount = themeCounts.length - VISIBLE_TAG_LIMIT;

  const hasActiveFilter = selectedTag !== null || searchQuery.trim() !== "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "slideUp 0.4s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontFamily: "var(--serif)", fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 400, lineHeight: 1.2 }}>
          Entry History
        </h2>
        <span style={{ fontSize: 13, color: "var(--text-dim)" }}>
          {filteredEntries.length}
          {hasActiveFilter ? ` of ${entries.length}` : ""} {entries.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      {/* Patterns at a Glance */}
      {entries.length >= 3 && (
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 16, padding: "20px 24px",
          display: "flex", flexDirection: "column", gap: 20,
          animation: "slideUp 0.4s ease",
        }}>
          <div style={{
            fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em",
            color: "var(--text-dim)", fontWeight: 600,
          }}>
            Patterns across your entries
          </div>

          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {/* Recurring themes */}
            {themeCounts.length > 0 && (
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 500, marginBottom: 10 }}>
                  Recurring themes
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {themeCounts.slice(0, 5).map(([theme, count]) => (
                    <div key={theme} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        fontSize: 13, color: "var(--text)", fontWeight: 500,
                        minWidth: 0, flex: 1, overflow: "hidden",
                        textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>{theme}</span>
                      <div style={{
                        width: 60, height: 4, background: "var(--border)",
                        borderRadius: 2, overflow: "hidden", flexShrink: 0,
                      }}>
                        <div style={{
                          height: "100%",
                          width: `${(count / themeCounts[0][1]) * 100}%`,
                          background: "var(--violet)", borderRadius: 2,
                        }} />
                      </div>
                      <span style={{ fontSize: 11, color: "var(--text-dim)", flexShrink: 0, minWidth: 20, textAlign: "right" }}>
                        {count}×
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top emotions */}
            {emotionCounts.length > 0 && (
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 500, marginBottom: 10 }}>
                  Most felt emotions
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {emotionCounts.slice(0, 6).map(([emotion, count], i) => {
                    const c = emotionColors[i % emotionColors.length];
                    return (
                      <span key={emotion} style={{
                        padding: "4px 12px", borderRadius: 100,
                        fontSize: 12, fontWeight: 500,
                        background: c.bg, color: c.color, border: `1px solid ${c.border}`,
                      }}>
                        {emotion}
                        <span style={{ opacity: 0.55, marginLeft: 4, fontSize: 11 }}>{count}×</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sentiment trend row */}
          {sentimentTrend && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              paddingTop: 16, borderTop: "1px solid var(--border)",
              flexWrap: "wrap",
            }}>
              <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Emotional trend:</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: sentimentTrend.color }}>
                {sentimentTrend.icon} {sentimentTrend.label}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-dim)", marginLeft: "auto" }}>
                based on last {entries.length} entries
              </span>
            </div>
          )}

          {/* Reflection prompt */}
          {themeCounts.length > 0 && themeCounts[0][1] >= 3 && (
            <div style={{
              background: "var(--bg-input)", border: "1px solid var(--border)",
              borderLeft: "3px solid var(--accent)",
              borderRadius: 10, padding: "12px 16px",
              fontSize: 13, color: "var(--text-muted)",
              fontStyle: "italic", lineHeight: 1.6,
            }}>
              You&apos;ve written about{" "}
              <strong style={{ fontStyle: "normal", color: "var(--text)" }}>
                &ldquo;{themeCounts[0][0]}&rdquo;
              </strong>{" "}
              {themeCounts[0][1]} times. What is it about this area of your life that keeps coming up?
            </div>
          )}
        </div>
      )}

      {/* ── Search & Filter Section ── */}
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 16, overflow: "hidden",
      }}>
        {/* Search Bar */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              fontSize: 15, color: "var(--text-dim)", pointerEvents: "none",
            }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entries by keyword, emotion, or topic..."
              style={{
                width: "100%", padding: "10px 14px 10px 40px",
                background: "var(--bg-input)", border: "1px solid var(--border)",
                borderRadius: 10, fontSize: 13, color: "var(--text)",
                fontFamily: "var(--sans)",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "var(--border)", border: "none", borderRadius: "50%",
                  width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", fontSize: 11, color: "var(--text-dim)",
                  fontFamily: "var(--sans)",
                }}
              >✕</button>
            )}
          </div>
        </div>

        {/* Categorized Tags */}
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ── Emotions Section ── */}
          {emotionCounts.length > 0 && (
            <div>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
              }}>
                <span style={{ fontSize: 13 }}>💭</span>
                <span style={{
                  fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em",
                  color: "var(--text-dim)", fontWeight: 600,
                }}>Emotions</span>
                <div style={{
                  flex: 1, height: 1, background: "var(--border)", marginLeft: 4,
                }} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {visibleEmotions.map(([emotion, count], i) => {
                  const active = selectedTag?.value === emotion && selectedTag?.type === "emotion";
                  const c = emotionColors[i % emotionColors.length];
                  return (
                    <button
                      key={emotion}
                      onClick={() => handleTagClick(emotion, "emotion")}
                      style={{
                        padding: "6px 14px", borderRadius: 100,
                        fontSize: 13, fontWeight: active ? 600 : 500,
                        background: active ? c.color : c.bg,
                        color: active ? "#fff" : c.color,
                        border: `1px solid ${active ? c.color : c.border}`,
                        cursor: "pointer",
                        transition: "all 0.18s",
                        fontFamily: "var(--sans)",
                      }}
                    >
                      {emotion}
                      <span style={{
                        opacity: active ? 0.7 : 0.5, marginLeft: 5, fontSize: 11,
                      }}>{count}</span>
                    </button>
                  );
                })}
                {hiddenEmotionCount > 0 && (
                  <button
                    onClick={() => setShowAllEmotions(!showAllEmotions)}
                    style={{
                      padding: "6px 16px", borderRadius: 100,
                      fontSize: 13, fontWeight: 500,
                      background: "transparent",
                      color: "var(--text-dim)",
                      border: "1px dashed var(--border)",
                      cursor: "pointer",
                      transition: "all 0.18s",
                      fontFamily: "var(--sans)",
                    }}
                  >
                    {showAllEmotions ? "Show less" : `+ ${hiddenEmotionCount} more`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Topics Section ── */}
          {themeCounts.length > 0 && (
            <div>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
              }}>
                <span style={{ fontSize: 13 }}>🏷️</span>
                <span style={{
                  fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em",
                  color: "var(--text-dim)", fontWeight: 600,
                }}>Topics &amp; Context</span>
                <div style={{
                  flex: 1, height: 1, background: "var(--border)", marginLeft: 4,
                }} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {visibleTopics.map(([topic, count], i) => {
                  const active = selectedTag?.value === topic && selectedTag?.type === "topic";
                  const c = topicColors[i % topicColors.length];
                  return (
                    <button
                      key={topic}
                      onClick={() => handleTagClick(topic, "topic")}
                      style={{
                        padding: "6px 14px", borderRadius: 100,
                        fontSize: 13, fontWeight: active ? 600 : 500,
                        background: active ? c.color : c.bg,
                        color: active ? "#fff" : c.color,
                        border: `1px solid ${active ? c.color : c.border}`,
                        cursor: "pointer",
                        transition: "all 0.18s",
                        fontFamily: "var(--sans)",
                      }}
                    >
                      {topic}
                      <span style={{
                        opacity: active ? 0.7 : 0.5, marginLeft: 5, fontSize: 11,
                      }}>{count}</span>
                    </button>
                  );
                })}
                {hiddenTopicCount > 0 && (
                  <button
                    onClick={() => setShowAllTopics(!showAllTopics)}
                    style={{
                      padding: "6px 16px", borderRadius: 100,
                      fontSize: 13, fontWeight: 500,
                      background: "transparent",
                      color: "var(--text-dim)",
                      border: "1px dashed var(--border)",
                      cursor: "pointer",
                      transition: "all 0.18s",
                      fontFamily: "var(--sans)",
                    }}
                  >
                    {showAllTopics ? "Show less" : `+ ${hiddenTopicCount} more`}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Active filter indicator */}
        {hasActiveFilter && (
          <div style={{
            padding: "10px 20px",
            borderTop: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "var(--bg-card-hover)",
          }}>
            <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
              Showing {filteredEntries.length} of {entries.length} entries
              {selectedTag && (
                <span> filtered by <span style={{ color: selectedTag.type === "emotion" ? "var(--rose)" : "var(--violet)", fontWeight: 600 }}>{selectedTag.value}</span></span>
              )}
              {searchQuery.trim() && (
                <span> matching &ldquo;<span style={{ color: "var(--accent)", fontWeight: 500 }}>{searchQuery.trim()}</span>&rdquo;</span>
              )}
            </span>
            <button
              onClick={() => { setSelectedTag(null); setSearchQuery(""); }}
              style={{
                fontSize: 12, color: "var(--text-dim)", background: "var(--border)",
                border: "none", padding: "4px 12px", borderRadius: 6,
                cursor: "pointer", fontFamily: "var(--sans)", fontWeight: 500,
                transition: "all 0.15s",
              }}
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Empty filtered state */}
      {filteredEntries.length === 0 && hasActiveFilter && (
        <div style={{
          textAlign: "center", padding: "48px 24px",
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 16,
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔎</div>
          <p style={{ color: "var(--text-dim)", fontSize: 14 }}>
            No entries found
            {selectedTag && <> tagged with &ldquo;{selectedTag.value}&rdquo;</>}
            {searchQuery.trim() && <> matching &ldquo;{searchQuery.trim()}&rdquo;</>}
            .
          </p>
          <button
            onClick={() => { setSelectedTag(null); setSearchQuery(""); }}
            style={{
              marginTop: 12, fontSize: 13, color: "var(--accent)",
              background: "var(--accent-dim)", border: "1px solid rgba(124,154,130,0.15)",
              padding: "8px 20px", borderRadius: 8,
              cursor: "pointer", fontFamily: "var(--sans)", fontWeight: 500,
            }}
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Entry list — paginated */}
      {filteredEntries.slice(0, visibleCount).map((entry, index) => (
        <div
          key={entry.id}
          style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 16, overflow: "hidden",
            transition: "all 0.2s",
            animation: `slideUp 0.4s ease`,
            animationDelay: `${index * 0.04}s`,
            animationFillMode: "backwards"
          }}
        >
          {/* Date header */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 24px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-card-hover)"
          }}>
            <span style={{ fontSize: 13, color: "var(--text-dim)" }}>
              {format(new Date(entry.created_at), "MMMM d, yyyy · h:mm a")}
            </span>
            <span style={{
              fontSize: 13, fontWeight: 600,
              color: getSentimentColor(entry.sentiment_score ?? 0),
              background: entry.sentiment_score > 0.3
                ? "var(--accent-dim)"
                : entry.sentiment_score < -0.3
                  ? "var(--rose-dim)"
                  : "var(--amber-dim)",
              padding: "2px 10px", borderRadius: 100
            }}>
              {(entry.sentiment_score ?? 0).toFixed(2)}
            </span>
          </div>

          {/* Content */}
          <div style={{ padding: "20px 24px" }}>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 16 }}>
              {entry.content}
            </p>

            {/* Tags — visually separated */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Inline emotions */}
              {entry.emotions?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginRight: 2 }}>Felt</span>
                  {entry.emotions.map((e: string, i: number) => {
                    const c = emotionColors[i % emotionColors.length];
                    const active = selectedTag?.value === e && selectedTag?.type === "emotion";
                    return (
                      <button
                        key={`${entry.id}-e-${e}`}
                        onClick={() => handleTagClick(e, "emotion")}
                        style={{
                          padding: "3px 10px", borderRadius: 100, fontSize: 12, fontWeight: active ? 600 : 500,
                          background: active ? c.color : c.bg, color: active ? "#fff" : c.color,
                          border: `1px solid ${active ? c.color : c.border}`,
                          cursor: "pointer", fontFamily: "var(--sans)", transition: "all 0.15s",
                        }}
                      >{e}</button>
                    );
                  })}
                </div>
              )}
              {/* Inline topics */}
              {entry.themes?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginRight: 2 }}>About</span>
                  {entry.themes.map((t: string, i: number) => {
                    const active = selectedTag?.value === t && selectedTag?.type === "topic";
                    const c = topicColors[i % topicColors.length];
                    return (
                      <button
                        key={`${entry.id}-t-${t}`}
                        onClick={() => handleTagClick(t, "topic")}
                        style={{
                          padding: "3px 10px", borderRadius: 100, fontSize: 12, fontWeight: active ? 600 : 500,
                          background: active ? c.color : c.bg, color: active ? "#fff" : c.color,
                          border: `1px solid ${active ? c.color : c.border}`,
                          cursor: "pointer", fontFamily: "var(--sans)", transition: "all 0.15s",
                        }}
                      >{t}</button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reflection */}
            {entry.reflection_prompt && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                <p style={{
                  fontSize: 13, fontStyle: "italic", color: "var(--text-dim)",
                  lineHeight: 1.6, paddingLeft: 12, borderLeft: "2px solid var(--accent-dim)"
                }}>
                  {entry.reflection_prompt}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Load More */}
      {filteredEntries.length > visibleCount && (
        <button
          onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
          style={{
            width: "100%", padding: "12px",
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 12, fontSize: 13, fontWeight: 500,
            color: "var(--text-dim)", cursor: "pointer",
            fontFamily: "var(--sans)", transition: "all 0.18s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.color = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-dim)";
          }}
        >
          Load more · {filteredEntries.length - visibleCount} remaining
        </button>
      )}

      {/* All loaded indicator */}
      {filteredEntries.length > 0 && filteredEntries.length <= visibleCount && visibleCount > PAGE_SIZE && (
        <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-dim)", padding: "4px 0 8px" }}>
          All {filteredEntries.length} entries loaded
        </p>
      )}
    </div>
  );
}

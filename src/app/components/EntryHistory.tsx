"use client";

import { useEffect, useState, useMemo } from "react";
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
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntries = async () => {
      const { data, error: dbError } = await supabase
        .from("entries")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (dbError) {
        setError("Failed to load entries.");
        console.error(dbError);
      }
      setEntries(data || []);
      setLoading(false);
    };
    fetchEntries();
  }, [userId]);

  // Collect unique themes across all entries
  const allThemes = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach((e) => {
      e.themes?.forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (!selectedTheme) return entries;
    return entries.filter((e) => e.themes?.includes(selectedTheme));
  }, [entries, selectedTheme]);

  const tagColors = [
    { bg: "var(--accent-dim)", color: "var(--accent)", border: "rgba(110,231,183,0.15)" },
    { bg: "var(--violet-dim)", color: "var(--violet)", border: "rgba(167,139,250,0.15)" },
    { bg: "var(--rose-dim)", color: "var(--rose)", border: "rgba(251,113,133,0.15)" },
    { bg: "var(--amber-dim)", color: "var(--amber)", border: "rgba(251,191,36,0.15)" },
  ];

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return "var(--accent)";
    if (score < -0.3) return "var(--rose)";
    return "var(--amber)";
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
        background: "var(--rose-dim)", border: "1px solid rgba(251,113,133,0.15)",
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "slideUp 0.4s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontFamily: "var(--serif)", fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 400, lineHeight: 1.2 }}>
          Entry History
        </h2>
        <span style={{ fontSize: 13, color: "var(--text-dim)" }}>
          {filteredEntries.length}
          {selectedTheme ? ` of ${entries.length}` : ""} {entries.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      {/* Theme Filter Bar */}
      {allThemes.length > 0 && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 8,
          padding: "14px 16px",
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 14,
        }}>
          {/* All pill */}
          <button
            onClick={() => setSelectedTheme(null)}
            style={{
              padding: "6px 16px", borderRadius: 100,
              fontSize: 13, fontWeight: selectedTheme === null ? 600 : 500,
              background: selectedTheme === null ? "var(--accent)" : "transparent",
              color: selectedTheme === null ? "#0a0a0b" : "var(--text-dim)",
              border: selectedTheme === null ? "1px solid transparent" : "1px solid var(--border)",
              cursor: "pointer",
              transition: "all 0.18s",
              fontFamily: "var(--sans)",
            }}
          >
            All
          </button>

          {allThemes.map((theme, i) => {
            const active = selectedTheme === theme;
            const c = tagColors[i % tagColors.length];
            return (
              <button
                key={theme}
                onClick={() => setSelectedTheme(active ? null : theme)}
                style={{
                  padding: "6px 16px", borderRadius: 100,
                  fontSize: 13, fontWeight: active ? 600 : 500,
                  background: active ? c.color : c.bg,
                  color: active ? "#0a0a0b" : c.color,
                  border: `1px solid ${active ? c.color : c.border}`,
                  cursor: "pointer",
                  transition: "all 0.18s",
                  fontFamily: "var(--sans)",
                }}
              >
                {theme}
              </button>
            );
          })}
        </div>
      )}

      {/* Empty filtered state */}
      {filteredEntries.length === 0 && selectedTheme && (
        <div style={{
          textAlign: "center", padding: "48px 24px",
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 16,
        }}>
          <p style={{ color: "var(--text-dim)", fontSize: 14 }}>
            No entries tagged with &ldquo;{selectedTheme}&rdquo;.
          </p>
        </div>
      )}

      {/* Entry list */}
      {filteredEntries.map((entry, index) => (
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
            background: "rgba(255,255,255,0.01)"
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

            {/* Tags */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {entry.emotions?.map((e: string, i: number) => {
                const c = tagColors[i % tagColors.length];
                return (
                  <span key={`${entry.id}-e-${e}`} style={{
                    padding: "4px 12px", borderRadius: 100, fontSize: 12, fontWeight: 500,
                    background: c.bg, color: c.color, border: `1px solid ${c.border}`
                  }}>{e}</span>
                );
              })}
              {entry.themes?.map((t: string, i: number) => {
                const active = selectedTheme === t;
                return (
                  <button
                    key={`${entry.id}-t-${t}`}
                    onClick={() => setSelectedTheme(active ? null : t)}
                    style={{
                      padding: "4px 12px", borderRadius: 100, fontSize: 12, fontWeight: active ? 600 : 500,
                      background: active ? "var(--violet)" : "var(--violet-dim)",
                      color: active ? "#0a0a0b" : "var(--violet)",
                      border: active ? "1px solid var(--violet)" : "1px solid rgba(167,139,250,0.15)",
                      cursor: "pointer",
                      fontFamily: "var(--sans)",
                      transition: "all 0.15s",
                    }}
                  >{t}</button>
                );
              })}
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
    </div>
  );
}

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface CoachingResult {
  diagnosis: string;
  framework: string;
  action: string;
  why: string;
}

interface AnalysisResult {
  emotions: string[];
  themes: string[];
  sentiment_score: number;
  reflection_prompt: string;
  coaching: CoachingResult;
}

export default function JournalEntry({ userId }: { userId: string }) {
  const [content, setContent] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"express" | "reflect" | "guide">("reflect");

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
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.status === 429) {
        const data = await res.json();
        const wait = data.retryAfter || 60;
        setError(`Rate limit reached. Please wait ${wait} seconds before trying again.`);
        return;
      }

      if (!res.ok) throw new Error("Analysis failed");

      const result: AnalysisResult = await res.json();

      // Validate
      if (!result.emotions || !result.themes || typeof result.sentiment_score !== "number") {
        throw new Error("Invalid analysis response");
      }

      result.sentiment_score = Math.max(-1, Math.min(1, result.sentiment_score));
      setAnalysis(result);

      const { error: dbError } = await supabase.from("entries").insert({
        user_id: userId,
        content,
        emotions: result.emotions,
        themes: result.themes,
        sentiment_score: result.sentiment_score,
        reflection_prompt: result.reflection_prompt,
        coaching: result.coaching,
      });

      if (dbError) throw dbError;
      setSaved(true);
    } catch (err) {
      console.error(err);
      if (!error) setError("Something went wrong. Try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setContent("");
    setAnalysis(null);
    setSaved(false);
    setError("");
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return "var(--accent)";
    if (score < -0.3) return "var(--rose)";
    return "var(--amber)";
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.5) return "Very Positive";
    if (score > 0.2) return "Positive";
    if (score > -0.2) return "Neutral";
    if (score > -0.5) return "Negative";
    return "Very Negative";
  };

  const tagColors = [
    { bg: "var(--accent-dim)", color: "var(--accent)", border: "rgba(110,231,183,0.15)" },
    { bg: "var(--violet-dim)", color: "var(--violet)", border: "rgba(167,139,250,0.15)" },
    { bg: "var(--rose-dim)", color: "var(--rose)", border: "rgba(251,113,133,0.15)" },
    { bg: "var(--amber-dim)", color: "var(--amber)", border: "rgba(251,191,36,0.15)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, animation: "slideUp 0.4s ease" }}>
      {/* Header */}
      <div>
        <h2 style={{
          fontFamily: "var(--serif)", fontSize: "clamp(24px, 4vw, 32px)",
          fontWeight: 400, marginBottom: 8, lineHeight: 1.2
        }}>
          How are you feeling today?
        </h2>
        <p style={{ color: "var(--text-dim)", fontSize: 14, lineHeight: 1.5 }}>
          Write whatever&apos;s on your mind. No pressure to be articulate.
        </p>
      </div>

      {/* Mode selector */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {(["express", "reflect", "guide"] as const).map((m) => {
          const labels = { express: "Just express", reflect: "Reflect", guide: "Get suggestions" };
          const active = mode === m;
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: "6px 14px", borderRadius: 8,
                fontSize: 12, fontWeight: active ? 600 : 400,
                background: active ? "var(--accent-dim)" : "transparent",
                color: active ? "var(--accent)" : "var(--text-dim)",
                border: active ? "1px solid rgba(110,231,183,0.2)" : "1px solid var(--border)",
                cursor: "pointer", fontFamily: "var(--sans)",
                transition: "all 0.15s",
              }}
            >
              {labels[m]}
            </button>
          );
        })}
        <span style={{ fontSize: 11, color: "var(--text-dim)", marginLeft: 2 }}>
          {mode === "express"
            ? "Tags your emotions only"
            : mode === "reflect"
            ? "Adds a reflection question"
            : "Adds reflection + a suggestion"}
        </span>
      </div>

      {/* Textarea */}
      <div style={{ position: "relative" }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Today I felt..."
          style={{
            width: "100%", minHeight: 200, maxHeight: 400,
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 14, padding: "20px",
            color: "var(--text)", fontSize: 15, lineHeight: 1.7,
            fontFamily: "var(--sans)",
            resize: "vertical",
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => e.target.style.borderColor = "var(--border-focus)"}
          onBlur={(e) => e.target.style.borderColor = "var(--border)"}
        />
        <div style={{
          position: "absolute", bottom: 16, left: 20,
          fontSize: 12, color: "var(--text-dim)"
        }}>
          {content.length} characters
          {content.length > 0 && content.length < 20 && (
            <span style={{ color: "var(--amber)", marginLeft: 8 }}>
              {20 - content.length} more needed
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, alignItems: "center" }}>
        {saved && (
          <button onClick={handleReset} style={{
            padding: "12px 24px", borderRadius: 10,
            fontSize: 14, fontWeight: 500, fontFamily: "var(--sans)",
            background: "none", border: "1px solid var(--border)",
            color: "var(--text-muted)", cursor: "pointer",
            transition: "all 0.2s"
          }}>
            New entry
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={analyzing || saved || content.trim().length < 20}
          style={{
            padding: "12px 28px", borderRadius: 10,
            fontSize: 14, fontWeight: 600, fontFamily: "var(--sans)",
            background: saved
              ? "var(--accent-dim)"
              : analyzing || content.trim().length < 20
                ? "var(--border)"
                : "var(--accent)",
            color: saved
              ? "var(--accent)"
              : analyzing || content.trim().length < 20
                ? "var(--text-dim)"
                : "#0a0a0b",
            border: saved ? "1px solid rgba(110,231,183,0.2)" : "none",
            cursor: analyzing || saved || content.trim().length < 20 ? "not-allowed" : "pointer",
            transition: "all 0.25s",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          {analyzing && (
            <div style={{
              width: 14, height: 14, borderRadius: "50%",
              border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#0a0a0b",
              animation: "spin 0.6s linear infinite"
            }} />
          )}
          {saved ? "✓ Saved" : analyzing ? "Analyzing..." : "Analyze & Save"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: "var(--rose-dim)", border: "1px solid rgba(251,113,133,0.15)",
          borderRadius: 10, padding: "12px 16px",
          fontSize: 13, color: "var(--rose)", lineHeight: 1.5,
          animation: "slideDown 0.3s ease"
        }}>
          {error}
        </div>
      )}

      {/* Analysis Result */}
      {analysis && (
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 16, overflow: "hidden",
          animation: "slideUp 0.5s ease"
        }}>
          {/* Success banner */}
          {saved && (
            <div style={{
              background: "var(--accent-dim)", borderBottom: "1px solid rgba(110,231,183,0.1)",
              padding: "10px 24px", fontSize: 13, color: "var(--accent)",
              fontWeight: 500, display: "flex", alignItems: "center", gap: 8
            }}>
              <span>✓</span> Entry saved successfully
            </div>
          )}

          <div style={{ padding: "28px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Emotions */}
            <div>
              <div style={{
                fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em",
                color: "var(--text-dim)", fontWeight: 600, marginBottom: 10
              }}>Emotions Detected</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {analysis.emotions.map((emotion, i) => {
                  const c = tagColors[i % tagColors.length];
                  return (
                    <span key={`${emotion}-${i}`} style={{
                      padding: "6px 14px", borderRadius: 100,
                      fontSize: 13, fontWeight: 500,
                      background: c.bg, color: c.color,
                      border: `1px solid ${c.border}`,
                      animation: `popIn 0.3s ease forwards`,
                      animationDelay: `${i * 0.1}s`
                    }}>
                      {emotion}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Themes */}
            <div>
              <div style={{
                fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em",
                color: "var(--text-dim)", fontWeight: 600, marginBottom: 10
              }}>Themes</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {analysis.themes.map((theme, i) => (
                  <span key={`${theme}-${i}`} style={{
                    padding: "6px 14px", borderRadius: 100,
                    fontSize: 13, fontWeight: 500,
                    background: "var(--violet-dim)", color: "var(--violet)",
                    border: "1px solid rgba(167,139,250,0.15)",
                  }}>
                    {theme}
                  </span>
                ))}
              </div>
            </div>

            {/* Sentiment */}
            <div>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: 8
              }}>
                <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)", fontWeight: 600 }}>
                  Sentiment
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: getSentimentColor(analysis.sentiment_score) }}>
                  {getSentimentLabel(analysis.sentiment_score)} ({analysis.sentiment_score.toFixed(2)})
                </span>
              </div>
              <div style={{
                height: 6, background: "var(--border)", borderRadius: 3,
                overflow: "hidden", position: "relative"
              }}>
                <div style={{
                  position: "absolute",
                  left: `${((analysis.sentiment_score + 1) / 2) * 100}%`,
                  top: 0, width: 12, height: 6,
                  background: getSentimentColor(analysis.sentiment_score),
                  borderRadius: 3,
                  transform: "translateX(-50%)",
                  transition: "left 0.5s ease"
                }} />
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 10, color: "var(--text-dim)", marginTop: 4
              }}>
                <span>Negative</span>
                <span>Neutral</span>
                <span>Positive</span>
              </div>
            </div>

            {/* Reflection */}
            {analysis.reflection_prompt && (
              <div style={{
                background: "var(--bg-input)", border: "1px solid var(--border)",
                borderRadius: 12, padding: "16px 20px",
                borderLeft: "3px solid var(--accent)"
              }}>
                <div style={{
                  fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em",
                  color: "var(--text-dim)", fontWeight: 600, marginBottom: 8
                }}>Reflection Prompt</div>
                <p style={{
                  fontSize: 14, fontStyle: "italic", color: "var(--text-muted)",
                  lineHeight: 1.6
                }}>
                  {analysis.reflection_prompt}
                </p>
              </div>
            )}

            {/* Insights — hidden in express mode */}
            {analysis.coaching && mode !== "express" && (
              <div style={{
                background: "linear-gradient(135deg, rgba(110,231,183,0.03) 0%, rgba(167,139,250,0.03) 100%)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                overflow: "hidden",
                animation: "slideUp 0.5s ease"
              }}>
                {/* Header */}
                <div style={{
                  padding: "14px 20px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex", alignItems: "center", gap: 10,
                  background: "rgba(110,231,183,0.04)"
                }}>
                  <span style={{ fontSize: 18 }}>🔍</span>
                  <span style={{
                    fontSize: 12, fontWeight: 600, letterSpacing: "0.08em",
                    textTransform: "uppercase", color: "var(--accent)"
                  }}>Insights</span>
                  <span style={{
                    fontSize: 11, color: "var(--text-dim)", marginLeft: "auto",
                    fontStyle: "italic"
                  }}>Based on this entry</span>
                </div>

                <div className="coaching-content" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Diagnosis */}
                  <div>
                    <div style={{
                      fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em",
                      color: "var(--text-dim)", fontWeight: 600, marginBottom: 6
                    }}>What&apos;s coming up</div>
                    <p style={{
                      fontSize: 14, color: "var(--text)", lineHeight: 1.6
                    }}>
                      {analysis.coaching.diagnosis}
                    </p>
                  </div>

                  {/* Framework — renamed */}
                  <div style={{
                    background: "var(--accent-dim)",
                    border: "1px solid rgba(110,231,183,0.12)",
                    borderRadius: 10, padding: "14px 16px"
                  }}>
                    <div style={{
                      fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em",
                      color: "var(--accent)", fontWeight: 600, marginBottom: 6,
                      display: "flex", alignItems: "center", gap: 6
                    }}>
                      <span style={{ fontSize: 12 }}>📚</span> The pattern
                    </div>
                    <p style={{
                      fontSize: 14, color: "var(--text)", lineHeight: 1.6
                    }}>
                      {analysis.coaching.framework}
                    </p>
                  </div>

                  {/* Action — only in guide mode, marked optional */}
                  {mode === "guide" && (
                    <div style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderLeft: "3px solid var(--violet)",
                      borderRadius: 10, padding: "14px 16px"
                    }}>
                      <div style={{
                        fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em",
                        color: "var(--violet)", fontWeight: 600, marginBottom: 6,
                        display: "flex", alignItems: "center", gap: 6
                      }}>
                        <span style={{ fontSize: 12 }}>⚡</span> One thing to try
                        <span style={{
                          marginLeft: "auto", fontSize: 10,
                          color: "var(--text-dim)", fontWeight: 400,
                          fontStyle: "italic", textTransform: "none", letterSpacing: "normal"
                        }}>optional</span>
                      </div>
                      <p style={{
                        fontSize: 14, color: "var(--text)", lineHeight: 1.6,
                        fontWeight: 500
                      }}>
                        {analysis.coaching.action}
                      </p>
                    </div>
                  )}

                  {/* Why — only in guide mode */}
                  {mode === "guide" && (
                    <div style={{
                      fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6,
                      fontStyle: "italic", paddingLeft: 12,
                      borderLeft: "2px solid var(--border)"
                    }}>
                      <span style={{ fontWeight: 600, fontStyle: "normal", color: "var(--text-dim)" }}>Why: </span>
                      {analysis.coaching.why}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post-analysis next-step prompt */}
      {analysis && saved && (
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: "18px 22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          animation: "slideUp 0.4s ease",
        }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", marginBottom: 3 }}>
              Your entry is saved.
            </p>
            <p style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.5 }}>
              You&apos;re done for now — or write another entry, it&apos;s up to you.
            </p>
          </div>
          <button
            onClick={handleReset}
            style={{
              padding: "10px 20px", borderRadius: 10,
              fontSize: 13, fontWeight: 600, fontFamily: "var(--sans)",
              background: "var(--accent)", color: "#0a0a0b",
              border: "none", cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Write another
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

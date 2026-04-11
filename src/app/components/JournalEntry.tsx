"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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

interface ContextData {
  activity?: string;
  sleep?: string;
  weather?: string;
  caffeine?: boolean;
  screenTime?: string;
}

// ─── Dynamic Prompt Logic ───────────────────────────────────────
interface PromptConfig {
  title: string;
  subtitle: string;
}

function getPromptFromSentiment(avgSentiment: number | null, entryCount: number): PromptConfig {
  if (entryCount === 0 || avgSentiment === null) {
    return {
      title: "How are you feeling today?",
      subtitle: "Write whatever\u2019s on your mind. No pressure to be articulate.",
    };
  }
  if (avgSentiment < -0.2) {
    return {
      title: "It\u2019s been a heavy week.",
      subtitle: "What\u2019s one small thing that went well today? Even tiny wins count.",
    };
  }
  if (avgSentiment > 0.2) {
    return {
      title: "You\u2019ve been in a good headspace lately.",
      subtitle: "What\u2019s fueling that momentum? Let\u2019s capture it.",
    };
  }
  return {
    title: "What\u2019s on your mind right now?",
    subtitle: "Check in with yourself \u2014 no filter needed.",
  };
}

// ─── Voice Recognition Hook ────────────────────────────────────
function useVoiceRecognition(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [voiceError, setVoiceError] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  // Source of truth: does the user WANT to be listening? (survives auto-restarts)
  const wantListening = useRef(false);
  // Tracks highest result index we've already appended
  const processedUpTo = useRef(-1);

  function createRecognition() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";
    return rec;
  }

  useEffect(() => {
    const rec = createRecognition();
    if (!rec) {
      setIsSupported(false);
      return;
    }
    recognitionRef.current = rec;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (event: any) => {
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        if (i <= processedUpTo.current) continue;
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
          processedUpTo.current = i;
        }
      }
      if (final) onTranscript(final);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (event: any) => {
      const err = event.error;
      if (err === "not-allowed") {
        wantListening.current = false;
        setVoiceError("Microphone access denied. Allow it in browser settings.");
        setIsListening(false);
      } else if (err === "no-speech") {
        // Desktop Chrome fires this after ~5s silence — don't error,
        // onend will auto-restart the session.
      } else if (err !== "aborted") {
        wantListening.current = false;
        setVoiceError("Voice recognition error. Try again.");
        setIsListening(false);
      }
    };

    rec.onend = () => {
      // Desktop Chrome kills sessions after silence / no-speech.
      // Auto-restart if the user hasn't explicitly stopped.
      if (wantListening.current) {
        try {
          processedUpTo.current = -1;
          rec.start();
        } catch {
          wantListening.current = false;
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    return () => {
      wantListening.current = false;
      rec.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    setVoiceError("");

    if (wantListening.current) {
      wantListening.current = false;
      rec.stop();
      setIsListening(false);
    } else {
      try {
        processedUpTo.current = -1;
        wantListening.current = true;
        rec.start();
        setIsListening(true);
      } catch {
        wantListening.current = false;
        setVoiceError("Could not start voice recognition.");
      }
    }
  }, []);

  return { isListening, isSupported, voiceError, toggle };
}

// ─── SVG Icons (monochrome, 18x18) ────────────────────────────
const Icons = {
  activity: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  sleep: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  sun: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  coffee: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="2" x2="6" y2="4" /><line x1="10" y1="2" x2="10" y2="4" /><line x1="14" y1="2" x2="14" y2="4" />
    </svg>
  ),
  monitor: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  mic: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  stop: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  ),
};

// ─── Context Icon Button + Popover ─────────────────────────────
interface ContextIconProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  activeColor: string;
  activeBg: string;
  children: React.ReactNode;
}

function ContextIconButton({ icon, label, active, activeColor, activeBg, children }: ContextIconProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        title={label}
        style={{
          width: 38, height: 38, borderRadius: 10,
          border: "none",
          background: active ? activeBg : "transparent",
          color: active ? activeColor : "var(--text-dim)",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.18s",
          position: "relative",
        }}
      >
        {icon}
        {active && (
          <span style={{
            position: "absolute", top: 4, right: 4,
            width: 5, height: 5, borderRadius: "50%",
            background: activeColor,
          }} />
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: "50%",
          transform: "translateX(-50%)",
          background: "var(--bg-elevated)", border: "1px solid var(--border)",
          borderRadius: 12, padding: 6,
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          zIndex: 100,
          minWidth: 120,
          animation: "popIn 0.15s ease",
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

// Popover option button
function PopoverOption({
  label,
  active,
  activeColor,
  activeBg,
  onClick,
}: {
  label: string;
  active: boolean;
  activeColor: string;
  activeBg: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "block", width: "100%", textAlign: "left",
        padding: "7px 12px", borderRadius: 8,
        fontSize: 12, fontWeight: active ? 600 : 400,
        fontFamily: "var(--sans)",
        background: active ? activeBg : "transparent",
        color: active ? activeColor : "var(--text-muted)",
        border: "none", cursor: "pointer",
        transition: "all 0.12s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}


// ─── Main Component ────────────────────────────────────────────
export default function JournalEntry({ userId }: { userId: string }) {
  const [content, setContent] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"express" | "reflect" | "guide">("reflect");

  // Context state
  const [activity, setActivity] = useState("");
  const [sleep, setSleep] = useState("");
  const [weather, setWeather] = useState("");
  const [caffeine, setCaffeine] = useState(false);
  const [screenTime, setScreenTime] = useState("");

  // Dynamic prompt state
  const [recentSentiment, setRecentSentiment] = useState<number | null>(null);
  const [recentCount, setRecentCount] = useState(0);

  // Voice recognition
  const handleVoiceTranscript = useCallback(
    (text: string) => {
      setContent((prev) => (prev ? prev + " " + text : text));
    },
    []
  );
  const voice = useVoiceRecognition(handleVoiceTranscript);

  // Fetch recent entries for dynamic prompt
  useEffect(() => {
    const fetchRecent = async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data } = await supabase
        .from("entries")
        .select("sentiment_score")
        .eq("user_id", userId)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        const avg = data.reduce((sum: number, e: { sentiment_score: number }) => sum + (e.sentiment_score ?? 0), 0) / data.length;
        setRecentSentiment(avg);
        setRecentCount(data.length);
      }
    };
    fetchRecent();
  }, [userId]);

  const dynamicPrompt = useMemo(
    () => getPromptFromSentiment(recentSentiment, recentCount),
    [recentSentiment, recentCount]
  );

  // Build context object for submission
  const buildContext = (): ContextData | undefined => {
    const ctx: ContextData = {};
    let hasAny = false;

    if (activity) { ctx.activity = activity; hasAny = true; }
    if (sleep) { ctx.sleep = sleep; hasAny = true; }
    if (weather) { ctx.weather = weather; hasAny = true; }
    if (caffeine) { ctx.caffeine = true; hasAny = true; }
    if (screenTime) { ctx.screenTime = screenTime; hasAny = true; }

    return hasAny ? ctx : undefined;
  };

  const contextCount = useMemo(() => {
    let count = 0;
    if (activity) count++;
    if (sleep) count++;
    if (weather) count++;
    if (caffeine) count++;
    if (screenTime) count++;
    return count;
  }, [activity, sleep, weather, caffeine, screenTime]);

  const handleSubmit = async () => {
    if (content.trim().length < 20) {
      setError("Write at least 20 characters for meaningful analysis.");
      return;
    }

    // Stop voice if still listening
    if (voice.isListening) voice.toggle();

    setAnalyzing(true);
    setError("");
    setAnalysis(null);
    setSaved(false);

    try {
      const context = buildContext();

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, context }),
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
        context: context || null,
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
    setActivity("");
    setSleep("");
    setWeather("");
    setCaffeine(false);
    setScreenTime("");
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

  // ─── Color configs for each context category ─────────────
  const ctxColors = {
    activity: { color: "#6ee7b7", bg: "rgba(110,231,183,0.1)" },
    sleep: { color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
    weather: { color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
    caffeine: { color: "#fb923c", bg: "rgba(251,146,60,0.1)" },
    screen: { color: "#fb7185", bg: "rgba(251,113,133,0.1)" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "slideUp 0.4s ease" }}>
      {/* ── Dynamic Header ── */}
      <div>
        <h2 style={{
          fontFamily: "var(--serif)", fontSize: "clamp(24px, 4vw, 32px)",
          fontWeight: 400, marginBottom: 8, lineHeight: 1.2
        }}>
          {dynamicPrompt.title}
        </h2>
        <p style={{ color: "var(--text-dim)", fontSize: 14, lineHeight: 1.5 }}>
          {dynamicPrompt.subtitle}
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

      {/* ── Context Icon Bar + Textarea ── */}
      <div style={{
        background: "var(--bg-card)",
        borderRadius: 16,
        overflow: "visible",
        boxShadow: "var(--card-shadow)",
      }}>
        {/* Compact icon bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 2,
          padding: "6px 8px",
          borderBottom: "1px solid var(--border)",
        }}>
          {/* Activity */}
          <ContextIconButton
            icon={Icons.activity}
            label="Activity"
            active={!!activity}
            activeColor={ctxColors.activity.color}
            activeBg={ctxColors.activity.bg}
          >
            {["Gym", "Running", "Yoga", "Bouldering", "Walking", "Swimming"].map((opt) => (
              <PopoverOption
                key={opt}
                label={opt}
                active={activity === opt.toLowerCase()}
                activeColor={ctxColors.activity.color}
                activeBg={ctxColors.activity.bg}
                onClick={() => setActivity(activity === opt.toLowerCase() ? "" : opt.toLowerCase())}
              />
            ))}
          </ContextIconButton>

          {/* Sleep */}
          <ContextIconButton
            icon={Icons.sleep}
            label="Sleep"
            active={!!sleep}
            activeColor={ctxColors.sleep.color}
            activeBg={ctxColors.sleep.bg}
          >
            {[
              { key: "poor", label: "Poor" },
              { key: "okay", label: "Okay" },
              { key: "great", label: "Great" },
            ].map((opt) => (
              <PopoverOption
                key={opt.key}
                label={opt.label}
                active={sleep === opt.key}
                activeColor={ctxColors.sleep.color}
                activeBg={ctxColors.sleep.bg}
                onClick={() => setSleep(sleep === opt.key ? "" : opt.key)}
              />
            ))}
          </ContextIconButton>

          {/* Weather */}
          <ContextIconButton
            icon={Icons.sun}
            label="Weather"
            active={!!weather}
            activeColor={ctxColors.weather.color}
            activeBg={ctxColors.weather.bg}
          >
            {[
              { key: "sunny", label: "Sunny" },
              { key: "cloudy", label: "Cloudy" },
              { key: "rainy", label: "Rainy" },
              { key: "snowy", label: "Snowy" },
            ].map((opt) => (
              <PopoverOption
                key={opt.key}
                label={opt.label}
                active={weather === opt.key}
                activeColor={ctxColors.weather.color}
                activeBg={ctxColors.weather.bg}
                onClick={() => setWeather(weather === opt.key ? "" : opt.key)}
              />
            ))}
          </ContextIconButton>

          {/* Caffeine (simple toggle — no popover) */}
          <button
            onClick={() => setCaffeine(!caffeine)}
            title="Caffeine"
            style={{
              width: 38, height: 38, borderRadius: 10,
              border: "none",
              background: caffeine ? ctxColors.caffeine.bg : "transparent",
              color: caffeine ? ctxColors.caffeine.color : "var(--text-dim)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.18s",
              position: "relative",
            }}
          >
            {Icons.coffee}
            {caffeine && (
              <span style={{
                position: "absolute", top: 4, right: 4,
                width: 5, height: 5, borderRadius: "50%",
                background: ctxColors.caffeine.color,
              }} />
            )}
          </button>

          {/* Screen time */}
          <ContextIconButton
            icon={Icons.monitor}
            label="Screen time"
            active={!!screenTime}
            activeColor={ctxColors.screen.color}
            activeBg={ctxColors.screen.bg}
          >
            {[
              { key: "low", label: "Low" },
              { key: "moderate", label: "Moderate" },
              { key: "high", label: "High" },
            ].map((opt) => (
              <PopoverOption
                key={opt.key}
                label={opt.label}
                active={screenTime === opt.key}
                activeColor={ctxColors.screen.color}
                activeBg={ctxColors.screen.bg}
                onClick={() => setScreenTime(screenTime === opt.key ? "" : opt.key)}
              />
            ))}
          </ContextIconButton>

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px" }} />

          {/* Context summary */}
          {contextCount > 0 ? (
            <span style={{
              fontSize: 11, color: "var(--text-dim)",
              padding: "3px 8px", borderRadius: 6,
              background: "var(--bg-card-hover)",
            }}>
              {contextCount} logged
            </span>
          ) : (
            <span style={{ fontSize: 11, color: "var(--text-dim)", opacity: 0.5 }}>
              Add context
            </span>
          )}

          {/* Spacer + Voice button */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
            {voice.isListening && (
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                animation: "fadeIn 0.3s ease",
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", background: "var(--rose)",
                  animation: "pulse 1s ease-in-out infinite",
                }} />
                <span style={{ fontSize: 11, color: "var(--rose)", fontWeight: 600 }}>
                  Listening
                </span>
              </div>
            )}
            {voice.isSupported && (
              <button
                onClick={voice.toggle}
                title={voice.isListening ? "Stop recording" : "Start voice input"}
                style={{
                  width: 38, height: 38, borderRadius: 10,
                  border: "none",
                  background: voice.isListening ? "rgba(251,113,133,0.15)" : "transparent",
                  color: voice.isListening ? "var(--rose)" : "var(--text-dim)",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.18s",
                }}
              >
                {voice.isListening ? Icons.stop : Icons.mic}
              </button>
            )}
          </div>
        </div>

        {/* Textarea */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Today I felt..."
          style={{
            width: "100%", minHeight: 200, maxHeight: 400,
            background: "transparent",
            border: "none",
            borderRadius: "0 0 16px 16px",
            padding: "16px 20px",
            color: "var(--text)", fontSize: 15, lineHeight: 1.7,
            fontFamily: "var(--sans)",
            resize: "vertical",
            outline: "none",
          }}
        />

        {/* Character count bar */}
        <div style={{
          padding: "0 20px 12px",
          fontSize: 12, color: "var(--text-dim)",
        }}>
          {content.length} characters
          {content.length > 0 && content.length < 20 && (
            <span style={{ color: "var(--amber)", marginLeft: 8 }}>
              {20 - content.length} more needed
            </span>
          )}
        </div>
      </div>

      {/* Voice not supported */}
      {!voice.isSupported && (
        <div style={{
          fontSize: 12, color: "var(--text-dim)", display: "flex", alignItems: "center", gap: 6,
          marginTop: -12,
        }}>
          {Icons.mic}
          Voice input not supported in this browser. Try Chrome, Edge, or Safari.
        </div>
      )}

      {/* Voice error */}
      {voice.voiceError && (
        <div style={{
          background: "var(--rose-dim)", border: "1px solid rgba(251,113,133,0.15)",
          borderRadius: 10, padding: "10px 14px",
          fontSize: 12, color: "var(--rose)", lineHeight: 1.5,
          marginTop: -12,
        }}>
          {voice.voiceError}
        </div>
      )}

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
                : "var(--bg)",
            border: saved ? "1px solid rgba(110,231,183,0.2)" : "none",
            cursor: analyzing || saved || content.trim().length < 20 ? "not-allowed" : "pointer",
            transition: "all 0.25s",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          {analyzing && (
            <div style={{
              width: 14, height: 14, borderRadius: "50%",
              border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "var(--bg)",
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
              {contextCount > 0 && (
                <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-dim)" }}>
                  + {contextCount} context {contextCount === 1 ? "factor" : "factors"} logged
                </span>
              )}
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

                  {/* Framework */}
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

                  {/* Action — only in guide mode */}
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
              background: "var(--accent)", color: "#fff",
              border: "none", cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Write another
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}

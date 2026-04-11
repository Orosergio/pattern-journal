"use client";

import { useEffect, useState } from "react";
import {
  startOfDay, endOfDay, subDays,
  startOfMonth, endOfMonth, subMonths,
  startOfYear, format,
} from "date-fns";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import JournalEntry from "@/components/JournalEntry";
import Dashboard from "@/components/Dashboard";
import EntryHistory from "@/components/EntryHistory";
import LandingPage from "@/components/LandingPage";
import WeeklyInsight from "@/components/WeeklyInsight";

// ─── Date Range ───────────────────────────────────────────────────────────────
type RangePreset = "7d" | "month" | "lastMonth" | "ytd" | "custom";

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
  preset: RangePreset;
}

function buildPreset(preset: Exclude<RangePreset, "custom">): DateRange {
  const today = new Date();
  switch (preset) {
    case "7d":
      return { start: startOfDay(subDays(today, 6)), end: endOfDay(today), label: "Last 7 Days", preset };
    case "month":
      return { start: startOfMonth(today), end: endOfDay(today), label: "This Month", preset };
    case "lastMonth": {
      const lm = subMonths(today, 1);
      return { start: startOfMonth(lm), end: endOfMonth(lm), label: "Last Month", preset };
    }
    case "ytd":
      return { start: startOfYear(today), end: endOfDay(today), label: "Year to Date", preset };
  }
}

function DateRangePicker({ value, onChange }: { value: DateRange; onChange: (r: DateRange) => void }) {
  const [open, setOpen] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const presets: { key: Exclude<RangePreset, "custom">; label: string }[] = [
    { key: "7d", label: "Last 7 Days" },
    { key: "month", label: "This Month" },
    { key: "lastMonth", label: "Last Month" },
    { key: "ytd", label: "Year to Date" },
  ];

  const applyCustom = () => {
    if (!customStart || !customEnd) return;
    const start = startOfDay(new Date(customStart + "T00:00:00"));
    const end = endOfDay(new Date(customEnd + "T00:00:00"));
    if (start > end) return;
    const label = `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
    onChange({ start, end, label, preset: "custom" });
    setOpen(false);
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Backdrop to close on outside click */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 99 }}
        />
      )}

      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: 8,
          fontSize: 13, fontWeight: 500, fontFamily: "var(--sans)",
          background: "var(--bg-card)", border: "1px solid var(--border)",
          color: "var(--text-dim)", cursor: "pointer",
          transition: "all 0.15s", whiteSpace: "nowrap",
          position: "relative", zIndex: open ? 101 : "auto",
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        {value.label}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 100,
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 12, padding: "8px", minWidth: 196,
          boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
          animation: "slideDown 0.15s ease",
        }}>
          {presets.map((p) => (
            <button
              key={p.key}
              onClick={() => { onChange(buildPreset(p.key)); setOpen(false); }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "8px 12px", borderRadius: 8, fontSize: 13,
                fontWeight: value.preset === p.key ? 600 : 400,
                background: value.preset === p.key ? "var(--accent-dim)" : "transparent",
                color: value.preset === p.key ? "var(--accent)" : "var(--text)",
                border: "none", cursor: "pointer", fontFamily: "var(--sans)",
                transition: "background 0.12s",
              }}
            >
              {p.label}
            </button>
          ))}

          <div style={{ height: 1, background: "var(--border)", margin: "6px 0" }} />

          <div style={{ padding: "4px 12px 8px" }}>
            <div style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              Custom range
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                style={{
                  padding: "6px 10px", borderRadius: 6, fontSize: 12,
                  background: "var(--bg-input)", border: "1px solid var(--border)",
                  color: "var(--text)", fontFamily: "var(--sans)", width: "100%",
                }}
              />
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                style={{
                  padding: "6px 10px", borderRadius: 6, fontSize: 12,
                  background: "var(--bg-input)", border: "1px solid var(--border)",
                  color: "var(--text)", fontFamily: "var(--sans)", width: "100%",
                }}
              />
              <button
                onClick={applyCustom}
                disabled={!customStart || !customEnd}
                style={{
                  padding: "7px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: !customStart || !customEnd ? "var(--border)" : "var(--accent)",
                  color: !customStart || !customEnd ? "var(--text-dim)" : "#0a0a0b",
                  border: "none",
                  cursor: !customStart || !customEnd ? "not-allowed" : "pointer",
                  fontFamily: "var(--sans)", transition: "all 0.15s",
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"write" | "dashboard" | "history" | "insights">("write");
  const [dateRange, setDateRange] = useState<DateRange>(() => buildPreset("7d"));

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg)"
      }}>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 16
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            border: "2px solid rgba(0,0,0,0.08)", borderTopColor: "var(--accent)",
            animation: "spin 0.8s linear infinite"
          }} />
          <span style={{ color: "var(--text-dim)", fontSize: 14 }}>Loading...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  const tabIcons = {
    write: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>,
    dashboard: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
    history: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    insights: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m16 12-4-4-4 4" /><path d="M12 16V8" /></svg>,
  };

  const tabs = [
    { key: "write" as const, label: "Write", icon: tabIcons.write },
    { key: "dashboard" as const, label: "Dashboard", icon: tabIcons.dashboard },
    { key: "history" as const, label: "History", icon: tabIcons.history },
    { key: "insights" as const, label: "Insights", icon: tabIcons.insights },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(246,243,238,0.9)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
        padding: "0 24px",
      }}>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 60
        }}>
          <div style={{
            fontFamily: "var(--sans)", fontWeight: 700, fontSize: 17,
            letterSpacing: "-0.02em"
          }}>
            Pattern<span style={{ color: "var(--accent)" }}>Journal</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{
              fontSize: 13, color: "var(--text-dim)",
              display: "none",
            }} className="hide-mobile">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              style={{
                fontSize: 13, color: "var(--text-dim)",
                background: "none", border: "1px solid var(--border)",
                padding: "6px 14px", borderRadius: 8, cursor: "pointer",
                fontFamily: "var(--sans)", fontWeight: 500,
                transition: "all 0.2s",
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation — desktop only; mobile uses the bottom nav */}
      <nav
        className="desktop-tab-nav"
        style={{
          position: "sticky", top: 60, zIndex: 40,
          background: "rgba(246,243,238,0.9)", backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
          padding: "0 24px",
        }}
      >
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "12px 16px",
                fontSize: 14, fontWeight: activeTab === tab.key ? 600 : 500,
                fontFamily: "var(--sans)",
                color: activeTab === tab.key ? "var(--accent)" : "var(--text-dim)",
                background: activeTab === tab.key ? "var(--accent-dim)" : "transparent",
                border: "none",
                borderRadius: "8px 8px 0 0",
                cursor: "pointer",
                transition: "all 0.2s",
                borderBottom: activeTab === tab.key ? "2px solid var(--accent)" : "2px solid transparent",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: 15 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
          {/* Date range picker — only shown on tabs that use it */}
          {activeTab !== "write" && (
            <div style={{ marginLeft: "auto", paddingBottom: 2 }}>
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
          )}
        </div>
      </nav>

      {/* Content */}
      <main
        className="main-content"
        style={{
          maxWidth: 900, margin: "0 auto",
          padding: "32px 24px 40px",
          animation: "fadeIn 0.3s ease",
        }}
      >
        {activeTab === "write" && <JournalEntry userId={user.id} />}
        {activeTab === "dashboard" && <Dashboard userId={user.id} dateRange={dateRange} />}
        {activeTab === "history" && <EntryHistory userId={user.id} dateRange={dateRange} />}
        {activeTab === "insights" && <WeeklyInsight userId={user.id} dateRange={dateRange} />}
      </main>

      {/* Mobile bottom nav */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(246,243,238,0.97)", backdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border)",
        display: "none",
        padding: "6px 8px env(safe-area-inset-bottom, 6px)",
        zIndex: 50,
      }} className="mobile-bottom-nav">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", gap: 3,
              padding: "6px 0",
              fontSize: 10, fontWeight: activeTab === tab.key ? 600 : 400,
              fontFamily: "var(--sans)",
              color: activeTab === tab.key ? "var(--accent)" : "var(--text-dim)",
              background: "none", border: "none", cursor: "pointer",
              letterSpacing: "0.01em",
            }}
          >
            <span style={{ fontSize: 19 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <style>{`
        /* Mobile: hide desktop tab nav, show bottom nav */
        @media (max-width: 640px) {
          .desktop-tab-nav { display: none !important; }
          .mobile-bottom-nav { display: flex !important; }
          .hide-mobile { display: none !important; }
          .main-content { padding-bottom: 90px !important; }
        }
        @media (min-width: 641px) {
          .desktop-tab-nav { display: block !important; }
          .hide-mobile { display: inline !important; }
        }
      `}</style>
    </div>
  );
}

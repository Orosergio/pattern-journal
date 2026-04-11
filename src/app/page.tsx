"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import JournalEntry from "@/components/JournalEntry";
import Dashboard from "@/components/Dashboard";
import EntryHistory from "@/components/EntryHistory";
import LandingPage from "@/components/LandingPage";
import WeeklyInsight from "@/components/WeeklyInsight";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"write" | "dashboard" | "history" | "insights">("write");

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
          display: "flex", gap: 4
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
        {activeTab === "dashboard" && <Dashboard userId={user.id} />}
        {activeTab === "history" && <EntryHistory userId={user.id} />}
        {activeTab === "insights" && <WeeklyInsight userId={user.id} />}
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

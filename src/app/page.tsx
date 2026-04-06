"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import JournalEntry from "@/components/JournalEntry";
import Dashboard from "@/components/Dashboard";
import EntryHistory from "@/components/EntryHistory";
import LandingPage from "@/components/LandingPage";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"write" | "dashboard" | "history">("write");

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
            border: "2px solid var(--border)", borderTopColor: "var(--accent)",
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

  const tabs = [
    { key: "write" as const, label: "Write", icon: "✏️" },
    { key: "dashboard" as const, label: "Dashboard", icon: "📊" },
    { key: "history" as const, label: "History", icon: "📖" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(10,10,11,0.85)", backdropFilter: "blur(20px)",
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

      {/* Tab Navigation */}
      <nav style={{
        position: "sticky", top: 60, zIndex: 40,
        background: "rgba(10,10,11,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
        padding: "0 24px",
      }}>
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
              }}
            >
              <span style={{ fontSize: 15 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main style={{
        maxWidth: 900, margin: "0 auto",
        padding: "32px 24px 80px",
        animation: "fadeIn 0.3s ease",
      }}>
        {activeTab === "write" && <JournalEntry userId={user.id} />}
        {activeTab === "dashboard" && <Dashboard userId={user.id} />}
        {activeTab === "history" && <EntryHistory userId={user.id} />}
      </main>

      {/* Mobile bottom nav */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(10,10,11,0.95)", backdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border)",
        display: "none", // Will show on mobile via media query
        padding: "8px 16px env(safe-area-inset-bottom, 8px)",
        zIndex: 50,
      }} className="mobile-bottom-nav">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", gap: 4,
              padding: "8px 0",
              fontSize: 11, fontWeight: activeTab === tab.key ? 600 : 400,
              fontFamily: "var(--sans)",
              color: activeTab === tab.key ? "var(--accent)" : "var(--text-dim)",
              background: "none", border: "none", cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <style>{`
        @media (max-width: 640px) {
          .mobile-bottom-nav { display: flex !important; }
          .hide-mobile { display: none !important; }
        }
        @media (min-width: 641px) {
          .hide-mobile { display: inline !important; }
        }
      `}</style>
    </div>
  );
}

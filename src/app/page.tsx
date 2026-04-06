"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import JournalEntry from "@/components/JournalEntry";
import Dashboard from "@/components/Dashboard";
import EntryHistory from "@/components/EntryHistory";

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

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md px-6">
          <h1 className="text-4xl font-bold tracking-tight">
            Pattern<span className="text-emerald-400">Journal</span>
          </h1>
          <p className="text-gray-400">
            AI-powered journaling that detects emotional patterns and helps you understand yourself better.
          </p>
          <button
            onClick={handleLogin}
            className="bg-white text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-3 mx-auto"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">
          Pattern<span className="text-emerald-400">Journal</span>
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{user.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="border-b border-gray-800 px-6">
        <div className="flex gap-6">
          {(["write", "dashboard", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                  ? "border-emerald-400 text-emerald-400"
                  : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
            >
              {tab === "write" ? "Write" : tab === "dashboard" ? "Dashboard" : "History"}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        {activeTab === "write" && <JournalEntry userId={user.id} />}
        {activeTab === "dashboard" && <Dashboard userId={user.id} />}
        {activeTab === "history" && <EntryHistory userId={user.id} />}
      </main>
    </div>
  );
}
"use client";

import { supabase } from "@/lib/supabase";

export default function LandingPage() {
    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.origin,
            },
        });
    };

    return (
        <>
            <style jsx global>{`
        .land-glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          opacity: 0;
          animation: landFadeOrb 2s ease forwards;
        }
        .land-glow-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(124,154,130,0.08) 0%, transparent 70%);
          top: -200px; right: -100px;
          animation-delay: 0.3s;
        }
        .land-glow-2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(138,112,148,0.06) 0%, transparent 70%);
          bottom: 100px; left: -150px;
          animation-delay: 0.6s;
        }
        @keyframes landFadeOrb { to { opacity: 1; } }
        @keyframes landSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes landPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes landBlink {
          50% { opacity: 0; }
        }
        @keyframes landPopIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes landFillSentiment {
          to { width: 18%; transform: translateX(-100%); }
        }
        @keyframes landFadeIn { to { opacity: 1; } }

        /* Responsive classes */
        .land-nav { display: flex; gap: 32px; align-items: center; }
        .land-nav-links { display: flex; gap: 32px; align-items: center; }
        .land-mobile-menu-btn { display: none; background: none; border: 1px solid var(--border); border-radius: 8px; padding: 8px; cursor: pointer; color: var(--text-muted); }
        .land-hero { padding: 140px 40px 80px; }
        .land-hero h1 br { display: inline; }
        .land-preview-grid { display: grid; grid-template-columns: 1fr 1fr; min-height: 420px; }
        .land-preview-write { padding: 40px; border-right: 1px solid var(--border); display: flex; flex-direction: column; gap: 20px; }
        .land-preview-analysis { padding: 40px; display: flex; flex-direction: column; gap: 24px; background: var(--bg-card-hover); }
        .land-features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .land-tech-bar { display: flex; align-items: center; justify-content: center; gap: 40px; flex-wrap: wrap; padding: 32px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .land-footer { display: flex; justify-content: space-between; align-items: center; }
        .land-section-pad { padding-left: 40px; padding-right: 40px; }
        .land-cta-buttons { display: flex; gap: 16px; }

        @media (max-width: 768px) {
          .land-nav-links a { display: none; }
          .land-mobile-menu-btn { display: block; }
          .land-hero { padding: 120px 20px 60px; }
          .land-hero h1 br { display: none; }
          .land-preview-grid { grid-template-columns: 1fr; }
          .land-preview-write { padding: 24px; border-right: none; border-bottom: 1px solid var(--border); }
          .land-preview-analysis { padding: 24px; }
          .land-features-grid { grid-template-columns: 1fr; }
          .land-tech-bar { gap: 16px; padding: 24px 0; }
          .land-tech-bar .land-tech-dot { display: none; }
          .land-footer { flex-direction: column; gap: 12px; text-align: center; }
          .land-section-pad { padding-left: 20px; padding-right: 20px; }
          .land-cta-buttons { flex-direction: column; align-items: stretch; }
          .land-cta-buttons a, .land-cta-buttons button { justify-content: center; text-align: center; }
        }

        @media (max-width: 480px) {
          .land-hero { padding: 110px 16px 48px; }
          .land-preview-write { padding: 20px; }
          .land-preview-analysis { padding: 20px; }
          .land-section-pad { padding-left: 16px; padding-right: 16px; }
          .land-tech-bar { gap: 12px; }
          .land-tech-bar span { font-size: 11px !important; }
        }
      `}</style>

            <div style={{ position: "relative", overflow: "hidden" }}>
                {/* Ambient Glows */}
                <div className="land-glow-orb land-glow-1" />
                <div className="land-glow-orb land-glow-2" />

                {/* Nav */}
                <nav style={{
                    position: "fixed", top: 0, left: 0, right: 0,
                    padding: "20px 40px",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    zIndex: 100,
                    background: "rgba(246,243,238,0.85)",
                    backdropFilter: "blur(20px)",
                    borderBottom: "1px solid var(--border)"
                }}>
                    <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em", color: "var(--text)" }}>
                        Pattern<span style={{ color: "var(--accent)" }}>Journal</span>
                    </div>
                    <div className="land-nav-links">
                        <a href="#features" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Features</a>
                        <a href="#preview" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Preview</a>
                        <a href="https://github.com/Orosergio/pattern-journal" target="_blank" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>GitHub</a>
                        <button onClick={handleLogin} style={{
                            background: "var(--text)", color: "var(--bg)",
                            padding: "8px 20px", borderRadius: 8,
                            fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer",
                            fontFamily: "var(--sans)"
                        }}>Sign in</button>
                    </div>
                    <button className="land-mobile-menu-btn" onClick={handleLogin} aria-label="Sign in">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                    </button>
                </nav>

                {/* Hero */}
                <section className="land-hero" style={{
                    position: "relative", minHeight: "100vh",
                    display: "flex", flexDirection: "column", justifyContent: "center",
                    maxWidth: 1200, margin: "0 auto"
                }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        background: "var(--accent-dim)", border: "1px solid rgba(124,154,130,0.15)",
                        padding: "6px 14px", borderRadius: 100,
                        fontSize: 13, fontWeight: 500, color: "var(--accent)",
                        marginBottom: 32, width: "fit-content",
                        opacity: 0, animation: "landSlideUp 0.8s ease forwards", animationDelay: "0.2s"
                    }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block", animation: "landPulse 2s ease infinite" }} />
                        Live — Powered by AI
                    </div>

                    <h1 style={{
                        fontFamily: "var(--serif)", fontSize: "clamp(48px, 6.5vw, 84px)",
                        lineHeight: 1.05, letterSpacing: "-0.025em", fontWeight: 400,
                        maxWidth: 800, opacity: 0, color: "var(--text)",
                        animation: "landSlideUp 0.8s ease forwards", animationDelay: "0.4s"
                    }}>
                        Understand your<br /> emotions through<br />{" "}<em style={{ fontStyle: "italic", color: "var(--accent)" }}>pattern recognition.</em>
                    </h1>

                    <p style={{
                        fontSize: 18, lineHeight: 1.65, color: "var(--text-muted)",
                        maxWidth: 520, marginTop: 28, opacity: 0,
                        animation: "landSlideUp 0.8s ease forwards", animationDelay: "0.6s"
                    }}>
                        Write freely. AI detects emotional patterns across your entries — surfacing recurring themes, sentiment shifts, and reflection prompts you'd miss on your own.
                    </p>

                    <div className="land-cta-buttons" style={{
                        marginTop: 40, opacity: 0,
                        animation: "landSlideUp 0.8s ease forwards", animationDelay: "0.8s"
                    }}>
                        <button onClick={handleLogin} style={{
                            display: "inline-flex", alignItems: "center", gap: 10,
                            background: "var(--accent)", color: "#fff",
                            padding: "14px 28px", borderRadius: 12,
                            fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer",
                            fontFamily: "var(--sans)", transition: "all 0.25s ease"
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                            Start journaling free
                        </button>
                        <a href="#preview" style={{
                            display: "inline-flex", alignItems: "center", gap: 8,
                            background: "transparent", color: "var(--text-muted)",
                            padding: "14px 24px", borderRadius: 12,
                            fontSize: 15, fontWeight: 500, textDecoration: "none",
                            border: "1px solid var(--border)", fontFamily: "var(--sans)"
                        }}>See how it works ↓</a>
                    </div>
                </section>

                {/* Product Preview */}
                <section id="preview" className="land-section-pad" style={{
                    maxWidth: 1200, margin: "0 auto", paddingBottom: 120,
                    opacity: 0, animation: "landSlideUp 1s ease forwards", animationDelay: "1.2s"
                }}>
                    <div style={{
                        background: "var(--bg-card)", border: "1px solid var(--border)",
                        borderRadius: 16, overflow: "hidden",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.03), 0 20px 60px rgba(0,0,0,0.06)"
                    }}>
                        {/* Top bar */}
                        <div style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "14px 20px", borderBottom: "1px solid var(--border)",
                            background: "var(--bg-card-hover)"
                        }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
                            <div style={{ flex: 1, textAlign: "center", fontSize: 12, color: "var(--text-dim)", letterSpacing: "0.02em" }}>
                                pattern-journal.vercel.app
                            </div>
                        </div>
                        {/* Content */}
                        <div className="land-preview-grid">
                            {/* Write Panel */}
                            <div className="land-preview-write">
                                <div style={{ fontFamily: "var(--serif)", fontSize: 22, color: "var(--text)" }}>How are you feeling today?</div>
                                <div style={{ fontSize: 13, color: "var(--text-dim)" }}>Write freely. AI will detect patterns in your emotions.</div>
                                <div style={{
                                    flex: 1, background: "var(--bg-input)",
                                    border: "1px solid var(--border)", borderRadius: 10, padding: 16
                                }}>
                                    <div style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-muted)" }}>
                                        I had a productive morning but keep thinking about the conversation with my sister last night. Not sure if I overreacted or if my feelings are valid. Went to the gym which helped clear my head a bit...
                                        <span style={{ display: "inline-block", width: 2, height: 16, background: "var(--accent)", marginLeft: 2, verticalAlign: "text-bottom", animation: "landBlink 1s step-end infinite" }} />
                                    </div>
                                </div>
                                <div style={{
                                    alignSelf: "flex-end", background: "var(--accent)", color: "#fff",
                                    border: "none", padding: "10px 20px", borderRadius: 8,
                                    fontSize: 13, fontWeight: 600, fontFamily: "var(--sans)"
                                }}>Analyze & Save</div>
                            </div>
                            {/* Analysis Panel */}
                            <div className="land-preview-analysis">
                                <div>
                                    <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)", fontWeight: 600 }}>Emotions Detected</div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                                        {[
                                            { label: "introspection", cls: "var(--accent-dim)", color: "var(--accent)", border: "rgba(124,154,130,0.2)", delay: "1.8s" },
                                            { label: "doubt", cls: "var(--violet-dim)", color: "var(--violet)", border: "rgba(138,112,148,0.2)", delay: "2.0s" },
                                            { label: "tension", cls: "var(--rose-dim)", color: "var(--rose)", border: "rgba(196,125,90,0.2)", delay: "2.2s" },
                                            { label: "relief", cls: "var(--amber-dim)", color: "var(--amber)", border: "rgba(184,146,58,0.2)", delay: "2.4s" },
                                        ].map(t => (
                                            <span key={t.label} style={{
                                                padding: "6px 14px", borderRadius: 100, fontSize: 13, fontWeight: 500,
                                                background: t.cls, color: t.color, border: `1px solid ${t.border}`,
                                                opacity: 0, animation: `landPopIn 0.4s ease forwards`, animationDelay: t.delay
                                            }}>{t.label}</span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)", fontWeight: 600 }}>Themes</div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                                        <span style={{ padding: "6px 14px", borderRadius: 100, fontSize: 13, fontWeight: 500, background: "var(--violet-dim)", color: "var(--violet)", border: "1px solid rgba(138,112,148,0.2)", opacity: 0, animation: "landPopIn 0.4s ease forwards", animationDelay: "2.4s" }}>family dynamics</span>
                                        <span style={{ padding: "6px 14px", borderRadius: 100, fontSize: 13, fontWeight: 500, background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid rgba(124,154,130,0.2)", opacity: 0, animation: "landPopIn 0.4s ease forwards", animationDelay: "2.6s" }}>self-validation</span>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                                        <span style={{ color: "var(--text-muted)" }}>Sentiment</span>
                                        <span style={{ color: "var(--accent)", fontWeight: 600 }}>Slightly Negative (−0.18)</span>
                                    </div>
                                    <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden", position: "relative", marginTop: 8 }}>
                                        <div style={{ position: "absolute", left: "50%", height: "100%", background: "var(--accent)", borderRadius: 3, width: 0, animation: "landFillSentiment 1s ease forwards", animationDelay: "2.5s" }} />
                                    </div>
                                </div>
                                <div style={{
                                    background: "var(--bg-input)", border: "1px solid var(--border)",
                                    borderRadius: 10, padding: 16, fontSize: 14, fontStyle: "italic",
                                    color: "var(--text-muted)", lineHeight: 1.6,
                                    opacity: 0, animation: "landFadeIn 0.6s ease forwards", animationDelay: "2.8s"
                                }}>
                                    &ldquo;What would it look like to validate your own feelings without needing the other person to agree?&rdquo;
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section id="features" className="land-section-pad" style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 120 }}>
                    <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)", fontWeight: 600, marginBottom: 16 }}>What it does</div>
                    <h2 style={{ fontFamily: "var(--serif)", fontSize: "clamp(32px, 4vw, 48px)", marginBottom: 60, maxWidth: 600, lineHeight: 1.15, color: "var(--text)" }}>
                        More than a journal — a mirror for your mind.
                    </h2>
                    <div className="land-features-grid">
                        {[
                            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" /><circle cx="12" cy="9" r="2.5" /></svg>, bg: "var(--accent-dim)", title: "Emotion Detection", desc: "Every entry is analyzed by AI to identify 2-4 emotions, recurring themes, and overall sentiment — instantly." },
                            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>, bg: "var(--violet-dim)", title: "Pattern Dashboard", desc: "Sentiment trends over time, most frequent emotions, and recurring life themes visualized in one view." },
                            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>, bg: "var(--rose-dim)", title: "Reflection Prompts", desc: "AI generates a personalized follow-up question after each entry to deepen self-awareness." },
                        ].map(f => (
                            <div key={f.title} style={{
                                background: "var(--bg-card)", border: "1px solid var(--border)",
                                borderRadius: 14, padding: 32, transition: "all 0.3s ease", cursor: "default",
                                boxShadow: "var(--card-shadow)",
                            }}>
                                <div style={{ width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, background: f.bg, color: "var(--text-muted)" }}>{f.icon}</div>
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, letterSpacing: "-0.01em", color: "var(--text)" }}>{f.title}</h3>
                                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Tech Stack */}
                <section className="land-section-pad" style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 120 }}>
                    <div className="land-tech-bar">
                        {["Next.js", "React", "TypeScript", "Supabase", "Google AI", "Vercel", "Recharts"].map((tech, i) => (
                            <span key={tech} style={{ display: "flex", alignItems: "center", gap: 40 }}>
                                <span style={{ fontSize: 14, color: "var(--text-dim)", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>{tech}</span>
                                {i < 6 && <span className="land-tech-dot" style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--border)" }} />}
                            </span>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="land-section-pad" style={{ textAlign: "center", paddingTop: 80, paddingBottom: 120, maxWidth: 600, margin: "0 auto" }}>
                    <h2 style={{ fontFamily: "var(--serif)", fontSize: "clamp(28px, 3.5vw, 40px)", marginBottom: 16, lineHeight: 1.2, color: "var(--text)" }}>
                        Start understanding yourself better.
                    </h2>
                    <p style={{ color: "var(--text-muted)", fontSize: 16, marginBottom: 32, lineHeight: 1.6 }}>
                        Free to use. Your data stays private. AI analyzes locally through secure API routes.
                    </p>
                    <button onClick={handleLogin} style={{
                        display: "inline-flex", alignItems: "center", gap: 10,
                        background: "var(--accent)", color: "#fff",
                        padding: "14px 28px", borderRadius: 12,
                        fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer",
                        fontFamily: "var(--sans)", margin: "0 auto"
                    }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                        Start journaling free
                    </button>
                </section>

                {/* Footer */}
                <footer className="land-footer land-section-pad" style={{
                    borderTop: "1px solid var(--border)", paddingTop: 32, paddingBottom: 32,
                    maxWidth: 1200, margin: "0 auto", fontSize: 13, color: "var(--text-dim)"
                }}>
                    <span>Built by <a href="https://github.com/Orosergio" target="_blank" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Sergio Orozco</a> · NTUT Taipei</span>
                    <a href="https://github.com/Orosergio/pattern-journal" target="_blank" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Source Code</a>
                </footer>
            </div>
        </>
    );
}
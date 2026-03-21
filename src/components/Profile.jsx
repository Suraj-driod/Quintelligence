"use client";

import { motion } from 'framer-motion';
import {
    User,
    Terminal,
    Brain,
    Trophy,
    Github,
    Fingerprint,
    Activity,
    ShieldCheck,
    Cpu
} from 'lucide-react';

export default function Profile({ user, pathways, learnerProfile }) {
    const activePathway = pathways?.find(p => p.status === 'active') || pathways?.[0];
    const completedModules = pathways?.reduce((sum, p) => sum + (p.progress || 0), 0) || 0;
    
    // Attempt to extract total repos as a proxy for telemetry from the active pathway's github metadata
    let githubTelemetry = 0;
    if (activePathway?.githubData) {
        githubTelemetry = activePathway.githubData.reposCount || activePathway.githubData.public_repos || 0;
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: {
            opacity: 1, y: 0, scale: 1,
            transition: { type: "spring", stiffness: 100, damping: 20 }
        }
    };

    return (
        <>
            {/* Poppins for display headings + numerals */}
            <link
                href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&display=swap"
                rel="stylesheet"
            />

            <style>{`
                .q-profile-root {
                    --font-display : 'Poppins', 'Plus Jakarta Sans', sans-serif;
                    --font-body    : 'Plus Jakarta Sans', sans-serif;
                }

                /* ── display — Poppins ─────────────────────── */
                .q-display { font-family: var(--font-display); }

                /* ── body — Plus Jakarta Sans (already global) */
                .q-body { font-family: var(--font-body); }

                .q-bento-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    position: relative;
                    z-index: 10;
                }

                .q-bento-grid {
                    display: grid;
                    grid-template-columns: repeat(12, 1fr);
                    gap: 24px;
                    grid-auto-rows: minmax(180px, auto);
                }

                .q-bento-card {
                    padding: 32px;
                    position: relative;
                    overflow: hidden;
                    font-family: var(--font-body);
                    transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
                }
                .q-bento-card:hover {
                    transform: translateY(-4px);
                    border-color: var(--border-hover);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                }

                .card-hero    { grid-column: span 8; grid-row: span 2; display: flex; flex-direction: column; justify-content: flex-end; }
                .card-mind    { grid-column: span 4; grid-row: span 2; display: flex; flex-direction: column; }
                .card-github  { grid-column: span 4; grid-row: span 1; display: flex; flex-direction: column; justify-content: space-between; }
                .card-pathway { grid-column: span 5; grid-row: span 1; display: flex; flex-direction: column; justify-content: space-between; }
                .card-trophy  { grid-column: span 3; grid-row: span 1; display: flex; flex-direction: column; justify-content: space-between; }

                @media (max-width: 1024px) {
                    .card-hero    { grid-column: span 12; }
                    .card-mind    { grid-column: span 12; grid-row: span 1; }
                    .card-github  { grid-column: span 6; }
                    .card-pathway { grid-column: span 12; }
                    .card-trophy  { grid-column: span 6; }
                }
                @media (max-width: 768px) {
                    .q-bento-grid { display: flex; flex-direction: column; }
                    .q-bento-card { padding: 24px; }
                }

                .q-hero-avatar-ring {
                    position: absolute; top: 32px; right: 32px;
                    width: 100px; height: 100px; border-radius: 50%;
                    background: var(--surface-elevated);
                    border: 1px solid var(--border);
                    display: flex; align-items: center; justify-content: center;
                }

                .q-badge {
                    display: inline-flex; align-items: center; gap: 6px;
                    background: var(--surface-elevated);
                    border: 1px solid var(--border);
                    padding: 5px 12px; border-radius: 999px;
                    font-family: var(--font-body);
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                    color: var(--text-muted);
                    width: fit-content;
                }

                .q-radar {
                    position: relative; width: 100%; flex: 1; min-height: 140px;
                    border-radius: 50%; border: 1px dashed var(--border);
                    margin-top: 24px; overflow: hidden;
                    display: flex; align-items: center; justify-content: center;
                }
                .q-radar-sweep {
                    position: absolute; inset: 0; border-radius: 50%;
                    background: conic-gradient(from 0deg, transparent 70%, var(--border-hover) 100%);
                }
            `}</style>

            <main
                className="q-profile-root"
                style={{ minHeight: '100vh', padding: '80px 24px', position: 'relative', overflowX: 'hidden' }}
            >
                <div style={{ position: 'absolute', inset: 0, opacity: 0.6, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
                    <div className="animate-float" style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)' }} />
                    <div className="animate-float" style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '70vw', height: '70vw', background: 'radial-gradient(circle, rgba(200,200,200,0.04) 0%, transparent 70%)', animationDelay: '-3s' }} />
                </div>

                <div className="q-bento-container">

                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}
                    >
                        <Fingerprint size={26} color="var(--text-primary)" />
                        <h1 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '26px', fontWeight: 700, margin: 0,
                            letterSpacing: '-0.01em', color: 'var(--text-primary)'
                        }}>
                            Identity Matrix
                        </h1>
                    </motion.div>

                    <motion.div
                        className="q-bento-grid"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >

                        {/* 1. HERO ID CARD */}
                        <motion.div variants={cardVariants} className="glass-card q-bento-card card-hero">
                            <div className="q-hero-avatar-ring">
                                <User size={32} color="var(--text-primary)" />
                            </div>

                            <div style={{ position: 'relative', zIndex: 10 }}>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                    <div className="q-badge"><Terminal size={12} /> Frontend Developer</div>
                                    <div className="q-badge" style={{ borderColor: 'rgba(16,185,129,0.4)', color: '#10b981' }}>
                                        <ShieldCheck size={12} /> Verified IIT Goa
                                    </div>
                                </div>

                                <h2 className="gradient-text" style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: 'clamp(42px, 5vw, 68px)',
                                    fontWeight: 800,
                                    margin: '0 0 14px 0',
                                    letterSpacing: '-0.02em',
                                    lineHeight: 1.05
                                }}>
                                    Anonymous {user?.email ? `<${user.email.split('@')[0]}>` : ''}
                                </h2>

                                <p style={{
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '17px', fontWeight: 400,
                                    color: 'var(--text-muted)',
                                    margin: 0, maxWidth: '420px', lineHeight: 1.65
                                }}>
                                    System Architect & UI Engineer. Currently synthesizing pathways for web architecture. {user?.displayName ? `Authenticated as ${user.displayName}.` : ''}
                                </p>
                            </div>
                        </motion.div>

                        {/* 2. MIND-GAUGE ARCHETYPE */}
                        <motion.div variants={cardVariants} className="glass-card q-bento-card card-mind">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', padding: '12px', borderRadius: '16px', color: 'var(--text-primary)' }}>
                                    <Brain size={22} />
                                </div>
                                <span style={{
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '11px', fontWeight: 600,
                                    color: 'var(--text-subtle)',
                                    textTransform: 'uppercase', letterSpacing: '0.14em'
                                }}>
                                    Mind-Gauge
                                </span>
                            </div>

                            <div style={{ marginTop: '24px' }}>
                                <h3 className="gradient-text-pink" style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '24px', fontWeight: 700,
                                    margin: '0 0 8px 0', letterSpacing: '-0.01em', lineHeight: 1.2
                                }}>
                                    {learnerProfile?.learnerType || 'The Experimenter'}
                                </h3>
                                <p style={{
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '15px', fontWeight: 400,
                                    color: 'var(--text-muted)', margin: 0, lineHeight: 1.65
                                }}>
                                    {learnerProfile?.style || 'Prefers hands-on execution. Highly adaptive to undocumented APIs and chaotic codebases.'}
                                </p>
                            </div>

                            <div className="q-radar">
                                <div className="q-radar-sweep animate-spin" />
                                <Cpu size={28} color="var(--text-primary)" style={{ position: 'relative', zIndex: 10 }} />
                                <div style={{ position: 'absolute', inset: '20px', border: '1px dashed var(--border)', borderRadius: '50%' }} />
                                <div style={{ position: 'absolute', inset: '40px', border: '1px solid var(--border)', borderRadius: '50%' }} />
                            </div>
                        </motion.div>

                        {/* 3. GITHUB TELEMETRY */}
                        <motion.div variants={cardVariants} className="glass-card q-bento-card card-github">
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <Github size={18} color="var(--text-muted)" />
                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Telemetry</span>
                                </div>
                                <p style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '32px', fontWeight: 800,
                                    margin: '0 0 6px 0', letterSpacing: '-0.03em',
                                    lineHeight: 1, color: 'var(--text-primary)'
                                }}>{githubTelemetry}</p>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', margin: 0 }}>
                                    Repositories tracked via mapped data.
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '4px', marginTop: '20px' }}>
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} style={{
                                        flex: 1, height: '22px', borderRadius: '4px',
                                        background: i % 3 === 0 ? 'var(--text-muted)' : i % 5 === 0 ? 'var(--border-hover)' : 'var(--surface-elevated)'
                                    }} />
                                ))}
                            </div>
                        </motion.div>

                        {/* 4. ACTIVE PATHWAY */}
                        <motion.div variants={cardVariants} className="glass-card q-bento-card card-pathway">
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <Activity size={18} color="var(--text-primary)" />
                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Current Protocol</span>
                                </div>
                                <h3 style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '20px', fontWeight: 700,
                                    margin: '0 0 6px 0', letterSpacing: '-0.01em',
                                    lineHeight: 1.2, color: 'var(--text-primary)'
                                }}>
                                    {activePathway?.title || 'No Active Protocol'}
                                </h3>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', margin: '0 0 20px 0' }}>
                                    {activePathway ? `Module ${activePathway.progress || 0} of ${activePathway.modules?.length || 0}` : 'Initialize a pathway'}
                                </p>
                            </div>

                            <div style={{ width: '100%', height: '6px', background: 'var(--surface-elevated)', borderRadius: '999px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.round(((activePathway?.progress || 0) / (activePathway?.modules?.length || 1)) * 100)}%` }}
                                    transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
                                    style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6, #ec4899)', borderRadius: '999px' }}
                                />
                            </div>
                        </motion.div>

                        {/* 5. MILESTONES */}
                        <motion.div variants={cardVariants} className="glass-card q-bento-card card-trophy">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                <Trophy size={18} color="var(--text-muted)" />
                                <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Milestones</span>
                            </div>
                            <div>
                                <p style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '48px', fontWeight: 800,
                                    margin: '0 0 4px 0', letterSpacing: '-0.04em',
                                    lineHeight: 1, color: 'var(--text-primary)'
                                }}>{completedModules}</p>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', margin: 0 }}>
                                    Modules completely<br />synthesized.
                                </p>
                            </div>
                        </motion.div>

                    </motion.div>
                </div>
            </main>
        </>
    );
}
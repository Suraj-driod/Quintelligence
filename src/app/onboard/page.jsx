"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UploadBox from '../../components/UploadBox';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Briefcase,
  Check,
  Loader2,
  Sparkles,
  Globe,
  Brain,
  Search,
  Volume2,
  FlaskConical,
  BookOpen,
  Users
} from 'lucide-react';
import { auth } from '@/app/backend/firebase';

const mindGaugeOptions = [
  { id: 'A', text: 'Look for clues', icon: <Search size={18} /> },
  { id: 'B', text: 'Listen for hints', icon: <Volume2 size={18} /> },
  { id: 'C', text: 'Try things out', icon: <FlaskConical size={18} /> },
  { id: 'D', text: 'Figure out the rules', icon: <BookOpen size={18} /> },
  { id: 'E', text: 'Ask others', icon: <Users size={18} /> }
];

export default function OnboardPage() {
  const router = useRouter();
  const [resume, setResume] = useState(null);
  const [jd, setJd] = useState('');
  const [publicLink, setPublicLink] = useState('');
  const [mindGauge, setMindGauge] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const canAnalyze = resume && jd.trim().length > 10;

  const handleAnalyze = async () => {
    if (!canAnalyze) return;
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("resume", resume);
      formData.append("jobDescription", jd);
      if (publicLink) formData.append("publicLink", publicLink);
      if (mindGauge) formData.append("mindGauge", mindGauge);

      if (auth.currentUser) {
         formData.append("userId", auth.currentUser.uid);
      }

      const res = await fetch("/api/generate-pathway", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to generate pathway");

      const data = await res.json();
      localStorage.setItem("pathwayData", JSON.stringify(data));
      router.push("/analysis");
    } catch (error) {
      console.error(error);
      setIsAnalyzing(false);
      alert("Failed to generate pathway. Please try again.");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }

        body {
          margin: 0;
          background: #000000;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #e2e2e2;
        }

        /* ── LEFT PANEL — fixed to viewport, always visible ──
           position:fixed takes it out of flow entirely.
           It stays put no matter how far the right side scrolls.
        ─────────────────────────────────────────────────────── */
        .q-left-panel {
          position: fixed;
          top: 0;
          left: 0;
          width: 40%;
          height: 100vh;
          background: linear-gradient(135deg, #050505 0%, #0a0a0a 100%);
          border-right: 1px solid rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 0 4vw;
          z-index: 100;
          overflow: hidden;
        }

        .q-ambient-glow {
          position: absolute;
          top: 30%; left: -10%;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 60%);
          filter: blur(80px);
          pointer-events: none;
        }

        /* ── RIGHT PANEL — normal flow, offset by left panel width ──
           margin-left: 40% pushes it right so it doesn't hide
           behind the fixed left panel.
           min-height: 100vh ensures the page is scrollable.
        ─────────────────────────────────────────────────────── */
        .q-right-panel {
          margin-left: 40%;
          min-height: 100vh;
          padding: 6vw 8vw;
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        /* ── MOBILE: stack vertically, unfix the panel ─────── */
        @media (max-width: 1024px) {
          .q-left-panel {
            position: relative;
            width: 100%;
            height: auto;
            border-right: none;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            padding: 80px 24px 40px;
          }
          .q-right-panel {
            margin-left: 0;
            padding: 40px 24px 80px;
          }
          .q-stepper-line { display: none !important; }
          .q-vertical-stepper {
            flex-direction: row !important;
            flex-wrap: wrap !important;
            gap: 16px !important;
            margin-top: 40px !important;
          }
        }

        .q-metallic-text {
          background: linear-gradient(to right, #ffffff 0%, #a1a1aa 50%, #ffffff 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shine 5s linear infinite reverse;
        }
        @keyframes shine { to { background-position: 200% center; } }

        .q-glass-panel {
          background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          transition: border-color 0.3s ease;
        }
        .q-glass-panel:hover { border-color: rgba(255,255,255,0.15); }

        .q-input-group { transition: all 0.3s ease; }
        .q-input-group:focus-within {
          border-color: rgba(255,255,255,0.3) !important;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1), 0 0 30px rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.05) !important;
        }

        .q-textarea::-webkit-scrollbar { width: 8px; }
        .q-textarea::-webkit-scrollbar-track { background: transparent; }
        .q-textarea::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .q-textarea::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

        .q-gauge-option {
          display: flex; align-items: center; gap: 16px;
          padding: 16px 24px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.25,1,0.5,1);
        }
        .q-gauge-option:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.2);
          transform: translateX(4px);
        }
        .q-gauge-option.selected {
          background: rgba(139,92,246,0.1);
          border-color: #8B5CF6;
          box-shadow: inset 0 0 0 1px #8B5CF6, 0 8px 20px rgba(139,92,246,0.15);
        }

        .q-btn-analyze {
          position: relative;
          background: #ffffff; color: #000000;
          border: none; border-radius: 9999px;
          padding: 24px 40px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 18px; font-weight: 800; letter-spacing: -0.02em;
          cursor: pointer; overflow: hidden;
          transition: all 0.3s cubic-bezier(0.25,1,0.5,1);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.2), 0 10px 30px rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center; gap: 12px;
          width: 100%;
        }
        .q-btn-analyze::before {
          content: '';
          position: absolute; top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent);
          transition: left 0.5s ease;
        }
        .q-btn-analyze:hover:not(:disabled) {
          transform: translateY(-4px);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.4), 0 20px 40px rgba(255,255,255,0.25);
        }
        .q-btn-analyze:hover:not(:disabled)::before { left: 100%; }
        .q-btn-analyze:disabled {
          background: rgba(255,255,255,0.03); color: #52525b;
          box-shadow: none; cursor: not-allowed;
          border: 1px solid rgba(255,255,255,0.05);
        }

        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.15); }
          70%  { box-shadow: 0 0 0 15px rgba(255,255,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
        }
        .step-active { animation: pulse-ring 2s infinite; }
      `}</style>

      {/* ── LEFT PANEL (fixed) ───────────────────────────── */}
      <div className="q-left-panel">
        <div className="q-ambient-glow" />
        <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '460px', margin: '0 auto' }}>

          <div style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#71717a', marginBottom: '40px' }}>
            Quintelligence
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            <h1 style={{ fontSize: 'clamp(36px, 3vw, 52px)', fontWeight: 800, margin: '0 0 20px 0', lineHeight: 1.1, letterSpacing: '-0.04em', color: '#ffffff' }}>
              Let&apos;s Build Your <br /><span className="q-metallic-text">DNA Pathway</span>
            </h1>
            <p style={{ color: '#a1a1aa', fontSize: '17px', lineHeight: 1.6, margin: 0 }}>
              Complete these steps to generate a hyper-personalized engineering roadmap based on your true skill gaps.
            </p>
          </motion.div>

          {/* VERTICAL STEPPER */}
          <motion.div
            className="q-vertical-stepper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '48px' }}
          >
            {[
              { label: 'Upload Resume', done: !!resume, active: !resume },
              { label: 'Target Role', done: jd.length > 10, active: !!resume && jd.length <= 10 },
              { label: 'Public Link', done: !!publicLink, active: jd.length > 10 && !publicLink },
              { label: 'Mind-Gauge', done: !!mindGauge, active: !!publicLink && !mindGauge },
            ].map((step, i, arr) => (
              <div key={step.label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div
                    className={step.active ? "step-active" : ""}
                    style={{
                      width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                      background: step.done ? '#ffffff' : 'rgba(255,255,255,0.05)',
                      border: step.done ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: step.done ? '#000000' : '#ffffff',
                      transition: 'all 0.4s ease'
                    }}
                  >
                    {step.done
                      ? <Check size={20} strokeWidth={3} />
                      : <span style={{ fontWeight: 700, fontSize: '14px' }}>{i + 1}</span>
                    }
                  </div>
                  <div style={{
                    fontSize: '15px', fontWeight: 700,
                    color: step.done ? '#ffffff' : '#a1a1aa',
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                    transition: 'color 0.4s ease'
                  }}>
                    {step.label}
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div className="q-stepper-line" style={{
                    width: '2px', height: '24px',
                    background: step.done ? '#ffffff' : 'rgba(255,255,255,0.1)',
                    marginLeft: '19px', transition: 'all 0.4s ease', borderRadius: '2px'
                  }} />
                )}
              </div>
            ))}
          </motion.div>

        </div>
      </div>

      {/* ── RIGHT PANEL (scrollable) ─────────────────────── */}
      <div className="q-right-panel">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ display: 'flex', flexDirection: 'column', gap: '40px', width: '100%', maxWidth: '800px', margin: '0 auto' }}
        >

          {/* Step 1: Resume */}
          <motion.div variants={itemVariants} className="q-glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <FileText size={24} color="#ffffff" />
              </div>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>Upload Resume</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#a1a1aa' }}>Provide your current profile for baseline analysis.</p>
              </div>
            </div>
            <UploadBox onFileSelect={setResume} />
          </motion.div>

          {/* Step 2: Job Description */}
          <motion.div variants={itemVariants} className="q-glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Briefcase size={24} color="#ffffff" />
              </div>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>Target Role</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#a1a1aa' }}>Paste the complete job description you are aiming for.</p>
              </div>
            </div>
            <div className="q-input-group" style={{
              background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px', padding: '20px', position: 'relative'
            }}>
              <textarea
                className="q-textarea"
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="E.g. We are looking for a Senior Frontend Engineer with deep experience in React, Next.js, and TypeScript..."
                style={{
                  width: '100%', minHeight: '200px', background: 'transparent',
                  border: 'none', color: '#e2e2e2', fontFamily: 'inherit', fontSize: '16px',
                  lineHeight: 1.6, resize: 'vertical', outline: 'none'
                }}
              />
              <div style={{
                position: 'absolute', bottom: '20px', right: '20px',
                color: jd.length > 10 ? '#ffffff' : '#71717a', fontSize: '12px', fontWeight: 700,
                background: jd.length > 10 ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.5)',
                padding: '6px 12px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.3s ease'
              }}>
                {jd.length} / 5000
              </div>
            </div>
          </motion.div>

          {/* Step 3: Public Link */}
          <motion.div variants={itemVariants} className="q-glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Globe size={24} color="#ffffff" />
                </div>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>Public Link</h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#a1a1aa' }}>Connect your portfolio, GitHub, or personal site.</p>
                </div>
              </div>
              <span style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', fontWeight: 700, padding: '6px 12px', borderRadius: '9999px', color: '#a1a1aa', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Optional
              </span>
            </div>
            <div className="q-input-group" style={{
              display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '0 20px', overflow: 'hidden'
            }}>
              <input
                value={publicLink}
                onChange={(e) => setPublicLink(e.target.value)}
                placeholder="https://..."
                style={{
                  background: 'transparent', border: 'none', color: '#ffffff',
                  padding: '24px 8px', fontSize: '16px', flex: 1, outline: 'none', fontFamily: 'inherit', fontWeight: 500
                }}
              />
              <AnimatePresence>
                {publicLink && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff', fontSize: '13px', fontWeight: 700, background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '999px', whiteSpace: 'nowrap' }}
                  >
                    <Check size={16} /> Attached
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Step 4: Mind-Gauge */}
          <motion.div variants={itemVariants} className="q-glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Brain size={24} color="#ffffff" />
                </div>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>Mind-Gauge</h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#a1a1aa' }}>A quick behavioral check to personalize your pathway.</p>
                </div>
              </div>
              <span style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', fontWeight: 700, padding: '6px 12px', borderRadius: '9999px', color: '#a1a1aa', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Optional
              </span>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
              <p style={{ fontSize: '16px', color: '#e2e2e2', fontWeight: 500, fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 12px 0' }}>
                "You enter a new learning world. A challenge appears in front of you, but no instructions are given."
              </p>
              <p style={{ color: '#8B5CF6', fontWeight: 700, margin: 0, fontSize: '15px' }}>What do you do first?</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {mindGaugeOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => setMindGauge(option.id)}
                  className={`q-gauge-option ${mindGauge === option.id ? 'selected' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', color: mindGauge === option.id ? '#ffffff' : '#a1a1aa', transition: 'color 0.2s ease' }}>
                    {option.icon}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: mindGauge === option.id ? '#8B5CF6' : '#71717a', fontWeight: 800, fontSize: '14px' }}>{option.id}.</span>
                    <span style={{ color: mindGauge === option.id ? '#ffffff' : '#e2e2e2', fontWeight: 600, fontSize: '15px' }}>{option.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ANALYZE BUTTON */}
          <motion.div variants={itemVariants} style={{ marginTop: '20px', paddingBottom: '60px' }}>
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze || isAnalyzing}
              className="q-btn-analyze"
            >
              {isAnalyzing ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <Loader2 size={24} color="#71717a" />
                  </motion.div>
                  Running AI Analysis...
                </>
              ) : (
                <>
                  <Sparkles size={24} />
                  Generate DNA Pathway
                </>
              )}
            </button>
          </motion.div>

        </motion.div>
      </div>
    </>
  );
}
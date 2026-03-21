"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Layers, Clock, Sparkles, Activity } from 'lucide-react';
// Assuming these exist in your project
import DNAHelix from '../../components/DNAHelix';
import PhotoCard from '../../components/PhotoCard';
import FeedbackPanel from '../../components/FeedbackPanel';

export default function PathwayPage() {
  const [modules, setModules] = useState([]);
  const [role, setRole] = useState("Analyzing...");
  const [estimatedHours, setEstimatedHours] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [viewMode, setViewMode] = useState('helix');

  useEffect(() => {
    const dataStr = localStorage.getItem('pathwayData');
    if (dataStr) {
      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.pathway) {
          setModules(parsed.pathway.modules || []);
          setRole(parsed.pathway.role || "Target Role");
          setEstimatedHours(parsed.pathway.estimatedHours || 0);
        }
      } catch (e) {
        console.error("Failed to parse pathwayData", e);
      }
    }
  }, []);

  const handleRegenerate = async (feedback) => {
    setIsRegenerating(true);
    try {
      const dataStr = localStorage.getItem('pathwayData');
      const parsedData = dataStr ? JSON.parse(dataStr) : {};
      const pathwayId = parsedData.pathwayId;

      const res = await fetch("/api/refine-pathway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, modules, feedback, pathwayId })
      });

      if (!res.ok) throw new Error("Failed to refine pathway");

      const data = await res.json();
      if (data.modules) {
        setModules(data.modules);

        // Persist to localStorage
        if (dataStr) {
          const parsed = JSON.parse(dataStr);
          if (parsed.pathway) {
            parsed.pathway.modules = data.modules;
            localStorage.setItem('pathwayData', JSON.stringify(parsed));
          }
        }
      }
    } catch (error) {
      console.error("Refinement error:", error);
      alert("Failed to refine the pathway. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  };

  // Framer Motion Orchestration
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const pillVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <>
      <style>{`
        /* --- PREMIUM DARK MODE BASE --- */
        .q-pathway-bg {
          background-color: #000000;
          color: #e2e2e2;
          font-family: 'Plus Jakarta Sans', sans-serif;
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
          padding-bottom: 120px;
        }

        /* Ambient Space Grid */
        .q-bg-grid {
          position: fixed;
          inset: 0;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(circle at top center, black 30%, transparent 80%);
          -webkit-mask-image: radial-gradient(circle at top center, black 30%, transparent 80%);
          z-index: 0;
          pointer-events: none;
        }

        /* Ambient Core Glow */
        .q-core-glow {
          position: absolute;
          top: 0; left: 50%;
          transform: translateX(-50%);
          width: 800px; height: 400px;
          background: radial-gradient(ellipse at top, rgba(255,255,255,0.08) 0%, transparent 70%);
          filter: blur(60px);
          pointer-events: none;
          z-index: 0;
        }

        /* Metallic Text */
        .q-metallic-text {
          background: linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Meta Pills */
        .q-meta-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          color: #a1a1aa;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
          transition: all 0.3s ease;
        }
        .q-meta-pill:hover {
          color: #ffffff;
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.15);
        }

        /* Glowing Progress Track */
        .q-progress-container {
          position: relative;
          width: 100%;
          height: 6px;
          background: rgba(255,255,255,0.05);
          border-radius: 999px;
          overflow: hidden;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.8);
        }
        .q-progress-fill {
          position: absolute;
          top: 0; left: 0; bottom: 0;
          background: linear-gradient(90deg, #52525b 0%, #ffffff 100%);
          border-radius: 999px;
          box-shadow: 0 0 12px rgba(255,255,255,0.6);
        }

        /* Loading Glass Modal */
        .q-loading-modal {
          background: linear-gradient(180deg, rgba(20,20,20,0.7) 0%, rgba(10,10,10,0.9) 100%);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 40px 48px;
          box-shadow: 
            inset 0 1px 0 0 rgba(255,255,255,0.15),
            0 30px 60px rgba(0,0,0,0.8),
            0 0 40px rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        /* AI Processing Orb */
        .q-ai-orb {
          width: 48px; height: 48px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          position: relative;
        }
        .q-ai-orb::before {
          content: ''; position: absolute; inset: -4px;
          border-radius: 50%;
          border: 1px solid transparent;
          border-top-color: rgba(255,255,255,0.8);
          animation: spin-orb 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
        }
        @keyframes spin-orb { 100% { transform: rotate(360deg); } }
      `}</style>

      <div className="q-pathway-bg">
        <div className="q-bg-grid" />
        <div className="q-core-glow" />

        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '100px 24px', position: 'relative', zIndex: 10 }}>

          {/* --- HEADER --- */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ textAlign: 'center', marginBottom: '64px' }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px', background: 'rgba(255,255,255,0.05)', padding: '6px 16px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Sparkles size={14} color="#a1a1aa" />
              <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#e2e2e2' }}>Pathway Generated</span>
            </div>

            <h1 className="q-metallic-text" style={{ fontSize: 'clamp(40px, 5vw, 56px)', fontWeight: 800, margin: '0 0 32px 0', letterSpacing: '-0.04em' }}>
              Your Learning DNA
            </h1>

            {/* Meta Information Pills */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '40px' }}
            >
              <motion.div variants={pillVariants} className="q-meta-pill">
                <Target size={14} /> {role}
              </motion.div>
              <motion.div variants={pillVariants} className="q-meta-pill">
                <Layers size={14} /> {modules.length} Modules
              </motion.div>
              <motion.div variants={pillVariants} className="q-meta-pill">
                <Clock size={14} /> Est. {estimatedHours} Hours
              </motion.div>
            </motion.div>

            {/* Premium Animated Progress Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ color: '#a1a1aa' }}>Foundation</span>
                <span style={{ color: '#ffffff' }}>15% Complete</span>
              </div>
              <div className="q-progress-container">
                <motion.div
                  className="q-progress-fill"
                  initial={{ width: '0%' }}
                  animate={{ width: '15%' }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                />
              </div>
            </motion.div>
          </motion.div>

          {/* --- VIEW TOGGLE --- */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ display: 'flex', justifyContent: 'center', marginBottom: '64px', position: 'relative', zIndex: 10 }}
          >
            <button
              onClick={() => setViewMode(prev => prev === 'helix' ? 'flowchart' : 'helix')}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#ffffff',
                padding: '14px 28px',
                borderRadius: '999px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)';
              }}
            >
              <Layers size={16} color="#10b981" />
              Change Cable Management
            </button>
          </motion.div>

          {/* --- MODULES VIEW (Helix or Flowchart) --- */}
          {/* Notice the physics: When regenerating, it scales down, fades, and blurs to simulate "moving into the background" */}
          <motion.div
            animate={{
              opacity: isRegenerating ? 0.3 : 1,
              scale: isRegenerating ? 0.95 : 1,
              filter: isRegenerating ? 'blur(8px)' : 'blur(0px)'
            }}
            transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
            style={{ position: 'relative', zIndex: 5 }}
          >
            {viewMode === 'helix' ? (
              <DNAHelix modules={modules} />
            ) : (
              <PhotoCard modules={modules} />
            )}
          </motion.div>

          {/* --- CINEMATIC LOADING OVERLAY --- */}
          <AnimatePresence>
            {isRegenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: 'fixed', inset: 0, zIndex: 100,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.4)', pointerEvents: 'none'
                }}
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  className="q-loading-modal"
                >
                  <div className="q-ai-orb">
                    <Activity size={20} color="#ffffff" />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0', color: '#ffffff' }}>Synthesizing Feedback</h3>
                  <p style={{ fontSize: '14px', color: '#a1a1aa', margin: 0, maxWidth: '280px', lineHeight: 1.6 }}>
                    Gemini is recompiling your DNA sequence to better fit your learning style...
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Feedback Panel Anchor */}
        <div style={{ position: 'relative', zIndex: 50 }}>
          <FeedbackPanel onRegenerate={handleRegenerate} />
        </div>
      </div>
    </>
  );
}
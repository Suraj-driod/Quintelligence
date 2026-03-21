"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Zap, Terminal, GitMerge, BrainCircuit, ArrowRight } from 'lucide-react';
// Note: Assuming GitHubCard and SkillChip are still in your components folder. 
// If they don't look good with this new theme, let me know and I can upgrade them too.
import GitHubCard from '../../components/GitHubCard';
import SkillChip from '../../components/SkillChip';

export default function AnalysisPage() {
  const [analysisData, setAnalysisData] = useState(null);
  const [githubProfile, setGithubProfile] = useState(null);

  useEffect(() => {
    const dataStr = localStorage.getItem('pathwayData');
    if (dataStr) {
      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.analysis) {
          setAnalysisData(parsed.analysis);
        }
        if (parsed.githubProfile) {
          setGithubProfile(parsed.githubProfile);
        }
      } catch (e) {
        console.error("Failed to parse pathwayData", e);
      }
    }
  }, []);

  const knownSkills = analysisData?.knownSkills || [];
  const missingSkills = analysisData?.missingSkills || [];
  const weakSkills = analysisData?.weakSkills || [];
  const reasoning = analysisData?.reasoning || [];
  const totalSkills = knownSkills.length + missingSkills.length + weakSkills.length;
  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
  };

  return (
    <>
      <style>{`
        .analysis-wrapper {
          background-color: #000000;
          color: #e2e2e2;
          font-family: 'Plus Jakarta Sans', sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
          position: relative;
        }

        /* Ambient Background Grid */
        .q-bg-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(circle at top center, black 40%, transparent 100%);
          -webkit-mask-image: radial-gradient(circle at top center, black 40%, transparent 100%);
          z-index: 0;
          pointer-events: none;
        }

        /* Top Summary Metrics */
        .metric-pill {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 9999px;
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
        }
        .metric-pill:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.15);
          transform: translateY(-2px);
        }

        /* Skill Columns Base Card */
        .skill-column-card {
          background: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%);
          border-radius: 24px;
          padding: 24px;
          position: relative;
          overflow: hidden;
          transition: all 0.4s ease;
        }
        
        /* Themed Glowing Borders */
        .column-success { border: 1px solid rgba(16, 185, 129, 0.15); }
        .column-success:hover { border-color: rgba(16, 185, 129, 0.4); box-shadow: 0 10px 40px rgba(16, 185, 129, 0.05); }
        
        .column-danger { border: 1px solid rgba(244, 63, 94, 0.15); }
        .column-danger:hover { border-color: rgba(244, 63, 94, 0.4); box-shadow: 0 10px 40px rgba(244, 63, 94, 0.05); }
        
        .column-warning { border: 1px solid rgba(245, 158, 11, 0.15); }
        .column-warning:hover { border-color: rgba(245, 158, 11, 0.4); box-shadow: 0 10px 40px rgba(245, 158, 11, 0.05); }

        /* Terminal Window */
        .terminal-window {
          background: #050505;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 24px;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 13px;
          line-height: 1.8;
          color: #a1a1aa;
          box-shadow: inset 0 2px 20px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.3);
          position: relative;
        }
        .terminal-header {
          display: flex;
          gap: 6px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot-red { background: #ff5f56; }
        .dot-yellow { background: #ffbd2e; }
        .dot-green { background: #27c93f; }

        /* Primary Action Button */
        .q-btn-generate {
          background: linear-gradient(180deg, #ffffff 0%, #d4d4d8 100%);
          color: #000000;
          border: none;
          border-radius: 9999px;
          padding: 20px 48px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -0.01em;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          box-shadow: inset 0 1px 1px rgba(255,255,255,1), 0 8px 24px rgba(255,255,255,0.15);
          transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .q-btn-generate:hover {
          transform: translateY(-4px);
          box-shadow: inset 0 1px 1px rgba(255,255,255,1), 0 12px 32px rgba(255,255,255,0.25);
        }

        /* Inline Chip Overrides (In case your external SkillChip component is too dark) */
        .level-badge {
          font-size: 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 2px 8px;
          border-radius: 6px;
          margin-left: 8px;
          color: #a1a1aa;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
      `}</style>

      <div className="analysis-wrapper">
        <div className="q-bg-grid" />
        
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 24px', position: 'relative', zIndex: 10 }}>
          
          {/* HEADER & TOP SUMMARY STRIP */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ marginBottom: '48px', display: 'flex', flexDirection: 'column', gap: '24px' }}
          >
            <div>
              <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.03em', color: '#ffffff' }}>
                Analysis Complete
              </h1>
              <p style={{ color: '#a1a1aa', fontSize: '16px', margin: 0 }}>We've mapped your profile against the target role.</p>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div className="metric-pill" style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}>
                <BrainCircuit size={16} />
                {totalSkills} Skills Detected
              </div>
              <div className="metric-pill" style={{ color: '#f43f5e' }}>
                <XCircle size={16} />
                {missingSkills.length} Gaps Found
              </div>
              <div className="metric-pill" style={{ color: '#10b981' }}>
                <CheckCircle2 size={16} />
                {knownSkills.length} Already Known
              </div>
            </div>
          </motion.div>

          {githubProfile && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              style={{ marginBottom: '64px' }}
            >
              <GitHubCard profile={githubProfile} />
            </motion.div>
          )}

          {/* THREE SKILL COLUMNS */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '64px' }}
          >
            {/* COLUMN 1: Strong */}
            <motion.div variants={itemVariants} className="skill-column-card column-success">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '10px', color: '#10b981' }}>
                  <CheckCircle2 size={20} strokeWidth={2.5} />
                </div>
                <h2 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 700, margin: 0 }}>You Already Know</h2>
              </div>
              <p style={{ color: '#71717a', fontSize: '14px', marginBottom: '24px', paddingLeft: '44px', margin: 0 }}>Skills matched from your profile.</p>
              
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '24px' }}>
                {knownSkills.length > 0 ? (
                  knownSkills.map((skill, i) => <SkillChip key={i} label={skill} />)
                ) : (
                  <span style={{ color: '#a1a1aa', fontSize: '14px' }}>No explicitly known skills detected.</span>
                )}
              </div>
            </motion.div>

            {/* COLUMN 2: Missing */}
            <motion.div variants={itemVariants} className="skill-column-card column-danger">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '8px', borderRadius: '10px', color: '#f43f5e' }}>
                  <XCircle size={20} strokeWidth={2.5} />
                </div>
                <h2 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 700, margin: 0 }}>Skill Gaps</h2>
              </div>
              <p style={{ color: '#71717a', fontSize: '14px', marginBottom: '24px', paddingLeft: '44px', margin: 0 }}>Required skills completely missing.</p>
              
              <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', marginTop: '24px' }}>
                {missingSkills.length > 0 ? (
                  missingSkills.map((ms, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '12px' }}>
                      <span style={{ color: '#e2e2e2', fontWeight: 600, fontSize: '14px' }}>{ms.name}</span>
                      <span className="level-badge" style={{ marginLeft: 'auto' }}>{ms.requiredLevel} Req.</span>
                    </div>
                  ))
                ) : (
                  <span style={{ color: '#a1a1aa', fontSize: '14px' }}>No critical skill gaps found!</span>
                )}
              </div>
            </motion.div>

            {/* COLUMN 3: Weak */}
            <motion.div variants={itemVariants} className="skill-column-card column-warning">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '8px', borderRadius: '10px', color: '#f59e0b' }}>
                  <Zap size={20} strokeWidth={2.5} />
                </div>
                <h2 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 700, margin: 0 }}>Needs Improvement</h2>
              </div>
              <p style={{ color: '#71717a', fontSize: '14px', marginBottom: '24px', paddingLeft: '44px', margin: 0 }}>Skills below required proficiency.</p>
              
              <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', marginTop: '24px' }}>
                {weakSkills.length > 0 ? (
                  weakSkills.map((ws, i) => (
                    <div key={i} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                      <div style={{ color: '#e2e2e2', fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>{ws.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#a1a1aa' }}>
                        <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px' }}>{ws.currentLevel}</span>
                        <ArrowRight size={12} />
                        <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>{ws.targetLevel}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <span style={{ color: '#a1a1aa', fontSize: '14px' }}>You meet the target proficiency in all identified skills.</span>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* AI REASONING TERMINAL */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="terminal-window" 
            style={{ marginBottom: '64px' }}
          >
            <div className="terminal-header">
              <div className="dot dot-red"></div>
              <div className="dot dot-yellow"></div>
              <div className="dot dot-green"></div>
              <div style={{ marginLeft: '12px', color: '#71717a', fontSize: '12px', fontFamily: 'sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Terminal size={14} /> AI Processing Log
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reasoning.length > 0 ? (
                  reasoning.map((log, i) => (
                    <div key={i} style={{ color: '#a1a1aa' }}>
                      <span style={{ color: i % 2 === 0 ? '#10b981' : (i % 3 === 0 ? '#f43f5e' : '#f59e0b') }}>➜</span> <span style={{ color: '#60a5fa' }}>~</span> {log}
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#a1a1aa' }}>
                    <span style={{ color: '#10b981' }}>➜</span> <span style={{ color: '#60a5fa' }}>~</span> Analyzing user profile data...
                  </div>
                )}
            </div>
          </motion.div>

          {/* CTA LAYER */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            style={{ textAlign: 'center' }}
          >
            <Link href="/pathway" style={{ textDecoration: 'none' }}>
              <button className="q-btn-generate">
                <GitMerge size={20} />
                Generate DNA Pathway
              </button>
            </Link>
          </motion.div>

        </div>
      </div>
    </>
  );
}
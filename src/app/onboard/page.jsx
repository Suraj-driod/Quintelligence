"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UploadBox from '../../components/UploadBox';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Briefcase, Github, Check, Loader2, Sparkles } from 'lucide-react';

export default function OnboardPage() {
  const router = useRouter();
  const [resume, setResume] = useState(null);
  const [jd, setJd] = useState('');
  const [github, setGithub] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const canAnalyze = resume && jd.trim().length > 10;

  const handleAnalyze = async () => {
    if (!canAnalyze) return;
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("resume", resume);
      formData.append("jobDescription", jd);
      if (github) {
        formData.append("github", github);
      }

      const res = await fetch("/api/generate-pathway", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to generate pathway");
      }

      const data = await res.json();
      localStorage.setItem("pathwayData", JSON.stringify(data));
      router.push("/analysis");
    } catch (error) {
      console.error(error);
      setIsAnalyzing(false);
      alert("Failed to generate pathway. Please try again.");
    }
  };

  // Framer Motion Variants
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
        /* --- FULL BLEED SPLIT LAYOUT --- */
        .q-split-layout {
          display: flex;
          min-height: 100vh;
          background-color: #000000;
          color: #e2e2e2;
          font-family: 'Plus Jakarta Sans', sans-serif;
          overflow-x: hidden;
        }

        /* Left Panel - Fixed/Sticky Branding & Progress */
        .q-left-panel {
          width: 40%;
          position: relative;
          background: linear-gradient(135deg, #050505 0%, #000000 100%);
          border-right: 1px solid rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 5vw;
          z-index: 10;
        }

        /* Cinematic ambient glow behind the text */
        .q-ambient-glow {
          position: absolute;
          top: 30%;
          left: -10%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 60%);
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }

        /* Right Panel - Scrolling Workspace */
        .q-right-panel {
          width: 60%;
          padding: 6vw 8vw;
          display: flex;
          flex-direction: column;
          gap: 40px;
          position: relative;
          z-index: 5;
        }

        /* Responsive Breakpoint for Mobile/Tablets */
        @media (max-width: 1024px) {
          .q-split-layout { flex-direction: column; }
          .q-left-panel { width: 100%; padding: 80px 24px 40px 24px; border-right: none; border-bottom: 1px solid rgba(255,255,255,0.05); }
          .q-right-panel { width: 100%; padding: 40px 24px 80px 24px; }
          .q-vertical-stepper { flex-direction: row !important; align-items: flex-start !important; justify-content: space-between; margin-top: 40px; }
          .q-stepper-line { width: 100% !important; height: 2px !important; margin: 19px 12px 0 12px !important; }
        }

        /* Metallic Text */
        .q-metallic-text {
          background: linear-gradient(to right, #ffffff 0%, #a1a1aa 50%, #ffffff 100%);
          background-size: 200% auto;
          color: #fff;
          background-clip: text;
          text-fill-color: transparent;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shine 5s linear infinite reverse;
        }
        @keyframes shine { to { background-position: 200% center; } }

        /* Ultra-Wide Glass Cards */
        .q-glass-panel {
          background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          transition: border-color 0.3s ease, transform 0.3s ease;
        }
        .q-glass-panel:hover {
          border-color: rgba(255, 255, 255, 0.15);
        }

        /* Inputs */
        .q-input-group { transition: all 0.3s ease; }
        .q-input-group:focus-within {
          border-color: rgba(255, 255, 255, 0.3) !important;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 0 30px rgba(255, 255, 255, 0.05);
          background: rgba(255, 255, 255, 0.05) !important;
        }

        .q-textarea::-webkit-scrollbar { width: 8px; }
        .q-textarea::-webkit-scrollbar-track { background: transparent; }
        .q-textarea::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .q-textarea::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

        /* Massive Analyze Button */
        .q-btn-analyze {
          position: relative;
          background: #ffffff;
          color: #000000;
          border: none;
          border-radius: 9999px;
          padding: 24px 40px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.02em;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.2), 0 10px 30px rgba(255,255,255,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
        }
        
        .q-btn-analyze::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.1), transparent);
          transition: left 0.5s ease;
        }

        .q-btn-analyze:hover:not(:disabled) {
          transform: translateY(-4px);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.4), 0 20px 40px rgba(255,255,255,0.25);
        }
        .q-btn-analyze:hover:not(:disabled)::before { left: 100%; }

        .q-btn-analyze:disabled {
          background: rgba(255, 255, 255, 0.03);
          color: #52525b;
          box-shadow: none;
          cursor: not-allowed;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        /* Pulse Ring */
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.15); }
          70% { box-shadow: 0 0 0 15px rgba(255, 255, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }
        .step-active { animation: pulse-ring 2s infinite; }
      `}</style>

      <div className="q-split-layout">
        
        {/* =========================================
            LEFT PANEL: Branding & Vertical Stepper 
        ============================================= */}
        <div className="q-left-panel">
          <div className="q-ambient-glow" />
          
          <div style={{ position: 'relative', zIndex: 10 }}>
            {/* Top Logo / Identifier */}
            <div style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#71717a', marginBottom: '8vh' }}>
              Quintelligence
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
            >
              <h1 style={{ fontSize: 'clamp(40px, 4vw, 64px)', fontWeight: 800, margin: '0 0 24px 0', lineHeight: 1.1, letterSpacing: '-0.04em' }}>
                Let&apos;s Build Your <br/><span className="q-metallic-text">DNA Pathway</span>
              </h1>
              <p style={{ color: '#a1a1aa', fontSize: '18px', lineHeight: 1.6, maxWidth: '400px', margin: 0 }}>
                Complete these three steps to generate a hyper-personalized engineering roadmap based on your true skill gaps.
              </p>
            </motion.div>

            {/* VERTICAL STEPPER */}
            <motion.div 
              className="q-vertical-stepper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10vh' }}
            >
              {/* Step 1 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div className={resume ? "" : "step-active"} style={{ 
                  width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                  background: resume ? '#ffffff' : 'rgba(255,255,255,0.05)', 
                  border: resume ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.2)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  color: resume ? '#000000' : '#ffffff', transition: 'all 0.4s ease' 
                }}>
                  {resume ? <Check size={20} strokeWidth={3} /> : <span style={{ fontWeight: 700, fontSize: '14px' }}>1</span>}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: resume ? '#ffffff' : '#a1a1aa', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Upload Resume</div>
                  <div style={{ fontSize: '13px', color: '#71717a', marginTop: '4px' }}>PDF format preferred</div>
                </div>
              </div>

              {/* Line 1 */}
              <div className="q-stepper-line" style={{ width: '2px', height: '40px', background: resume ? '#ffffff' : 'rgba(255,255,255,0.1)', marginLeft: '19px', transition: 'all 0.4s ease', borderRadius: '2px' }} />
              
              {/* Step 2 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div className={resume && !(jd.length > 10) ? "step-active" : ""} style={{ 
                  width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                  background: jd.length > 10 ? '#ffffff' : 'rgba(255,255,255,0.05)', 
                  border: jd.length > 10 ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.2)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  color: jd.length > 10 ? '#000000' : '#ffffff', transition: 'all 0.4s ease' 
                }}>
                  {jd.length > 10 ? <Check size={20} strokeWidth={3} /> : <span style={{ fontWeight: 700, fontSize: '14px' }}>2</span>}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: jd.length > 10 ? '#ffffff' : '#a1a1aa', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Target Role</div>
                  <div style={{ fontSize: '13px', color: '#71717a', marginTop: '4px' }}>Paste job description</div>
                </div>
              </div>

              {/* Line 2 */}
              <div className="q-stepper-line" style={{ width: '2px', height: '40px', background: github ? '#ffffff' : 'rgba(255,255,255,0.1)', marginLeft: '19px', transition: 'all 0.4s ease', borderRadius: '2px' }} />

              {/* Step 3 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                  background: github ? '#ffffff' : 'rgba(255,255,255,0.05)', 
                  border: github ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.2)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  color: github ? '#000000' : '#ffffff', transition: 'all 0.4s ease' 
                }}>
                  {github ? <Check size={20} strokeWidth={3} /> : <span style={{ fontWeight: 700, fontSize: '14px' }}>3</span>}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: github ? '#ffffff' : '#a1a1aa', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Connect GitHub</div>
                  <div style={{ fontSize: '13px', color: '#71717a', marginTop: '4px' }}>Optional analysis step</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>


        {/* =========================================
            RIGHT PANEL: Scrolling Form Elements 
        ============================================= */}
        <div className="q-right-panel">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: '40px', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
            
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
                <div style={{ position: 'absolute', bottom: '20px', right: '20px', color: jd.length > 10 ? '#ffffff' : '#71717a', fontSize: '12px', fontWeight: 700, background: jd.length > 10 ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.5)', padding: '6px 12px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.3s ease' }}>
                  {jd.length} / 5000
                </div>
              </div>
            </motion.div>

            {/* Step 3: GitHub */}
            <motion.div variants={itemVariants} className="q-glass-panel">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Github size={24} color="#ffffff" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>GitHub Profile</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#a1a1aa' }}>Connect for deeper technical analysis.</p>
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
                <span style={{ color: '#71717a', fontSize: '16px', fontWeight: 600 }}>github.com/</span>
                <input
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="username"
                  style={{
                    background: 'transparent', border: 'none', color: '#ffffff',
                    padding: '24px 8px', fontSize: '16px', flex: 1, outline: 'none', fontFamily: 'inherit', fontWeight: 500
                  }}
                />
                <AnimatePresence>
                  {github && (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff', fontSize: '13px', fontWeight: 700, background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '999px' }}>
                      <Check size={16} /> Linked
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* ANALYZE BUTTON */}
            <motion.div variants={itemVariants} style={{ marginTop: '20px', position: 'relative', zIndex: 10 }}>
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

      </div>
    </>
  );
}
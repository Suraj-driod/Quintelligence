"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Plus, ArrowRight, Eye, Trash2, Clock, Layers, Activity
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import { auth } from '@/app/backend/firebase';
import { getUserPathways, archivePathway } from '@/app/backend/pathwayService';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activePathway, setActivePathway] = useState(null);
  const [secondaryPathways, setSecondaryPathways] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);

      try {
        const pathways = await getUserPathways(currentUser.uid);
        const active = pathways.find(p => p.status === 'active') || pathways[0];
        setActivePathway(active || null);
        const others = pathways.filter(p => p.id !== active?.id);
        setSecondaryPathways(others);
      } catch (err) {
        console.error("Failed to fetch pathways", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 20 } }
  };

  return (
    <>
      <style>{`
        .q-dashboard-wrapper {
          background-color: #030305;
          color: #e2e2e2;
          font-family: 'Plus Jakarta Sans', sans-serif;
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
        }

        /* --- DEEP SPACE STARFIELD --- */
        .q-starfield {
          position: fixed;
          inset: 0;
          background-color: #030305;
          background-image:
            radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 3px),
            radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 2px),
            radial-gradient(white, rgba(255,255,255,.1) 2px, transparent 3px);
          background-size: 550px 550px, 350px 350px, 250px 250px;
          background-position: 0 0, 40px 60px, 130px 270px;
          z-index: 0;
          pointer-events: none;
          animation: star-drift 150s linear infinite;
        }

        @keyframes star-drift {
          0% { background-position: 0 0, 40px 60px, 130px 270px; }
          100% { background-position: 0 -550px, 40px -290px, 130px 20px; }
        }

        /* --- GLASS CARDS --- */
        .q-glass-card {
          position: relative;
          padding: 32px;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: linear-gradient(180deg, rgba(15,15,15,0.9), rgba(5,5,5,0.98));
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.4s ease;
          z-index: 1;
        }

        .q-glass-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255, 255, 255, 0.16);
        }

        /* --- METALLIC TEXT --- */
        .q-metallic-text {
          background: linear-gradient(to right, #ffffff 0%, #a1a1aa 30%, #ffffff 50%, #71717a 100%);
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          animation: shine 4s linear infinite;
        }
        @keyframes shine { to { background-position: 200% center; } }

        /* --- SEGMENTED LED PROGRESS BARS --- */
        .q-progress-track {
          height: 10px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.8);
        }
        .q-progress-track::after {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(90deg, transparent 0px, transparent 6px, #000 6px, #000 8px);
          z-index: 5;
          pointer-events: none;
        }

        .q-progress-fill {
          height: 100%;
          border-radius: 4px;
          position: relative;
        }
        .q-progress-fill::before {
          content: '';
          position: absolute;
          top: 0; right: 0; bottom: 0;
          width: 15px;
          background: #ffffff;
          filter: blur(4px);
          border-radius: 50%;
        }

        /* --- MAGNETIC ROWS --- */
        .q-magnetic-row {
          padding: 24px;
          background: rgba(255,255,255,0.01);
          border: 1px solid rgba(255,255,255,0.03);
          border-radius: 16px;
          transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
          position: relative;
          overflow: hidden;
        }
        .q-magnetic-row:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.15);
          transform: scale(1.02);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        /* --- BUTTONS --- */
        .q-gradient-btn {
          background: #ffffff;
          color: #000000;
          font-weight: 800;
          font-family: inherit;
          border: none;
          padding: 14px 28px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.2), 0 10px 20px rgba(255,255,255,0.1);
        }
        .q-gradient-btn:hover {
          box-shadow: 0 0 0 1px rgba(255,255,255,0.4), 0 15px 30px rgba(255,255,255,0.25);
          transform: translateY(-2px);
        }

        .q-dashboard-content {
          max-width: 1100px;
          margin: 0 auto;
          padding: 120px 24px 80px 24px;
          position: relative;
          z-index: 10;
        }

        .q-split-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 32px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .q-split-grid { grid-template-columns: 1fr; }
        }
          
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
        ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
      `}</style>

      <div className="q-dashboard-wrapper">
        <div className="q-starfield" />

        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}>
          <Navbar />
        </div>

        <main className="q-dashboard-content">
          {loading ? (
            <div style={{ textAlign: 'center', marginTop: '100px' }}>
              <span className="q-metallic-text" style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Synchronizing Neural Pathways...
              </span>
            </div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">

              {/* Top Action Bar */}
              <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
                <button className="q-gradient-btn" onClick={() => router.push('/onboard')}>
                  <Plus size={18} /> Initialize Protocol
                </button>
              </motion.div>

              {/* Active Protocol (Hero Card) */}
              {activePathway ? (
                <motion.div variants={itemVariants} className="q-glass-card" style={{ marginBottom: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', fontSize: '12px', color: '#10b981', marginBottom: '20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        <Activity size={14} /> Active Protocol
                      </div>
                      <h1 style={{ margin: 0, fontSize: 'clamp(32px, 5vw, 42px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>{activePathway.title}</h1>
                      <div style={{ color: '#a1a1aa', fontSize: '15px', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                        <Clock size={16} /> Initiated {new Date(activePathway.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="q-metallic-text" style={{ fontSize: '56px', fontWeight: 800, lineHeight: 1, marginBottom: '8px' }}>
                        {Math.round((activePathway.progress / (activePathway.modules?.length || 1)) * 100)}%
                      </div>
                      <div style={{ color: '#a1a1aa', fontSize: '15px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        Module {activePathway.progress || 0} / {activePathway.modules?.length || 0}
                      </div>
                    </div>
                  </div>

                  <div className="q-progress-track" style={{ marginBottom: '40px' }}>
                    <motion.div
                      className="q-progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(((activePathway.progress || 0) / (activePathway.modules?.length || 1)) * 100)}%` }}
                      transition={{ duration: 2, delay: 0.5, ease: [0.25, 1, 0.5, 1] }}
                      style={{ background: 'linear-gradient(90deg, #06B6D4, #8B5CF6)', boxShadow: '0 0 20px rgba(139, 92, 246, 0.6)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {(activePathway.gapAnalysis?.missing?.slice(0, 3) || []).map(skill => (
                        <span key={skill} style={{ padding: '8px 18px', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '13px', color: '#e2e2e2', fontWeight: 700, letterSpacing: '0.05em' }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                    <button style={{
                      background: '#ffffff', color: '#000000', border: 'none',
                      padding: '14px 32px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '10px',
                      cursor: 'pointer', fontWeight: 800, fontSize: '15px', transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
                      boxShadow: '0 10px 25px rgba(255,255,255,0.15)'
                    }}
                      onClick={() => {
                        localStorage.setItem('pathwayData', JSON.stringify({ pathway: activePathway, pathwayId: activePathway.id }));
                        router.push('/pathway');
                      }}
                      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(255,255,255,0.25)'; }}
                      onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(255,255,255,0.15)'; }}>
                      Resume Protocol <ArrowRight size={18} />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div variants={itemVariants} className="q-glass-card" style={{ marginBottom: '32px', textAlign: 'center', padding: '80px 32px' }}>
                  <p style={{ color: '#a1a1aa', fontSize: '18px', fontWeight: 600 }}>No active protocols found. Initialize a new learning pathway to begin.</p>
                </motion.div>
              )}

              {/* Split Grid: Pathways & Skills */}
              <div className="q-split-grid">

                {/* Secondary Pathways */}
                <motion.div variants={itemVariants} className="q-glass-card" style={{ padding: '40px 32px' }}>
                  <h3 style={{ margin: '0 0 32px 0', fontSize: '20px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>Archived Protocols</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {secondaryPathways.length === 0 ? (
                      <p style={{ color: '#71717a', fontSize: '15px', fontWeight: 500 }}>No secondary pathways available.</p>
                    ) : secondaryPathways.map((pathway, i) => {
                      const prog = Math.round(((pathway.progress || 0) / (pathway.modules?.length || 1)) * 100);
                      const color = pathway.status === 'archived' ? '#71717a' : '#10b981';
                      return (
                        <div key={i} className="q-magnetic-row">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{pathway.title}</h4>
                                <span style={{ fontSize: '11px', padding: '4px 10px', background: `${color}15`, border: `1px solid ${color}30`, color: color, borderRadius: '6px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{pathway.status}</span>
                              </div>
                              <div style={{ color: '#a1a1aa', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '20px', fontWeight: 600 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Layers size={16} /> {pathway.modules?.length || 0} Modules</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={16} /> {(pathway.modules?.length || 0) * 8}h</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', color: '#d4d4d8', padding: '10px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }} aria-label="View"
                                onMouseOver={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#000000'; }}
                                onMouseOut={e => { e.currentTarget.style.background = '#0a0a0a'; e.currentTarget.style.color = '#d4d4d8'; }}>
                                <Eye size={18} />
                              </button>
                            </div>
                          </div>
                          <div style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#a1a1aa', marginBottom: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              <span>Data Sync</span><span style={{ color: '#fff' }}>{prog}%</span>
                            </div>
                            <div className="q-progress-track">
                              <motion.div className="q-progress-fill" initial={{ width: 0 }} whileInView={{ width: `${prog}%` }} viewport={{ once: true }} transition={{ duration: 1.5, ease: [0.25, 1, 0.5, 1] }} style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Skill Matrix */}
                <motion.div variants={itemVariants} className="q-glass-card" style={{ padding: '40px 32px' }}>
                  <h3 style={{ margin: '0 0 32px 0', fontSize: '20px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>Competency Matrix</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {(() => {
                      const missing = activePathway?.gapAnalysis?.missing || [];
                      const weak = activePathway?.gapAnalysis?.weak || [];
                      const known = activePathway?.gapAnalysis?.strong || [];
                      const displaySkills = [
                        ...known.map(s => ({ name: s, level: 'Advanced', percent: 90, color: '#06B6D4' })),
                        ...weak.map(s => ({ name: s, level: 'Developing', percent: 45, color: '#F59E0B' })),
                        ...missing.map(s => ({ name: s, level: 'Critical Gap', percent: 15, color: '#EF4444' }))
                      ].slice(0, 6);
                      if (displaySkills.length === 0) return <p style={{ color: '#71717a', fontSize: '15px', fontWeight: 500 }}>No telemetry compiled yet.</p>;
                      return displaySkills.map((skill, i) => (
                        <div key={i} className="q-magnetic-row" style={{ padding: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', marginBottom: '16px' }}>
                            <span style={{ fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>{skill.name}</span>
                            <span style={{ color: skill.color, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{skill.level}</span>
                          </div>
                          <div className="q-progress-track">
                            <motion.div className="q-progress-fill" initial={{ width: 0 }} whileInView={{ width: `${skill.percent}%` }} viewport={{ once: true }} transition={{ duration: 1.5, delay: i * 0.1, ease: [0.25, 1, 0.5, 1] }} style={{ background: skill.color, boxShadow: `0 0 12px ${skill.color}` }} />
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </motion.div>

              </div>
            </motion.div>
          )}
        </main>
      </div>
    </>
  );
}
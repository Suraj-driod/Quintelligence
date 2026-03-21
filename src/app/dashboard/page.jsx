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
        // "Active" pathway is the first one that is status='active', or the most recent one
        const active = pathways.find(p => p.status === 'active') || pathways[0];
        setActivePathway(active || null);
        
        // Secondary pathways are anything else
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
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <>
      <style>{`
        .q-dashboard-wrapper {
          background-color: #000000;
          color: #e2e2e2;
          font-family: 'Plus Jakarta Sans', sans-serif;
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
        }

        .q-bg-grid {
          position: fixed;
          inset: 0;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: linear-gradient(to bottom, black 20%, transparent 80%);
          -webkit-mask-image: linear-gradient(to bottom, black 20%, transparent 80%);
          z-index: 0;
          pointer-events: none;
        }

        .q-glass-card {
          background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 32px;
          position: relative;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .q-glass-card:hover {
          border-color: rgba(255, 255, 255, 0.15);
          background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5), 0 0 20px rgba(255,255,255,0.02);
        }

        .q-metallic-text {
          background: linear-gradient(to right, #ffffff 0%, #a1a1aa 40%, #ffffff 60%, #71717a 100%);
          background-size: 200% auto;
          color: #fff;
          background-clip: text;
          text-fill-color: transparent;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shine 5s linear infinite reverse;
        }

        @keyframes shine { 
          to { background-position: 200% center; } 
        }

        .q-gradient-btn {
          background: linear-gradient(135deg, #ffffff, #c6c6c7);
          color: #000;
          font-weight: 700;
          font-family: inherit;
          border: none;
          padding: 12px 24px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .q-gradient-btn:hover {
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
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
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .q-split-grid {
            grid-template-columns: 1fr;
          }
        }
          
        ::-webkit-scrollbar {
          width: 6px; height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>

      <div className="q-dashboard-wrapper">
        <div className="q-bg-grid" />

        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}>
          <Navbar />
        </div>

        <main className="q-dashboard-content">
          {loading ? (
             <div style={{ textAlign: 'center', marginTop: '100px' }}>
                <span className="q-metallic-text">Synchronizing Data Modules...</span>
             </div>
          ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">

            {/* Top Action Bar */}
            <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
              <button className="q-gradient-btn" onClick={() => router.push('/onboard')}>
                <Plus size={18} /> Initialize New Pathway
              </button>
            </motion.div>

            {/* Active Protocol (Hero Card) */}
            {activePathway ? (
            <motion.div variants={itemVariants} className="q-glass-card" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', fontSize: '12px', color: '#10b981', marginBottom: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Activity size={14} /> Active Protocol
                  </div>
                  <h1 style={{ margin: 0, fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{activePathway.title}</h1>
                  <div style={{ color: '#a1a1aa', fontSize: '15px', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} /> Initiated {new Date(activePathway.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="q-metallic-text" style={{ fontSize: '48px', fontWeight: 800, lineHeight: 1, marginBottom: '8px' }}>
                    {Math.round((activePathway.progress / (activePathway.modules?.length || 1)) * 100)}%
                  </div>
                  <div style={{ color: '#a1a1aa', fontSize: '15px', fontWeight: 600 }}>Module {activePathway.progress || 0} of {activePathway.modules?.length || 0}</div>
                </div>
              </div>

              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden', marginBottom: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round(((activePathway.progress || 0) / (activePathway.modules?.length || 1)) * 100)}%` }}
                  transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', borderRadius: '999px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(activePathway.gapAnalysis?.missing?.slice(0,3) || []).map(skill => (
                    <span key={skill} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '13px', color: '#d4d4d8', fontWeight: 600 }}>
                      {skill}
                    </span>
                  ))}
                </div>
                <button style={{
                  background: '#ffffff', color: '#000000', border: 'none',
                  padding: '12px 28px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px',
                  cursor: 'pointer', fontWeight: 700, fontSize: '15px', transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
                }}
                  onClick={() => {
                     // We cache stringified pathway to match how /pathway loads it if coming from analysis 
                     localStorage.setItem('pathwayData', JSON.stringify({ pathway: activePathway, pathwayId: activePathway.id }));
                     router.push('/pathway');
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  Resume Module <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
            ) : (
                <motion.div variants={itemVariants} className="q-glass-card" style={{ marginBottom: '24px', textAlign: 'center', padding: '64px 32px' }}>
                   <p style={{ color: '#a1a1aa', fontSize: '16px' }}>No active protocols found. Initialize a new learning pathway to begin.</p>
                </motion.div>
            )}

            {/* Split Grid: Pathways & Skills */}
            <div className="q-split-grid">

              {/* Secondary Pathways */}
              <motion.div variants={itemVariants} className="q-glass-card">
                <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>Secondary Pathways</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {secondaryPathways.length === 0 ? (
                     <p style={{ color: '#71717a', fontSize: '14px' }}>No secondary pathways available.</p>
                  ) : secondaryPathways.map((pathway, i) => {
                    const prog = Math.round(((pathway.progress || 0) / (pathway.modules?.length || 1)) * 100);
                    const color = pathway.status === 'archived' ? '#71717a' : '#10b981';
                    return (
                    <div key={i} style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>{pathway.title}</h4>
                            <span style={{ fontSize: '11px', padding: '4px 8px', background: `${color}15`, border: `1px solid ${color}30`, color: color, borderRadius: '6px', fontWeight: 700, textTransform: 'uppercase' }}>{pathway.status}</span>
                          </div>
                          <div style={{ color: '#a1a1aa', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '16px', fontWeight: 500 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Layers size={14} /> {pathway.modules?.length || 0} Modules</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {(pathway.modules?.length || 0) * 8}h</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#d4d4d8', padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }} aria-label="View">
                            <Eye size={16} />
                          </button>
                        </div>
                      </div>

                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#a1a1aa', marginBottom: '8px', fontWeight: 600 }}>
                          <span>Progress</span><span style={{ color: '#fff' }}>{prog}%</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} whileInView={{ width: `${prog}%` }} viewport={{ once: true }} transition={{ duration: 1 }} style={{ height: '100%', background: color, borderRadius: '999px' }} />
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              </motion.div>

              {/* Skill Matrix */}
              <motion.div variants={itemVariants} className="q-glass-card">
                <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>Skill Matrix</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {(() => {
                    const missing = activePathway?.gapAnalysis?.missing || [];
                    const weak = activePathway?.gapAnalysis?.weak || [];
                    const known = activePathway?.gapAnalysis?.strong || [];
                    
                    const displaySkills = [
                      ...known.map(s => ({ name: s, level: 'Advanced', percent: 90, color: '#3b82f6' })),
                      ...weak.map(s => ({ name: s, level: 'Beginner', percent: 35, color: '#f59e0b' })),
                      ...missing.map(s => ({ name: s, level: 'Missing', percent: 10, color: '#ef4444' }))
                    ].slice(0, 6); // Just show top 6 for the dashboard

                    if (displaySkills.length === 0) return <p style={{ color: '#71717a', fontSize: '14px' }}>No skill data compiled yet.</p>;

                    return displaySkills.map((skill, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '12px' }}>
                          <span style={{ fontWeight: 700, color: '#fff' }}>{skill.name}</span>
                          <span style={{ color: '#a1a1aa', fontSize: '13px', fontWeight: 600 }}>{skill.level}</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} whileInView={{ width: `${skill.percent}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }} style={{ height: '100%', background: skill.color, borderRadius: '999px' }} />
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
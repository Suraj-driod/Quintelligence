'use client'
import React from 'react';
import { motion } from 'framer-motion';
import {
  Plus, ArrowRight, Eye, Trash2, GitBranch,
  Map, CheckCircle, Clock, Rocket, Layers, ShieldCheck, Cpu, Github, User
} from 'lucide-react';
import Navbar from '../../components/Navbar';

export default function DashboardPage() {
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
          padding: 24px;
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
          font-weight: 600;
          border: none;
          padding: 12px 24px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .q-gradient-btn:hover {
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .q-main-grid {
          max-width: 1000px;
          margin: 0 auto;
          position: relative;
          z-index: 10;
        }

        .q-dashboard-content {
          max-width: 1300px;
          margin: 0 auto;
          padding: 120px 24px 60px 24px; /* Padding top accounts for fixed/absolute Navbar */
          position: relative;
          z-index: 10;
        }
          
        /* Custom Scrollbar for inner components */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
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

        {/* If Navbar is absolute/fixed from landing page CSS, wrap inside this relative block */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}>
          <Navbar />
        </div>

        <div className="q-dashboard-content">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Top Bar */}
            <motion.header variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800 }}>
                  Welcome back, <span className="q-metallic-text">Alex</span> 👋
                </h1>
                <p style={{ margin: '8px 0 0 0', color: '#a1a1aa' }}>Ready to conquer new skills today?</p>
              </div>
              <button className="q-gradient-btn">
                <Plus size={18} /> New Pathway
              </button>
            </motion.header>

            {/* Stats Row */}
            <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '40px' }}>
              {[
                { label: 'Pathways Generated', value: '12', icon: <Map size={24} color="#e2e2e2" /> },
                { label: 'Skills Detected', value: '142', icon: <Cpu size={24} color="#e2e2e2" /> },
                { label: 'Gaps Closed', value: '28', icon: <ShieldCheck size={24} color="#e2e2e2" /> },
                { label: 'Learning Hours', value: '340h', icon: <Clock size={24} color="#e2e2e2" /> }
              ].map((stat, i) => (
                <div key={i} className="q-glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {stat.icon}
                  </div>
                  <div>
                    <div className="q-metallic-text" style={{ fontSize: '28px', fontWeight: 800, lineHeight: 1, marginBottom: '4px' }}>{stat.value}</div>
                    <div style={{ fontSize: '13px', color: '#a1a1aa', fontWeight: 600 }}>{stat.label}</div>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Main Grid Content */}
            <div className="q-main-grid">
              {/* Left Column */}
              <motion.div variants={containerVariants}>

                {/* Active Pathway Card */}
                <motion.div variants={itemVariants} className="q-glass-card" style={{ marginBottom: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <div style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', fontSize: '12px', color: '#10b981', marginBottom: '12px', fontWeight: 600 }}>
                        ● Active Focus
                      </div>
                      <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#fff' }}>Senior Frontend Engineer</h2>
                      <div style={{ color: '#a1a1aa', fontSize: '14px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} /> Started 14 days ago
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="q-metallic-text" style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1, marginBottom: '4px' }}>37%</div>
                      <div style={{ color: '#a1a1aa', fontSize: '14px', fontWeight: 500 }}>3/8 Modules</div>
                    </div>
                  </div>

                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '37%' }}
                      transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                      style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', borderRadius: '4px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {['React Server Components', 'GraphQL', 'System Design'].map(skill => (
                        <span key={skill} style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px', fontSize: '13px', color: '#d4d4d8', fontWeight: 500 }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                    <button style={{
                      background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
                      padding: '10px 24px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px',
                      cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s'
                    }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                      Continue <ArrowRight size={16} />
                    </button>
                  </div>
                </motion.div>

                {/* My Pathways List */}
                <motion.div variants={itemVariants} className="q-glass-card" style={{ marginBottom: '32px' }}>
                  <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 700 }}>My Pathways</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      { role: 'Fullstack Dev', emoji: '⚙️', status: 'Completed', progress: 100, modules: 12, hours: '45h', color: '#10b981' },
                      { role: 'Cloud Architect', emoji: '☁️', status: 'Archived', progress: 15, modules: 20, hours: '120h', color: '#71717a' }
                    ].map((pathway, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ fontSize: '24px', width: '48px', height: '48px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pathway.emoji}</div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{pathway.role}</h4>
                              <span style={{ fontSize: '11px', padding: '4px 8px', background: `${pathway.color}15`, border: `1px solid ${pathway.color}30`, color: pathway.color, borderRadius: '6px', fontWeight: 600 }}>{pathway.status}</span>
                            </div>
                            <div style={{ color: '#a1a1aa', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Layers size={14} /> {pathway.modules} Modules</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {pathway.hours}</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                          <div style={{ width: '120px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#a1a1aa', marginBottom: '6px', fontWeight: 500 }}>
                              <span>Progress</span><span style={{ color: '#fff' }}>{pathway.progress}%</span>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                              <motion.div initial={{ width: 0 }} whileInView={{ width: `${pathway.progress}%` }} viewport={{ once: true }} transition={{ duration: 1 }} style={{ height: '100%', background: pathway.color, borderRadius: '3px' }} />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#d4d4d8', padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'} aria-label="View">
                              <Eye size={16} />
                            </button>
                            <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#ef4444', padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'} aria-label="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Skill Breakdown */}
                <motion.div variants={itemVariants} className="q-glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Skill Breakdown</h3>
                    <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      {['All', 'Strong', 'Weak', 'Missing'].map((tab, i) => (
                        <button key={tab} style={{ background: i === 0 ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: i === 0 ? '#fff' : '#a1a1aa', padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>{tab}</button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {[
                      { name: 'React.js', level: 'Advanced', percent: 90, color: '#3b82f6' },
                      { name: 'TypeScript', level: 'Intermediate', percent: 65, color: '#8b5cf6' },
                      { name: 'System Design', level: 'Beginner', percent: 30, color: '#f59e0b' },
                      { name: 'Go', level: 'Missing', percent: 5, color: '#ef4444' }
                    ].map((skill, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '10px' }}>
                          <span style={{ fontWeight: 600, color: '#fff' }}>{skill.name}</span>
                          <span style={{ color: '#a1a1aa', fontSize: '13px', fontWeight: 500 }}>{skill.level}</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} whileInView={{ width: `${skill.percent}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }} style={{ height: '100%', background: skill.color, borderRadius: '4px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

              </motion.div>

              {/* Right Column */}

            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

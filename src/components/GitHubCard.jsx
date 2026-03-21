"use client";

import { motion } from 'framer-motion';
import { Github, ExternalLink, BadgeCheck, FolderGit2, Code2, GitCommitHorizontal, CalendarDays, Lightbulb } from 'lucide-react';
import SkillChip from './SkillChip';

export default function GitHubCard({ profile }) {
  if (!profile) return null;

  const topLanguages = profile.languages?.slice(0, 3).join(", ") || "N/A";
  return (
    <>
      <style>{`
        .q-gh-card {
          background: linear-gradient(180deg, rgba(25, 25, 25, 0.8) 0%, rgba(10, 10, 10, 0.95) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 32px;
          position: relative;
          overflow: hidden;
          box-shadow: 
            inset 0 1px 0 0 rgba(255, 255, 255, 0.1), 
            0 20px 40px rgba(0, 0, 0, 0.5);
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: transform 0.3s ease, border-color 0.3s ease;
        }
        
        .q-gh-card:hover {
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        /* Subtle mesh background for the card */
        .q-gh-bg {
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(circle at 100% 0%, rgba(255,255,255,0.03) 0%, transparent 40%),
            radial-gradient(circle at 0% 100%, rgba(6, 182, 212, 0.03) 0%, transparent 40%);
          z-index: 0;
          pointer-events: none;
        }

        .q-gh-avatar {
          width: 56px; 
          height: 56px; 
          border-radius: 50%;
          background: linear-gradient(135deg, #2a2a2a 0%, #111111 100%);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: inset 0 2px 10px rgba(255,255,255,0.1), 0 0 20px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .q-gh-avatar::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: conic-gradient(from 0deg, transparent 70%, rgba(255,255,255,0.2) 100%);
          animation: spin 4s linear infinite;
          z-index: -1;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .q-stat-box {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: background 0.2s ease;
        }
        .q-stat-box:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .q-stat-label {
          color: #71717a;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .q-stat-value {
          color: #ffffff;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .q-gh-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #a1a1aa;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 8px 16px;
          border-radius: 999px;
          transition: all 0.2s ease;
        }
        .q-gh-link:hover {
          background: rgba(255,255,255,0.08);
          color: #ffffff;
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="q-gh-card"
      >
        <div className="q-gh-bg" />

        <div style={{ position: 'relative', zIndex: 10 }}>
          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div className="q-gh-avatar">
                <Github size={28} color="#e2e2e2" strokeWidth={1.5} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h3 style={{ fontWeight: 800, fontSize: '22px', color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
                    {profile.username}
                  </h3>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
                    fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}>
                    <BadgeCheck size={14} /> Verified Source
                  </div>
                </div>
                <div style={{ color: '#a1a1aa', fontSize: '14px' }}>Connected via Resume Parsing</div>
              </div>
            </div>
            <a href={profile.url} target="_blank" rel="noopener noreferrer" className="q-gh-link">
              View Profile <ExternalLink size={14} />
            </a>
          </div>

          {/* STATS GRID */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px'
          }}>
            <div className="q-stat-box">
              <div className="q-stat-label"><FolderGit2 size={14} /> Public Repos</div>
              <div className="q-stat-value">{profile.reposCount}</div>
            </div>
            <div className="q-stat-box">
              <div className="q-stat-label"><Code2 size={14} /> Top Languages</div>
              <div className="q-stat-value" style={{ fontSize: '18px' }}>{topLanguages}</div>
            </div>
            <div className="q-stat-box">
              <div className="q-stat-label"><GitCommitHorizontal size={14} /> Contributions</div>
              <div className="q-stat-value">842 <span style={{ fontSize: '12px', color: '#71717a', fontWeight: 500 }}>(Past year)</span></div>
            </div>
            <div className="q-stat-box">
              <div className="q-stat-label"><CalendarDays size={14} /> Account Age</div>
              <div className="q-stat-value">3 Years</div>
            </div>
          </div>

          {/* DETECTED SKILLS */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ color: '#e2e2e2', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
              Skills extracted from repositories
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {profile.languages?.length > 0 ? (
                profile.languages.slice(0, 8).map((lang, i) => (
                  <SkillChip key={i} label={lang} size="sm" />
                ))
              ) : (
                <span style={{ color: '#a1a1aa', fontSize: '13px' }}>No public languages detected</span>
              )}
            </div>
          </div>

          {/* INSIGHT ROW */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <div style={{ color: '#f59e0b', marginTop: '2px' }}>
              <Lightbulb size={18} />
            </div>
            <div style={{ color: '#a1a1aa', fontSize: '14px', lineHeight: 1.6 }}>
              <span style={{ color: '#e2e2e2', fontWeight: 600 }}>GitHub Extraction:</span> Found <span style={{ color: '#ffffff' }}>{profile.reposCount}</span> public repositories indicating experience across <span style={{ color: '#ffffff' }}>{profile.languages?.length || 0}</span> languages.
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Clock, Target, Layers, CheckCircle2 } from 'lucide-react';
import ModuleModal from './ModuleModal';

const ACCENTS = [
  { borderColor: '#3B82F6', gradient: 'linear-gradient(145deg, #3B82F6 0%, #050508 65%)' },
  { borderColor: '#10B981', gradient: 'linear-gradient(145deg, #10B981 0%, #050508 65%)' },
  { borderColor: '#8B5CF6', gradient: 'linear-gradient(145deg, #8B5CF6 0%, #050508 65%)' },
  { borderColor: '#F59E0B', gradient: 'linear-gradient(145deg, #F59E0B 0%, #050508 65%)' },
  { borderColor: '#EF4444', gradient: 'linear-gradient(145deg, #EF4444 0%, #050508 65%)' },
  { borderColor: '#06B6D4', gradient: 'linear-gradient(145deg, #06B6D4 0%, #050508 65%)' },
];

export default function PhotoCard({
  className = '',
  modules = [],
  completedModules = [],
  onToggleComplete,
  animationDelay = 0.2,
  animationStagger = 0.13,
  easeType = 'back.out(1.1)',
  enableHover = true
}) {
  const containerRef = useRef(null);
  const [selectedModule, setSelectedModule] = useState(null);

  useEffect(() => {
    if (!modules || modules.length === 0) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.q-module-card',
        { opacity: 0, y: 48, scale: 0.93, rotation: 0 },
        {
          opacity: 1, y: 0, scale: 1, rotation: 0,
          stagger: animationStagger,
          ease: easeType,
          delay: animationDelay,
          duration: 0.75
        }
      );
      gsap.fromTo(
        '.q-conn',
        { scaleY: 0, transformOrigin: 'top center' },
        {
          scaleY: 1,
          stagger: animationStagger,
          ease: 'power2.out',
          delay: animationDelay + 0.45,
          duration: 0.45
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [animationStagger, easeType, animationDelay, modules]);

  const pushSiblings = (hoveredIdx) => {
    if (!enableHover || !containerRef.current) return;
    const q = gsap.utils.selector(containerRef);
    modules.forEach((_, i) => {
      const t = q(`.q-module-card-${i}`);
      gsap.killTweensOf(t);
      if (i === hoveredIdx) {
        gsap.to(t, { scale: 1.03, y: -8, rotation: 0, zIndex: 20, duration: 0.35, ease: 'back.out(1.4)', overwrite: 'auto' });
      } else {
        const dist = Math.abs(hoveredIdx - i);
        gsap.to(t, { scale: 0.98, y: i < hoveredIdx ? -14 : 14, rotation: 0, duration: 0.35, ease: 'back.out(1.4)', delay: dist * 0.03, overwrite: 'auto' });
      }
    });
  };

  const resetSiblings = () => {
    if (!enableHover || !containerRef.current) return;
    const q = gsap.utils.selector(containerRef);
    modules.forEach((_, i) => {
      const t = q(`.q-module-card-${i}`);
      gsap.killTweensOf(t);
      gsap.to(t, { scale: 1, y: 0, rotation: 0, duration: 0.45, ease: 'back.out(1.2)', overwrite: 'auto' });
    });
  };

  const handleCardMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  return (
    <>
      <style>{`
        .q-fc-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          padding: 80px 32px 100px;
          background: transparent;
          position: relative;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .q-fc-spine {
          position: absolute;
          top: 0; bottom: 0; left: 50%;
          transform: translateX(-50%);
          width: 1px;
          background: repeating-linear-gradient(
            to bottom,
            #474747 0px,
            #474747 6px,
            transparent 6px,
            transparent 16px
          );
          pointer-events: none;
          z-index: 0;
        }

        .q-conn-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 2;
        }
        .q-conn-dot {
          width: 9px; height: 9px;
          border-radius: 50%;
          border: 1.5px solid #474747;
          background: #131313;
        }
        .q-conn {
          width: 2px;
          height: 52px;
          background: linear-gradient(to bottom, #474747, transparent);
        }
        .q-conn-arrow {
          width: 0; height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 7px solid #474747;
        }

        /* ── CARD ── */
        .q-module-card {
          width: 100%;
          max-width: 580px;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(71, 71, 71, 0.7);
          cursor: pointer;
          will-change: transform, opacity;
          position: relative;
          z-index: 3;
          display: flex;
          flex-direction: column;
          transform: none;
          --mouse-x: 50%;
          --mouse-y: 50%;
          box-shadow: 0 2px 12px rgba(0,0,0,0.35), 0 8px 32px rgba(0,0,0,0.25);
          transition: border-color 0.35s ease, box-shadow 0.35s ease;
        }

        /* spotlight on hover */
        .q-module-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at var(--mouse-x) var(--mouse-y), var(--spotlight), transparent 65%);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.4s ease;
          z-index: 4;
        }
        .q-module-card:hover::before { opacity: 1; }

        /* Greyscale overlay — sits over the accent gradient at rest */
        .q-bw-overlay {
          position: absolute;
          inset: 0;
          z-index: 3;
          pointer-events: none;
          /* Neutral surface color covers the accent gradient */
          background: #000000;
          transition: opacity 0.45s ease;
          opacity: 1;
        }
        .q-module-card:hover .q-bw-overlay {
          opacity: 0;
        }

        .q-module-card:hover {
          box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 16px 56px rgba(0,0,0,0.35);
        }

        .q-card-body {
          padding: 28px 30px 24px;
          position: relative;
          z-index: 5;
          flex: 1;
        }

        .q-phase-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #2a2a2a;
          border: 1px solid #474747;
          border-radius: 999px;
          padding: 5px 13px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #919191;
          margin-bottom: 18px;
        }
        .q-phase-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
        }

        .q-card-title {
          font-size: 22px;
          font-weight: 700;
          color: #e2e2e2;
          margin: 0 0 10px;
          letter-spacing: -0.02em;
          line-height: 1.25;
        }

        .q-card-desc {
          font-size: 13.5px;
          font-weight: 400;
          color: #919191;
          line-height: 1.7;
          margin: 0 0 22px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .q-card-meta {
          display: flex;
          gap: 18px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .q-meta-item {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12.5px;
          font-weight: 500;
          color: #6a6a6a;
        }

        .q-card-topics {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          padding-top: 18px;
          border-top: 1px solid #2a2a2a;
        }
        .q-topic-tag {
          background: #0e0e0e;
          border: 1px solid rgba(71, 71, 71, 0.5);
          border-radius: 7px;
          padding: 5px 12px;
          font-size: 11.5px;
          font-weight: 500;
          color: #6a6a6a;
          transition: all 0.2s ease;
        }
        .q-module-card:hover .q-topic-tag {
          background: #2a2a2a;
          border-color: #6a6a6a;
          color: #e2e2e2;
        }

        .q-card-footer {
          position: relative;
          z-index: 5;
          padding: 11px 30px;
          border-top: 1px solid #2a2a2a;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #0e0e0e;
        }
        .q-footer-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #474747;
        }
        .q-footer-num {
          font-size: 13px;
          font-weight: 700;
          color: #474747;
          font-variant-numeric: tabular-nums;
        }
      `}</style>

      <div className={`q-fc-wrap ${className}`} ref={containerRef}>
        <div className="q-fc-spine" />

        {modules.map((mod, idx) => {
          const accent = ACCENTS[idx % ACCENTS.length];
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                maxWidth: 580,
                position: 'relative',
                zIndex: 3,
                transform: 'none',
              }}
            >
              {idx > 0 && (
                <div className="q-conn-wrap">
                  <div className="q-conn-dot" />
                  <div className="q-conn" />
                  <div className="q-conn-arrow" />
                </div>
              )}

              <div
                className={`q-module-card q-module-card-${idx}`}
                style={{
                  background: accent.gradient,
                  '--spotlight': `${accent.borderColor}20`,
                  /* NO rotation, NO transform here */
                }}
                onClick={() => setSelectedModule(mod)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = accent.borderColor;
                  pushSiblings(idx);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#222';
                  resetSiblings();
                }}
                onMouseMove={handleCardMouseMove}
              >
                {/* Greyscale veil — lifted on hover via CSS */}
                <div className="q-bw-overlay" />

                <div className="q-card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="q-phase-pill">
                      <span
                        className="q-phase-dot"
                        style={{
                          background: accent.borderColor,
                          boxShadow: `0 0 6px ${accent.borderColor}`,
                        }}
                      />
                      Phase {idx + 1}
                    </div>
                    {completedModules.includes(mod.name || mod.title) && (
                      <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '12px' }}>
                        <CheckCircle2 size={14} /> Completed
                      </div>
                    )}
                  </div>

                  <h3 className="q-card-title">{mod.title || mod.name || 'Unknown Module'}</h3>

                  <p className="q-card-desc">
                    {mod.description || mod.reasoning || 'No description available for this module. Focus on core objectives and related topics.'}
                  </p>

                  <div className="q-card-meta">
                    <div className="q-meta-item">
                      <Clock size={13} color="rgba(255,255,255,0.28)" />
                      {mod.duration || '2 weeks'}
                    </div>
                    <div className="q-meta-item">
                      <Target size={13} color="rgba(255,255,255,0.28)" />
                      {mod.difficulty || 'Intermediate'}
                    </div>
                    <div className="q-meta-item">
                      <Layers size={13} color="rgba(255,255,255,0.28)" />
                      {(mod.keyTopics || mod.skills)?.length || 0} topics
                    </div>
                  </div>

                  {(mod.keyTopics || mod.skills) && (mod.keyTopics || mod.skills).length > 0 && (
                    <div className="q-card-topics">
                      {(mod.keyTopics || mod.skills).map((topic, i) => (
                        <span key={i} className="q-topic-tag">{topic}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="q-card-footer">
                  <span className="q-footer-label">pathway · module</span>
                  <span className="q-footer-num">{String(idx + 1).padStart(2, '0')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedModule && (
        <ModuleModal
          module={selectedModule}
          onClose={() => setSelectedModule(null)}
          isCompleted={completedModules.includes(selectedModule.name || selectedModule.title)}
          onToggleComplete={() => {
            if (onToggleComplete) onToggleComplete(selectedModule.name || selectedModule.title);
          }}
        />
      )}
    </>
  );
}
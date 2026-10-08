"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const loadingTexts = [
  "Calling the higher authorities of AI...",
  "Ascending to LLM heavens...",
  "Breathing in the mechanical power...",
  "Suppressing Hallucinations...",
  "Converting the holy texts into readable language...",
  "Pulling the final strings..."
];

export default function Loading() {
  const [phase, setPhase] = useState(0);
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 15000);
    return () => { clearTimeout(t1); };
  }, []);

  useEffect(() => {
    let interval;
    if (phase === 0) {
      interval = setInterval(() => {
        setTextIndex((prev) => Math.min(prev + 1, loadingTexts.length - 1));
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [phase]);

  const cells = (n) => [...Array(n)].map((_, i) => <div key={i} className="q-cell" />);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .q-loading-wrapper {
          position: fixed; inset: 0;
          background: #000;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 56px;
          z-index: 9999;
          overflow: hidden;
        }

        .q-scene {
          perspective: 520px;
          perspective-origin: 50% 38%;
          width: 120px; height: 120px;
          flex-shrink: 0;
        }

        .q-cube {
          position: relative;
          width: 120px; height: 120px;
          transform-style: preserve-3d;
          transform: rotateX(-28deg) rotateY(45deg);
        }

        .q-layer {
          position: absolute;
          width: 120px; height: 40px;
          transform-style: preserve-3d;
          overflow: visible;
        }
        .q-layer-0 { top: 0px; }
        .q-layer-1 { top: 40px; }
        .q-layer-2 { top: 80px; }

        .is-solving {
          animation: master-drift 12s ease-in-out infinite;
        }
        @keyframes master-drift {
          0%   { transform: rotateX(-28deg) rotateY(45deg); }
          25%  { transform: rotateX(-28deg) rotateY(110deg); }
          50%  { transform: rotateX(-28deg) rotateY(45deg); }
          75%  { transform: rotateX(-28deg) rotateY(-20deg); }
          100% { transform: rotateX(-28deg) rotateY(45deg); }
        }

        .is-solving .q-layer-0 {
          animation: row-top 6s cubic-bezier(0.4,0,0.2,1) 0s infinite;
          transform-origin: 60px 20px 0;
        }
        @keyframes row-top {
          0%,12%  { transform: rotateY(0deg); }
          25%,48% { transform: rotateY(90deg); }
          60%,88% { transform: rotateY(90deg); }
          100%    { transform: rotateY(0deg); }
        }

        .is-solving .q-layer-1 {
          animation: row-mid 6s cubic-bezier(0.4,0,0.2,1) 2s infinite;
          transform-origin: 60px 20px 0;
        }
        @keyframes row-mid {
          0%,12%  { transform: rotateY(0deg); }
          25%,48% { transform: rotateY(-90deg); }
          60%,88% { transform: rotateY(-90deg); }
          100%    { transform: rotateY(0deg); }
        }

        .is-solving .q-layer-2 {
          animation: row-bot 6s cubic-bezier(0.4,0,0.2,1) 4s infinite;
          transform-origin: 60px 20px 0;
        }
        @keyframes row-bot {
          0%,12%  { transform: rotateY(0deg); }
          25%,48% { transform: rotateY(90deg); }
          60%,88% { transform: rotateY(90deg); }
          100%    { transform: rotateY(0deg); }
        }

        .is-solved .q-layer {
          animation: none !important;
          transform: rotateY(0deg) !important;
          transition: transform 0.6s cubic-bezier(0.25,1,0.5,1);
        }
        .is-solved {
          animation: solved-drift 5s ease-in-out infinite;
        }
        @keyframes solved-drift {
          0%,100% { transform: rotateX(-28deg) rotateY(45deg); }
          50%     { transform: rotateX(-28deg) rotateY(62deg); }
        }

        .q-face {
          position: absolute;
          display: grid; gap: 3px; padding: 3px;
          background: #090909;
          border: 1px solid rgba(255,255,255,0.07);
          transform-style: preserve-3d;
        }

        .q-face-side {
          width: 120px; height: 40px;
          grid-template-columns: repeat(3,1fr);
          grid-template-rows: 1fr;
        }

        .q-face-cap {
          width: 120px; height: 120px;
          top: -40px; left: 0;
          grid-template-columns: repeat(3,1fr);
          grid-template-rows: repeat(3,1fr);
        }

        .q-front { transform: rotateY(0deg)   translateZ(60px); }
        .q-back  { transform: rotateY(180deg) translateZ(60px); }
        .q-right { transform: rotateY(90deg)  translateZ(60px); }
        .q-left  { transform: rotateY(-90deg) translateZ(60px); }

        .q-top    { transform: rotateX(90deg)  translateZ(20px); }
        .q-bottom { transform: rotateX(-90deg) translateZ(20px); }

        .q-cell {
          background: rgba(255,255,255,0.04);
          border-radius: 2px;
          box-shadow: inset 0 0 8px rgba(0,0,0,0.8);
        }

        .is-solving .q-cell {
          animation: color-scramble 6s ease-in-out infinite;
        }
        .q-face .q-cell:nth-child(1) { animation-delay: 0.00s; }
        .q-face .q-cell:nth-child(2) { animation-delay: 0.22s; }
        .q-face .q-cell:nth-child(3) { animation-delay: 0.44s; }
        .q-face .q-cell:nth-child(4) { animation-delay: 0.66s; }
        .q-face .q-cell:nth-child(5) { animation-delay: 0.88s; }
        .q-face .q-cell:nth-child(6) { animation-delay: 1.10s; }
        .q-face .q-cell:nth-child(7) { animation-delay: 1.32s; }
        .q-face .q-cell:nth-child(8) { animation-delay: 1.54s; }
        .q-face .q-cell:nth-child(9) { animation-delay: 1.76s; }

        @keyframes color-scramble {
          0%   { background: rgba(255,255,255,0.04); box-shadow: inset 0 0 8px rgba(0,0,0,0.9); }
          20%  { background: rgba(139,92,246,0.75);  box-shadow: inset 0 0 14px #8B5CF6; }
          40%  { background: rgba(6,182,212,0.75);   box-shadow: inset 0 0 14px #06B6D4; }
          60%  { background: rgba(236,72,153,0.75);  box-shadow: inset 0 0 14px #EC4899; }
          80%  { background: rgba(245,158,11,0.75);  box-shadow: inset 0 0 14px #f59e0b; }
          100% { background: rgba(255,255,255,0.04); box-shadow: inset 0 0 8px rgba(0,0,0,0.9); }
        }

        .is-solved .q-cell { animation: none !important; }
        .is-solved .q-front  .q-cell { background: #8B5CF6; box-shadow: 0 0 8px rgba(139,92,246,0.5), inset 0 0 16px rgba(139,92,246,0.3); }
        .is-solved .q-top    .q-cell { background: #EC4899; box-shadow: 0 0 8px rgba(236,72,153,0.5), inset 0 0 16px rgba(236,72,153,0.3); }
        .is-solved .q-right  .q-cell { background: #06B6D4; box-shadow: 0 0 8px rgba(6,182,212,0.5),  inset 0 0 16px rgba(6,182,212,0.3); }
        .is-solved .q-left   .q-cell { background: #10b981; box-shadow: 0 0 8px rgba(16,185,129,0.5), inset 0 0 16px rgba(16,185,129,0.3); }
        .is-solved .q-back   .q-cell { background: #f59e0b; box-shadow: 0 0 8px rgba(245,158,11,0.5), inset 0 0 16px rgba(245,158,11,0.3); }
        .is-solved .q-bottom .q-cell { background: #ef4444; box-shadow: 0 0 8px rgba(239,68,68,0.5),  inset 0 0 16px rgba(239,68,68,0.3); }

        .q-glow {
          position: absolute; width: 220px; height: 220px;
          background: radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(6,182,212,0.1) 50%, transparent 70%);
          filter: blur(28px);
          pointer-events: none;
          animation: glow-pulse 3s ease-in-out infinite alternate;
        }
        @keyframes glow-pulse {
          from { transform: scale(1);   opacity: 0.8; }
          to   { transform: scale(1.3); opacity: 0.4; }
        }

        /* ── CHANGED: font-size 15px → 18px ── */
        .q-loading-text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 18px; font-weight: 600; letter-spacing: 0.03em;
          color: #a1a1aa;
          text-align: center;
          text-shadow: 0 0 10px rgba(255,255,255,0.2);
          width: 420px;
          flex-shrink: 0;
        }
      `}</style>

      <div className="q-loading-wrapper">

          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '80px',
            }}
          >
            {/* CUBE CONTAINER */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="q-glow" />
              <div className="q-scene">
                <div className={`q-cube ${phase === 0 ? 'is-solving' : 'is-solved'}`}>

                  <div className="q-layer q-layer-0">
                    <div className="q-face q-face-cap q-top">{cells(9)}</div>
                    <div className="q-face q-face-side q-front">{cells(3)}</div>
                    <div className="q-face q-face-side q-right">{cells(3)}</div>
                    <div className="q-face q-face-side q-back">{cells(3)}</div>
                    <div className="q-face q-face-side q-left">{cells(3)}</div>
                  </div>

                  <div className="q-layer q-layer-1">
                    <div className="q-face q-face-side q-front">{cells(3)}</div>
                    <div className="q-face q-face-side q-right">{cells(3)}</div>
                    <div className="q-face q-face-side q-back">{cells(3)}</div>
                    <div className="q-face q-face-side q-left">{cells(3)}</div>
                  </div>

                  <div className="q-layer q-layer-2">
                    <div className="q-face q-face-cap q-bottom">{cells(9)}</div>
                    <div className="q-face q-face-side q-front">{cells(3)}</div>
                    <div className="q-face q-face-side q-right">{cells(3)}</div>
                    <div className="q-face q-face-side q-back">{cells(3)}</div>
                    <div className="q-face q-face-side q-left">{cells(3)}</div>
                  </div>

                </div>
              </div>
            </div>

            {/* TEXT */}
            <div className="q-loading-text">
              <AnimatePresence mode="wait">
                <motion.div
                  key={phase === 1 ? 'locked' : textIndex}
                  initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                  transition={{ duration: 0.4 }}
                  style={{ color: phase === 1 ? '#ffffff' : '#a1a1aa' }}
                >
                  {phase === 1 ? 'System Locked. Pathway Loading.' : loadingTexts[textIndex]}
                </motion.div>
              </AnimatePresence>
            </div>

          </motion.div>

      </div>
    </>
  );
}
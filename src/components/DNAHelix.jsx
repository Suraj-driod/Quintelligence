"use client";

import { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import RoadmapCard from './RoadmapCard';
import ModuleModal from './ModuleModal';
import { Trophy } from 'lucide-react';

export default function DNAHelix({ modules, completedModules = [], onToggleComplete }) {
  const [selectedModule, setSelectedModule] = useState(null);
  const containerRef = useRef(null);

  const ROW_HEIGHT = 240;
  const END_GOAL_HEIGHT = 160; // extra space at bottom for the end goal node
  const totalHeight = Math.max(modules.length * ROW_HEIGHT, 400) + END_GOAL_HEIGHT;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const spineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const strand1Path = `M 50 0 ${modules.map((_, i) => `Q ${i % 2 === 0 ? '-20' : '120'} ${i * ROW_HEIGHT + ROW_HEIGHT / 2}, 50 ${(i + 1) * ROW_HEIGHT}`).join(' ')}`;
  const strand2Path = `M 50 0 ${modules.map((_, i) => `Q ${i % 2 === 0 ? '120' : '-20'} ${i * ROW_HEIGHT + ROW_HEIGHT / 2}, 50 ${(i + 1) * ROW_HEIGHT}`).join(' ')}`;

  // End goal sits below all modules
  const endGoalTop = modules.length * ROW_HEIGHT + END_GOAL_HEIGHT / 2;

  return (
    <>
      <style>{`
        .q-helix-wrapper {
          position: relative;
          width: 100%;
          margin: 60px 0;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .q-node-container {
          position: absolute;
          width: 100%;
          z-index: 10;
          /* KEY FIX: do not use display:flex here — it shifts the stacking context.
             Children are positioned absolutely relative to this div. */
        }

        .q-card-wrapper {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 44%;
          max-width: 420px;
        }
        /* Left card: sits to the left of centre */
        .q-card-wrapper.left {
          right: calc(50% + 48px);
        }
        /* Right card: sits to the right of centre */
        .q-card-wrapper.right {
          left: calc(50% + 48px);
        }

        /* Connector lines from spine to card */
        .q-connector {
          position: absolute;
          top: 50%;
          height: 1px;
          width: 48px;
          z-index: 5;
        }
        .q-connector.left {
          right: 50%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25));
          transform-origin: right center;
        }
        .q-connector.right {
          left: 50%;
          background: linear-gradient(90deg, rgba(255,255,255,0.25), transparent);
          transform-origin: left center;
        }

        /* Node orb — KEY FIX: positioned relative to the spine's centre.
           We use left:50% + marginLeft:-8px instead of transform so it
           doesn't conflict with the card's own transform. */
        .q-node-orb {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 16px;
          height: 16px;
          margin-left: -8px;   /* half of width */
          margin-top: -8px;    /* half of height */
          border-radius: 50%;
          background: #000000;
          border: 2px solid #ffffff;
          box-shadow: 0 0 20px rgba(255,255,255,0.5), inset 0 0 8px rgba(255,255,255,0.4);
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .q-node-orb::after {
          content: '';
          position: absolute;
          width: 100%; height: 100%;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.5);
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .q-node-orb-inner {
          width: 6px; height: 6px;
          background: #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 8px #ffffff;
        }

        @keyframes ping {
          75%, 100% { transform: scale(2.5); opacity: 0; }
        }

        /* ── END GOAL NODE ───────────────────────────────── */
        .q-end-goal {
          position: absolute;
          /* Centering via width + margin-left instead of transform
             so Framer Motion's transform (y animation) doesn't clobber it */
          left: 50%;
          width: 220px;
          margin-left: -110px;
          z-index: 20;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .q-end-goal-orb {
          width: 56px; height: 56px;
          border-radius: 50%;
          background: #ffffff;
          display: flex; align-items: center; justify-content: center;
          box-shadow:
            0 0 0 8px rgba(255,255,255,0.08),
            0 0 0 16px rgba(255,255,255,0.04),
            0 0 40px rgba(255,255,255,0.6),
            0 0 80px rgba(255,255,255,0.2);
          animation: end-pulse 3s ease-in-out infinite;
        }
        @keyframes end-pulse {
          0%, 100% { box-shadow: 0 0 0 8px rgba(255,255,255,0.08), 0 0 0 16px rgba(255,255,255,0.04), 0 0 40px rgba(255,255,255,0.6), 0 0 80px rgba(255,255,255,0.2); }
          50%       { box-shadow: 0 0 0 10px rgba(255,255,255,0.12), 0 0 0 22px rgba(255,255,255,0.06), 0 0 60px rgba(255,255,255,0.8), 0 0 100px rgba(255,255,255,0.3); }
        }

        .q-end-goal-label {
          text-align: center;
        }
        .q-end-goal-label h3 {
          font-size: 18px;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 4px 0;
          letter-spacing: -0.02em;
        }
        .q-end-goal-label p {
          font-size: 13px;
          color: #71717a;
          margin: 0;
          font-weight: 500;
        }

        /* ── MOBILE ─────────────────────────────────────── */
        @media (max-width: 1024px) {
          .q-desktop-svg { opacity: 0.15 !important; }

          .q-node-orb {
            left: 24px;
            margin-left: 0;
          }
          .q-spine-track { left: 24px !important; transform: none !important; }

          .q-card-wrapper {
            position: absolute !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            left: 56px !important;
            right: auto !important;
            width: calc(100% - 72px) !important;
          }
          .q-connector { display: none; }

          .q-end-goal { left: 24px; transform: none; align-items: flex-start; }
        }
      `}</style>

      <div
        className="q-helix-wrapper"
        style={{ minHeight: `${totalHeight + 100}px` }}
        ref={containerRef}
      >

        {/* ── DNA STRANDS SVG ── */}
        <svg
          className="q-desktop-svg"
          style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: '200px', height: '100%', zIndex: 0, overflow: 'visible'
          }}
          viewBox={`0 0 100 ${totalHeight}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="strand1-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(6,182,212,0.1)" />
              <stop offset="50%" stopColor="rgba(139,92,246,0.8)" />
              <stop offset="100%" stopColor="rgba(6,182,212,0.1)" />
            </linearGradient>
            <linearGradient id="strand2-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.5)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
            </linearGradient>
          </defs>

          <motion.path
            d={strand1Path}
            stroke="url(#strand1-grad)" strokeWidth="2" fill="none" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
            style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.4))' }}
          />
          <motion.path
            d={strand2Path}
            stroke="url(#strand2-grad)" strokeWidth="1.5" fill="none" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
          />
        </svg>

        {/* ── SPINE TRACK ── */}
        <div className="q-spine-track" style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '2px', height: '100%',
          background: 'rgba(255,255,255,0.05)',
          zIndex: 1, borderRadius: '999px'
        }} />
        <motion.div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '2px', height: spineHeight,
          background: 'linear-gradient(to bottom, transparent, #ffffff, #ffffff)',
          boxShadow: '0 0 20px 2px rgba(255,255,255,0.5)',
          zIndex: 2, borderRadius: '999px'
        }} />

        {/* ── MODULE NODES ── */}
        {modules.map((module, i) => {
          const isLeft = i % 2 === 0;
          const topPos = i * ROW_HEIGHT + ROW_HEIGHT / 2;

          return (
            <div
              key={i}
              className="q-node-container"
              style={{ top: `${topPos}px`, height: `1px` }}
            >
              {/* Orb — centered on spine via left:50% + negative margin */}
              <motion.div
                className="q-node-orb"
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, margin: "-20%" }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <div className="q-node-orb-inner" />
              </motion.div>

              {/* Connector */}
              <motion.div
                className={`q-connector ${isLeft ? 'left' : 'right'}`}
                initial={{ scaleX: 0, opacity: 0 }}
                whileInView={{ scaleX: 1, opacity: 1 }}
                viewport={{ once: true, margin: "-20%" }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
              />

              {/* Card */}
              <motion.div
                className={`q-card-wrapper ${isLeft ? 'left' : 'right'}`}
                initial={{ opacity: 0, x: isLeft ? 30 : -30, filter: 'blur(8px)' }}
                whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, margin: "-15%" }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
              >
                <RoadmapCard
                  module={module}
                  index={i}
                  side={isLeft ? 'left' : 'right'}
                  onClick={() => setSelectedModule(module)}
                />
              </motion.div>
            </div>
          );
        })}

        {/* ── END GOAL NODE ── */}
        <motion.div
          className="q-end-goal"
          style={{ top: `${endGoalTop}px` }}
          initial={{ scale: 0, opacity: 0, y: 20 }}
          whileInView={{ scale: 1, opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.3 }}
        >
          <div className="q-end-goal-orb">
            <Trophy size={24} color="#000000" strokeWidth={2.5} />
          </div>
          <div className="q-end-goal-label">
            <h3>Pathway Complete</h3>
            <p>All modules synthesized</p>
          </div>
        </motion.div>

      </div>

      {selectedModule && (
        <ModuleModal 
          module={selectedModule} 
          onClose={() => setSelectedModule(null)} 
          isCompleted={completedModules.includes(selectedModule.id)}
          onToggleComplete={() => {
            if (onToggleComplete) onToggleComplete(selectedModule.id);
          }}
        />
      )}
    </>
  );
}
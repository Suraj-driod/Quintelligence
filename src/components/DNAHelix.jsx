"use client";

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import RoadmapCard from './RoadmapCard';
import { Sparkles } from 'lucide-react';

export default function DNAHelix({ modules }) {
  const containerRef = useRef(null);

  const ROW_HEIGHT = 240; 
  const totalHeight = Math.max(modules.length * ROW_HEIGHT, 400);

  // Scroll tracking to make the central spine fill up as the user scrolls
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const spineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  // Draw smooth Bezier curves for the double helix
  const strand1Path = `M 50 0 ${modules.map((_, i) => `Q ${i % 2 === 0 ? '-20' : '120'} ${i * ROW_HEIGHT + ROW_HEIGHT/2}, 50 ${(i+1) * ROW_HEIGHT}`).join(' ')}`;
  const strand2Path = `M 50 0 ${modules.map((_, i) => `Q ${i % 2 === 0 ? '120' : '-20'} ${i * ROW_HEIGHT + ROW_HEIGHT/2}, 50 ${(i+1) * ROW_HEIGHT}`).join(' ')}`;

  return (
    <>
      <style>{`
        .q-helix-wrapper {
          position: relative;
          width: 100%;
          margin: 60px 0;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* Responsive Container */
        .q-node-container {
          position: absolute;
          width: 100%;
          z-index: 10;
          display: flex;
          align-items: center;
        }

        /* Cards Positioning */
        .q-card-wrapper {
          position: absolute;
          width: 45%;
          max-width: 420px;
        }
        .q-card-wrapper.left { right: 50%; padding-right: 60px; }
        .q-card-wrapper.right { left: 50%; padding-left: 60px; }

        /* Themed Glowing Connectors */
        .q-connector {
          position: absolute;
          height: 1px;
          top: 50%;
          z-index: 0;
        }
        .q-connector.left {
          right: 50%;
          width: 60px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3));
        }
        .q-connector.right {
          left: 50%;
          width: 60px;
          background: linear-gradient(90deg, rgba(255,255,255,0.3), transparent);
        }

        /* Pulsing Node Orbs */
        .q-node-orb {
          position: absolute;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #000000;
          border: 2px solid #ffffff;
          box-shadow: 0 0 20px rgba(255,255,255,0.4), inset 0 0 10px rgba(255,255,255,0.5);
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

        @keyframes ping {
          75%, 100% { transform: scale(2.5); opacity: 0; }
        }

        /* Mobile Layout Adjustments */
        @media (max-width: 1024px) {
          .q-desktop-svg { opacity: 0.15 !important; }
          
          .q-node-orb { left: 24px; }
          .q-spine-track { left: 24px !important; }
          
          .q-card-wrapper {
            position: relative;
            width: calc(100% - 64px);
            left: 64px !important;
            right: auto !important;
            padding: 0 !important;
            margin-bottom: 32px;
          }
          
          .q-connector { display: none; }
        }
      `}</style>

      {/* The ref is now attached immediately on the first render, preventing the error */}
      <div className="q-helix-wrapper" style={{ minHeight: `${totalHeight + 100}px` }} ref={containerRef}>
        
        {/* --- GLOWING SVG DNA STRANDS --- */}
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
              <stop offset="0%" stopColor="rgba(6, 182, 212, 0.1)" />
              <stop offset="50%" stopColor="rgba(139, 92, 246, 0.8)" />
              <stop offset="100%" stopColor="rgba(6, 182, 212, 0.1)" />
            </linearGradient>
            
            <linearGradient id="strand2-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.1)" />
              <stop offset="50%" stopColor="rgba(255, 255, 255, 0.5)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.1)" />
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

        {/* --- SCROLL-DRIVEN CENTRAL SPINE --- */}
        <div className="q-spine-track" style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '2px', height: '100%', background: 'rgba(255,255,255,0.05)',
          zIndex: 1, borderRadius: '999px'
        }} />
        
        <motion.div className="q-spine-track" style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '2px', height: spineHeight, 
          background: 'linear-gradient(to bottom, transparent, #ffffff, #ffffff)',
          boxShadow: '0 0 20px 2px rgba(255,255,255,0.5)',
          zIndex: 2, borderRadius: '999px'
        }} />

        {/* --- MODULE NODES & CARDS --- */}
        {modules.map((module, i) => {
          const isLeft = i % 2 === 0;
          const topPos = i * ROW_HEIGHT + ROW_HEIGHT / 2;
          
          return (
            <div key={i} className="q-node-container" style={{ top: `${topPos}px` }}>
              
              <motion.div 
                className="q-node-orb"
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, margin: "-20%" }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <div style={{ width: '6px', height: '6px', background: '#ffffff', borderRadius: '50%', boxShadow: '0 0 10px #ffffff' }} />
              </motion.div>

              <motion.div 
                className={`q-connector ${isLeft ? 'left' : 'right'}`}
                initial={{ scaleX: 0, opacity: 0 }}
                whileInView={{ scaleX: 1, opacity: 1 }}
                viewport={{ once: true, margin: "-20%" }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                style={{ transformOrigin: isLeft ? 'right' : 'left' }}
              />

              <motion.div 
                className={`q-card-wrapper ${isLeft ? 'left' : 'right'}`}
                initial={{ opacity: 0, x: isLeft ? 40 : -40, filter: 'blur(10px)' }}
                whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, margin: "-15%" }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
              >
                <RoadmapCard module={module} index={i} side={isLeft ? 'left' : 'right'} />
              </motion.div>

            </div>
          );
        })}

       
        
      </div>
    </>
  );
}
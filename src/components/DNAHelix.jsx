"use client";

import { useEffect, useState } from 'react';
import RoadmapCard from './RoadmapCard';

export default function DNAHelix({ modules }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const ROW_HEIGHT = 180;
  const totalHeight = Math.max(modules.length * ROW_HEIGHT, 400);

  if (!mounted) return null;

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: `${totalHeight + 100}px`, margin: '40px 0' }}>
      
      {/* Background SVG DNA Strands */}
      <svg 
        style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100px', height: '100%', zIndex: 0, opacity: 0.6
        }}
        viewBox={`0 0 100 ${totalHeight}`}
        preserveAspectRatio="none"
      >
        <path 
          d={`M 50 0 ${modules.map((_, i) => `Q ${i % 2 === 0 ? '0' : '100'} ${i * ROW_HEIGHT + ROW_HEIGHT/2}, 50 ${(i+1) * ROW_HEIGHT}`).join(' ')}`}
          stroke="#8B5CF6" strokeWidth="2" fill="none"
          style={{ animation: 'draw-strand 1.5s ease forwards' }}
          strokeDasharray="2000" strokeDashoffset="2000"
        />
        <path 
          d={`M 50 0 ${modules.map((_, i) => `Q ${i % 2 === 0 ? '100' : '0'} ${i * ROW_HEIGHT + ROW_HEIGHT/2}, 50 ${(i+1) * ROW_HEIGHT}`).join(' ')}`}
          stroke="#06B6D4" strokeWidth="2" fill="none"
          style={{ animation: 'draw-strand 1.5s ease forwards' }}
          strokeDasharray="2000" strokeDashoffset="2000"
        />
      </svg>

      {/* Central Spine Line (Linear) */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '4px', height: '100%', background: 'linear-gradient(to bottom, #8B5CF6, #06B6D4, #EC4899)',
        zIndex: 1, borderRadius: '99px'
      }} />

      {/* Modules */}
      {modules.map((module, i) => {
        const isLeft = i % 2 === 0;
        const topPos = i * ROW_HEIGHT + ROW_HEIGHT / 2;
        
        return (
          <div key={i} style={{ position: 'absolute', top: `${topPos}px`, width: '100%', zIndex: 10 }}>
            {/* Spine Dot */}
            <div style={{
              position: 'absolute', left: '50%', transform: 'translate(-50%, -50%)',
              width: '14px', height: '14px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
              border: '3px solid white',
              boxShadow: '0 0 12px rgba(139,92,246,0.6)',
              zIndex: 2
            }} />

            {/* Connector Line */}
            <div className={`dna-connector ${isLeft ? 'left' : 'right'}`} />

            {/* Roadmap Card Container */}
            <div className={`dna-card-container ${isLeft ? 'left' : 'right'}`}>
              <RoadmapCard module={module} index={i} side={isLeft ? 'left' : 'right'} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

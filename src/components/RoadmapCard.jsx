"use client";

import SkillChip from './SkillChip';
import ReasoningTrace from './ReasoningTrace';
import { useState } from 'react';

export default function RoadmapCard({ module, index, side, onClick }) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Monochrome accent shades based on index
  const shades = ['#ffffff', '#c6c6c7', '#919191', '#e2e2e2'];
  const accentHex = shades[index % shades.length];

  // For entrance animation
  const animateClass = side === 'left' ? 'dna-card-left' : 'dna-card-right';
  const animationDelay = `${index * 0.15}s`;

  return (
    <div 
      className={`${animateClass}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      style={{
        cursor: 'pointer',
        width: '320px',
        maxWidth: '100%',
        padding: '20px',
        background: isHovered ? 'rgba(31, 31, 31, 0.8)' : 'rgba(31, 31, 31, 0.6)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${isHovered ? 'rgba(255,255,255,0.2)' : 'rgba(71,71,71,0.3)'}`,
        borderRadius: '20px',
        boxShadow: isHovered ? '0 0 30px rgba(255,255,255,0.06)' : 'none',
        transition: 'all 0.3s ease',
        animationDelay,
        animationFillMode: 'both'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{
          fontSize: '11px', color: accentHex, letterSpacing: '0.05em', fontWeight: 600, textTransform: 'uppercase'
        }}>
          Module {String(index + 1).padStart(2, '0')}
        </div>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.06)', color: '#919191', borderRadius: '9999px', fontSize: '12px', padding: '2px 8px',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          {module.duration}
        </div>
      </div>
      
      <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#e2e2e2', margin: '0 0 12px 0' }}>
        {module.name}
      </h3>
      
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {module.skills?.map(skill => (
          <SkillChip key={skill} label={skill} size="sm" />
        ))}
      </div>
      
      <ReasoningTrace reasoning={module.reasoning} />
    </div>
  );
}

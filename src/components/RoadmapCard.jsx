"use client";

import SkillChip from './SkillChip';
import ReasoningTrace from './ReasoningTrace';
import { useState } from 'react';

export default function RoadmapCard({ module, index, side }) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Rotate colors based on index: purple, cyan, pink, green
  const colors = ['purple', 'cyan', 'pink', 'green'];
  const accentColor = colors[index % colors.length];
  
  const accentHex = {
    purple: '#8B5CF6',
    cyan: '#06B6D4',
    pink: '#EC4899',
    green: '#10B981',
  }[accentColor];

  // For entrance animation
  const animateClass = side === 'left' ? 'dna-card-left' : 'dna-card-right';
  const animationDelay = `${index * 0.15}s`;

  return (
    <div 
      className={`surface-card ${animateClass}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '320px',
        maxWidth: '100%',
        padding: '20px',
        borderColor: isHovered ? accentHex : '#1a1a1a',
        boxShadow: isHovered ? `0 0 20px ${accentHex}26` : 'none',
        transition: 'all 0.2s ease',
        animationDelay,
        animationFillMode: 'both' // Ensures it stays hidden before animation
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{
          fontSize: '11px', color: accentHex, letterSpacing: '0.05em', fontWeight: 600, textTransform: 'uppercase'
        }}>
          Module {String(index + 1).padStart(2, '0')}
        </div>
        <div style={{
          backgroundColor: '#1a1a1a', color: '#888', borderRadius: '99px', fontSize: '12px', padding: '2px 8px'
        }}>
          {module.duration}
        </div>
      </div>
      
      <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'white', margin: '0 0 12px 0' }}>
        {module.name}
      </h3>
      
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {module.skills?.map(skill => (
          <SkillChip key={skill} label={skill} color={accentColor} size="sm" />
        ))}
      </div>
      
      <ReasoningTrace reasoning={module.reasoning} />
    </div>
  );
}

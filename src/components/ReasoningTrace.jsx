"use client";

import { useState } from 'react';

export default function ReasoningTrace({ reasoning }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ marginTop: '16px' }}>
      <button 
        onClick={() => setExpanded(!expanded)}
        style={{
          fontSize: '12px', color: '#c6c6c7', backgroundColor: 'transparent',
          border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: '4px', transition: 'color 0.2s'
        }}
      >
        Why this module? <span style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
      </button>

      <div style={{
        maxHeight: expanded ? '200px' : '0',
        opacity: expanded ? 1 : 0,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        marginTop: expanded ? '8px' : '0'
      }}>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderLeft: '2px solid #919191',
          borderRadius: '0 12px 12px 0',
          padding: '12px'
        }}>
          <p style={{
            margin: 0, fontStyle: 'italic', color: '#919191', fontSize: '13px', lineHeight: 1.7
          }}>
            {reasoning}
          </p>
        </div>
      </div>
    </div>
  );
}

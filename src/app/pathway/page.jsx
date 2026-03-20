"use client";

import { useState } from 'react';
import DNAHelix from '../../components/DNAHelix';
import FeedbackPanel from '../../components/FeedbackPanel';

const dummyModules = [
  {
    id: 1,
    name: 'Advanced TypeScript Patterns',
    duration: '8 hrs',
    skills: ['TypeScript', 'Generics', 'Utility Types'],
    reasoning: 'Addresses the gap from Beginner to Intermediate TypeScript required by the JD. Your repos show mostly JS.'
  },
  {
    id: 2,
    name: 'GraphQL Data Fetching in React',
    duration: '12 hrs',
    skills: ['GraphQL', 'Apollo', 'Caching'],
    reasoning: 'Fills the missing GraphQL requirement completely. Critical for the Senior Frontend role.'
  },
  {
    id: 3,
    name: 'Docker Fundamentals for Devs',
    duration: '4 hrs',
    skills: ['Docker', 'Containers', 'CI/CD'],
    reasoning: 'Basic understanding of containerization is expected in the JD for local environment setups.'
  },
  {
    id: 4,
    name: 'Frontend System Design',
    duration: '16 hrs',
    skills: ['System Design', 'Architecture', 'Performance'],
    reasoning: 'Bridges your current intermediate system design skills to the advanced level required for leadership.'
  }
];

export default function PathwayPage() {
  const [modules, setModules] = useState(dummyModules);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async (feedback) => {
    setIsRegenerating(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 2000));
    
    // Simulate updating modules based on feedback
    setModules(prev => prev.map(m => ({ ...m, duration: 'Refined' })));
    setIsRegenerating(false);
  };

  return (
    <div style={{ paddingBottom: '100px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 24px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '12px' }}>
            Your Learning DNA
          </h1>
          <p style={{ color: '#888', fontSize: '15px' }}>
            Role: Senior Frontend Developer • {modules.length} modules • Est. 40 hours total
          </p>
          
          <div style={{ marginTop: '24px', width: '100%', height: '8px', background: '#111', borderRadius: '99px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '15%', background: 'linear-gradient(90deg, #8B5CF6, #06B6D4)', borderRadius: '99px' }} />
          </div>
          <div style={{ textAlign: 'right', color: '#888', fontSize: '12px', marginTop: '8px' }}>15% Complete</div>
        </div>

        {/* DNA Helix Block */}
        <div style={{ opacity: isRegenerating ? 0.3 : 1, transition: 'opacity 0.3s' }}>
          <DNAHelix modules={modules} />
        </div>

        {/* Loading Overlay Context */}
        {isRegenerating && (
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', zIndex: 100 }}>
            <div style={{
                width: '40px', height: '40px', border: '3px solid rgba(139,92,246,0.3)',
                borderTopColor: '#8B5CF6', borderRadius: '50%', margin: '0 auto 16px',
              }} className="animate-spin" />
            <div style={{ color: 'white', fontWeight: 600 }}>Regenerating your pathway...</div>
          </div>
        )}

      </div>

      <FeedbackPanel onRegenerate={handleRegenerate} />
    </div>
  );
}

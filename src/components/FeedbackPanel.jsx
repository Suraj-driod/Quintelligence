"use client";

import { useState } from 'react';

export default function FeedbackPanel({ onRegenerate }) {
  const [rating, setRating] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [freeText, setFreeText] = useState("");

  const emojis = ['😞', '😐', '🙂', '😊', '🔥'];

  const feedbackOptions = [
    { id: 'advanced', icon: '📈', title: 'Too Advanced', desc: 'Start with more basics' },
    { id: 'basic', icon: '📉', title: 'Too Basic', desc: 'I need more advanced content' },
    { id: 'focus', icon: '🎯', title: 'Wrong Focus', desc: 'Different skill areas needed' },
    { id: 'length', icon: '⏱️', title: 'Too Long', desc: 'Make it more concise' },
  ];

  const handleToggleOption = (id) => {
    setSelectedOptions(prev => 
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );
  };

  const handleRegenerate = async () => {
    setShowModal(false);
    if (onRegenerate) await onRegenerate({ rating, selectedOptions, freeText });
  };

  const handleLooksGood = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <>
      <div style={{
        position: 'fixed', bottom: 0, left: 0, width: '100%',
        backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid #1a1a1a', padding: '16px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        zIndex: 50
      }}>
        {/* Left Side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#888', fontSize: '14px' }}>How&apos;s your pathway?</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {emojis.map((emoji, i) => (
              <button
                key={i}
                onClick={() => setRating(i)}
                style={{
                  fontSize: '28px', background: 'transparent', border: 'none', cursor: 'pointer',
                  opacity: rating === i ? 1 : 0.5,
                  transform: rating === i ? 'scale(1.3)' : 'scale(1)',
                  transition: 'all 0.15s ease', padding: 0
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Right Side */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {success && (
            <span style={{ color: '#10B981', fontSize: '14px', animation: 'toast-in 0.3s ease' }}>
              Saved!
            </span>
          )}
          <button 
            onClick={() => setShowModal(true)}
            style={{
              background: 'transparent', border: '1px solid #8B5CF6', color: '#8B5CF6',
              borderRadius: '99px', padding: '8px 20px', fontSize: '14px', cursor: 'pointer'
            }}
          >
            Refine My Pathway
          </button>
          <button 
            onClick={handleLooksGood}
            className="gradient-btn"
            style={{ borderRadius: '99px', padding: '8px 20px', fontSize: '14px' }}
          >
            Looks Good ✓
          </button>
        </div>
      </div>

      {/* Feedback Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '20px',
            width: 'min(520px, 90vw)', padding: '32px', position: 'relative'
          }}>
            <button 
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute', top: '24px', right: '24px', background: 'transparent',
                border: 'none', color: '#555', fontSize: '20px', cursor: 'pointer'
              }}
            >
              ✕
            </button>
            
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white', margin: '0 0 8px 0' }}>Refine Your Pathway</h2>
            <p style={{ color: '#888', fontSize: '14px', margin: '0 0 24px 0' }}>Tell us what to adjust</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {feedbackOptions.map(opt => {
                const isSelected = selectedOptions.includes(opt.id);
                return (
                  <div 
                    key={opt.id}
                    onClick={() => handleToggleOption(opt.id)}
                    style={{
                      backgroundColor: isSelected ? 'rgba(139,92,246,0.08)' : '#111',
                      border: `1px solid ${isSelected ? '#8B5CF6' : '#222'}`,
                      borderRadius: '12px', padding: '16px', cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{opt.icon}</div>
                    <div style={{ color: 'white', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{opt.title}</div>
                    <div style={{ color: '#888', fontSize: '12px' }}>{opt.desc}</div>
                  </div>
                );
              })}
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ color: '#888', fontSize: '13px', marginBottom: '8px' }}>Anything specific?</div>
              <textarea 
                value={freeText}
                onChange={e => setFreeText(e.target.value)}
                placeholder="e.g. Focus more on React and less on Vue..."
                style={{
                  backgroundColor: '#111', border: '1px solid #222', color: 'white',
                  borderRadius: '8px', padding: '12px', width: '100%', minHeight: '80px',
                  fontFamily: 'inherit', fontSize: '14px', resize: 'vertical'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setShowModal(false)}
                style={{
                  background: 'transparent', border: '1px solid #333', color: '#888',
                  borderRadius: '99px', padding: '12px 24px', fontSize: '14px', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleRegenerate}
                className="gradient-btn"
                style={{ borderRadius: '99px', padding: '12px 24px', fontSize: '14px', flex: 1 }}
              >
                Regenerate Pathway →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

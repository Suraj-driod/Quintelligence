"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Clock, X, CheckCircle2, Sparkles, SlidersHorizontal } from 'lucide-react';

export default function FeedbackPanel({ onRegenerate }) {
  const [rating, setRating] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [freeText, setFreeText] = useState("");

  // Emojis for the quick feedback dock
  const emojis = ['😞', '😐', '🙂', '😊', '🔥'];

  // Upgraded to use Lucide Icons
  const feedbackOptions = [
    { id: 'advanced', icon: <TrendingUp size={22} />, title: 'Too Advanced', desc: 'Start with more basics' },
    { id: 'basic', icon: <TrendingDown size={22} />, title: 'Too Basic', desc: 'I need more advanced content' },
    { id: 'focus', icon: <Target size={22} />, title: 'Wrong Focus', desc: 'Different skill areas needed' },
    { id: 'length', icon: <Clock size={22} />, title: 'Too Long', desc: 'Make it more concise' },
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

  // Framer Motion Variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } },
    exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
  };

  return (
    <>
      <style>{`
        /* --- PREMIUM DOCK & MODAL CSS --- */
        .q-feedback-dock {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 48px);
          max-width: 800px;
          background: linear-gradient(180deg, rgba(20,20,20,0.7) 0%, rgba(10,10,10,0.9) 100%);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 9999px;
          padding: 12px 16px 12px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 50;
          box-shadow: 
            inset 0 1px 0 0 rgba(255,255,255,0.15),
            0 20px 40px rgba(0,0,0,0.8),
            0 0 20px rgba(0,0,0,0.4);
        }

        /* Mobile adjustments for dock */
        @media (max-width: 768px) {
          .q-feedback-dock {
            flex-direction: column;
            gap: 16px;
            padding: 20px;
            border-radius: 24px;
            bottom: 16px;
          }
          .q-dock-actions { width: 100%; justify-content: space-between; }
        }

        .q-emoji-btn {
          font-size: 24px;
          background: transparent;
          border: none;
          cursor: pointer;
          width: 40px; height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          filter: grayscale(100%) opacity(0.5);
        }
        .q-emoji-btn:hover {
          filter: grayscale(0%) opacity(1);
          transform: scale(1.2);
          background: rgba(255,255,255,0.05);
        }
        .q-emoji-active {
          filter: grayscale(0%) opacity(1);
          transform: scale(1.3);
          background: rgba(255,255,255,0.1);
          box-shadow: 0 0 20px rgba(255,255,255,0.1);
        }

        /* Action Buttons */
        .q-btn-ghost {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          color: #e2e2e2;
          border-radius: 9999px;
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }
        .q-btn-ghost:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.2);
          color: #ffffff;
        }

        .q-btn-solid {
          background: linear-gradient(180deg, #ffffff 0%, #d4d4d8 100%);
          color: #000000;
          border: none;
          border-radius: 9999px;
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 700;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: inset 0 1px 1px rgba(255,255,255,1), 0 4px 15px rgba(255,255,255,0.15);
          transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .q-btn-solid:hover {
          transform: translateY(-2px);
          box-shadow: inset 0 1px 1px rgba(255,255,255,1), 0 8px 20px rgba(255,255,255,0.25);
        }

        /* Modal Internals */
        .q-modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .q-modal-surface {
          background: linear-gradient(180deg, rgba(25,25,25,0.95) 0%, rgba(10,10,10,1) 100%);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          width: 100%; max-width: 560px;
          padding: 32px;
          position: relative;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 30px 60px rgba(0,0,0,0.8);
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .q-option-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 24px;
        }

        .q-option-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .q-option-card:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.15);
        }
        .q-option-card.selected {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.3);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1), 0 8px 20px rgba(0,0,0,0.2);
        }
        .q-option-card.selected .icon-glow {
          color: #ffffff;
        }

        .q-textarea {
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 16px;
          width: 100%;
          min-height: 100px;
          color: #e2e2e2;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.6;
          resize: vertical;
          outline: none;
          transition: all 0.3s ease;
        }
        .q-textarea:focus {
          border-color: rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.05);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1), 0 0 20px rgba(255,255,255,0.05);
        }
      `}</style>

      {/* --- FLOATING FEEDBACK DOCK --- */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.5 }}
        className="q-feedback-dock"
      >
        {/* Left Side: Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#a1a1aa', fontSize: '14px', fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            How's your pathway?
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {emojis.map((emoji, i) => (
              <button
                key={i}
                onClick={() => setRating(i)}
                className={`q-emoji-btn ${rating === i ? 'q-emoji-active' : ''}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="q-dock-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <AnimatePresence>
            {success && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '13px', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <CheckCircle2 size={16} /> Saved
              </motion.span>
            )}
          </AnimatePresence>

          <button onClick={() => setShowModal(true)} className="q-btn-ghost">
            <SlidersHorizontal size={16} />
            Refine
          </button>
          
          <button onClick={handleLooksGood} className="q-btn-solid">
            <Sparkles size={16} />
            Looks Good
          </button>
        </div>
      </motion.div>

      {/* --- REFINEMENT MODAL --- */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="q-modal-backdrop"
          >
            <motion.div 
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="q-modal-surface"
            >
              <button 
                onClick={() => setShowModal(false)}
                style={{
                  position: 'absolute', top: '24px', right: '24px', 
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
                  color: '#a1a1aa', borderRadius: '50%', width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#a1a1aa'; }}
              >
                <X size={16} />
              </button>
              
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
                Refine Your Pathway
              </h2>
              <p style={{ color: '#a1a1aa', fontSize: '15px', margin: '0 0 32px 0' }}>
                Tell the AI exactly what needs adjustment.
              </p>
              
              {/* Option Grid */}
              <div className="q-option-grid">
                {feedbackOptions.map(opt => {
                  const isSelected = selectedOptions.includes(opt.id);
                  return (
                    <div 
                      key={opt.id}
                      onClick={() => handleToggleOption(opt.id)}
                      className={`q-option-card ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="icon-glow" style={{ color: isSelected ? '#ffffff' : '#71717a', marginBottom: '12px', transition: 'color 0.2s ease' }}>
                        {opt.icon}
                      </div>
                      <div style={{ color: isSelected ? '#ffffff' : '#e2e2e2', fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>
                        {opt.title}
                      </div>
                      <div style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: 1.5 }}>
                        {opt.desc}
                      </div>
                      {/* Selection Indicator Ring */}
                      {isSelected && (
                        <motion.div layoutId="selection-ring" style={{ position: 'absolute', inset: 0, borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)', pointerEvents: 'none' }} />
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Free Text Input */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ color: '#e2e2e2', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
                  Additional Context <span style={{ color: '#71717a', fontWeight: 500 }}>(Optional)</span>
                </div>
                <textarea 
                  className="q-textarea"
                  value={freeText}
                  onChange={e => setFreeText(e.target.value)}
                  placeholder="e.g. Focus more on React component architecture and less on Vue..."
                />
              </div>
              
              {/* Modal Footer Actions */}
              <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                <button onClick={() => setShowModal(false)} className="q-btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
                <button onClick={handleRegenerate} className="q-btn-solid" style={{ flex: 2, justifyContent: 'center' }}>
                  <Sparkles size={16} />
                  Regenerate Pathway
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
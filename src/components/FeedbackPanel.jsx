"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Clock, X, CheckCircle2, Sparkles, SlidersHorizontal } from 'lucide-react';

export default function FeedbackPanel({ onRegenerate }) {
  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [freeText, setFreeText] = useState("");

  const feedbackOptions = [
    { id: 'advanced', icon: <TrendingUp size={18} />, title: 'Too Advanced', desc: 'Start with more basics' },
    { id: 'basic', icon: <TrendingDown size={18} />, title: 'Too Basic', desc: 'Need more advanced content' },
    { id: 'focus', icon: <Target size={18} />, title: 'Wrong Focus', desc: 'Different skill areas needed' },
    { id: 'length', icon: <Clock size={18} />, title: 'Too Long', desc: 'Make it more concise' },
  ];

  const toggleOption = (id) =>
    setSelectedOptions(prev =>
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );

  const handleRegenerate = async () => {
    setShowModal(false);
    if (onRegenerate) await onRegenerate({ selectedOptions, freeText });
  };

  const handleLooksGood = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <>
      <style>{`
        .q-dock {
          position: fixed;
          bottom: 28px;
          left: 0;
          right: 0;
          width: fit-content;
          margin-left: auto;
          margin-right: auto;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 9999px;
          background: linear-gradient(180deg, rgba(22,22,22,0.88) 0%, rgba(10,10,10,0.96) 100%);
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.12),
            0 24px 48px rgba(0,0,0,0.7);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          z-index: 50;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .q-dock-divider {
          width: 1px;
          height: 20px;
          background: rgba(255,255,255,0.1);
          flex-shrink: 0;
        }

        .q-btn-ghost {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 18px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 9999px;
          color: #e2e2e2;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px; font-weight: 600;
          cursor: pointer; white-space: nowrap;
          transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
        }
        .q-btn-ghost:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.2);
          color: #ffffff;
        }

        .q-btn-solid {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 18px;
          background: #ffffff;
          border: none;
          border-radius: 9999px;
          color: #000000;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px; font-weight: 700;
          cursor: pointer; white-space: nowrap;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 12px rgba(255,255,255,0.15);
          transition: transform 0.2s cubic-bezier(0.25,1,0.5,1), box-shadow 0.2s ease;
        }
        .q-btn-solid:hover {
          transform: translateY(-2px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 20px rgba(255,255,255,0.25);
        }

        /* Modal */
        .q-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .q-modal {
          background: linear-gradient(180deg, rgba(24,24,24,0.98) 0%, rgba(10,10,10,1) 100%);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          width: 100%; max-width: 480px;
          padding: 28px;
          position: relative;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.1),
            0 40px 80px rgba(0,0,0,0.9);
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .q-modal-close {
          position: absolute; top: 20px; right: 20px;
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.45);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
        }
        .q-modal-close:hover {
          background: rgba(255,255,255,0.1);
          color: #ffffff;
        }

        .q-option-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 18px;
        }

        .q-option {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 14px;
          cursor: pointer;
          transition: background 0.18s ease, border-color 0.18s ease;
        }
        .q-option:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.14);
        }
        .q-option.active {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.28);
        }

        .q-option-icon {
          margin-bottom: 10px;
          transition: color 0.18s ease;
        }

        .q-textarea {
          width: 100%; min-height: 80px;
          background: rgba(0,0,0,0.45);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 12px 14px;
          color: #e2e2e2;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px; line-height: 1.6;
          resize: none; outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .q-textarea:focus {
          border-color: rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.04);
        }
        .q-textarea::placeholder { color: #4a4a4a; }

        .q-modal-footer {
          display: flex; gap: 10px; margin-top: 18px;
        }
        .q-modal-footer .q-btn-ghost  { flex: 1; justify-content: center; }
        .q-modal-footer .q-btn-solid  { flex: 2; justify-content: center; }
      `}</style>

      {/* DOCK */}
      <motion.div
        className="q-dock"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.5 }}
      >
        <button className="q-btn-ghost" onClick={() => setShowModal(true)}>
          <SlidersHorizontal size={13} />
          Refine Pathway
        </button>

        <div className="q-dock-divider" />

        <button className="q-btn-solid" onClick={handleLooksGood}>
          <Sparkles size={13} />
          Looks Good
        </button>

        <AnimatePresence>
          {success && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                color: '#10b981', fontSize: '12px', fontWeight: 700,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                paddingLeft: '2px', whiteSpace: 'nowrap'
              }}
            >
              <CheckCircle2 size={13} /> Saved
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {/* MODAL */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="q-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              className="q-modal"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            >
              <button className="q-modal-close" onClick={() => setShowModal(false)}>
                <X size={13} />
              </button>

              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                Refine Your Pathway
              </h2>
              <p style={{ color: '#71717a', fontSize: '13px', margin: '0 0 22px', lineHeight: 1.5 }}>
                Tell the AI exactly what needs adjustment.
              </p>

              <div className="q-option-grid">
                {feedbackOptions.map(opt => {
                  const active = selectedOptions.includes(opt.id);
                  return (
                    <div
                      key={opt.id}
                      className={`q-option ${active ? 'active' : ''}`}
                      onClick={() => toggleOption(opt.id)}
                    >
                      <div
                        className="q-option-icon"
                        style={{ color: active ? '#ffffff' : '#555555' }}
                      >
                        {opt.icon}
                      </div>
                      <div style={{ color: active ? '#ffffff' : '#e2e2e2', fontWeight: 700, fontSize: '13px', marginBottom: '3px' }}>
                        {opt.title}
                      </div>
                      <div style={{ color: '#555555', fontSize: '12px', lineHeight: 1.45 }}>
                        {opt.desc}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginBottom: '2px' }}>
                <div style={{ color: '#a1a1aa', fontSize: '12px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Additional context <span style={{ color: '#444', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>— optional</span>
                </div>
                <textarea
                  className="q-textarea"
                  value={freeText}
                  onChange={e => setFreeText(e.target.value)}
                  placeholder="e.g. Focus more on React component architecture and less on Vue..."
                />
              </div>

              <div className="q-modal-footer">
                <button className="q-btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button className="q-btn-solid" onClick={handleRegenerate}>
                  <Sparkles size={13} />
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
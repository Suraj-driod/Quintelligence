'use client'
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { auth } from '@/app/backend/firebase';
import { motion } from 'framer-motion';

/* --- BlurText Component --- */
const BlurText = ({
  text = '',
  delay = 200,
  animateBy = 'words',
  direction = 'top',
  onAnimationComplete,
  className = ''
}) => {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('');

  const directionOffset = {
    top: { y: -20 },
    bottom: { y: 20 },
    left: { x: -20 },
    right: { x: 20 },
  };

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: delay / 1000 }
    }
  };

  const child = {
    hidden: {
      opacity: 0,
      filter: 'blur(10px)',
      ...directionOffset[direction]
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      x: 0,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      animate="visible"
      onAnimationComplete={onAnimationComplete}
      style={{ display: 'inline-flex', flexWrap: 'wrap', justifyContent: 'center', gap: animateBy === 'words' ? '0.25em' : '0px' }}
    >
      {elements.map((el, i) => (
        <motion.span key={i} variants={child}>
          {el === ' ' ? '\u00A0' : el}
        </motion.span>
      ))}
    </motion.div>
  );
};

/* Floating blur bits — techy words that drift around the hero */
const BITS = [
  'React', 'Next.js', 'TypeScript', 'GraphQL', 'Docker',
  'Node.js', 'Tailwind', 'Prisma', 'Redis', 'AWS',
  'PostgreSQL', 'Git', 'CI/CD', 'Kubernetes', 'Rust',
  'Python', 'LLM', 'WebGL', 'tRPC', 'Vite',
];

/* Deterministic positions so they don't jump on hydration */
const BIT_POSITIONS = [
  { top: '8%', left: '6%', dur: 18, delay: 0, size: 11 },
  { top: '15%', left: '88%', dur: 22, delay: 1.5, size: 12 },
  { top: '25%', left: '14%', dur: 16, delay: 3, size: 10 },
  { top: '32%', left: '82%', dur: 24, delay: 0.8, size: 11 },
  { top: '48%', left: '4%', dur: 20, delay: 2.2, size: 10 },
  { top: '52%', left: '92%', dur: 17, delay: 4, size: 12 },
  { top: '65%', left: '10%', dur: 21, delay: 1, size: 11 },
  { top: '70%', left: '78%', dur: 19, delay: 3.5, size: 10 },
  { top: '80%', left: '20%', dur: 23, delay: 0.5, size: 12 },
  { top: '85%', left: '86%', dur: 15, delay: 2.8, size: 11 },
  { top: '12%', left: '45%', dur: 26, delay: 5, size: 10 },
  { top: '38%', left: '60%', dur: 18, delay: 1.2, size: 12 },
  { top: '58%', left: '35%', dur: 22, delay: 3.8, size: 11 },
  { top: '75%', left: '55%', dur: 20, delay: 0.3, size: 10 },
  { top: '90%', left: '42%', dur: 17, delay: 4.5, size: 12 },
  { top: '5%', left: '68%', dur: 24, delay: 2, size: 11 },
  { top: '42%', left: '75%', dur: 19, delay: 1.8, size: 10 },
  { top: '22%', left: '30%', dur: 21, delay: 0.9, size: 12 },
  { top: '62%', left: '48%', dur: 16, delay: 3.2, size: 11 },
  { top: '88%', left: '65%', dur: 25, delay: 2.5, size: 10 },
];

export default function HeroSection() {
  const [user, setUser] = useState(null);

  const handleAnimationComplete = () => {
    console.log('Animation completed!');
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .hero-premium-wrapper {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background-color: #000000;
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 24px;
        }

        /* Grid */
        .hero-bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(circle at center, black 20%, transparent 80%);
          -webkit-mask-image: radial-gradient(circle at top center, black 20%, transparent 80%);
          z-index: 1;
        }

        /* Core glow */
        .hero-core-glow {
          position: absolute;
          top: -20%; left: 50%;
          transform: translateX(-50%);
          width: 800px; height: 600px;
          background: radial-gradient(ellipse at center, rgba(255,255,255,0.12) 0%, transparent 60%);
          filter: blur(80px);
          z-index: 0;
          animation: pulse-glow 6s ease-in-out infinite alternate;
        }
        @keyframes pulse-glow {
          0%   { opacity: 0.6; transform: translateX(-50%) scale(1); }
          100% { opacity: 1;   transform: translateX(-50%) scale(1.05); }
        }

        /* ── FLOATING BLUR BITS ─────────────────────────────
           Techy words scattered around the hero.
           Each floats on a gentle up-down drift loop.
           Blurred + very low opacity so they feel like
           background atmosphere, not foreground content.
        ─────────────────────────────────────────────────── */
        .hero-bit {
          position: absolute;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          color: rgba(255,255,255,0.18);
          letter-spacing: 0.04em;
          text-transform: uppercase;
          filter: blur(1.5px);
          z-index: 2;
          pointer-events: none;
          user-select: none;
          animation: bit-drift linear infinite;
        }

        @keyframes bit-drift {
          0%   { transform: translateY(0px);   opacity: 0.12; }
          25%  { opacity: 0.22; }
          50%  { transform: translateY(-18px); opacity: 0.16; }
          75%  { opacity: 0.10; }
          100% { transform: translateY(0px);   opacity: 0.12; }
        }

        /* ── VIVID SHIMMER — "Adapts" ───────────────────────
           Bright, saturated gradient — electric neon feel.
           Faster shine cycle than before.
        ─────────────────────────────────────────────────── */
        .text-shimmer-theme {
          background: linear-gradient(
            90deg,
            #a855f7 0%,    /* bright violet */
            #ec4899 20%,   /* hot pink */
            #f97316 38%,   /* vivid orange */
            #facc15 52%,   /* electric yellow */
            #22d3ee 68%,   /* bright cyan */
            #6366f1 84%,   /* indigo */
            #a855f7 100%   /* back to violet */
          );
          background-size: 250% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: vivid-shine 3s linear infinite;
        }
        @keyframes vivid-shine {
          0%   { background-position: 0%   center; }
          100% { background-position: 250% center; }
        }

        /* Badge */
        .hero-badge-premium {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          color: #e4e4e7;
          font-size: 13px; font-weight: 600;
          border-radius: 9999px;
          padding: 6px 16px 6px 12px;
          margin-bottom: 32px;
          backdrop-filter: blur(16px);
          box-shadow: 0 0 20px rgba(255,255,255,0.05);
          animation: slide-up 0.8s cubic-bezier(0.16,1,0.3,1) forwards;
          opacity: 0; transform: translateY(20px);
        }
        .live-dot {
          width: 6px; height: 6px;
          background: #ffffff; border-radius: 50%;
          box-shadow: 0 0 10px #ffffff, 0 0 20px #ffffff;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%,100% { opacity: 1; }
          50%     { opacity: 0.4; }
        }

        /* Buttons */
        .btn-premium-primary {
          position: relative;
          background: #ffffff; color: #000000;
          border: none; border-radius: 9999px;
          padding: 16px 36px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px; font-weight: 700;
          cursor: pointer; overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.2), 0 8px 20px rgba(255,255,255,0.15);
        }
        .btn-premium-primary::before {
          content: '';
          position: absolute; top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent);
          transition: left 0.5s ease;
        }
        .btn-premium-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.4), 0 12px 30px rgba(255,255,255,0.3);
        }
        .btn-premium-primary:hover::before { left: 100%; }

        .btn-premium-ghost {
          background: rgba(255,255,255,0.02); color: #a1a1aa;
          border: 1px solid rgba(255,255,255,0.1); border-radius: 9999px;
          padding: 16px 36px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px; font-weight: 600;
          cursor: pointer; backdrop-filter: blur(10px);
          transition: all 0.2s ease;
        }
        .btn-premium-ghost:hover {
          background: rgba(255,255,255,0.08); color: #ffffff;
          border-color: rgba(255,255,255,0.3); transform: translateY(-2px);
        }

        /* Stagger entrances */
        .animate-stagger-1 { animation: slide-up 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s forwards; opacity: 0; transform: translateY(20px); }
        .animate-stagger-2 { animation: slide-up 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s forwards; opacity: 0; transform: translateY(20px); }
        .animate-stagger-3 { animation: slide-up 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s forwards; opacity: 0; transform: translateY(20px); }

        @keyframes slide-up {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <section className="hero-premium-wrapper">

        <div className="hero-bg-grid" />
        <div className="hero-core-glow" />

        {/* ── FLOATING BLUR BITS ── */}
        {BITS.map((word, i) => {
          const pos = BIT_POSITIONS[i];
          return (
            <span
              key={word}
              className="hero-bit"
              style={{
                top: pos.top,
                left: pos.left,
                fontSize: `${pos.size}px`,
                animationDuration: `${pos.dur}s`,
                animationDelay: `${pos.delay}s`,
              }}
            >
              {word}
            </span>
          );
        })}

        {/* Foreground content */}
        <div style={{
          position: 'relative', zIndex: 10,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', textAlign: 'center',
          maxWidth: '840px'
        }}>

          <div className="hero-badge-premium">
            <span className="live-dot" />
            AI-Powered • Adaptive • Personalized
          </div>

          <h1 className="animate-stagger-1" style={{
            fontSize: 'clamp(3.5rem, 8vw, 6rem)',
            fontWeight: 800,
            margin: '0 0 24px 0',
            lineHeight: 1.05,
            letterSpacing: '-0.05em',
            color: '#ffffff'
          }}>
            Onboarding That <br />
            <span className="text-shimmer-theme">Adapts</span> To You
          </h1>

          <div className="animate-stagger-2" style={{
            color: '#a1a1aa',
            fontSize: 'clamp(1.1rem, 2vw, 1.25rem)',
            maxWidth: '580px',
            margin: '0 0 48px 0',
            lineHeight: 1.6,
            fontWeight: 400
          }}>
            <BlurText
              text="Upload your resume, paste the job description, and let AI build your personalized learning path in seconds."
              delay={50}
              animateBy="words"
              direction="top"
              onAnimationComplete={handleAnimationComplete}
            />
          </div>

          <div className="animate-stagger-3" style={{
            display: 'flex', gap: '16px',
            flexWrap: 'wrap', justifyContent: 'center'
          }}>
            {user ? (
              <Link href="/dashboard" className="btn-premium-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/onboard" className="btn-premium-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                  Analyze My Skills
                </Link>
                <Link href="/login" className="btn-premium-ghost" style={{ textDecoration: 'none', display: 'inline-block' }}>
                  Login
                </Link>
              </>
            )}
          </div>

        </div>
      </section>
    </>
  );
}
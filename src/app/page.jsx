'use client'
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import { motion } from 'framer-motion';
import { FileText, BrainCircuit, Map, Github, ChevronRight } from 'lucide-react';
import Loading from '@/components/Loading';

export default function LandingPage() {
  // Advanced Framer Motion Spring Physics
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 100, damping: 20, mass: 1 }
    }
  };

  return (
    <>
      <style>{`
        /* --- ULTRA-PREMIUM SCOPED CSS --- */
        .q-landing-wrapper {
          background-color: #000000;
          color: #e2e2e2;
          font-family: 'Plus Jakarta Sans', sans-serif;
          overflow: hidden;
          position: relative;
        }

        /* Ambient Background Grid */
        .q-bg-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: linear-gradient(to bottom, black 20%, transparent 80%);
          -webkit-mask-image: linear-gradient(to bottom, black 20%, transparent 80%);
          z-index: 0;
          pointer-events: none;
        }

        /* Liquid Silver Text Gradient */
        .q-metallic-text {
          background: linear-gradient(
            to right, 
            #ffffff 0%, 
            #a1a1aa 40%, 
            #ffffff 60%, 
            #71717a 100%
          );
          background-size: 200% auto;
          color: #fff;
          background-clip: text;
          text-fill-color: transparent;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shine 5s linear infinite reverse;
        }

        @keyframes shine {
          to { background-position: 200% center; }
        }

        /* Premium Dark Glass Card */
        .q-glass-card {
          background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 40px 32px;
          position: relative;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        }

        /* The Glow effect on hover */
        .q-glass-card::before {
          content: '';
          position: absolute;
          top: 0; left: 50%;
          transform: translateX(-50%);
          width: 80%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .q-glass-card:hover {
          border-color: rgba(255, 255, 255, 0.15);
          background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.8), 0 0 40px rgba(255,255,255,0.03);
          transform: translateY(-8px);
        }

        .q-glass-card:hover::before {
          opacity: 1;
        }

        .q-icon-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px; height: 56px;
          border-radius: 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #a1a1aa;
          margin-bottom: 24px;
          transition: all 0.4s ease;
        }

        .q-glass-card:hover .q-icon-wrapper {
          color: #ffffff;
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.2);
          transform: scale(1.05);
          box-shadow: 0 0 20px rgba(255,255,255,0.1);
        }

        /* Micro-interactions for chips */
        .q-chip {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 9999px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          color: #a1a1aa;
          transition: all 0.3s ease;
        }
        .q-chip:hover {
          color: #ffffff;
          border-color: rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.08);
        }
      `}</style>

      <div className="q-landing-wrapper">
        <div className="q-bg-grid" />

        {/* Assumes you have styled these components based on previous steps */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <Navbar />
          <HeroSection />
        </div>

        {/* --- HOW IT WORKS SECTION --- */}
        <section style={{ padding: '140px 24px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10 }}>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
            style={{ textAlign: 'center', marginBottom: '80px' }}
          >
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, margin: '0 0 16px 0', letterSpacing: '-0.04em' }}>
              <span className="q-metallic-text">The Quintelligence Process</span>
            </h2>
            <p style={{ color: '#a1a1aa', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
              Three steps to unlock your personalized engineering roadmap.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}
          >
            {/* Card 1 */}
            <motion.div variants={itemVariants} className="q-glass-card">
              <div style={{ position: 'absolute', top: '32px', right: '32px', fontSize: '48px', fontWeight: 800, color: 'rgba(255,255,255,0.03)', lineHeight: 1 }}>01</div>
              <div className="q-icon-wrapper">
                <FileText size={28} strokeWidth={1.5} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>
                Upload Credentials
              </h3>
              <p style={{ fontSize: '15px', color: '#a1a1aa', lineHeight: 1.7, margin: 0 }}>
                Securely drop your resume PDF and paste the target job description. We extract the signal from the noise.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div variants={itemVariants} className="q-glass-card">
              <div style={{ position: 'absolute', top: '32px', right: '32px', fontSize: '48px', fontWeight: 800, color: 'rgba(255,255,255,0.03)', lineHeight: 1 }}>02</div>
              <div className="q-icon-wrapper">
                <BrainCircuit size={28} strokeWidth={1.5} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>
                AI Gap Analysis
              </h3>
              <p style={{ fontSize: '15px', color: '#a1a1aa', lineHeight: 1.7, margin: 0 }}>
                Our Gemini-powered engine maps your existing capabilities against market requirements to identify precise gaps.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div variants={itemVariants} className="q-glass-card">
              <div style={{ position: 'absolute', top: '32px', right: '32px', fontSize: '48px', fontWeight: 800, color: 'rgba(255,255,255,0.03)', lineHeight: 1 }}>03</div>
              <div className="q-icon-wrapper">
                <Map size={28} strokeWidth={1.5} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>
                Your DNA Pathway
              </h3>
              <p style={{ fontSize: '15px', color: '#a1a1aa', lineHeight: 1.7, margin: 0 }}>
                Receive an actionable, personalized helix roadmap designed to upskill you in record time.
              </p>
            </motion.div>
          </motion.div>
        </section>

        {/* --- GITHUB SECTION --- */}
        <section style={{ padding: '80px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 10 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 80 }}
            style={{
              maxWidth: '700px',
              width: '100%',
              background: 'linear-gradient(180deg, rgba(30,30,30,0.4) 0%, rgba(10,10,10,0.8) 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '32px',
              padding: '64px 40px',
              textAlign: 'center',
              boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Soft glow behind the Github Icon */}
            <div style={{ position: 'absolute', top: '40px', left: '50%', transform: 'translateX(-50%)', width: '120px', height: '120px', background: 'rgba(255,255,255,0.1)', filter: 'blur(40px)', borderRadius: '50%' }} />

            <div style={{
              display: 'inline-flex', padding: '20px', background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', marginBottom: '32px', position: 'relative'
            }}>
              <Github size={56} color="#ffffff" strokeWidth={1.5} />
            </div>

            <h3 style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', margin: '0 0 16px 0', letterSpacing: '-0.03em' }}>Level Up With GitHub</h3>
            <p style={{ color: '#a1a1aa', fontSize: '16px', maxWidth: '480px', margin: '0 auto 40px auto', lineHeight: 1.6 }}>
              Connect your profile. We scan your repositories, syntax patterns, and commit history to auto-detect your true technical depth.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {['Repos Analyzed', 'Languages Detected', 'Contribution Streak'].map((chip, i) => (
                <motion.span
                  key={chip}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + (i * 0.1), type: "spring", stiffness: 100 }}
                  className="q-chip"
                >
                  {chip}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </section>

        {/* --- STATS BAR --- */}
        <section style={{
          marginTop: '100px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          background: 'linear-gradient(to bottom, rgba(20,20,20,0.5), transparent)',
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '100px 24px' }}>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '64px',
                textAlign: 'center'
              }}
            >
              <motion.div variants={itemVariants}>
                <div className="q-metallic-text" style={{ fontSize: 'clamp(3.5rem, 6vw, 5rem)', fontWeight: 800, marginBottom: '8px', lineHeight: 1 }}>95%</div>
                <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#71717a' }}>Faster Onboarding</div>
              </motion.div>
              <motion.div variants={itemVariants}>
                <div className="q-metallic-text" style={{ fontSize: 'clamp(3.5rem, 6vw, 5rem)', fontWeight: 800, marginBottom: '8px', lineHeight: 1 }}>500+</div>
                <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#71717a' }}>Skills Mapped</div>
              </motion.div>
              <motion.div variants={itemVariants}>
                <div className="q-metallic-text" style={{ fontSize: 'clamp(3.5rem, 6vw, 5rem)', fontWeight: 800, marginBottom: '8px', lineHeight: 1 }}>10x</div>
                <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#71717a' }}>Training ROI</div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* --- FOOTER --- */}
        <footer style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '48px 24px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10
        }}>
          <p style={{ color: '#52525b', fontSize: '14px', fontWeight: 500, letterSpacing: '0.05em', margin: 0 }}>
            © 2026 Quintelligence. Built for ARTPARK CodeForge Hackathon.
          </p>
        </footer>

      </div>
    </>
  );
}
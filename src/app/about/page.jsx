'use client'

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileText, BrainCircuit, Map, Github, BookOpen, Target, Network, ChevronRight, Zap } from 'lucide-react';

export default function AboutPage() {
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

  const team = [
    {
      name: "Suraj",
      role: "Full Stack / AI",
      github: "https://github.com/Suraj-driod",
      avatar: "https://github.com/Suraj-driod.png",
      bio: "Architecting the core engine and building flawless adaptive digital experiences."
    },
    {
      name: "UnintentionalBugger9",
      role: "AI / Backend",
      github: "https://github.com/UnintentionalBugger9",
      avatar: "https://github.com/UnintentionalBugger9.png",
      bio: "Designing the LLM pipeline for high-precision dynamic gap analysis."
    },
    {
      name: "Omkar Shendge",
      role: "Backend / Infrastructure",
      github: "https://github.com/omkarshendge",
      avatar: "https://github.com/omkarshendge.png",
      bio: "Structuring the scalable infrastructure that powers real-time pathways."
    }
  ];

  return (
    <>
      <style>{`
        /* --- ULTRA-PREMIUM SCOPED CSS --- */
        .q-about-wrapper {
          background-color: #000000;
          color: #e2e2e2;
          font-family: 'Plus Jakarta Sans', sans-serif;
          overflow: hidden;
          position: relative;
          min-height: 100vh;
        }

        /* Ambient Background Grid */
        .q-bg-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
          z-index: 0;
          pointer-events: none;
        }

        .q-core-glow {
          position: absolute;
          top: -10%;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 600px;
          background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.1) 0%, transparent 60%);
          filter: blur(80px);
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

        /* Hero Badge */
        .q-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #e4e4e7;
          font-size: 13px;
          font-weight: 600;
          border-radius: 9999px;
          padding: 6px 16px 6px 12px;
          backdrop-filter: blur(16px);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.05);
        }

        .q-badge-dot {
          width: 6px;
          height: 6px;
          background-color: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 10px #10b981;
          animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        /* Steps list */
        .q-step-box {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          padding: 24px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          transition: all 0.3s ease;
        }

        .q-step-box:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateX(8px);
        }

        .q-step-number {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #ffffff;
          color: #000000;
          font-size: 18px;
          font-weight: 800;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
        }

        /* Buttons */
        .q-btn-primary {
          background: linear-gradient(180deg, #ffffff 0%, #e2e2e2 100%);
          color: #000;
          border: none;
          border-radius: 9999px;
          padding: 16px 36px;
          font-family: inherit;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          box-shadow: inset 0 1px 1px rgba(255,255,255,1), 0 8px 25px rgba(255, 255, 255, 0.15);
        }
        
        .q-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: inset 0 1px 1px rgba(255,255,255,1), 0 12px 30px rgba(255, 255, 255, 0.25);
        }

        .q-btn-ghost {
          background: transparent;
          color: #a1a1aa;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 9999px;
          padding: 14px 32px;
          font-family: inherit;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .q-btn-ghost:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.3);
        }
      `}</style>

      <div className="q-about-wrapper">
        <div className="q-bg-grid" />
        <div className="q-core-glow" />

        <div style={{ position: 'relative', zIndex: 50 }}>

        </div>

        {/* --- HERO SECTION --- */}
        <section style={{
          padding: '150px 24px 100px 24px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '1000px',
          margin: '0 auto'
        }}>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{
              fontSize: 'clamp(3rem, 6vw, 5.5rem)',
              fontWeight: 800,
              margin: '0 0 24px 0',
              lineHeight: 1.1,
              letterSpacing: '-0.04em'
            }}
          >
            We're fixing how the world <br className="hidden md:block" />
            <span className="q-metallic-text">onboards talent</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              color: '#a1a1aa',
              fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
              maxWidth: '650px',
              margin: '0 auto',
              lineHeight: 1.6
            }}
          >
            Quintelligence replaces standard, one-size-fits-all training with highly personalized, AI-driven pathways built uniquely for your mind.
          </motion.p>
        </section>


        {/* --- THE PROBLEM --- */}
        <section style={{ padding: '80px 24px', position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto' }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.03em' }}>
                Why We Exist
              </h2>
              <p style={{ color: '#a1a1aa', fontSize: '18px', maxWidth: '700px', margin: '0 auto 40px auto', lineHeight: 1.6 }}>
                The corporate learning structure is fundamentally broken. We noticed that intelligent engineers were being forced through generic, agonizing curriculums that ignored their actual skillsets.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
              <motion.div variants={itemVariants} className="q-glass-card">
                <div className="q-icon-wrapper" style={{ color: '#ef4444' }}>
                  <Network size={28} strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 12px 0' }}>The Broken Standard</h3>
                <p style={{ color: '#a1a1aa', lineHeight: 1.6, margin: 0 }}>
                  Most onboarding programs are rigidly one-size-fits-all, designed for the lowest common denominator, not for dynamic talent.
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="q-glass-card">
                <div className="q-icon-wrapper" style={{ color: '#eab308' }}>
                  <Target size={28} strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 12px 0' }}>Wasted Potential</h3>
                <p style={{ color: '#a1a1aa', lineHeight: 1.6, margin: 0 }}>
                  New hires waste up to 40% of their onboarding time staring at materials and concepts they already mastered years ago.
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="q-glass-card">
                <div className="q-icon-wrapper" style={{ color: '#f97316' }}>
                  <Zap size={28} strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 12px 0' }}>The Financial Drain</h3>
                <p style={{ color: '#a1a1aa', lineHeight: 1.6, margin: 0 }}>
                  Companies lose thousands of dollars in productivity per employee directly due to bad, slow, and uninspiring onboarding experiences.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </section>


        {/* --- WHAT WE BUILT / HOW IT WORKS --- */}
        <section style={{ padding: '80px 24px', position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }} className="md-grid-stack">

            {/* Left side: What we built & Product Desc */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 80 }}
            >
              <h2 style={{ fontSize: '40px', fontWeight: 800, margin: '0 0 24px 0', letterSpacing: '-0.03em' }}>
                <span className="q-metallic-text">The Solution</span>
              </h2>
              <p style={{ color: '#a1a1aa', fontSize: '18px', lineHeight: 1.7, marginBottom: '40px' }}>
                Quintelligence is a hyper-intelligent learning engine that acts as your personal technical mentor. Instead of assigning a blanket course, we calculate exactly what you don't know, and give you only what you need.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700 }}>Intelligent Resume Parsing</h4>
                    <span style={{ color: '#a1a1aa', fontSize: '14px' }}>Extracting your true skills from implicit data.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                    <BrainCircuit size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700 }}>Precision Gap Analysis</h4>
                    <span style={{ color: '#a1a1aa', fontSize: '14px' }}>Mapping exactly what you're missing against the JD.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                    <Map size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700 }}>Personalized DNA Pathway</h4>
                    <span style={{ color: '#a1a1aa', fontSize: '14px' }}>Your completely custom learning roadmap.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '16px' }}>
                  <Github size={24} color="#ffffff" />
                  <span style={{ color: '#e2e2e2', fontSize: '15px', fontWeight: 500 }}>
                    <strong style={{ color: '#fff' }}>Deep GitHub Integration:</strong> Connect your repository and we scan your commits to validate your code.
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Right side: How It Works Visual Steps */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={containerVariants}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px', color: '#ffffff' }}>How It Works</h3>

              <motion.div variants={itemVariants} className="q-step-box">
                <div className="q-step-number">1</div>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#fff' }}>Upload Resume & JD</h4>
                  <p style={{ margin: 0, color: '#a1a1aa', fontSize: '15px', lineHeight: 1.5 }}>Feed Quintelligence your background and where you need to be.</p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="q-step-box">
                <div className="q-step-number">2</div>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#fff' }}>AI Detects Gaps</h4>
                  <p style={{ margin: 0, color: '#a1a1aa', fontSize: '15px', lineHeight: 1.5 }}>Our engine mathematically calculates the delta between your skills and the requirement.</p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="q-step-box">
                <div className="q-step-number">3</div>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#fff' }}>Pathway Generation</h4>
                  <p style={{ margin: 0, color: '#a1a1aa', fontSize: '15px', lineHeight: 1.5 }}>A visually stunning DNA helix forms with modules explicitly tailored to your weak points.</p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="q-step-box">
                <div className="q-step-number">4</div>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#fff' }}>Learn Efficiently</h4>
                  <p style={{ margin: 0, color: '#a1a1aa', fontSize: '15px', lineHeight: 1.5 }}>You learn exactly what you need, slashing onboarding time and avoiding redundancies.</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Minimal CSS for grid stacking on mobile */}
            <style>{`
              @media (max-width: 900px) {
                .md-grid-stack {
                  grid-template-columns: 1fr !important;
                }
              }
            `}</style>
          </div>
        </section>


        {/* --- MISSION STATEMENT --- */}
        <section style={{ padding: '120px 24px', position: 'relative', zIndex: 10, textAlign: 'center' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', background: 'radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, transparent 70%)', padding: '60px 0' }}>
            <BookOpen size={48} color="#ffffff" style={{ margin: '0 auto 24px auto', opacity: 0.8 }} />
            <p style={{
              fontSize: 'clamp(24px, 4vw, 36px)',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.4,
              letterSpacing: '-0.02em',
              margin: 0
            }}>
              "Learning should never be wasted. <br /> Every person deserves a path <span className="q-metallic-text">built exactly for them.</span>"
            </p>
          </div>
        </section>


        {/* --- THE TEAM --- */}
        <section style={{ padding: '80px 24px 140px 24px', position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.03em' }}>The Engineers Behind It</h2>
              <p style={{ color: '#a1a1aa', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
                A team united by the vision to revolutionize digital upskilling.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
              {team.map((member, i) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, type: "spring", stiffness: 80 }}
                  className="q-glass-card"
                  style={{ textAlign: 'center', padding: '48px 32px' }}
                >
                  <img
                    src={member.avatar}
                    alt={member.name}
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      margin: '0 auto 24px auto',
                      border: '2px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 0 30px rgba(255,255,255,0.05)'
                    }}
                  />
                  <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', margin: '0 0 8px 0' }}>{member.name}</h3>
                  <div style={{ color: '#e4e4e7', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
                    {member.role}
                  </div>
                  <p style={{ color: '#a1a1aa', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
                    {member.bio}
                  </p>
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: 700,
                      background: 'rgba(255,255,255,0.05)',
                      padding: '10px 20px',
                      borderRadius: '9999px',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    <Github size={16} /> GitHub Profile
                  </a>
                </motion.div>
              ))}
            </div>
          </div>
        </section>


        {/* --- FOOTER CTA --- */}
        <footer style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          background: 'linear-gradient(to top, rgba(255,255,255,0.02), transparent)',
          padding: '100px 24px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10
        }}>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#ffffff', marginBottom: '32px', letterSpacing: '-0.02em' }}>
            Ready to upgrade your onboarding?
          </h2>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/onboard" className="q-btn-primary" style={{ textDecoration: 'none' }}>
              Try Quintelligence free <ChevronRight size={18} />
            </Link>
            <a href="https://github.com/Suraj-driod/Quintelligence" target="_blank" rel="noreferrer" className="q-btn-ghost" style={{ textDecoration: 'none' }}>
              <Github size={18} /> View Source
            </a>
          </div>
        </footer>

      </div>
    </>
  );
}

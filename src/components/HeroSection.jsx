import Link from 'next/link';

export default function HeroSection() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        /* Base Setup */
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

        /* 1. The Abyss Grid Overlay */
        .hero-bg-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 60px 60px;
          /* Fades the grid out at the edges and bottom */
          mask-image: radial-gradient(circle at center, black 20%, transparent 80%);
          -webkit-mask-image: radial-gradient(circle at top center, black 20%, transparent 80%);
          z-index: 1;
        }

        /* 2. Ambient Core Glow */
        .hero-core-glow {
          position: absolute;
          top: -20%;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 600px;
          background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.15) 0%, transparent 60%);
          filter: blur(80px);
          z-index: 0;
          animation: pulse-glow 6s ease-in-out infinite alternate;
        }

        @keyframes pulse-glow {
          0% { opacity: 0.6; transform: translateX(-50%) scale(1); }
          100% { opacity: 1; transform: translateX(-50%) scale(1.05); }
        }

        /* 3. Shimmering Brand Theme Text Effect */
        .text-shimmer-theme {
          background: linear-gradient(
            to right,
            #8B5CF6 0%,   /* Brand Purple */
            #06B6D4 25%,  /* Brand Cyan */
            #EC4899 50%,  /* Brand Pink */
            #06B6D4 75%,  /* Brand Cyan */
            #8B5CF6 100%  /* Brand Purple */
          );
          background-size: 200% auto;
          color: #000;
          background-clip: text;
          text-fill-color: transparent;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shine 4s linear infinite;
        }

        @keyframes shine {
          to { background-position: 200% center; }
        }

        /* 4. The Live AI Badge */
        .hero-badge-premium {
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
          margin-bottom: 32px;
          backdrop-filter: blur(16px);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.05);
          animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
          transform: translateY(20px);
        }

        .live-dot {
          width: 6px;
          height: 6px;
          background-color: #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 10px #ffffff, 0 0 20px #ffffff;
          animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        /* 5. Ultra-Premium Primary Button */
        .btn-premium-primary {
          position: relative;
          background: #ffffff;
          color: #000000;
          border: none;
          border-radius: 9999px;
          padding: 16px 36px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2), 0 8px 20px rgba(255, 255, 255, 0.15);
        }

        .btn-premium-primary::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(0, 0, 0, 0.1),
            transparent
          );
          transition: left 0.5s ease;
        }

        .btn-premium-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.4), 0 12px 30px rgba(255, 255, 255, 0.3);
        }

        .btn-premium-primary:hover::before {
          left: 100%;
        }

        /* 6. Ghost Glass Secondary Button */
        .btn-premium-ghost {
          background: rgba(255, 255, 255, 0.02);
          color: #a1a1aa;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 9999px;
          padding: 16px 36px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          backdrop-filter: blur(10px);
          transition: all 0.2s ease;
        }

        .btn-premium-ghost:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        /* Entrance Animations */
        .animate-stagger-1 { animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards; opacity: 0; transform: translateY(20px); }
        .animate-stagger-2 { animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards; opacity: 0; transform: translateY(20px); }
        .animate-stagger-3 { animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards; opacity: 0; transform: translateY(20px); }

        @keyframes slide-up {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <section className="hero-premium-wrapper">
        
        {/* Deep Background Elements */}
        <div className="hero-bg-grid" />
        <div className="hero-core-glow" />

        {/* Foreground Content */}
        <div style={{
          position: 'relative', 
          zIndex: 10, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          textAlign: 'center', 
          maxWidth: '840px'
        }}>
          
          {/* Pill Badge with Live Indicator */}
          <div className="hero-badge-premium">
            <span className="live-dot" />
            AI-Powered • Adaptive • Personalized
          </div>
          
          {/* Main Headline with Theme Shimmer on "Adapts" */}
          <h1 className="animate-stagger-1" style={{ 
            fontSize: 'clamp(3.5rem, 8vw, 6rem)', 
            fontWeight: 800, 
            margin: '0 0 24px 0', 
            lineHeight: 1.05, 
            letterSpacing: '-0.05em',
            color: '#ffffff'
          }}>
            Onboarding That <br className="hidden sm:block" />
            <span className="text-shimmer-theme">Adapts</span> To You
          </h1>
          
          {/* Subtext */}
          <p className="animate-stagger-2" style={{ 
            color: '#a1a1aa', 
            fontSize: 'clamp(1.1rem, 2vw, 1.25rem)', 
            maxWidth: '580px', 
            margin: '0 0 48px 0', 
            lineHeight: 1.6,
            fontWeight: 400
          }}>
            Upload your resume, paste the job description, and let AI build your personalized learning path in seconds.
          </p>
          
          {/* Action Buttons */}
          <div className="animate-stagger-3" style={{ 
            display: 'flex', 
            gap: '16px', 
            flexWrap: 'wrap', 
            justifyContent: 'center' 
          }}>
            <Link href="/onboard" style={{ textDecoration: 'none' }}>
              <button className="btn-premium-primary">
                Analyze My Skills
              </button>
            </Link>
            <button className="btn-premium-ghost">
              See How It Works
            </button>
          </div>
          
        </div>
      </section>
    </>
  );
}
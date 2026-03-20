import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <HeroSection />

      {/* HOW IT WORKS */}
      <section style={{ padding: '120px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: 700, marginBottom: '64px' }}>
          <span className="gradient-text" style={{ textDecoration: 'underline', textDecorationColor: '#8B5CF6' }}>How Quintelligence Works</span>
        </h2>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px'
        }}>
          {/* Card 1 */}
          <div className="surface-card animate-slide-up" style={{ padding: '32px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '32px', left: '32px', fontSize: '11px', color: '#8B5CF6', letterSpacing: '0.1em' }}>01</div>
            <div style={{ fontSize: '32px', marginBottom: '16px', marginTop: '24px' }}>📄</div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '8px' }}>Upload Your Credentials</h3>
            <p style={{ fontSize: '14px', color: '#888' }}>Drop your resume PDF and paste the job description</p>
          </div>

          {/* Card 2 */}
          <div className="surface-card animate-slide-up" style={{ padding: '32px', position: 'relative', animationDelay: '0.15s' }}>
            <div style={{ position: 'absolute', top: '32px', left: '32px', fontSize: '11px', color: '#06B6D4', letterSpacing: '0.1em' }}>02</div>
            <div style={{ fontSize: '32px', marginBottom: '16px', marginTop: '24px' }}>🧠</div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '8px' }}>AI Gap Analysis</h3>
            <p style={{ fontSize: '14px', color: '#888' }}>Gemini analyzes your skills and identifies exact gaps</p>
          </div>

          {/* Card 3 */}
          <div className="surface-card animate-slide-up" style={{ padding: '32px', position: 'relative', animationDelay: '0.3s' }}>
            <div style={{ position: 'absolute', top: '32px', left: '32px', fontSize: '11px', color: '#EC4899', letterSpacing: '0.1em' }}>03</div>
            <div style={{ fontSize: '32px', marginBottom: '16px', marginTop: '24px' }}>🗺️</div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '8px' }}>Get Your DNA Pathway</h3>
            <p style={{ fontSize: '14px', color: '#888' }}>Receive a personalized helix roadmap to close every gap</p>
          </div>
        </div>
      </section>

      {/* GITHUB SECTION */}
      <section style={{ padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ textAlign: 'center', fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>Level Up With GitHub Insights</h2>
        <p style={{ color: '#888', textAlign: 'center', marginBottom: '40px' }}>Connect your GitHub profile for richer skill detection</p>

        <div className="surface-card" style={{ maxWidth: '480px', width: '100%', padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>
            <svg height="40" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="40" style={{ fill: 'white', display: 'inline-block' }}>
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg>
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'white', marginBottom: '12px' }}>GitHub Profile Analysis</h3>
          <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>We scan your repos, languages, and contributions to auto-detect your actual skill level</p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Repos Analyzed', 'Languages Detected', 'Contribution Streak'].map(chip => (
              <span key={chip} style={{ background: '#111', border: '1px solid #222', borderRadius: '99px', fontSize: '12px', padding: '4px 12px', color: '#888' }}>
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section style={{ backgroundColor: '#0a0a0a', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', padding: '64px 24px', marginTop: '60px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '80px', flexWrap: 'wrap', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div>
            <div className="gradient-text" style={{ fontSize: '3rem', fontWeight: 800 }}>95%</div>
            <div style={{ fontSize: '14px', color: '#888' }}>Faster Onboarding</div>
          </div>
          <div>
            <div className="gradient-text" style={{ fontSize: '3rem', fontWeight: 800 }}>500+</div>
            <div style={{ fontSize: '14px', color: '#888' }}>Skills Mapped</div>
          </div>
          <div>
            <div className="gradient-text" style={{ fontSize: '3rem', fontWeight: 800 }}>10x</div>
            <div style={{ fontSize: '14px', color: '#888' }}>Training ROI</div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ backgroundColor: '#000', borderTop: '1px solid #1a1a1a', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ color: '#555', fontSize: '13px' }}>© 2026 Quintelligence. Built for ARTPARK CodeForge Hackathon.</p>
      </footer>
    </>
  );
}

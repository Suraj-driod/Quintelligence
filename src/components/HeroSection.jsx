import Link from 'next/link';

export default function HeroSection() {
  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: '0 24px'
    }}>
      {/* Background Orbs */}
      <div className="animate-float" style={{
        position: 'absolute', top: '10%', left: '10%',
        width: '400px', height: '400px', borderRadius: '50%',
        background: '#8B5CF6', opacity: 0.2, filter: 'blur(80px)', pointerEvents: 'none'
      }} />
      <div className="animate-float" style={{
        position: 'absolute', top: '20%', right: '10%',
        width: '300px', height: '300px', borderRadius: '50%',
        background: '#06B6D4', opacity: 0.15, filter: 'blur(80px)', pointerEvents: 'none',
        animationDelay: '2s'
      }} />
      <div className="animate-float" style={{
        position: 'absolute', bottom: '10%', left: '50%', transform: 'translateX(-50%)',
        width: '350px', height: '350px', borderRadius: '50%',
        background: '#EC4899', opacity: 0.1, filter: 'blur(80px)', pointerEvents: 'none',
        animationDelay: '4s'
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
      }}>
        <div style={{
          border: '1px solid rgba(139,92,246,0.5)', backgroundColor: 'rgba(139,92,246,0.1)',
          color: '#8B5CF6', fontSize: '13px', borderRadius: '99px', padding: '6px 16px', marginBottom: '24px'
        }}>
          AI-Powered • Adaptive • Personalized
        </div>
        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 800, margin: '0 0 24px 0', lineHeight: 1.1 }}>
          Onboarding That <span className="gradient-text">Adapts</span> To You
        </h1>
        <p style={{ color: '#888888', fontSize: '18px', maxWidth: '580px', margin: '0 0 40px 0', lineHeight: 1.6 }}>
          Upload your resume, paste the job description, and let AI build your personalized learning path in seconds.
        </p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/onboard">
            <button className="gradient-btn" style={{
              borderRadius: '99px', padding: '16px 32px', fontSize: '16px', fontWeight: 600
            }}>
              Analyze My Skills →
            </button>
          </Link>
          <button style={{
            background: 'transparent', border: '1px solid #333', color: 'white',
            borderRadius: '99px', padding: '16px 32px', fontSize: '16px', fontWeight: 600, cursor: 'pointer'
          }}>
            See How It Works
          </button>
        </div>
      </div>
    </section>
  );
}

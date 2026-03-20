export default function Navbar() {
  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #1a1a1a',
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div 
        className="gradient-text" 
        style={{ fontSize: '24px', fontWeight: 700, cursor: 'pointer' }}
      >
        Quintelligence
      </div>
      <button 
        className="gradient-btn" 
        style={{
          borderRadius: '99px',
          padding: '8px 24px',
          fontSize: '14px',
          fontWeight: 600
        }}
      >
        Get Started
      </button>
    </nav>
  );
}

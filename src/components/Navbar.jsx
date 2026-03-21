'use client'
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { auth } from '@/app/backend/firebase';

export default function Navbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  return (
    <>
      {/* SCOPED CSS: Handles hover effects, custom fonts, and premium button styling 
        without touching your global.css file.
      */}
      <style>{`
        /* Importing a premium modern font specifically for this component */
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');

        .glass-nav-link {
          color: rgba(255, 255, 255, 0.6);
          transition: color 0.2s ease;
          cursor: pointer;
        }
        .glass-nav-link:hover {
          color: rgba(255, 255, 255, 1);
        }
        
        .glass-btn-primary {
          background: linear-gradient(180deg, #ffffff 0%, #e2e2e2 100%);
          color: #0a0a0a;
          border: 1px solid rgba(255, 255, 255, 0.8);
          border-radius: 9999px;
          padding: 10px 28px;
          
          /* Upgraded Typography */
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.03em;
          
          cursor: pointer;
          
          /* Multi-layered shadow: Inner highlight for 3D depth + Outer soft glow */
          box-shadow: 
            inset 0 1px 1px rgba(255, 255, 255, 1),
            0 4px 15px rgba(255, 255, 255, 0.15);
            
          transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        }
        
        .glass-btn-primary:hover {
          transform: translateY(-2px);
          background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%);
          box-shadow: 
            inset 0 1px 1px rgba(255, 255, 255, 1),
            0 8px 25px rgba(255, 255, 255, 0.25);
        }

        .glass-btn-secondary {
          background: rgba(255, 255, 255, 0.03);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 9999px;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .glass-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.3);
        }
      `}</style>

      <nav style={{
        position: 'fixed',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '95%',
        maxWidth: '1200px',
        zIndex: 9999,

        /* Dark frosted glass effect specifically for black backgrounds */
        background: 'rgba(10, 10, 10, 0.65)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',

        /* Pill shape and sharp glass edge */
        borderRadius: '9999px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',

        /* Asymmetric padding to balance the buttons on the right */
        padding: '10px 14px 10px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>

        {/* LOGO */}
        <Link
          href={"/"}
          style={{
            fontSize: '22px',
            fontWeight: 800,
            cursor: 'pointer',
            color: '#ffffff',
            letterSpacing: '-0.04em',
            textDecoration: 'none'
          }}
        >
          Quintelligence
        </Link>

        {/* CENTER LINKS */}
        <div style={{
          display: 'flex',
          gap: '32px',
          fontSize: '12px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          <Link href={user ? "/dashboard" : "/"} className="glass-nav-link" style={{ textDecoration: 'none' }}>Home</Link>

          {user && (
            <>
              <Link href="/onboard" className="glass-nav-link" style={{ textDecoration: 'none' }}>Onboard</Link>
              <Link href="/pathways" className="glass-nav-link" style={{ textDecoration: 'none' }}>Pathways</Link>
            </>
          )}
          <Link href="/about" className="glass-nav-link" style={{ textDecoration: 'none' }}>About Us</Link>

        </div>

        {/* ACTION BUTTONS */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>

          {user ? (
            <>
              <button
                onClick={handleSignOut}
                className="glass-btn-secondary"
                style={{ background: 'transparent', border: 'none', padding: '10px 16px', fontSize: '13px' }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="glass-btn-primary"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            >
              Login
            </Link>
          )}

        </div>

      </nav>
    </>
  );
}

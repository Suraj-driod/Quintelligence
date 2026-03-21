"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { auth, googleProvider, signInWithPopup } from "@/app/backend/firebase";

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <>
      <style>{`
        .q-login-universe {
          min-height: 100vh;
          background-color: transparent;
          color: #e2e2e2;
          font-family: 'Plus Jakarta Sans', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        /* ── CABLE / CIRCUIT BACKGROUND ──────────────────────
           Static cable geometry with animated glowing pulses
           travelling along each wire. Radial vignette hides edges.
        ─────────────────────────────────────────────────────── */
        .q-cable-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .q-cable-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        /* Base cable — dim static wire */
        .q-cable {
          fill: none;
          stroke: rgba(255,255,255,0.07);
          stroke-width: 1;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        /* Travelling pulse — a short glowing dash moving along the cable.
           stroke-dasharray: [pulse-length] [gap = total-path-length]
           stroke-dashoffset animates from 0 to -total-path-length     */
        .q-pulse {
          fill: none;
          stroke-width: 1.5;
          stroke-linecap: round;
          stroke: rgba(255,255,255,0.7);
          filter: url(#wire-glow);
        }

        /* Junction dots */
        .q-dot {
          fill: rgba(255,255,255,0.15);
          stroke: rgba(255,255,255,0.3);
          stroke-width: 0.8;
        }
        .q-dot-hot {
          fill: rgba(255,255,255,0.6);
          filter: url(#wire-glow);
        }

        /* Radial vignette — fades cables near edges so centre is clear */
        .q-cable-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 60% 60% at 50% 50%, transparent 20%, #000000 100%);
          z-index: 2;
          pointer-events: none;
        }

        /* The Grid Overlay */
        .q-login-universe::after {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(circle at center, black 20%, transparent 100%);
          -webkit-mask-image: radial-gradient(circle at center, black 20%, transparent 100%);
          z-index: 1;
          pointer-events: none;
        }

        /* ── MONOLITH CARD ────────────────────────────────── */
        .q-monolith {
          position: relative;
          z-index: 10;
          width: min(100%, 420px);
          padding: 48px 40px;
          border-radius: 32px;
          background: linear-gradient(180deg, rgba(20,20,20,0.6) 0%, rgba(5,5,5,0.9) 100%);
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow:
            inset 0 1px 0 0 rgba(255,255,255,0.15),
            0 30px 60px rgba(0,0,0,0.8),
            0 0 40px rgba(0,0,0,0.5);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .q-brand-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 6px 16px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #a1a1aa;
          margin-bottom: 32px;
        }
        .q-brand-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 0 10px #ffffff;
        }

        .q-auth-title {
          font-size: 36px;
          letter-spacing: -0.04em;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 12px 0;
          line-height: 1.1;
        }

        .q-auth-subtitle {
          color: #a1a1aa;
          line-height: 1.6;
          font-size: 15px;
          margin: 0 0 40px 0;
        }

        /* ── LIQUID GOOGLE BUTTON ─────────────────────────── */
        .q-liquid-google {
          position: relative;
          width: 100%;
          padding: 18px 24px;
          border-radius: 16px;
          background: #0a0a0a;
          color: #ffffff;
          border: none;
          font-family: inherit;
          font-size: 16px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          overflow: hidden;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .q-liquid-google::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 16px;
          background: conic-gradient(from 0deg, transparent 60%, #8B5CF6, #06B6D4, #ffffff, transparent 100%);
          animation: spin-border 3s linear infinite;
          z-index: 0;
        }
        @keyframes spin-border { 100% { transform: rotate(360deg); } }
        .q-liquid-google::after {
          content: '';
          position: absolute;
          inset: 1px;
          border-radius: 15px;
          background: linear-gradient(180deg, #1f1f1f 0%, #0a0a0a 100%);
          z-index: 1;
          transition: background 0.3s ease;
        }
        .q-liquid-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .q-liquid-google:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0,0,0,0.6), 0 0 30px rgba(139,92,246,0.2);
        }
        .q-liquid-google:hover::after {
          background: linear-gradient(180deg, #2a2a2a 0%, #151515 100%);
        }

        .q-auth-footer {
          margin-top: 32px;
          color: #71717a;
          font-size: 13px;
        }
        .q-link {
          color: #e2e2e2;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s ease;
        }
        .q-link:hover { color: #ffffff; }
      `}</style>

      <main className="q-login-universe">

        {/* ── CABLE BACKGROUND ── */}
        <div className="q-cable-bg">
          <svg
            className="q-cable-svg"
            viewBox="0 0 1440 900"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Glow filter for pulses and hot dots */}
              <filter id="wire-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/*
              CABLE NETWORK — orthogonal wires (L-shaped paths) spreading
              outward from the centre like a PCB trace layout.
              Each cable has a matching pulse path with animated dashoffset.
              
              Path length estimates used for dasharray gaps:
              Short  ~300px  → dasharray="40 260"
              Medium ~600px  → dasharray="40 560"
              Long   ~900px  → dasharray="40 860"
              XLong  ~1200px → dasharray="40 1160"
            */}

            {/* ── TOP-LEFT CLUSTER ─────────────────────── */}
            <path className="q-cable" d="M720,450 L720,340 L580,340 L580,200 L400,200" />
            <path className="q-pulse" strokeDasharray="40 860" strokeDashoffset="0" d="M720,450 L720,340 L580,340 L580,200 L400,200">
              <animate attributeName="stroke-dashoffset" from="0" to="-900" dur="4s" repeatCount="indefinite" />
            </path>

            <path className="q-cable" d="M720,450 L620,450 L620,300 L480,300 L480,140" />
            <path className="q-pulse" strokeDasharray="40 620" strokeDashoffset="0" d="M720,450 L620,450 L620,300 L480,300 L480,140">
              <animate attributeName="stroke-dashoffset" from="0" to="-660" dur="3.2s" repeatCount="indefinite" />
            </path>

            <path className="q-cable" d="M720,450 L720,380 L820,380 L820,240 L960,240 L960,100" />
            <path className="q-pulse" strokeDasharray="40 720" strokeDashoffset="0" d="M720,450 L720,380 L820,380 L820,240 L960,240 L960,100">
              <animate attributeName="stroke-dashoffset" from="0" to="-760" dur="4.5s" repeatCount="indefinite" />
            </path>

            {/* ── BOTTOM-LEFT CLUSTER ───────────────────── */}
            <path className="q-cable" d="M720,450 L720,560 L560,560 L560,700 L380,700" />
            <path className="q-pulse" strokeDasharray="40 760" strokeDashoffset="0" d="M720,450 L720,560 L560,560 L560,700 L380,700">
              <animate attributeName="stroke-dashoffset" from="0" to="-800" dur="5s" repeatCount="indefinite" />
            </path>

            <path className="q-cable" d="M720,450 L620,450 L620,600 L440,600 L440,780" />
            <path className="q-pulse" strokeDasharray="40 600" strokeDashoffset="0" d="M720,450 L620,450 L620,600 L440,600 L440,780">
              <animate attributeName="stroke-dashoffset" from="0" to="-640" dur="3.8s" repeatCount="indefinite" />
            </path>

            {/* ── TOP-RIGHT CLUSTER ─────────────────────── */}
            <path className="q-cable" d="M720,450 L820,450 L820,300 L1000,300 L1000,160" />
            <path className="q-pulse" strokeDasharray="40 640" strokeDashoffset="0" d="M720,450 L820,450 L820,300 L1000,300 L1000,160">
              <animate attributeName="stroke-dashoffset" from="0" to="-680" dur="3.5s" repeatCount="indefinite" />
            </path>

            <path className="q-cable" d="M720,450 L720,340 L900,340 L900,200 L1100,200 L1100,80" />
            <path className="q-pulse" strokeDasharray="40 880" strokeDashoffset="0" d="M720,450 L720,340 L900,340 L900,200 L1100,200 L1100,80">
              <animate attributeName="stroke-dashoffset" from="0" to="-920" dur="5.5s" repeatCount="indefinite" />
            </path>

            <path className="q-cable" d="M720,450 L860,450 L860,360 L1060,360 L1060,240 L1280,240" />
            <path className="q-pulse" strokeDasharray="40 800" strokeDashoffset="0" d="M720,450 L860,450 L860,360 L1060,360 L1060,240 L1280,240">
              <animate attributeName="stroke-dashoffset" from="0" to="-840" dur="4.8s" repeatCount="indefinite" />
            </path>

            {/* ── BOTTOM-RIGHT CLUSTER ──────────────────── */}
            <path className="q-cable" d="M720,450 L820,450 L820,600 L1020,600 L1020,760" />
            <path className="q-pulse" strokeDasharray="40 620" strokeDashoffset="0" d="M720,450 L820,450 L820,600 L1020,600 L1020,760">
              <animate attributeName="stroke-dashoffset" from="0" to="-660" dur="4.2s" repeatCount="indefinite" />
            </path>

            <path className="q-cable" d="M720,450 L720,560 L900,560 L900,700 L1120,700 L1120,820" />
            <path className="q-pulse" strokeDasharray="40 800" strokeDashoffset="0" d="M720,450 L720,560 L900,560 L900,700 L1120,700 L1120,820">
              <animate attributeName="stroke-dashoffset" from="0" to="-840" dur="5.2s" repeatCount="indefinite" />
            </path>

            {/* ── WIDE HORIZONTAL RUNS ──────────────────── */}
            <path className="q-cable" d="M720,450 L200,450 L200,300 L80,300" />
            <path className="q-pulse" strokeDasharray="40 640" strokeDashoffset="0" d="M720,450 L200,450 L200,300 L80,300">
              <animate attributeName="stroke-dashoffset" from="0" to="-680" dur="4s" repeatCount="indefinite" />
            </path>

            <path className="q-cable" d="M720,450 L1240,450 L1240,320 L1400,320" />
            <path className="q-pulse" strokeDasharray="40 620" strokeDashoffset="0" d="M720,450 L1240,450 L1240,320 L1400,320">
              <animate attributeName="stroke-dashoffset" from="0" to="-660" dur="3.6s" repeatCount="indefinite" />
            </path>

            <path className="q-cable" d="M720,450 L160,450 L160,600 L40,600" />
            <path className="q-pulse" strokeDasharray="40 560" strokeDashoffset="0" d="M720,450 L160,450 L160,600 L40,600">
              <animate attributeName="stroke-dashoffset" from="0" to="-600" dur="3.4s" repeatCount="indefinite" />
            </path>

            <path className="q-cable" d="M720,450 L1300,450 L1300,580 L1440,580" />
            <path className="q-pulse" strokeDasharray="40 580" strokeDashoffset="0" d="M720,450 L1300,450 L1300,580 L1440,580">
              <animate attributeName="stroke-dashoffset" from="0" to="-620" dur="3.9s" repeatCount="indefinite" />
            </path>

            {/* ── JUNCTION DOTS at bends ────────────────── */}
            {[
              [720, 340], [580, 340], [580, 200],
              [620, 450], [620, 300], [480, 300],
              [820, 380], [820, 240], [960, 240],
              [720, 560], [560, 560], [560, 700],
              [620, 600], [440, 600],
              [820, 450], [820, 300], [1000, 300],
              [900, 340], [900, 200], [1100, 200],
              [860, 450], [860, 360], [1060, 360], [1060, 240],
              [820, 600], [1020, 600],
              [900, 560], [900, 700], [1120, 700],
              [200, 450], [200, 300],
              [1240, 450], [1240, 320],
              [160, 450], [160, 600],
              [1300, 450], [1300, 580],
            ].map(([cx, cy], i) => (
              <circle key={i} className="q-dot" cx={cx} cy={cy} r="3" />
            ))}

            {/* Centre origin dot — the bright hub */}
            <circle cx="720" cy="450" r="5" className="q-dot" />
            <circle cx="720" cy="450" r="2.5" className="q-dot-hot" />

          </svg>
        </div>

        {/* The Central Monolith Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20, duration: 0.8 }}
          className="q-monolith"
        >
          <div className="q-brand-pill">
            <span className="q-brand-dot" /> Quintelligence
          </div>

          <h1 className="q-auth-title">Enter the Pathway.</h1>
          <p className="q-auth-subtitle">
            Authenticate to unlock your personalized engineering intelligence and skill synthesis.
          </p>

          <button className="q-liquid-google" onClick={handleGoogleLogin}>
            <div className="q-liquid-content">
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign in with Google
              <ArrowRight size={18} style={{ marginLeft: '4px', opacity: 0.6 }} />
            </div>
          </button>

          <p className="q-auth-footer">
            By continuing, you agree to our <Link href="#" className="q-link">Terms</Link> and <Link href="#" className="q-link">Privacy</Link>.
          </p>
        </motion.div>
      </main>
    </>
  );
}
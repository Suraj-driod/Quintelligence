"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Github, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";

const benefits = [
  "Adaptive role-based skill mapping",
  "AI-guided DNA pathway generation",
  "GitHub-backed technical depth analysis",
];

const quickStats = [
  { value: "500+", label: "skills mapped" },
  { value: "95%", label: "faster onboarding" },
  { value: "10x", label: "training ROI" },
];

export default function LoginPage() {
  const router = useRouter();

  const handleSubmit = (event) => {
    event.preventDefault();
    router.push("/onboard");
  };

  return (
    <>
      <style>{`
        .q-login-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          background:
            radial-gradient(circle at 18% 22%, rgba(255, 255, 255, 0.08), transparent 26%),
            radial-gradient(circle at 82% 18%, rgba(255, 255, 255, 0.04), transparent 24%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 35%),
            var(--surface-lowest);
          color: var(--text-primary);
          position: relative;
          overflow: hidden;
        }

        .q-login-shell::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(to right, rgba(255, 255, 255, 0.045) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.045) 1px, transparent 1px);
          background-size: 64px 64px;
          opacity: 0.55;
          mask-image: radial-gradient(circle at center, black 42%, transparent 100%);
          -webkit-mask-image: radial-gradient(circle at center, black 42%, transparent 100%);
          pointer-events: none;
        }

        .q-login-brand,
        .q-login-panel {
          position: relative;
          z-index: 1;
        }

        .q-login-brand {
          padding: 48px clamp(24px, 6vw, 88px);
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 48px;
        }

        .q-login-panel {
          padding: 48px clamp(24px, 5vw, 72px);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .q-brand-mark {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.2em;
          font-size: 13px;
          font-weight: 700;
        }

        .q-brand-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: linear-gradient(135deg, #ffffff, #7f7f7f);
          box-shadow: 0 0 18px rgba(255, 255, 255, 0.25);
        }

        .q-hero-kicker {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          width: fit-content;
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.04);
          color: var(--accent-soft);
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 24px;
        }

        .q-login-heading {
          font-size: clamp(3rem, 6vw, 5.6rem);
          line-height: 0.94;
          letter-spacing: -0.07em;
          font-weight: 800;
          max-width: 620px;
        }

        .q-login-copy {
          margin-top: 24px;
          max-width: 520px;
          color: var(--text-muted);
          font-size: 18px;
          line-height: 1.7;
        }

        .q-benefit-list {
          display: grid;
          gap: 16px;
          margin-top: 36px;
        }

        .q-benefit-item {
          display: flex;
          align-items: center;
          gap: 14px;
          color: var(--accent-soft);
          font-size: 15px;
          font-weight: 500;
        }

        .q-benefit-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--accent-white);
          flex-shrink: 0;
        }

        .q-stats-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        .q-stat-card {
          padding: 22px 20px;
          border-radius: 22px;
          background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(18px);
        }

        .q-stat-value {
          font-size: clamp(1.8rem, 3vw, 2.8rem);
          font-weight: 800;
          letter-spacing: -0.06em;
          color: var(--accent-white);
        }

        .q-stat-label {
          margin-top: 8px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: var(--text-subtle);
        }

        .q-auth-card {
          width: min(100%, 510px);
          padding: 34px;
          border-radius: 30px;
          background: linear-gradient(180deg, rgba(31,31,31,0.92), rgba(12,12,12,0.96));
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 28px 80px rgba(0, 0, 0, 0.42);
          backdrop-filter: blur(20px);
        }

        .q-auth-title {
          font-size: 38px;
          line-height: 1;
          letter-spacing: -0.05em;
          font-weight: 800;
          color: var(--accent-white);
        }

        .q-auth-subtitle {
          margin-top: 12px;
          color: var(--text-muted);
          line-height: 1.7;
          font-size: 15px;
        }

        .q-auth-form {
          display: grid;
          gap: 18px;
          margin-top: 28px;
        }

        .q-auth-label {
          display: block;
          margin-bottom: 10px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--accent-soft);
        }

        .q-input-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 18px;
          min-height: 60px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .q-input-wrap:focus-within {
          border-color: rgba(255, 255, 255, 0.22);
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.04);
        }

        .q-input-wrap input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          color: var(--text-primary);
          font: inherit;
          font-size: 15px;
        }

        .q-input-wrap input::placeholder {
          color: var(--text-subtle);
        }

        .q-auth-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 4px;
          font-size: 14px;
          color: var(--text-muted);
        }

        .q-check {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .q-check input {
          accent-color: #ffffff;
        }

        .q-link {
          color: var(--accent-white);
          text-decoration: none;
        }

        .q-link:hover {
          opacity: 0.8;
        }

        .q-submit {
          margin-top: 6px;
          min-height: 62px;
          border: none;
          border-radius: 999px;
          background: var(--accent-white);
          color: #0f0f0f;
          font: inherit;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: -0.02em;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
          box-shadow: 0 14px 35px rgba(255, 255, 255, 0.14);
        }

        .q-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 38px rgba(255, 255, 255, 0.18);
        }

        .q-divider {
          display: flex;
          align-items: center;
          gap: 14px;
          color: var(--text-subtle);
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin: 8px 0;
        }

        .q-divider::before,
        .q-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
        }

        .q-social-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .q-social-btn {
          min-height: 56px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.03);
          color: var(--text-primary);
          font: inherit;
          font-size: 14px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
        }

        .q-social-btn:hover {
          border-color: rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.06);
          transform: translateY(-2px);
        }

        .q-auth-footer {
          margin-top: 24px;
          text-align: center;
          color: var(--text-muted);
          font-size: 14px;
        }

        @media (max-width: 1080px) {
          .q-login-shell {
            grid-template-columns: 1fr;
          }

          .q-login-brand {
            border-right: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          }

          .q-stats-row {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
          .q-login-brand,
          .q-login-panel {
            padding: 28px 20px;
          }

          .q-login-heading {
            font-size: 3rem;
          }

          .q-stats-row,
          .q-social-grid {
            grid-template-columns: 1fr;
          }

          .q-auth-card {
            padding: 24px;
            border-radius: 24px;
          }

          .q-auth-row {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <main className="q-login-shell">
        <motion.section
          className="q-login-brand"
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div>
            <Link href="/" className="q-brand-mark">
              <span className="q-brand-dot" />
              quintelligence
            </Link>
          </div>

          <div>
            <div className="q-hero-kicker">
              <Sparkles size={14} />
              Secure sign in for personalized onboarding
            </div>

            <h1 className="q-login-heading">
              Sign in to build your next engineering pathway.
            </h1>

            <p className="q-login-copy">
              Access your role analysis, resume intelligence, and custom DNA roadmap from a single workspace tuned to the Quintelligence theme.
            </p>

            <div className="q-benefit-list">
              {benefits.map((benefit) => (
                <div className="q-benefit-item" key={benefit}>
                  <span className="q-benefit-icon">
                    <ShieldCheck size={16} />
                  </span>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="q-stats-row">
            {quickStats.map((stat) => (
              <div className="q-stat-card" key={stat.label}>
                <div className="q-stat-value">{stat.value}</div>
                <div className="q-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="q-login-panel"
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.08 }}
        >
          <div className="q-auth-card">
            <div>
              <h2 className="q-auth-title">Welcome back</h2>
              <p className="q-auth-subtitle">
                Sign in to continue your onboarding flow, review your saved profile, and launch a fresh pathway analysis.
              </p>
            </div>

            <form className="q-auth-form" onSubmit={handleSubmit}>
              <div>
                <label className="q-auth-label" htmlFor="email">
                  Email
                </label>
                <div className="q-input-wrap">
                  <Mail size={18} color="var(--text-subtle)" />
                  <input id="email" type="email" placeholder="name@company.com" required />
                </div>
              </div>

              <div>
                <label className="q-auth-label" htmlFor="password">
                  Password
                </label>
                <div className="q-input-wrap">
                  <LockKeyhole size={18} color="var(--text-subtle)" />
                  <input id="password" type="password" placeholder="Enter your password" required />
                </div>
              </div>

              <div className="q-auth-row">
                <label className="q-check">
                  <input type="checkbox" />
                  <span>Keep me signed in</span>
                </label>
                <Link href="/onboard" className="q-link">
                  Forgot password?
                </Link>
              </div>

              <button className="q-submit" type="submit">
                Continue to workspace
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="q-divider">or continue with</div>

            <div className="q-social-grid">
              <button className="q-social-btn" type="button">
                <Github size={18} />
                GitHub
              </button>
              <button className="q-social-btn" type="button">
                <Mail size={18} />
                Google
              </button>
            </div>

            <p className="q-auth-footer">
              New to Quintelligence?{" "}
              <Link href="/signup" className="q-link">
                Start your first pathway
              </Link>
            </p>
          </div>
        </motion.section>
      </main>
    </>
  );
}

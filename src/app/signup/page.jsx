"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Github,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

const pillars = [
  "Create one secure profile for all analyses",
  "Save resumes, roles, and roadmap progress",
  "Unlock collaborative engineering insights",
];

const trustPoints = [
  { value: "3 min", label: "to get started" },
  { value: "AI", label: "guided setup" },
  { value: "Secure", label: "workspace access" },
];

export default function SignupPage() {
  const router = useRouter();

  const handleSubmit = (event) => {
    event.preventDefault();
    router.push("/onboard");
  };

  return (
    <>
      <style>{`
        .q-signup-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 0.98fr 1.02fr;
          background:
            radial-gradient(circle at 20% 16%, rgba(255, 255, 255, 0.08), transparent 24%),
            radial-gradient(circle at 78% 80%, rgba(255, 255, 255, 0.05), transparent 28%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 30%),
            var(--surface-lowest);
          color: var(--text-primary);
          position: relative;
          overflow: hidden;
        }

        .q-signup-shell::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 64px 64px;
          opacity: 0.5;
          mask-image: radial-gradient(circle at center, black 45%, transparent 100%);
          -webkit-mask-image: radial-gradient(circle at center, black 45%, transparent 100%);
          pointer-events: none;
        }

        .q-signup-brand,
        .q-signup-panel {
          position: relative;
          z-index: 1;
        }

        .q-signup-brand {
          padding: 48px clamp(24px, 5vw, 80px);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 40px;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
        }

        .q-signup-panel {
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
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          font-size: 13px;
          font-weight: 700;
        }

        .q-brand-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: linear-gradient(135deg, #ffffff, #777777);
          box-shadow: 0 0 18px rgba(255,255,255,0.22);
        }

        .q-kicker {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          width: fit-content;
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: var(--accent-soft);
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 22px;
        }

        .q-heading {
          font-size: clamp(3rem, 6vw, 5.4rem);
          line-height: 0.95;
          letter-spacing: -0.07em;
          font-weight: 800;
          max-width: 620px;
        }

        .q-copy {
          margin-top: 24px;
          max-width: 540px;
          color: var(--text-muted);
          font-size: 18px;
          line-height: 1.7;
        }

        .q-pillars {
          display: grid;
          gap: 16px;
          margin-top: 34px;
        }

        .q-pillar {
          display: flex;
          align-items: center;
          gap: 14px;
          color: var(--accent-soft);
          font-size: 15px;
          font-weight: 500;
        }

        .q-pillar-icon {
          width: 34px;
          height: 34px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--accent-white);
          flex-shrink: 0;
        }

        .q-trust-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .q-trust-card {
          padding: 20px 18px;
          border-radius: 22px;
          background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(18px);
        }

        .q-trust-value {
          font-size: clamp(1.6rem, 3vw, 2.4rem);
          font-weight: 800;
          letter-spacing: -0.05em;
          color: var(--accent-white);
        }

        .q-trust-label {
          margin-top: 8px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: var(--text-subtle);
        }

        .q-auth-card {
          width: min(100%, 560px);
          padding: 34px;
          border-radius: 30px;
          background: linear-gradient(180deg, rgba(31,31,31,0.92), rgba(12,12,12,0.96));
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 28px 80px rgba(0,0,0,0.42);
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

        .q-split-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
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
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .q-input-wrap:focus-within {
          border-color: rgba(255,255,255,0.22);
          background: rgba(255,255,255,0.05);
          box-shadow: 0 0 0 4px rgba(255,255,255,0.04);
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

        .q-check {
          display: inline-flex;
          align-items: flex-start;
          gap: 10px;
          color: var(--text-muted);
          font-size: 14px;
          line-height: 1.6;
        }

        .q-check input {
          margin-top: 3px;
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
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 14px 35px rgba(255,255,255,0.14);
        }

        .q-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 38px rgba(255,255,255,0.18);
        }

        .q-divider {
          display: flex;
          align-items: center;
          gap: 14px;
          color: var(--text-subtle);
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin: 6px 0;
        }

        .q-divider::before,
        .q-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.08);
        }

        .q-social-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .q-social-btn {
          min-height: 56px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.03);
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
          border-color: rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.06);
          transform: translateY(-2px);
        }

        .q-auth-footer {
          margin-top: 24px;
          text-align: center;
          color: var(--text-muted);
          font-size: 14px;
        }

        @media (max-width: 1080px) {
          .q-signup-shell {
            grid-template-columns: 1fr;
          }

          .q-signup-brand {
            border-right: none;
            border-bottom: 1px solid rgba(255,255,255,0.08);
          }
        }

        @media (max-width: 720px) {
          .q-signup-brand,
          .q-signup-panel {
            padding: 28px 20px;
          }

          .q-heading {
            font-size: 3rem;
          }

          .q-split-inputs,
          .q-trust-grid,
          .q-social-grid {
            grid-template-columns: 1fr;
          }

          .q-auth-card {
            padding: 24px;
            border-radius: 24px;
          }
        }
      `}</style>

      <main className="q-signup-shell">
        <motion.section
          className="q-signup-brand"
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
            <div className="q-kicker">
              <Sparkles size={14} />
              Create your personalized onboarding workspace
            </div>

            <h1 className="q-heading">
              Join Quintelligence and map what comes next.
            </h1>

            <p className="q-copy">
              Set up your account to store resumes, target roles, GitHub signals, and every AI-generated pathway in one focused dashboard.
            </p>

            <div className="q-pillars">
              {pillars.map((pillar) => (
                <div className="q-pillar" key={pillar}>
                  <span className="q-pillar-icon">
                    <ShieldCheck size={16} />
                  </span>
                  <span>{pillar}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="q-trust-grid">
            {trustPoints.map((item) => (
              <div className="q-trust-card" key={item.label}>
                <div className="q-trust-value">{item.value}</div>
                <div className="q-trust-label">{item.label}</div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="q-signup-panel"
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.08 }}
        >
          <div className="q-auth-card">
            <div>
              <h2 className="q-auth-title">Create account</h2>
              <p className="q-auth-subtitle">
                Start with a few details and move straight into the resume and target-role onboarding flow.
              </p>
            </div>

            <form className="q-auth-form" onSubmit={handleSubmit}>
              <div className="q-split-inputs">
                <div>
                  <label className="q-auth-label" htmlFor="firstName">
                    First name
                  </label>
                  <div className="q-input-wrap">
                    <UserRound size={18} color="var(--text-subtle)" />
                    <input id="firstName" type="text" placeholder="Aarav" required />
                  </div>
                </div>

                <div>
                  <label className="q-auth-label" htmlFor="lastName">
                    Last name
                  </label>
                  <div className="q-input-wrap">
                    <UserRound size={18} color="var(--text-subtle)" />
                    <input id="lastName" type="text" placeholder="Sharma" required />
                  </div>
                </div>
              </div>

              <div>
                <label className="q-auth-label" htmlFor="email">
                  Work email
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
                  <input id="password" type="password" placeholder="Create a strong password" required />
                </div>
              </div>

              <div>
                <label className="q-auth-label" htmlFor="confirmPassword">
                  Confirm password
                </label>
                <div className="q-input-wrap">
                  <CheckCircle2 size={18} color="var(--text-subtle)" />
                  <input id="confirmPassword" type="password" placeholder="Repeat your password" required />
                </div>
              </div>

              <label className="q-check">
                <input type="checkbox" required />
                <span>
                  I agree to the <Link href="/signup" className="q-link">Terms</Link> and <Link href="/signup" className="q-link">Privacy Policy</Link>.
                </span>
              </label>

              <button className="q-submit" type="submit">
                Create account
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="q-divider">or sign up with</div>

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
              Already have an account?{" "}
              <Link href="/login" className="q-link">
                Sign in
              </Link>
            </p>
          </div>
        </motion.section>
      </main>
    </>
  );
}

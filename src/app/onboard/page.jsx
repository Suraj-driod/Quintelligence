"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UploadBox from '../../components/UploadBox';

export default function OnboardPage() {
  const router = useRouter();
  const [resume, setResume] = useState(null);
  const [jd, setJd] = useState('');
  const [github, setGithub] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const canAnalyze = resume && jd.trim().length > 10;

  const handleAnalyze = () => {
    if (!canAnalyze) return;
    setIsAnalyzing(true);
    // Simulate API delay
    setTimeout(() => {
      router.push('/analysis');
    }, 2000);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '16px' }}>
          Let&apos;s Build Your <span className="gradient-text">Pathway</span>
        </h1>
        <p style={{ color: '#888', fontSize: '18px' }}>Three steps to your personalized learning roadmap</p>
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '64px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: resume ? 'linear-gradient(135deg, #8B5CF6, #06B6D4)' : 'transparent', border: resume ? 'none' : '2px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>1</div>
          <span style={{ fontSize: '13px', color: resume ? 'white' : '#888' }}>Resume</span>
        </div>
        <div style={{ width: '100px', height: '2px', background: resume ? '#8B5CF6' : '#1a1a1a', margin: '0 16px', alignSelf: 'flex-start', marginTop: '15px' }} />
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: jd.length > 10 ? 'linear-gradient(135deg, #8B5CF6, #06B6D4)' : 'transparent', border: jd.length > 10 ? 'none' : '2px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>2</div>
          <span style={{ fontSize: '13px', color: jd.length > 10 ? 'white' : '#888' }}>Job Description</span>
        </div>
        <div style={{ width: '100px', height: '2px', background: github ? '#8B5CF6' : '#1a1a1a', margin: '0 16px', alignSelf: 'flex-start', marginTop: '15px' }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: github ? 'linear-gradient(135deg, #8B5CF6, #06B6D4)' : 'transparent', border: github ? 'none' : '2px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>3</div>
          <span style={{ fontSize: '13px', color: github ? 'white' : '#888' }}>GitHub</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        {/* Step 1 */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>01 — Upload Your Resume</h2>
          <UploadBox onFileSelect={setResume} />
        </div>

        {/* Step 2 */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>02 — Job Description</h2>
          <div className="surface-card" style={{ padding: '24px' }}>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the full job description here..."
              style={{
                width: '100%', minHeight: '200px', background: 'transparent',
                border: 'none', color: 'white', fontFamily: 'inherit', fontSize: '14px',
                resize: 'vertical', outline: 'none'
              }}
            />
            <div style={{ textAlign: 'right', color: '#555', fontSize: '12px', marginTop: '12px' }}>
              {jd.length} / 5000
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            03 — GitHub Profile <span style={{ background: '#333', fontSize: '12px', padding: '2px 8px', borderRadius: '99px' }}>Optional</span>
          </h2>
          <div className="surface-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '32px' }}>
              <svg height="32" viewBox="0 0 16 16" width="32" style={{fill: 'white'}}>
                 <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex', alignItems: 'center', background: '#111',
                border: '1px solid #222', borderRadius: '8px', padding: '0 12px'
              }}>
                <span style={{ color: '#555', fontSize: '14px' }}>github.com/</span>
                <input
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="username"
                  style={{
                    background: 'transparent', border: 'none', color: 'white',
                    padding: '12px 0', fontSize: '14px', flex: 1, outline: 'none', fontFamily: 'inherit'
                  }}
                />
                {github && <span style={{ color: '#10B981', marginLeft: '8px' }}>✓ Profile Linked</span>}
              </div>
              <div style={{ color: '#888', fontSize: '13px', marginTop: '8px' }}>
                We&apos;ll scan your repos and languages to better assess your skills
              </div>
            </div>
          </div>
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze || isAnalyzing}
          className={canAnalyze && !isAnalyzing ? 'gradient-btn animate-pulse-glow' : ''}
          style={{
            width: '100%', borderRadius: '12px', padding: '20px 0', fontSize: '18px', fontWeight: 600,
            background: canAnalyze && !isAnalyzing ? undefined : '#222',
            color: canAnalyze && !isAnalyzing ? 'white' : '#555',
            cursor: canAnalyze && !isAnalyzing ? 'pointer' : 'not-allowed',
            marginTop: '24px', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px'
          }}
        >
          {isAnalyzing ? (
            <>
              <div style={{
                width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.2)',
                borderTopColor: 'white', borderRadius: '50%',
              }} className="animate-spin" />
              Analyzing with Gemini AI...
            </>
          ) : (
            'Analyze My Skills →'
          )}
        </button>
      </div>
    </div>
  );
}

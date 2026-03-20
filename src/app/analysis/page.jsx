import Link from 'next/link';
import GitHubCard from '../../components/GitHubCard';
import SkillChip from '../../components/SkillChip';

export default function AnalysisPage() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 24px' }}>
      {/* Top Summary Strip */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', borderRadius: '99px', padding: '10px 20px', fontSize: '14px', fontWeight: 600 }}>
          12 Skills Detected
        </div>
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', borderRadius: '99px', padding: '10px 20px', fontSize: '14px', fontWeight: 600 }}>
          5 Gaps Found
        </div>
        <div style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', color: '#06B6D4', borderRadius: '99px', padding: '10px 20px', fontSize: '14px', fontWeight: 600 }}>
          7 Already Known
        </div>
      </div>

      <GitHubCard />

      {/* Three Skill Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', marginBottom: '40px' }}>
        
        {/* Strong */}
        <div>
          <h2 style={{ color: '#10B981', fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>✓ You Already Know</h2>
          <p style={{ color: '#888', fontSize: '13px', marginBottom: '24px' }}>Skills from resume + GitHub matching JD</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="surface-card" style={{ padding: '16px', background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.2)' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <SkillChip label="Python" color="green" />
                <SkillChip label="JavaScript" color="green" />
                <SkillChip label="React" color="green" />
                <SkillChip label="Next.js" color="green" />
                <SkillChip label="CSS" color="green" />
              </div>
            </div>
          </div>
        </div>

        {/* Missing */}
        <div>
          <h2 style={{ color: '#EF4444', fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>✗ Skill Gaps</h2>
          <p style={{ color: '#888', fontSize: '13px', marginBottom: '24px' }}>Required skills completely missing</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="surface-card" style={{ padding: '16px', background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <SkillChip label="GraphQL" color="red">
                  <span style={{ fontSize: '10px', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' }}>Intermediate</span>
                </SkillChip>
                <SkillChip label="Docker" color="red">
                  <span style={{ fontSize: '10px', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' }}>Basic</span>
                </SkillChip>
              </div>
            </div>
          </div>
        </div>

        {/* Weak */}
        <div>
          <h2 style={{ color: '#F59E0B', fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>⚡ Needs Improvement</h2>
          <p style={{ color: '#888', fontSize: '13px', marginBottom: '24px' }}>Skills below required proficiency</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="surface-card" style={{ padding: '16px', background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.2)' }}>
              <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                <SkillChip label="TypeScript" color="orange">
                  <span style={{ fontSize: '10px', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' }}>Beginner → Intermediate</span>
                </SkillChip>
                <SkillChip label="System Design" color="orange">
                  <span style={{ fontSize: '10px', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' }}>Intermediate → Advanced</span>
                </SkillChip>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Reasoning Section */}
      <div className="surface-card" style={{ padding: '24px', marginBottom: '48px' }}>
        <h3 style={{ color: '#8B5CF6', fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🧠 AI Reasoning
        </h3>
        <div style={{ color: '#888', fontSize: '14px', lineHeight: 1.8, fontFamily: 'monospace' }}>
          &gt; Scanning resume and GitHub repos for matches against Senior Frontend Developer JD...<br/>
          &gt; Found strong evidence of React/Next.js and general JS/Python from 24 public repos.<br/>
          &gt; Missing evidence of GraphQL and Docker. JD strictly requires intermediate GraphQL for data fetching.<br/>
          &gt; TypeScript is mentioned in resume, but GitHub shows predominantly JS repos, classifying as &quot;Needs Improvement&quot; to clear Senior bar.
        </div>
      </div>

      {/* CTA Layer */}
      <div style={{ textAlign: 'center' }}>
        <Link href="/pathway">
          <button className="gradient-btn" style={{ borderRadius: '99px', padding: '16px 40px', fontSize: '17px', fontWeight: 600 }}>
            Generate My DNA Pathway →
          </button>
        </Link>
      </div>

    </div>
  );
}

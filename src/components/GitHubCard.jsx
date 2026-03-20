import SkillChip from './SkillChip';

export default function GitHubCard() {
  return (
    <div className="surface-card" style={{ padding: '24px', maxWidth: '100%', marginBottom: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.3)', backgroundColor: '#2a2a2a'
          }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '18px', color: '#e2e2e2' }}>octocat</div>
            <div style={{
              display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.06)', color: '#c6c6c7',
              fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', marginTop: '4px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              Verified Profile
            </div>
          </div>
        </div>
        <a href="#" style={{ color: '#c6c6c7', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }}>View Profile ↗</a>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginBottom: '24px'
      }}>
        <div>
          <div style={{ color: '#919191', fontSize: '12px', marginBottom: '4px' }}>Public Repos</div>
          <div style={{ color: '#e2e2e2', fontSize: '18px', fontWeight: 600 }}>24</div>
        </div>
        <div>
          <div style={{ color: '#919191', fontSize: '12px', marginBottom: '4px' }}>Top Languages</div>
          <div style={{ color: '#e2e2e2', fontSize: '18px', fontWeight: 600 }}>Python, JS</div>
        </div>
        <div>
          <div style={{ color: '#919191', fontSize: '12px', marginBottom: '4px' }}>Contributions</div>
          <div style={{ color: '#e2e2e2', fontSize: '18px', fontWeight: 600 }}>842</div>
        </div>
        <div>
          <div style={{ color: '#919191', fontSize: '12px', marginBottom: '4px' }}>Account Age</div>
          <div style={{ color: '#e2e2e2', fontSize: '18px', fontWeight: 600 }}>3 years</div>
        </div>
      </div>

      {/* Skills */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ color: '#919191', fontSize: '13px', marginBottom: '12px' }}>Skills detected from your repos</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <SkillChip label="Python" size="sm" />
          <SkillChip label="JavaScript" size="sm" />
          <SkillChip label="Docker" size="sm" />
          <SkillChip label="React" size="sm" />
        </div>
      </div>

      {/* Insight Row */}
      <div style={{
        borderTop: '1px solid rgba(71,71,71,0.3)', paddingTop: '16px', color: '#919191', fontSize: '13px', fontStyle: 'italic'
      }}>
        💡 Your GitHub suggests intermediate Python and beginner Docker
      </div>
    </div>
  );
}

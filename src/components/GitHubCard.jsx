import SkillChip from './SkillChip';

export default function GitHubCard() {
  return (
    <div className="surface-card" style={{ padding: '24px', maxWidth: '100%', marginBottom: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            border: '2px solid #8B5CF6', backgroundColor: '#333'
          }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '18px', color: 'white' }}>octocat</div>
            <div style={{
              display: 'inline-block', backgroundColor: 'rgba(16,185,129,0.1)', color: '#10B981',
              fontSize: '11px', padding: '2px 8px', borderRadius: '99px', marginTop: '4px'
            }}>
              Verified Profile
            </div>
          </div>
        </div>
        <a href="#" style={{ color: '#8B5CF6', textDecoration: 'none', fontSize: '14px' }}>View Profile ↗</a>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginBottom: '24px'
      }}>
        <div>
          <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Public Repos</div>
          <div style={{ color: 'white', fontSize: '18px', fontWeight: 600 }}>24</div>
        </div>
        <div>
          <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Top Languages</div>
          <div style={{ color: 'white', fontSize: '18px', fontWeight: 600 }}>Python, JS</div>
        </div>
        <div>
          <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Contributions</div>
          <div style={{ color: 'white', fontSize: '18px', fontWeight: 600 }}>842</div>
        </div>
        <div>
          <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Account Age</div>
          <div style={{ color: 'white', fontSize: '18px', fontWeight: 600 }}>3 years</div>
        </div>
      </div>

      {/* Skills */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ color: '#888', fontSize: '13px', marginBottom: '12px' }}>Skills detected from your repos</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <SkillChip label="Python" color="purple" size="sm" />
          <SkillChip label="JavaScript" color="purple" size="sm" />
          <SkillChip label="Docker" color="purple" size="sm" />
          <SkillChip label="React" color="purple" size="sm" />
        </div>
      </div>

      {/* Insight Row */}
      <div style={{
        borderTop: '1px solid #1a1a1a', paddingTop: '16px', color: '#888', fontSize: '13px', fontStyle: 'italic'
      }}>
        💡 Your GitHub suggests intermediate Python and beginner Docker
      </div>
    </div>
  );
}

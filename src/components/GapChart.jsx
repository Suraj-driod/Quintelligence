export default function GapChart({ skills }) {
  // skills structure: [{ name: 'React', current: 40, required: 80 }, ...]
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {skills.map((skill, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#fff' }}>{skill.name}</span>
            <span style={{ color: '#888' }}>{skill.current}% → {skill.required}%</span>
          </div>
          <div style={{
            position: 'relative',
            width: '100%',
            height: '8px',
            backgroundColor: '#111',
            borderRadius: '99px',
            overflow: 'hidden'
          }}>
            {/* Base Current Level */}
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${skill.current}%`,
              backgroundColor: '#333',
              borderRadius: '99px'
            }} />
            {/* Gap to Fill */}
            <div style={{
              position: 'absolute',
              left: `${skill.current}%`,
              top: 0,
              height: '100%',
              width: `${Math.max(0, skill.required - skill.current)}%`,
              background: 'linear-gradient(90deg, #F59E0B, #EF4444)',
              borderRadius: '0 99px 99px 0'
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

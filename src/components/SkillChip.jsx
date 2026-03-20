export default function SkillChip({ label, color, size = 'md', children }) {
  // Monochrome-only chip — color prop is ignored in OBSIDIAN theme
  const padding = size === 'sm' ? '4px 12px' : '6px 16px';
  const fontSize = size === 'sm' ? '12px' : '13px';

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      backgroundColor: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.12)',
      color: '#c6c6c7',
      borderRadius: '9999px',
      padding,
      fontSize,
      fontWeight: 500,
      whiteSpace: 'nowrap',
      transition: 'all 0.2s ease'
    }}>
      {label}
      {children}
    </div>
  );
}

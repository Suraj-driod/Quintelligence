export default function SkillChip({ label, color = 'purple', size = 'md', children }) {
  const colors = {
    green: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', text: '#10B981' },
    red: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', text: '#EF4444' },
    orange: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', text: '#F59E0B' },
    purple: { bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.3)', text: '#8B5CF6' }
  };

  const theme = colors[color] || colors.purple;
  const padding = size === 'sm' ? '4px 12px' : '6px 16px';
  const fontSize = size === 'sm' ? '12px' : '13px';

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      backgroundColor: theme.bg,
      border: `1px solid ${theme.border}`,
      color: theme.text,
      borderRadius: '99px',
      padding,
      fontSize,
      fontWeight: 500,
      whiteSpace: 'nowrap'
    }}>
      {label}
      {children}
    </div>
  );
}

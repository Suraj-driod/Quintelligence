import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, PlayCircle, FileText, CheckCircle2, MessageSquare, BookOpen, Layers } from 'lucide-react';
import SkillChip from './SkillChip';

const getResourceIcon = (type) => {
  const t = type?.toLowerCase() || '';
  if (t.includes('video') || t.includes('youtube')) return <PlayCircle size={16} />;
  if (t.includes('doc') || t.includes('article') || t.includes('read')) return <FileText size={16} />;
  if (t.includes('exercise') || t.includes('lab') || t.includes('practice')) return <CheckCircle2 size={16} />;
  if (t.includes('social') || t.includes('community') || t.includes('forum')) return <MessageSquare size={16} />;
  if (t.includes('book')) return <BookOpen size={16} />;
  return <Layers size={16} />;
};

export default function ModuleModal({ module, onClose }) {
  if (!module) return null;

  return (
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px'
        }}
      >
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)', cursor: 'pointer'
          }}
        />

        {/* Modal Window */}
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            position: 'relative', width: '100%', maxWidth: '600px',
            background: 'linear-gradient(180deg, rgba(31, 31, 31, 0.95) 0%, rgba(20, 20, 20, 0.95) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', maxHeight: '90vh'
          }}
        >
          {/* Header */}
          <div style={{ padding: '32px 32px 24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <button 
              onClick={onClose}
              style={{
                position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.05)',
                border: 'none', color: '#a1a1aa', borderRadius: '50%', width: '36px', height: '36px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#a1a1aa'; }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', padding: '6px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em' }}>
                MODULE
              </span>
              <span style={{ color: '#71717a', fontSize: '14px', fontWeight: 600 }}>
                {module.duration}
              </span>
            </div>

            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', margin: '0 0 16px 0', lineHeight: 1.2 }}>
              {module.name}
            </h2>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {module.skills?.map(skill => (
                <SkillChip key={skill} label={skill} size="sm" />
              ))}
            </div>
          </div>

          {/* Body Content (Scrollable) */}
          <div style={{ padding: '32px', overflowY: 'auto' }}>
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '15px', color: '#ffffff', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '4px', height: '16px', background: '#8b5cf6', borderRadius: '2px' }} />
                Why focus on this?
              </h3>
              <p style={{ color: '#a1a1aa', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
                {module.reasoning}
              </p>
            </div>

            {module.resources && module.resources.length > 0 && (
              <div>
                <h3 style={{ fontSize: '15px', color: '#ffffff', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '4px', height: '16px', background: '#ec4899', borderRadius: '2px' }} />
                  Curated Resources
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {module.resources.map((res, i) => (
                    <a 
                      key={i} 
                      href={res.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '16px', textDecoration: 'none', transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ color: '#a1a1aa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {getResourceIcon(res.type)}
                        </div>
                        <div>
                          <div style={{ color: '#e2e2e2', fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{res.title}</div>
                          <div style={{ color: '#71717a', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{res.type}</div>
                        </div>
                      </div>
                      <ExternalLink size={16} color="#71717a" />
                    </a>
                  ))}
                </div>
              </div>
            )}
            {!(module.resources && module.resources.length > 0) && (
              <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
                 <p style={{ color: '#71717a', fontSize: '14px', margin: 0 }}>No explicit resources generated for this module.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

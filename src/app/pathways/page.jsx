'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Layers, Activity, Calendar, ArrowRight } from 'lucide-react';
import { auth } from '@/app/backend/firebase';
import { getUserPathways } from '@/app/backend/pathwayService';
import Loading from '@/components/Loading';

export default function PathwaysPage() {
  const [pathways, setPathways] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        try {
          const fetchedPathways = await getUserPathways(currentUser.uid);
          // Filter to show active/completed pathways if needed, or all.
          setPathways(fetchedPathways || []);
        } catch (error) {
          console.error("Error fetching pathways:", error);
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handlePathwayClick = (pathway) => {
    localStorage.setItem('pathwayData', JSON.stringify({ pathwayId: pathway.id, pathway }));
    router.push('/pathway');
  };

  if (loading) return <Loading />;

  return (
    <>
      <style>{`
        .target-role-chip {
          display: inline-flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 9999px;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 600;
          color: #a1a1aa;
          margin-bottom: 24px;
        }

        .glass-card-pathway {
          background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 32px;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .glass-card-pathway::before {
          content: '';
          position: absolute;
          top: 0; left: 50%;
          transform: translateX(-50%);
          width: 80%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .glass-card-pathway:hover {
          border-color: rgba(255, 255, 255, 0.15);
          background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
          transform: translateY(-8px);
          box-shadow: 0 15px 35px -10px rgba(0,0,0,0.8), 0 0 20px rgba(255,255,255,0.03);
        }

        .glass-card-pathway:hover::before {
          opacity: 1;
        }

        .pathway-icon {
          width: 48px; height: 48px;
          border-radius: 12px;
          background: rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #a1a1aa;
          margin-bottom: 24px;
          transition: all 0.3s ease;
        }
        
        .glass-card-pathway:hover .pathway-icon {
          color: #ffffff;
          background: rgba(255,255,255,0.1);
          transform: scale(1.05);
        }
      `}</style>
      
      <div style={{ backgroundColor: '#000000', color: '#e2e2e2', minHeight: '100vh', padding: '120px 24px 80px 24px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
            style={{ marginBottom: '64px' }}
          >
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, margin: '0 0 16px 0', letterSpacing: '-0.04em' }}>
              Your <span style={{ color: '#a1a1aa' }}>Generated Pathways</span>
            </h1>
            <p style={{ color: '#71717a', fontSize: '18px', maxWidth: '600px', margin: 0, lineHeight: 1.6 }}>
              Select a specialized roadmap you've synthesized to continue your deep work and fast-track your skills.
            </p>
          </motion.div>

          {pathways.length === 0 ? (
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               style={{ textAlign: 'center', padding: '80px 0', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '24px' }}
             >
               <Layers size={48} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 24px auto' }} />
               <h3 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>No Pathways Synthesized</h3>
               <p style={{ color: '#a1a1aa', marginBottom: '32px' }}>Initialize a new deep-learning protocol via the Onboard process.</p>
               <button onClick={() => router.push('/onboard')} className="glass-btn-primary">
                 Start Onboarding
               </button>
             </motion.div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}
            >
              {pathways.map((pathway) => (
                <motion.div
                  key={pathway.id}
                  variants={{
                    hidden: { opacity: 0, scale: 0.95, y: 20 },
                    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
                  }}
                  className="glass-card-pathway"
                  onClick={() => handlePathwayClick(pathway)}
                >
                  <div className="pathway-icon">
                    <Layers size={24} />
                  </div>
                  <div className="target-role-chip">{pathway.role || pathway.title || "Target Role"}</div>
                  
                  <h3 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 12px 0', letterSpacing: '-0.02em', color: '#ffffff' }}>
                    {pathway.title || 'Untitled Roadmap'}
                  </h3>
                  
                  <p style={{ fontSize: '14px', color: '#a1a1aa', margin: '0 0 32px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={16} /> Progress: {pathway.progress || 0} / {pathway.modules?.length || 0} Modules
                  </p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <Calendar size={14} /> {(pathway.createdAt?.toDate ? pathway.createdAt.toDate() : new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <ArrowRight size={18} color="#ffffff" style={{ opacity: 0.5 }} />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
          
        </div>
      </div>
    </>
  );
}

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/app/backend/firebase';
import { getUserPathways, getLearnerProfileFromDB } from '@/app/backend/pathwayService';
import Profile from '@/components/Profile';


export default function ProfileRoute() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [pathways, setPathways] = useState([]);
  const [learnerProfile, setLearnerProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);
      
      try {
        const [userPathways, profile] = await Promise.all([
          getUserPathways(currentUser.uid),
          getLearnerProfileFromDB(currentUser.uid)
        ]);
        setPathways(userPathways || []);
        if (profile) setLearnerProfile(profile);
      } catch (err) {
        console.error("Failed to fetch profile data", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
     return (
        <div style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <span style={{ color: '#fff' }}>Synchronizing Identity Matrix...</span>
        </div>
     );
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>

      </div>
      <div style={{ paddingTop: '80px' }}>
         <Profile user={user} pathways={pathways} learnerProfile={learnerProfile} />
      </div>
    </div>
  );
}

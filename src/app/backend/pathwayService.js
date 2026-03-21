import {
  collection, doc, addDoc, getDoc,
  getDocs, updateDoc, setDoc, query,
  where, orderBy, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

// ── SAVE new pathway ──────────────────────────────────────────────
export async function savePathway(userId, pathwayData) {
  try {
    const ref = await addDoc(collection(db, 'pathways'), {
      userId:       userId || 'guest_user',
      title:        pathwayData.title        ?? 'Untitled Pathway',
      company:      pathwayData.company       ?? null,
      status:       'active',
      progress:     0,

      // Mind-Gauge fields
      mindGauge:    pathwayData.mindGauge    ?? null,
      learnerType:  pathwayData.learnerType  ?? null,
      learnerTrait: pathwayData.learnerTrait ?? null,

      // Skills & analysis
      resumeSkills: pathwayData.resumeSkills ?? [],
      jdSkills:     pathwayData.jdSkills     ?? [],
      githubData:   pathwayData.githubData   ?? null,
      gapAnalysis:  pathwayData.gapAnalysis  ?? { missing: [], weak: [], strong: [] },

      // Modules — each gets learningStyle + resources from the AI response
      modules: (pathwayData.modules ?? []).map(m => ({
        ...m,
        status:        'pending',
        learningStyle: m.learningStyle ?? null,
        resources:     m.resources     ?? [],
        completedAt:   null
      })),

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return ref.id
  } catch (err) {
    console.error('savePathway error:', err)
    throw err
  }
}

// ── SAVE learner profile to user doc (so we never ask again) ──────
export async function saveLearnerProfile(userId, mindGauge, learnerProfile) {
  try {
    await setDoc(
      doc(db, 'users', userId),
      {
        learnerProfile: {
          mindGauge,
          learnerType:  learnerProfile.type,
          learnerTrait: learnerProfile.trait,
          style:        learnerProfile.style,
          answeredAt:   serverTimestamp()
        }
      },
      { merge: true }
    )
  } catch (err) {
    console.error('saveLearnerProfile error:', err)
    throw err
  }
}

// ── GET learner profile from user doc ─────────────────────────────
export async function getLearnerProfileFromDB(userId) {
  try {
    const snap = await getDoc(doc(db, 'users', userId))
    if (!snap.exists()) return null
    return snap.data().learnerProfile ?? null
  } catch (err) {
    console.error('getLearnerProfileFromDB error:', err)
    throw err
  }
}

// ── GET single pathway by ID ──────────────────────────────────────
export async function getPathway(pathwayId) {
  try {
    const snap = await getDoc(doc(db, 'pathways', pathwayId))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() }
  } catch (err) {
    console.error('getPathway error:', err)
    throw err
  }
}

// ── GET all pathways for a user ───────────────────────────────────
export async function getUserPathways(userId) {
  try {
    const q = query(
      collection(db, 'pathways'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.error('getUserPathways error:', err)
    throw err
  }
}

// ── MARK a module as complete ─────────────────────────────────────
export async function completeModule(pathwayId, moduleId, modules) {
  try {
    const updated = modules.map(m =>
      m.id === moduleId
        ? { ...m, status: 'completed', completedAt: new Date().toISOString() }
        : m
    )
    const completedCount = updated.filter(m => m.status === 'completed').length
    const allDone        = completedCount === updated.length

    await updateDoc(doc(db, 'pathways', pathwayId), {
      modules:   updated,
      progress:  completedCount,
      status:    allDone ? 'completed' : 'active',
      updatedAt: serverTimestamp()
    })
    return updated
  } catch (err) {
    console.error('completeModule error:', err)
    throw err
  }
}

// ── UPDATE pathway after feedback regeneration ────────────────────
export async function updatePathwayModules(pathwayId, newModules, feedback) {
  try {
    await updateDoc(doc(db, 'pathways', pathwayId), {
      modules:      newModules,
      progress:     0,
      lastFeedback: feedback,
      updatedAt:    serverTimestamp()
    })
  } catch (err) {
    console.error('updatePathwayModules error:', err)
    throw err
  }
}

// ── ARCHIVE a pathway ─────────────────────────────────────────────
export async function archivePathway(pathwayId) {
  try {
    await updateDoc(doc(db, 'pathways', pathwayId), {
      status:    'archived',
      updatedAt: serverTimestamp()
    })
  } catch (err) {
    console.error('archivePathway error:', err)
    throw err
  }
}

// ── UPDATE PATHWAY PROGRESS ───────────────────────────────────────
export async function updatePathwayProgress(pathwayId, completedModulesArray, totalModules) {
  try {
    const progress = completedModulesArray.length;
    await updateDoc(doc(db, 'pathways', pathwayId), {
      completedModules: completedModulesArray,
      progress: progress,
      status: progress >= totalModules ? 'completed' : 'active',
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.error('updatePathwayProgress error:', err);
    throw err;
  }
}

import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signInWithPopup,
  signOut, updateProfile, sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from '../lib/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        await ensureUserProfile(firebaseUser)
        const prof = await getUserProfile(firebaseUser.uid)
        setProfile(prof)
      } else { setProfile(null) }
      setLoading(false)
    })
    return unsub
  }, [])

  async function ensureUserProfile(firebaseUser) {
    const ref = doc(db, 'users', firebaseUser.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: firebaseUser.uid, email: firebaseUser.email,
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || '',
        plan: 'free', fileCount: 0,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
    }
  }
  async function getUserProfile(uid) {
    const snap = await getDoc(doc(db, 'users', uid))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  }
  async function signUp(email, password, name) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    await ensureUserProfile({ ...cred.user, displayName: name })
    return cred
  }
  async function signIn(email, password) { return signInWithEmailAndPassword(auth, email, password) }
  async function signInWithGoogle() {
    const cred = await signInWithPopup(auth, googleProvider)
    await ensureUserProfile(cred.user)
    return cred
  }
  async function logout() { await signOut(auth); setProfile(null) }
  async function resetPassword(email) { return sendPasswordResetEmail(auth, email) }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signInWithGoogle, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

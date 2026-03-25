// src/pages/SettingsPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '../hooks/useAuth'
import { auth, db } from '../lib/firebase'
import AppShell from '../components/AppShell'
import { Input, Button, Spinner, Badge } from '../components/UI'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()
  const [name, setName]         = useState(user?.displayName || '')
  const [saving, setSaving]     = useState(false)
  const [oldPw, setOldPw]       = useState('')
  const [newPw, setNewPw]       = useState('')
  const [changingPw, setChangePw] = useState(false)

  async function saveProfile() {
    setSaving(true)
    try {
      await updateProfile(auth.currentUser, { displayName: name })
      await updateDoc(doc(db, 'users', user.uid), { displayName: name, updatedAt: serverTimestamp() })
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function changePassword() {
    setChangePw(true)
    try {
      const cred = EmailAuthProvider.credential(user.email, oldPw)
      await reauthenticateWithCredential(auth.currentUser, cred)
      await updatePassword(auth.currentUser, newPw)
      toast.success('Password updated!')
      setOldPw(''); setNewPw('')
    } catch (err) {
      toast.error(err.message?.replace('Firebase: ','') || 'Password change failed')
    } finally {
      setChangePw(false)
    }
  }

  return (
    <AppShell>
      <div style={{ height:'100%', overflow:'auto', padding:'32px 40px', maxWidth:680 }}>
        <h1 style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>Settings</h1>
        <p style={{ color:'var(--text3)', marginBottom:36, fontSize:14 }}>Manage your account and preferences</p>

        {/* Plan badge */}
        <div style={{
          background:'var(--bg1)', border:'1px solid var(--border)',
          borderRadius:14, padding:'20px 24px', marginBottom:24,
          display:'flex', alignItems:'center', gap:16,
        }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>
              {profile?.plan === 'pro' ? '⚡ Pro Plan' : '🆓 Free Plan'}
            </div>
            <div style={{ fontSize:13, color:'var(--text3)' }}>
              {profile?.plan === 'pro'
                ? 'Unlimited files, priority AI, advanced analytics'
                : 'Up to 10 files, 50 AI queries/month'}
            </div>
          </div>
          {profile?.plan !== 'pro' && (
            <button style={{
              padding:'8px 18px', background:'var(--lime)', border:'none',
              borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer', color:'#0b0c0f',
            }}>
              Upgrade to Pro
            </button>
          )}
        </div>

        {/* Profile */}
        <Section title="Profile">
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <Input label="Display name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            <Input label="Email" value={user?.email || ''} disabled />
            <Button variant="primary" onClick={saveProfile} loading={saving} style={{ width:'fit-content' }}>
              Save changes
            </Button>
          </div>
        </Section>

        {/* Change password (email users only) */}
        {!user?.providerData?.some(p => p.providerId === 'google.com') && (
          <Section title="Change Password">
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <Input label="Current password" type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} placeholder="••••••••" />
              <Input label="New password" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min. 8 characters" minLength={8} />
              <Button variant="primary" onClick={changePassword} loading={changingPw} disabled={!oldPw || newPw.length < 8} style={{ width:'fit-content' }}>
                Update password
              </Button>
            </div>
          </Section>
        )}

        {/* API Keys section */}
        <Section title="API Configuration">
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px' }}>
            <div style={{ fontSize:13, color:'var(--text3)', lineHeight:1.65, marginBottom:12 }}>
              Oshi uses <strong style={{ color:'var(--text)' }}>Google Gemini 1.5 Flash</strong> for document analysis. Your Gemini API key is configured in the <code style={{ fontFamily:'var(--mono)', fontSize:12, background:'var(--bg3)', padding:'1px 6px', borderRadius:4, color:'var(--lime)' }}>.env</code> file.
            </div>
            <div style={{ fontFamily:'var(--mono)', fontSize:12, color:'var(--text3)', background:'var(--bg3)', padding:'10px 14px', borderRadius:8, border:'1px solid var(--border)' }}>
              VITE_GEMINI_API_KEY=your_key_here
            </div>
          </div>
        </Section>

        {/* Danger zone */}
        <Section title="Danger Zone">
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <Button variant="danger" onClick={async () => { await logout(); navigate('/auth') }}>
              Sign out
            </Button>
          </div>
        </Section>
      </div>
    </AppShell>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:28 }}>
      <h2 style={{ fontSize:14, fontWeight:700, marginBottom:16, paddingBottom:10, borderBottom:'1px solid var(--border)', color:'var(--text2)' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

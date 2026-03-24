// src/pages/AuthPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Input, Button, Spinner } from '../components/UI'
import toast from 'react-hot-toast'

export default function AuthPage() {
  const [mode, setMode]       = useState('login') // 'login' | 'signup' | 'reset'
  const [email, setEmail]     = useState('')
  const [password, setPass]   = useState('')
  const [name, setName]       = useState('')
  const [loading, setLoading] = useState(false)
  const [gLoading, setGLoad]  = useState(false)
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        toast.success('Welcome back!')
        navigate('/dashboard')
      } else if (mode === 'signup') {
        if (!name.trim()) { toast.error('Please enter your name'); return }
        await signUp(email, password, name)
        toast.success('Account created!')
        navigate('/dashboard')
      } else {
        await resetPassword(email)
        toast.success('Password reset email sent!')
        setMode('login')
      }
    } catch (err) {
      toast.error(err.message?.replace('Firebase: ', '') || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setGLoad(true)
    try {
      await signInWithGoogle()
      toast.success('Signed in with Google!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message?.replace('Firebase: ', '') || 'Google sign-in failed')
    } finally {
      setGLoad(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', background: 'var(--bg)',
      fontFamily: 'var(--sans)',
    }}>
      {/* Left panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: '40px 48px', maxWidth: 520,
      }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'auto', paddingBottom:48 }}>
          <div style={{
            width:32, height:32, background:'var(--lime)', borderRadius:8,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M4 3h8l4 4v10H4V3z" fill="#0b0c0f" opacity=".9"/>
              <path d="M12 3v4h4" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" fill="none"/>
            </svg>
          </div>
          <span style={{ fontSize:18, fontWeight:800, color:'var(--text)', letterSpacing:'-0.3px' }}>
            Orion<span style={{ color:'var(--lime)' }}>.</span>
          </span>
        </div>

        {/* Form */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', maxWidth:400 }}>
          <h1 style={{ fontFamily:'var(--serif)', fontSize:32, marginBottom:8, letterSpacing:'-0.5px' }}>
            {mode === 'login'  ? 'Welcome back'  :
             mode === 'signup' ? 'Create account' :
             'Reset password'}
          </h1>
          <p style={{ color:'var(--text3)', marginBottom:32, fontSize:14 }}>
            {mode === 'login'  ? 'Sign in to your Orion workspace' :
             mode === 'signup' ? 'Start your free trial — no card required' :
             'Enter your email and we\'ll send a reset link'}
          </p>

          {mode !== 'reset' && (
            <>
              <button onClick={handleGoogle} disabled={gLoading} style={{
                width:'100%', padding:'11px 16px', marginBottom:20,
                background:'var(--bg2)', border:'1px solid var(--border2)',
                borderRadius:10, color:'var(--text)', fontSize:14, fontWeight:500,
                display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                cursor:'pointer', transition:'all 0.15s',
              }}
              onMouseEnter={e => e.target.style.background='var(--bg3)'}
              onMouseLeave={e => e.target.style.background='var(--bg2)'}
              >
                {gLoading ? <Spinner size={16} /> : (
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Continue with Google
              </button>

              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
                <div style={{ flex:1, height:1, background:'var(--border)' }}/>
                <span style={{ fontSize:12, color:'var(--text4)' }}>or</span>
                <div style={{ flex:1, height:1, background:'var(--border)' }}/>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {mode === 'signup' && (
              <Input label="Full name" type="text" placeholder="Alex Johnson"
                value={name} onChange={e => setName(e.target.value)} required />
            )}
            <Input label="Email address" type="email" placeholder="you@company.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
            {mode !== 'reset' && (
              <Input label="Password" type="password" placeholder={mode === 'signup' ? 'Min. 8 characters' : '••••••••'}
                value={password} onChange={e => setPass(e.target.value)} required minLength={mode === 'signup' ? 8 : 1} />
            )}

            {mode === 'login' && (
              <div style={{ textAlign:'right', marginTop:-8 }}>
                <button type="button" onClick={() => setMode('reset')}
                  style={{ background:'none', border:'none', color:'var(--text3)', fontSize:12, cursor:'pointer' }}>
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width:'100%', padding:'12px', marginTop:4,
              background:'var(--lime)', border:'none', borderRadius:10,
              color:'#0b0c0f', fontSize:14, fontWeight:700,
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              transition:'all 0.15s',
            }}>
              {loading ? <Spinner size={16} color="#0b0c0f" /> : null}
              {mode === 'login'  ? 'Sign in'        :
               mode === 'signup' ? 'Create account'  :
               'Send reset link'}
            </button>
          </form>

          <p style={{ marginTop:24, fontSize:13, color:'var(--text3)', textAlign:'center' }}>
            {mode === 'login'  ? "Don't have an account? " :
             mode === 'signup' ? 'Already have an account? ' :
             'Remember your password? '}
            <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              style={{ background:'none', border:'none', color:'var(--lime)', fontWeight:600, cursor:'pointer' }}>
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        flex:1, background:'var(--bg1)', borderLeft:'1px solid var(--border)',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        padding:48, position:'relative', overflow:'hidden',
      }}>
        {/* Glow */}
        <div style={{
          position:'absolute', top:'20%', right:'10%', width:400, height:400,
          background:'radial-gradient(circle, rgba(200,240,77,0.08) 0%, transparent 70%)',
          pointerEvents:'none',
        }}/>

        <div style={{ position:'relative', zIndex:1, maxWidth:420, textAlign:'center' }}>
          <div style={{
            width:64, height:64, background:'var(--lime-dim)', border:'1px solid rgba(200,240,77,0.2)',
            borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 24px', animation:'pulse 3s ease-in-out infinite',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--lime)" strokeWidth="1.8">
              <path d="M12 2L4 6V12C4 16.418 7.582 20.418 12 22C16.418 20.418 20 16.418 20 12V6L12 2Z"/>
              <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <h2 style={{ fontFamily:'var(--serif)', fontSize:28, marginBottom:14, color:'var(--text)' }}>
            AI that understands your documents
          </h2>
          <p style={{ fontSize:14, color:'var(--text3)', lineHeight:1.7, marginBottom:36 }}>
            Upload any document and ask questions in plain English. Orion extracts, analyzes, and explains your files instantly — powered by Google Gemini.
          </p>

          {/* Feature pills */}
          {[
            '📄  Any file format supported',
            '🔍  Instant AI-powered answers',
            '🔒  Enterprise-grade security',
            '⚡  Real-time document processing',
          ].map(f => (
            <div key={f} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'10px 16px', background:'var(--bg2)',
              border:'1px solid var(--border)', borderRadius:10,
              marginBottom:10, textAlign:'left',
              fontSize:13.5, color:'var(--text2)',
            }}>{f}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

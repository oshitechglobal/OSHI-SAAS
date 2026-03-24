// src/components/UI.jsx
import { useState } from 'react'

// ── BUTTON ────────────────────────────────────────────────
const btnVariants = {
  primary:  'bg-lime text-dark font-semibold hover:bg-lime2',
  ghost:    'border border-border2 text-text2 hover:bg-bg3 hover:text-text',
  danger:   'bg-red/10 border border-red/20 text-red hover:bg-red/20',
  dark:     'bg-bg3 border border-border2 text-text2 hover:bg-bg4 hover:text-text',
}

export function Button({ variant = 'ghost', children, className = '', loading, icon, ...props }) {
  const base = `inline-flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none`
  return (
    <button
      className={`${base} ${className}`}
      style={variant === 'primary'
        ? { background: 'var(--lime)', color: '#0b0c0f' }
        : variant === 'danger'
        ? { background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--red)' }
        : { background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text2)' }
      }
      {...props}
    >
      {loading ? <Spinner size={14} /> : icon}
      {children}
    </button>
  )
}

// ── INPUT ────────────────────────────────────────────────
export function Input({ label, error, prefix, suffix, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</label>}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {prefix && <span style={{ position:'absolute', left:12, color:'var(--text3)', pointerEvents:'none' }}>{prefix}</span>}
        <input
          style={{
            width: '100%',
            padding: prefix ? '10px 12px 10px 36px' : '10px 12px',
            paddingRight: suffix ? 36 : 12,
            background: 'var(--bg2)',
            border: `1px solid ${error ? 'var(--red)' : 'var(--border2)'}`,
            borderRadius: 8,
            color: 'var(--text)',
            fontSize: 14,
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = error ? 'var(--red)' : 'rgba(200,240,77,0.5)'}
          onBlur={e => e.target.style.borderColor = error ? 'var(--red)' : 'var(--border2)'}
          {...props}
        />
        {suffix && <span style={{ position:'absolute', right:12, color:'var(--text3)', pointerEvents:'none' }}>{suffix}</span>}
      </div>
      {error && <span style={{ fontSize:12, color:'var(--red)' }}>{error}</span>}
    </div>
  )
}

// ── SPINNER ──────────────────────────────────────────────
export function Spinner({ size = 18, color = 'var(--lime)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" strokeDasharray="40" strokeDashoffset="20" strokeLinecap="round" />
    </svg>
  )
}

// ── BADGE ────────────────────────────────────────────────
export function Badge({ children, color = 'var(--lime)', bg = 'var(--lime-dim)' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 20,
      fontSize: 11, fontWeight: 600, fontFamily: 'var(--mono)',
      background: bg, color, border: `1px solid ${color}22`,
    }}>{children}</span>
  )
}

// ── MODAL ────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 480 }) {
  if (!open) return null
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20,
      backdropFilter: 'blur(4px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg1)', border: '1px solid var(--border2)',
        borderRadius: 16, padding: 28, width: '100%', maxWidth: width,
        animation: 'fadeIn 0.2s ease',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', padding:4, borderRadius:6 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── AVATAR ────────────────────────────────────────────────
export function Avatar({ name, photoURL, size = 32 }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : '?'
  if (photoURL) return <img src={photoURL} alt={name} style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover' }} />
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, var(--lime), #7de89a)',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize: size * 0.36, fontWeight: 700, color: '#0b0c0f', flexShrink:0,
    }}>{initials}</div>
  )
}

// ── FILE TYPE CHIP ────────────────────────────────────────
export function FileChip({ type, color, bg }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
      background: bg, display:'flex', alignItems:'center', justifyContent:'center',
      fontSize: 10, fontWeight: 700, color, fontFamily: 'var(--mono)',
      border: `1px solid ${color}22`,
    }}>{type}</div>
  )
}

// ── EMPTY STATE ───────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:'60px 24px', textAlign:'center' }}>
      <div style={{ fontSize:40, opacity:0.4 }}>{icon}</div>
      <div>
        <div style={{ fontSize:16, fontWeight:600, marginBottom:6 }}>{title}</div>
        <div style={{ fontSize:13.5, color:'var(--text3)', maxWidth:320 }}>{description}</div>
      </div>
      {action}
    </div>
  )
}

// ── TOOLTIP ───────────────────────────────────────────────
export function Tooltip({ children, label }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position:'relative', display:'inline-flex' }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div style={{
          position:'absolute', bottom:'calc(100% + 6px)', left:'50%', transform:'translateX(-50%)',
          background:'var(--bg4)', border:'1px solid var(--border2)', borderRadius:6,
          padding:'4px 10px', fontSize:11, fontWeight:500, color:'var(--text2)',
          whiteSpace:'nowrap', zIndex:100, pointerEvents:'none',
        }}>{label}</div>
      )}
    </div>
  )
}

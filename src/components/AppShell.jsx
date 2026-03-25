// src/components/AppShell.jsx
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Avatar, Tooltip } from './UI'
import toast from 'react-hot-toast'

const NAV = [
  { path: '/dashboard',  icon: <GridIcon />,  label: 'Files' },
  { path: '/chat',       icon: <ChatIcon />,   label: 'Conversations' },
  { path: '/settings',   icon: <SettingsIcon />, label: 'Settings' },
]

export default function AppShell({ children }) {
  const { user, profile, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  async function handleLogout() {
    await logout()
    toast.success('Signed out')
    navigate('/auth')
  }

  return (
    <div style={{ display:'flex', height:'100vh', background:'var(--bg)', overflow:'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 60 : 'var(--sidebar-w)',
        minWidth: collapsed ? 60 : 'var(--sidebar-w)',
        background:'var(--bg1)',
        borderRight:'1px solid var(--border)',
        display:'flex', flexDirection:'column',
        transition:'width 0.2s, min-width 0.2s',
        overflow:'hidden',
      }}>
        {/* Logo */}
        <div style={{
          height: 'var(--nav-h)', display:'flex', alignItems:'center',
          padding: collapsed ? '0 14px' : '0 20px',
          borderBottom:'1px solid var(--border)',
          gap:10, flexShrink:0,
        }}>
          <div style={{
            width:28, height:28, background:'var(--lime)', borderRadius:7,
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
            cursor:'pointer',
          }} onClick={() => navigate('/dashboard')}>
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
              <path d="M4 3h8l4 4v10H4V3z" fill="#0b0c0f" opacity=".9"/>
              <path d="M12 3v4h4" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" fill="none"/>
            </svg>
          </div>
          {!collapsed && (
            <span style={{ fontSize:16, fontWeight:800, letterSpacing:'-0.3px', whiteSpace:'nowrap' }}>
              Oshi<span style={{ color:'var(--lime)' }}>.</span>
            </span>
          )}
          <button onClick={() => setCollapsed(c => !c)} style={{
            marginLeft:'auto', background:'none', border:'none',
            color:'var(--text3)', cursor:'pointer', padding:4, borderRadius:5,
            flexShrink:0,
          }}>
            {collapsed
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            }
          </button>
        </div>

        {/* New chat button */}
        {!collapsed && (
          <div style={{ padding:'12px 12px 8px' }}>
            <button onClick={() => navigate('/dashboard')} style={{
              width:'100%', padding:'9px 12px',
              background:'var(--lime-dim)', border:'1px solid rgba(200,240,77,0.2)',
              borderRadius:8, color:'var(--lime)', fontSize:13, fontWeight:600,
              display:'flex', alignItems:'center', gap:8, cursor:'pointer',
              transition:'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(200,240,77,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background='var(--lime-dim)'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New conversation
            </button>
          </div>
        )}

        {/* Nav links */}
        <nav style={{ flex:1, padding:'8px 8px', display:'flex', flexDirection:'column', gap:2, overflow:'hidden' }}>
          {NAV.map(item => {
            const active = location.pathname.startsWith(item.path)
            return (
              <Tooltip key={item.path} label={collapsed ? item.label : ''}>
                <button
                  onClick={() => navigate(item.path)}
                  style={{
                    width:'100%', display:'flex', alignItems:'center',
                    gap:10, padding: collapsed ? '10px 14px' : '9px 12px',
                    borderRadius:8, background: active ? 'var(--bg3)' : 'transparent',
                    border:'none', color: active ? 'var(--text)' : 'var(--text3)',
                    cursor:'pointer', transition:'all 0.15s', textAlign:'left',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                  }}
                  onMouseEnter={e => !active && (e.currentTarget.style.background='var(--bg2)')}
                  onMouseLeave={e => !active && (e.currentTarget.style.background='transparent')}
                >
                  {item.icon}
                  {!collapsed && <span style={{ fontSize:13.5, fontWeight:500 }}>{item.label}</span>}
                </button>
              </Tooltip>
            )
          })}
        </nav>

        {/* User footer */}
        <div style={{ padding:'12px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
          <div style={{
            display:'flex', alignItems:'center', gap:10,
            padding: collapsed ? '8px 6px' : '8px 10px',
            borderRadius:8, cursor:'pointer',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
          onMouseEnter={e => e.currentTarget.style.background='var(--bg2)'}
          onMouseLeave={e => e.currentTarget.style.background='transparent'}
          onClick={() => navigate('/settings')}
          >
            <Avatar name={user?.displayName || profile?.email} photoURL={user?.photoURL} size={28} />
            {!collapsed && (
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {user?.displayName || 'User'}
                </div>
                <div style={{ fontSize:11, color:'var(--text3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {profile?.plan === 'pro' ? '⚡ Pro Plan' : '🆓 Free Plan'}
                </div>
              </div>
            )}
            {!collapsed && (
              <button onClick={e => { e.stopPropagation(); handleLogout() }} style={{
                background:'none', border:'none', color:'var(--text4)',
                cursor:'pointer', padding:4, borderRadius:5,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
        {children}
      </main>
    </div>
  )
}

// Icons
function GridIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
}
function ChatIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
}
function SettingsIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
}

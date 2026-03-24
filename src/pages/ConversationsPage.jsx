// src/pages/ConversationsPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { subscribeToConversations } from '../lib/db'
import AppShell from '../components/AppShell'
import { EmptyState, Spinner } from '../components/UI'
import { formatDistanceToNow } from 'date-fns'

export default function ConversationsPage() {
  const { user }      = useAuth()
  const navigate      = useNavigate()
  const [convs, setConvs]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    if (!user) return
    const unsub = subscribeToConversations(user.uid, data => {
      setConvs(data)
      setLoading(false)
    })
    return unsub
  }, [user])

  const filtered = convs.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.fileName?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppShell>
      <div style={{ height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Header */}
        <div style={{
          padding:'16px 28px', borderBottom:'1px solid var(--border)',
          display:'flex', alignItems:'center', gap:16, flexShrink:0,
          background:'var(--bg1)',
        }}>
          <div style={{ flex:1 }}>
            <h1 style={{ fontSize:18, fontWeight:700, marginBottom:2 }}>Conversations</h1>
            <p style={{ fontSize:12.5, color:'var(--text3)' }}>{convs.length} conversation{convs.length !== 1 ? 's' : ''}</p>
          </div>
          <div style={{ position:'relative' }}>
            <svg style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations…"
              style={{ padding:'8px 12px 8px 32px', background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', fontSize:13, outline:'none', width:220 }}
            />
          </div>
        </div>

        <div style={{ flex:1, overflow:'auto', padding:28 }}>
          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:40 }}><Spinner /></div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="💬"
              title={search ? 'No conversations found' : 'No conversations yet'}
              description={search ? 'Try a different search' : 'Upload a document and start chatting to create conversations'}
              action={!search && <button onClick={() => navigate('/dashboard')} style={{ padding:'9px 18px', background:'var(--lime)', border:'none', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer', color:'#0b0c0f' }}>Upload a document</button>}
            />
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {filtered.map(conv => (
                <button key={conv.id}
                  onClick={() => navigate(`/chat/${conv.fileId}`)}
                  style={{
                    background:'var(--bg1)', border:'1px solid var(--border)',
                    borderRadius:12, padding:'16px 18px',
                    display:'flex', alignItems:'flex-start', gap:14,
                    cursor:'pointer', transition:'all 0.15s', textAlign:'left',
                    animation:'fadeIn 0.3s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background='var(--bg2)'; e.currentTarget.style.borderColor='var(--border2)' }}
                  onMouseLeave={e => { e.currentTarget.style.background='var(--bg1)'; e.currentTarget.style.borderColor='var(--border)' }}
                >
                  <div style={{
                    width:36, height:36, borderRadius:10, flexShrink:0,
                    background:'var(--lime-dim)', border:'1px solid rgba(200,240,77,0.15)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:14, fontWeight:700, color:'var(--lime)',
                  }}>✦</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:600, marginBottom:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {conv.title || 'Untitled conversation'}
                    </div>
                    {conv.lastMessage && (
                      <div style={{ fontSize:13, color:'var(--text3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:6 }}>
                        {conv.lastMessage}
                      </div>
                    )}
                    <div style={{ fontSize:11.5, color:'var(--text4)' }}>
                      📄 {conv.fileName} · {conv.updatedAt?.toDate ? formatDistanceToNow(conv.updatedAt.toDate(), { addSuffix: true }) : ''}
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text4)" strokeWidth="2" style={{ flexShrink:0, marginTop:2 }}>
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

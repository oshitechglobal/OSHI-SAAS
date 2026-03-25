// src/pages/ChatPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAuth } from '../hooks/useAuth'
import { getFile } from '../lib/db'
import {
  createConversation, getConversation, subscribeToMessages,
  addMessage, subscribeToConversations, getMessages
} from '../lib/db'
import { askGemini } from '../lib/gemini'
import { getFileTypeInfo, formatFileSize } from '../lib/storage'
import AppShell from '../components/AppShell'
import { Avatar, Spinner, FileChip, EmptyState, Badge } from '../components/UI'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const SUGGESTIONS = [
  { icon: '📊', title: 'Summarize this document', prompt: 'Please provide a comprehensive summary of this document, including the main topics, key findings, and important conclusions.' },
  { icon: '⚠️', title: 'Find key risks or concerns', prompt: 'What are the main risks, concerns, or warnings mentioned in this document?' },
  { icon: '📅', title: 'Extract dates & deadlines', prompt: 'Extract all important dates, deadlines, and time-sensitive information from this document.' },
  { icon: '❓', title: 'What are the main action items?', prompt: 'What are the main action items, next steps, or recommendations in this document?' },
]

export default function ChatPage() {
  const { fileId } = useParams()
  const { user: authUser } = useAuth()
  const navigate   = useNavigate()

  const [file, setFile]               = useState(null)
  const [convId, setConvId]           = useState(null)
  const [messages, setMessages]       = useState([])
  const [conversations, setConvs]     = useState([])
  const [input, setInput]             = useState('')
  const [sending, setSending]         = useState(false)
  const [loadingFile, setLoadingFile] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)
  const unsubMsgsRef   = useRef(null)

  // Load file
  useEffect(() => {
    if (!fileId) return
    getFile(fileId).then(f => {
      if (!f) { toast.error('File not found'); navigate('/dashboard'); return }
      setFile(f)
      setLoadingFile(false)
    })
  }, [fileId])

  // Subscribe to conversations for this file
  useEffect(() => {
    if (!authUser || !fileId) return
    const unsub = subscribeToConversations(authUser.uid, convs => {
      const fileConvs = convs.filter(c => c.fileId === fileId)
      setConvs(fileConvs)
      // Auto-select most recent
      if (fileConvs.length > 0 && !convId) {
        loadConversation(fileConvs[0].id)
      }
    })
    return unsub
  }, [authUser, fileId])

  function loadConversation(id) {
    setConvId(id)
    if (unsubMsgsRef.current) unsubMsgsRef.current()
    unsubMsgsRef.current = subscribeToMessages(id, msgs => {
      setMessages(msgs)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    })
  }

  async function startNewConversation() {
    if (!file || !authUser) return
    const ref = await createConversation(authUser.uid, fileId, file.name)
    loadConversation(ref.id)
  }

  async function sendMessage(text) {
    const content = (text || input).trim()
    if (!content || sending) return

    // Create conversation if none
    let cid = convId
    if (!cid) {
      const ref = await createConversation(authUser.uid, fileId, file?.name || 'Untitled')
      cid = ref.id
      setConvId(cid)
      if (unsubMsgsRef.current) unsubMsgsRef.current()
      unsubMsgsRef.current = subscribeToMessages(cid, msgs => {
        setMessages(msgs)
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
    }

    setInput('')
    setSending(true)
    inputRef.current?.focus()

    try {
      // Save user message
      await addMessage(cid, 'user', content)

      // Build history for Gemini (last 10 messages)
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }))

      // Call Gemini
      const response = await askGemini(content, file?.extractedText || '', history)

      // Save assistant message
      await addMessage(cid, 'assistant', response)
    } catch (err) {
      console.error(err)
      toast.error('AI error: ' + (err.message || 'Unknown error'))
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (loadingFile) {
    return <AppShell><div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}><Spinner size={32} /></div></AppShell>
  }

  const typeInfo = file ? getFileTypeInfo(file.mimeType) : {}

  return (
    <AppShell>
      <div style={{ height:'100%', display:'grid', gridTemplateColumns:'1fr 320px', overflow:'hidden' }}>

        {/* ── MAIN CHAT COLUMN ── */}
        <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', borderRight:'1px solid var(--border)' }}>

          {/* Topbar */}
          <div style={{
            height:'var(--nav-h)', padding:'0 20px',
            borderBottom:'1px solid var(--border)',
            display:'flex', alignItems:'center', gap:14, flexShrink:0,
            background:'var(--bg1)',
          }}>
            <button onClick={() => navigate('/dashboard')} style={{
              background:'none', border:'none', color:'var(--text3)', cursor:'pointer', padding:4, borderRadius:6,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <FileChip type={file?.typeLabel || typeInfo.label} color={file?.typeColor || typeInfo.color} bg={file?.typeBg || typeInfo.bg} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{file?.name}</div>
              <div style={{ fontSize:11.5, color:'var(--text3)' }}>{formatFileSize(file?.size || 0)} · AI ready</div>
            </div>
            <button onClick={startNewConversation} style={{
              padding:'6px 14px', background:'var(--lime-dim)', border:'1px solid rgba(200,240,77,0.2)',
              borderRadius:7, color:'var(--lime)', fontSize:12.5, fontWeight:600, cursor:'pointer',
              display:'flex', alignItems:'center', gap:6, transition:'all 0.15s',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New chat
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflow:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:20 }}>
            {messages.length === 0 && !sending ? (
              <WelcomeScreen file={file} onSuggest={sendMessage} />
            ) : (
              messages.map((msg, i) => (
                <MessageBubble key={msg.id || i} message={msg} user={authUser} />
              ))
            )}

            {/* Typing indicator */}
            {sending && (
              <div style={{ display:'flex', gap:12, animation:'fadeIn 0.3s ease' }}>
                <div style={{
                  width:30, height:30, borderRadius:'50%', flexShrink:0,
                  background:'var(--lime-dim)', border:'1px solid rgba(200,240,77,0.2)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:13, fontWeight:700, color:'var(--lime)',
                }}>✦</div>
                <div style={{
                  padding:'12px 16px', background:'var(--bg1)', border:'1px solid var(--border)',
                  borderRadius:'4px 12px 12px 12px', display:'flex', gap:5, alignItems:'center',
                }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width:7, height:7, borderRadius:'50%', background:'var(--text3)',
                      animation:`bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding:'14px 20px 18px', borderTop:'1px solid var(--border)', background:'var(--bg)', flexShrink:0 }}>
            <div style={{
              background:'var(--bg1)', border:'1px solid var(--border2)',
              borderRadius:12, overflow:'hidden', transition:'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocusCapture={e => e.currentTarget.style.borderColor='rgba(200,240,77,0.4)'}
            onBlurCapture={e => e.currentTarget.style.borderColor='var(--border2)'}
            >
              <div style={{ display:'flex', alignItems:'flex-end', gap:8, padding:'10px 12px' }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => { setInput(e.target.value); e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,120)+'px' }}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask anything about ${file?.name || 'this document'}…`}
                  rows={1}
                  style={{
                    flex:1, background:'transparent', border:'none', outline:'none',
                    color:'var(--text)', fontSize:14, resize:'none',
                    maxHeight:120, minHeight:24, lineHeight:1.5,
                  }}
                />
                <button onClick={() => sendMessage()} disabled={!input.trim() || sending} style={{
                  width:34, height:34, borderRadius:8, flexShrink:0,
                  background: input.trim() ? 'var(--lime)' : 'var(--bg3)',
                  border:'none', display:'flex', alignItems:'center', justifyContent:'center',
                  cursor: input.trim() ? 'pointer' : 'not-allowed', transition:'all 0.15s',
                }}>
                  {sending
                    ? <Spinner size={14} color={input.trim() ? '#0b0c0f' : 'var(--text3)'} />
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={input.trim() ? '#0b0c0f' : 'var(--text3)'} strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  }
                </button>
              </div>
              <div style={{ padding:'6px 10px 8px', borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ fontSize:11, color:'var(--text4)', marginLeft:'auto', fontFamily:'var(--mono)' }}>
                  Enter to send · Shift+Enter for newline
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: Conversation history ── */}
        <ConversationPanel
          conversations={conversations}
          activeConvId={convId}
          onSelect={loadConversation}
          onNew={startNewConversation}
          file={file}
        />
      </div>
    </AppShell>
  )
}

// ── Welcome screen ────────────────────────────────────────
function WelcomeScreen({ file, onSuggest }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, textAlign:'center', padding:'40px 20px', gap:20 }}>
      <div style={{
        width:60, height:60, background:'var(--lime-dim)', border:'1px solid rgba(200,240,77,0.2)',
        borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center',
        animation:'pulse 3s ease-in-out infinite',
      }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--lime)" strokeWidth="1.8">
          <path d="M12 2L4 6V12C4 16.418 7.582 20.418 12 22C16.418 20.418 20 16.418 20 12V6L12 2Z"/>
          <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div>
        <h2 style={{ fontFamily:'var(--serif)', fontSize:24, marginBottom:8 }}>Ask anything about this file</h2>
        <p style={{ fontSize:14, color:'var(--text3)', maxWidth:380, lineHeight:1.65 }}>
          Orion has processed <strong style={{ color:'var(--text)' }}>{file?.name}</strong> and is ready to answer questions, summarize content, or extract key information.
        </p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, width:'100%', maxWidth:520 }}>
        {SUGGESTIONS.map(s => (
          <button key={s.title} onClick={() => onSuggest(s.prompt)} style={{
            padding:'14px 16px', background:'var(--bg1)', border:'1px solid var(--border)',
            borderRadius:12, cursor:'pointer', textAlign:'left', transition:'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background='var(--bg2)'; e.currentTarget.style.borderColor='var(--border2)'; e.currentTarget.style.transform='translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.background='var(--bg1)'; e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='none' }}
          >
            <div style={{ fontSize:18, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:3 }}>{s.title}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Message bubble ────────────────────────────────────────
function MessageBubble({ message, user }) {
  const isUser = message.role === 'user'
  const time   = message.createdAt?.toDate ? formatDistanceToNow(message.createdAt.toDate(), { addSuffix: true }) : ''
  return (
    <div style={{ display:'flex', gap:12, flexDirection: isUser ? 'row-reverse' : 'row', animation:'fadeIn 0.3s ease' }}>
      {isUser ? (
        <Avatar name={user?.displayName} photoURL={user?.photoURL} size={30} />
      ) : (
        <div style={{
          width:30, height:30, borderRadius:'50%', flexShrink:0,
          background:'var(--lime-dim)', border:'1px solid rgba(200,240,77,0.2)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:13, fontWeight:700, color:'var(--lime)',
        }}>✦</div>
      )}
      <div style={{ display:'flex', flexDirection:'column', gap:4, maxWidth:'75%', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        <div style={{
          padding:'12px 16px',
          background: isUser ? 'var(--lime-dim)' : 'var(--bg1)',
          border: `1px solid ${isUser ? 'rgba(200,240,77,0.2)' : 'var(--border)'}`,
          borderRadius: isUser ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
          fontSize:14, lineHeight:1.65,
        }}>
          {isUser ? (
            <span style={{ color:'var(--text)', whiteSpace:'pre-wrap' }}>{message.content}</span>
          ) : (
            <div className="markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
        <span style={{ fontSize:11, color:'var(--text4)' }}>{time}</span>
      </div>
    </div>
  )
}

// ── Conversation panel ────────────────────────────────────
function ConversationPanel({ conversations, activeConvId, onSelect, onNew, file }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--bg1)' }}>
      <div style={{
        height:'var(--nav-h)', padding:'0 16px',
        borderBottom:'1px solid var(--border)',
        display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0,
      }}>
        <span style={{ fontSize:12, fontWeight:600, color:'var(--text3)', letterSpacing:'0.06em', textTransform:'uppercase' }}>History</span>
        <button onClick={onNew} style={{
          background:'none', border:'1px solid var(--border2)', borderRadius:6,
          color:'var(--text3)', cursor:'pointer', padding:'4px 8px',
          fontSize:11, fontWeight:600, display:'flex', alignItems:'center', gap:4,
          transition:'all 0.15s',
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New
        </button>
      </div>
      <div style={{ flex:1, overflow:'auto', padding:10 }}>
        {conversations.length === 0 ? (
          <div style={{ padding:20, textAlign:'center', color:'var(--text4)', fontSize:13 }}>
            No conversations yet.<br/>Start chatting to create one.
          </div>
        ) : (
          conversations.map(conv => (
            <button key={conv.id} onClick={() => onSelect(conv.id)} style={{
              width:'100%', padding:'11px 12px', borderRadius:9, border:'none',
              background: conv.id === activeConvId ? 'var(--bg3)' : 'transparent',
              textAlign:'left', cursor:'pointer', transition:'all 0.15s', marginBottom:2,
            }}
            onMouseEnter={e => conv.id !== activeConvId && (e.currentTarget.style.background='var(--bg2)')}
            onMouseLeave={e => conv.id !== activeConvId && (e.currentTarget.style.background='transparent')}
            >
              <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {conv.title || `Chat ${conv.id.slice(0,6)}`}
              </div>
              {conv.lastMessage && (
                <div style={{ fontSize:12, color:'var(--text3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {conv.lastMessage}
                </div>
              )}
              <div style={{ fontSize:11, color:'var(--text4)', marginTop:4 }}>
                {conv.updatedAt?.toDate ? formatDistanceToNow(conv.updatedAt.toDate(), { addSuffix: true }) : ''}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

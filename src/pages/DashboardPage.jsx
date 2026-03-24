// src/pages/DashboardPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { useAuth } from '../hooks/useAuth'
import { subscribeToFiles, createFile, deleteFile } from '../lib/db'
import { uploadFile, deleteStorageFile, getFileTypeInfo, formatFileSize, extractTextFromFile } from '../lib/storage'
import { summarizeDocument } from '../lib/gemini'
import AppShell from '../components/AppShell'
import { Button, Modal, EmptyState, FileChip, Badge, Spinner } from '../components/UI'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [files, setFiles]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)
  const [search, setSearch]     = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeToFiles(user.uid, data => {
      setFiles(data)
      setLoading(false)
    })
    return unsub
  }, [user])

  const onDrop = useCallback(async (accepted) => {
    if (!accepted.length) return
    const file = accepted[0]

    // Validate
    const MAX_SIZE = 25 * 1024 * 1024 // 25MB
    if (file.size > MAX_SIZE) { toast.error('File must be under 25MB'); return }

    setUploading(true)
    setUploadPct(0)
    try {
      const { url, path } = await uploadFile(user.uid, file, pct => setUploadPct(pct))
      const typeInfo = getFileTypeInfo(file.type)
      const text = await extractTextFromFile(file)

      const docRef = await createFile(user.uid, {
        name:       file.name,
        size:       file.size,
        mimeType:   file.type,
        storageUrl: url,
        storagePath: path,
        typeLabel:  typeInfo.label,
        typeColor:  typeInfo.color,
        typeBg:     typeInfo.bg,
        extractedText: text,
        pageCount:  null,
        status:     'ready',
      })

      toast.success(`${file.name} uploaded!`)
      // Navigate straight to chat
      navigate(`/chat/${docRef.id}`)
    } catch (err) {
      console.error(err)
      toast.error('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
      setUploadPct(0)
    }
  }, [user, navigate])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
    }
  })

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteStorageFile(deleteTarget.storagePath)
      await deleteFile(deleteTarget.id)
      toast.success('File deleted')
      setDeleteTarget(null)
    } catch (err) {
      toast.error('Delete failed')
    }
  }

  const filtered = files.filter(f => f.name?.toLowerCase().includes(search.toLowerCase()))

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
            <h1 style={{ fontSize:18, fontWeight:700, marginBottom:2 }}>File Library</h1>
            <p style={{ fontSize:12.5, color:'var(--text3)' }}>{files.length} file{files.length !== 1 ? 's' : ''}</p>
          </div>
          <div style={{ position:'relative' }}>
            <svg style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search files…"
              style={{
                padding:'8px 12px 8px 32px', background:'var(--bg2)',
                border:'1px solid var(--border2)', borderRadius:8,
                color:'var(--text)', fontSize:13, outline:'none', width:200,
              }}
            />
          </div>
        </div>

        <div style={{ flex:1, overflow:'auto', padding:28, display:'flex', flexDirection:'column', gap:24 }}>
          {/* Upload zone */}
          <div {...getRootProps()} style={{
            border: `2px dashed ${isDragActive ? 'var(--lime)' : 'var(--border2)'}`,
            borderRadius: 16, padding:'36px 24px',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            gap:12, textAlign:'center', cursor:'pointer',
            background: isDragActive ? 'var(--lime-dim)' : 'var(--bg1)',
            transition:'all 0.2s',
          }}>
            <input {...getInputProps()} />
            {uploading ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
                <Spinner size={28} />
                <div style={{ fontSize:14, fontWeight:600 }}>Uploading… {uploadPct}%</div>
                <div style={{ width:200, height:4, background:'var(--bg3)', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ width:`${uploadPct}%`, height:'100%', background:'var(--lime)', transition:'width 0.3s', borderRadius:4 }}/>
                </div>
              </div>
            ) : (
              <>
                <div style={{
                  width:52, height:52, borderRadius:14,
                  background: isDragActive ? 'rgba(200,240,77,0.2)' : 'var(--bg2)',
                  border:`1px solid ${isDragActive ? 'rgba(200,240,77,0.4)' : 'var(--border2)'}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isDragActive ? 'var(--lime)' : 'var(--text3)'} strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize:15, fontWeight:600, marginBottom:4 }}>
                    {isDragActive ? 'Drop to upload' : 'Upload a document'}
                  </div>
                  <div style={{ fontSize:13, color:'var(--text3)' }}>
                    Drag & drop or <span style={{ color:'var(--lime)', fontWeight:600 }}>browse files</span> · PDF, DOCX, XLSX, TXT, CSV · Max 25MB
                  </div>
                </div>
              </>
            )}
          </div>

          {/* File grid */}
          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:40 }}><Spinner /></div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="📄"
              title={search ? 'No files match your search' : 'No files yet'}
              description={search ? 'Try a different search term' : 'Upload your first document to get started with AI-powered analysis'}
              action={!search && <label htmlFor="hidden-upload" style={{ cursor:'pointer' }}><Button variant="primary">Upload your first file</Button></label>}
            />
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14 }}>
              {filtered.map(file => (
                <FileCard key={file.id} file={file}
                  onClick={() => navigate(`/chat/${file.id}`)}
                  onDelete={() => setDeleteTarget(file)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete file" width={420}>
        <p style={{ color:'var(--text3)', marginBottom:24, fontSize:14, lineHeight:1.6 }}>
          Are you sure you want to delete <strong style={{ color:'var(--text)' }}>{deleteTarget?.name}</strong>? This will also delete all conversations associated with this file. This action cannot be undone.
        </p>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete file</Button>
        </div>
      </Modal>
    </AppShell>
  )
}

function FileCard({ file, onClick, onDelete }) {
  const typeInfo = getFileTypeInfo(file.mimeType)
  const timeAgo  = file.createdAt?.toDate ? formatDistanceToNow(file.createdAt.toDate(), { addSuffix: true }) : ''

  return (
    <div onClick={onClick} style={{
      background:'var(--bg1)', border:'1px solid var(--border)',
      borderRadius:14, padding:'18px 18px 16px',
      cursor:'pointer', transition:'all 0.2s',
      display:'flex', flexDirection:'column', gap:14,
      animation:'fadeIn 0.3s ease',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor='var(--border3)'; e.currentTarget.style.background='var(--bg2)'; e.currentTarget.style.transform='translateY(-2px)' }}
    onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--bg1)'; e.currentTarget.style.transform='none' }}
    >
      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
        <FileChip type={file.typeLabel || typeInfo.label} color={file.typeColor || typeInfo.color} bg={file.typeBg || typeInfo.bg} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{file.name}</div>
          <div style={{ fontSize:12, color:'var(--text3)' }}>{formatFileSize(file.size)}{file.pageCount ? ` · ${file.pageCount} pages` : ''}</div>
        </div>
        <button onClick={e => { e.stopPropagation(); onDelete() }} style={{
          background:'none', border:'none', color:'var(--text4)', cursor:'pointer',
          padding:4, borderRadius:5, opacity:0, transition:'opacity 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity=1; e.currentTarget.style.color='var(--red)' }}
        onMouseLeave={e => { e.currentTarget.style.opacity=0; e.currentTarget.style.color='var(--text4)' }}
        id="del-btn"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:11.5, color:'var(--text4)' }}>{timeAgo}</span>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--lime)', fontWeight:600 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Chat
        </div>
      </div>
    </div>
  )
}

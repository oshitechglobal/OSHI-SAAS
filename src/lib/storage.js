import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './firebase'

export function uploadFile(uid, file, onProgress) {
  return new Promise((resolve, reject) => {
    const path = `users/${uid}/files/${Date.now()}_${file.name}`
    const storageRef = ref(storage, path)
    const uploadTask = uploadBytesResumable(storageRef, file)
    uploadTask.on('state_changed',
      snapshot => { onProgress?.(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)) },
      error => reject(error),
      async () => { const url = await getDownloadURL(uploadTask.snapshot.ref); resolve({ url, path }) }
    )
  })
}
export async function deleteStorageFile(path) { return deleteObject(ref(storage, path)) }

export const FILE_TYPES = {
  'application/pdf': { label: 'PDF', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { label: 'DOCX', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  'application/msword': { label: 'DOC', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { label: 'XLSX', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  'application/vnd.ms-excel': { label: 'XLS', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { label: 'PPTX', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  'text/plain': { label: 'TXT', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  'text/csv': { label: 'CSV', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
}
export function getFileTypeInfo(mimeType) {
  return FILE_TYPES[mimeType] || { label: 'FILE', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' }
}
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
export async function extractTextFromFile(file) {
  return new Promise((resolve) => {
    if (file.type === 'text/plain' || file.type === 'text/csv') {
      const reader = new FileReader()
      reader.onload = e => resolve(e.target.result?.slice(0, 50000) || '')
      reader.onerror = () => resolve('')
      reader.readAsText(file)
    } else {
      resolve(`[File: ${file.name} — ${(file.size / 1024).toFixed(0)} KB. For full PDF/DOCX text extraction, integrate the Gemini Files API.]`)
    }
  })
}

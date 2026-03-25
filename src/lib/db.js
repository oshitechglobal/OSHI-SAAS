import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy, serverTimestamp,
  onSnapshot, limit
} from 'firebase/firestore'
import { db } from './firebase'

export async function createFile(uid, fileData) {
  return addDoc(collection(db, 'files'), { uid, ...fileData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
}
export async function getFile(fileId) {
  const snap = await getDoc(doc(db, 'files', fileId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}
export async function deleteFile(fileId) { return deleteDoc(doc(db, 'files', fileId)) }
export function subscribeToFiles(uid, callback) {
  const q = query(collection(db, 'files'), where('uid', '==', uid), orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap => { callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))) })
}
export async function createConversation(uid, fileId, fileName) {
  return addDoc(collection(db, 'conversations'), {
    uid, fileId, fileName, title: `Chat with ${fileName}`,
    messageCount: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  })
}
export async function getConversation(convId) {
  const snap = await getDoc(doc(db, 'conversations', convId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}
export async function updateConversation(convId, data) {
  return updateDoc(doc(db, 'conversations', convId), { ...data, updatedAt: serverTimestamp() })
}
export function subscribeToConversations(uid, callback) {
  const q = query(collection(db, 'conversations'), where('uid', '==', uid), orderBy('updatedAt', 'desc'), limit(50))
  return onSnapshot(q, snap => { callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))) })
}
export async function addMessage(convId, role, content) {
  await addDoc(collection(db, 'conversations', convId, 'messages'), { role, content, createdAt: serverTimestamp() })
  await updateConversation(convId, { lastMessage: content.slice(0, 120) })
}
export function subscribeToMessages(convId, callback) {
  const q = query(collection(db, 'conversations', convId, 'messages'), orderBy('createdAt', 'asc'))
  return onSnapshot(q, snap => { callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))) })
}
export async function getMessages(convId) {
  const q = query(collection(db, 'conversations', convId, 'messages'), orderBy('createdAt', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

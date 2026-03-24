// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Spinner } from './UI'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        height:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
        background:'var(--bg)', flexDirection:'column', gap:16,
      }}>
        <div style={{
          width:48, height:48, background:'var(--lime)', borderRadius:12,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
            <path d="M4 3h8l4 4v10H4V3z" fill="#0b0c0f"/>
          </svg>
        </div>
        <Spinner size={20} />
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />

  return children
}

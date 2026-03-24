import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import ChatPage from './pages/ChatPage'
import ConversationsPage from './pages/ConversationsPage'
import SettingsPage from './pages/SettingsPage'
import './styles/globals.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><ConversationsPage /></ProtectedRoute>} />
          <Route path="/chat/:fileId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg2)',
            color: 'var(--text)',
            border: '1px solid var(--border2)',
            borderRadius: '10px',
            fontSize: '13.5px',
            fontFamily: 'var(--sans)',
          },
          success: { iconTheme: { primary: 'var(--lime)', secondary: '#0b0c0f' } },
          error:   { iconTheme: { primary: 'var(--red)',  secondary: '#0b0c0f' } },
        }}
      />
    </AuthProvider>
  )
}

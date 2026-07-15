import React, { useState, useEffect } from 'react'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [role, setRole] = useState('user') // 🔐 Track role centrally inside top-level state

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedRole = localStorage.getItem('role') || 'user'
    if (token) {
      setIsAuthenticated(true)
      setRole(savedRole)
    }
  }, [])

  const handleLoginSuccess = () => {
    // Sync state cleanly with recent localstorage updates post-login
    const savedRole = localStorage.getItem('role') || 'user'
    setRole(savedRole)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.clear() // Wipes token, userEmail, and role cache synchronously 🚪
    setRole('user')
    setIsAuthenticated(false)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white font-sans antialiased">
      {isAuthenticated ? (
        <Dashboard 
          userRole={role} // Optional explicit injection hook
          onLogout={handleLogout} 
        />
      ) : (
        <Auth onLoginSuccess={handleLoginSuccess} />
      )}
    </main>
  )
}

export default App
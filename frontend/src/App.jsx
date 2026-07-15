import React, { useState, useEffect } from 'react'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [role, setRole] = useState('user') 

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedRole = localStorage.getItem('role') || 'user'
    if (token) {
      setIsAuthenticated(true)
      setRole(savedRole)
    }
  }, [])

  const handleLoginSuccess = () => {
    
    const savedRole = localStorage.getItem('role') || 'user'
    setRole(savedRole)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.clear() 
    setRole('user')
    setIsAuthenticated(false)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white font-sans antialiased">
      {isAuthenticated ? (
        <Dashboard 
          userRole={role} 
          onLogout={handleLogout} 
        />
      ) : (
        <Auth onLoginSuccess={handleLoginSuccess} />
      )}
    </main>
  )
}

export default App

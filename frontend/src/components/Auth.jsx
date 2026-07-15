import React, { useState } from 'react'
import axios from 'axios'

function Auth({ onLoginSuccess }) { 
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('') 
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', isError: false }) 

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: '', isError: false })

    const endpoint = isLogin 
      ? 'http://localhost:8000/api/auth/login' 
      : 'http://localhost:8000/api/auth/signup'

    
    const payload = isLogin 
      ? { email, password }
      : { email, password, username: username || email.split('@')[0] } 
    try {
      const response = await axios.post(endpoint, payload)

      setMessage({ 
        text: isLogin ? 'Successfully Signed In! 🚗' : 'Account Created Successfully! ✨ Please Sign In.', 
        isError: false 
      })
      
      console.log('API Response Success:', response.data)
      
      if (isLogin) {
        const token = response.data.access_token || response.data.token
        if (token) {
          localStorage.setItem('token', token)
          localStorage.setItem('userEmail', email) 
          
        
          const customUsername = response.data.username || email.split('@')[0]
          localStorage.setItem('userName', customUsername)
          
          if (response.data.role) {
            localStorage.setItem('role', response.data.role)
          } else {
            localStorage.setItem('role', 'user') 
          }
          
          setTimeout(() => {
            onLoginSuccess()
          }, 1000)
        }
      } else {
       
        setTimeout(() => {
          setIsLogin(true)
          setUsername('')
          setPassword('')
          setMessage({ text: '', isError: false })
        }, 1500)
      }

    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || 'Something went wrong. Please try again.'
      setMessage({ text: errorMsg, isError: true })
      console.error('API Error Response:', error.response?.data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-purple-500 selection:text-white relative overflow-hidden">
      

      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-purple-950/40 border border-purple-800/40 backdrop-blur-md rounded-2xl p-8 shadow-2xl z-10">
        
       
        <div className="flex flex-col items-center justify-center mb-6 select-none">
          <h1 
            className="text-3xl text-center bg-gradient-to-r from-purple-400 via-purple-200 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(168,85,247,0.4)] mb-1.5 tracking-wider uppercase"
            style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800 }}
          >
            SMARTGAADI
          </h1>
          
          <h2 
            className="text-xs text-center text-purple-200/90 tracking-wide" 
            style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400 }} 
          >
            Stop Circling. Start Parking📍
          </h2>
        </div>

       
        {message.text && (
          <div className={`mb-5 p-3 rounded-xl text-xs font-medium text-center border backdrop-blur-sm transition-all ${
            message.isError 
              ? 'bg-red-500/10 border-red-500/30 text-red-400' 
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          
          {!isLogin && (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-purple-200 mb-2">Display Username</label>
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your Name (e.g. Bhoomika)"
                className="w-full px-4 py-3 bg-purple-950/60 border border-purple-800/50 rounded-xl text-white placeholder-purple-400/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>
          )}

         
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-3 bg-purple-950/60 border border-purple-800/50 rounded-xl text-white placeholder-purple-400/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              disabled={loading}
            />
          </div>

         
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-purple-950/60 border border-purple-800/50 rounded-xl text-white placeholder-purple-400/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              disabled={loading}
            />
          </div>

          
          <button 
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-900/40 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : isLogin ? 'Sign In' : 'Register Account'}
          </button>
        </form>

        
        <div className="mt-6 text-center">
          <button 
            onClick={() => {
              setIsLogin(!isLogin)
              setMessage({ text: '', isError: false })
            }}
            disabled={loading}
            className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors underline decoration-purple-600 underline-offset-4 disabled:opacity-50"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default Auth

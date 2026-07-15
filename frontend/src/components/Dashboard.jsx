import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Line, Bar, Pie } from 'react-chartjs-2'


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

axios.defaults.baseURL = 'http://localhost:8000';

function Dashboard({ onLogout }) {
 
  const userName = localStorage.getItem('userName') || 'Agent'
  const [slots, setSlots] = useState([])
  const [occupancy, setOccupancy] = useState(0)
  const [walletBalance, setWalletBalance] = useState(0.0) 
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(null)
  const [message, setMessage] = useState('')
  
  const userEmail = localStorage.getItem('userEmail') || 'user@example.com'
  const userRole = localStorage.getItem('role') || 'user'

  const [analyticsData, setAnalyticsData] = useState(null)

  const fetchWalletBalance = async () => {
    if (userRole === 'admin') return; 
    try {
      const response = await axios.get(`/api/user/wallet/${userEmail}`)
      setWalletBalance(response.data.wallet_balance)
    } catch (error) {
      console.error("Error connecting with financial api gateway:", error)
    }
  }

  const fetchAnalytics = async () => {
    if (userRole !== 'admin') return;
    try {
      const response = await axios.get('/api/admin/analytics')
      setAnalyticsData(response.data)
    } catch (error) {
      console.error("Error pooling administrative analytics parameters:", error)
    }
  }

  const fetchSlots = async () => {
    try {
      const response = await axios.get('/api/slots')
      setSlots(response.data.slots)
      setOccupancy(response.data.occupancy_percentage)
    } catch (error) {
      console.error("Error fetching slots:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSlots()
    fetchWalletBalance()
    fetchAnalytics()
    
    const interval = setInterval(() => {
      fetchSlots()
      fetchWalletBalance()
      fetchAnalytics()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleBookSlot = async (slotId) => {
    setBookingLoading(slotId)
    setMessage('')
    try {
      const payload = { userEmail: userEmail }
      const response = await axios.post(`/api/slots/book/${slotId}`, payload)
      
      setMessage(`${response.data.message || 'Slot Booked!'}`)
      fetchWalletBalance()
      fetchSlots()
      fetchAnalytics()
      setTimeout(() => {
        setMessage('')
      }, 3000)

    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Booking failed!'
      setMessage(`${errorMsg}`)
      setTimeout(() => {
        setMessage('')
      }, 4000)
    } finally {
      setBookingLoading(null)
    }
  }

  const handleCheckoutSlot = async (slotId) => {
    setBookingLoading(slotId)
    setMessage('')
    try {
      const response = await axios.post(`/api/slots/checkout/${slotId}`)
      setMessage(`${response.data.message || 'Slot Released Successfully!'}`)
      fetchSlots()
      fetchWalletBalance()
      fetchAnalytics()

      setTimeout(() => {
        setMessage('')
      }, 3000)

    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Checkout failed!'
      setMessage(`${errorMsg}`)

      setTimeout(() => {
        setMessage('')
      }, 4000)
    } finally {
      setBookingLoading(null)
    }
  }

  if (loading) return <div className="text-purple-400 font-mono text-center p-20 animate-pulse">SMART PARKING STARTS HERE</div>;

  return (
    <div className="min-h-screen bg-slate-950 p-6 relative flex flex-col items-center selection:bg-purple-500 selection:text-white">
      
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center border-b border-purple-900/40 pb-5 mb-6 z-10 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-wider bg-gradient-to-r from-purple-400 via-purple-200 to-indigo-400 bg-clip-text text-transparent uppercase" style={{ fontFamily: "'Syne', sans-serif" }}>
            SMARTGAADI {userRole === 'admin' && <span className="text-sm font-mono text-purple-400 ml-2 bg-purple-950/60 border border-purple-800/40 px-2.5 py-0.5 rounded-full tracking-widest font-black uppercase">ADMIN CONSOLE</span>}
          </h1>
          
          <div className="flex items-center gap-2.5 mt-2 bg-gradient-to-r from-purple-950/30 to-slate-900/40 border border-purple-900/40 px-3.5 py-1.5 rounded-xl w-fit shadow-md backdrop-blur-sm">
            <div className="w-5 h-5 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-mono text-[10px] font-black text-purple-400 uppercase">
              {userName.charAt(0)}
            </div>
            <p className="text-xs text-purple-200/80 font-medium">
              Welcome back, <span className="text-white font-bold tracking-wide">{userName}</span> 
            </p>
          </div>
        </div>
        
       
        <div className="flex flex-col sm:flex-row gap-4 items-center z-10">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            {userRole !== 'admin' && (
              <div className="bg-emerald-950/30 border border-emerald-500/30 px-4 py-2 rounded-xl flex items-center gap-3 backdrop-blur-sm shadow-md min-w-[170px] justify-between">
                <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-black">WALLET BALANCE</span>
                <span className="text-sm font-mono text-emerald-300 font-bold">₹{walletBalance.toFixed(2)}</span>
              </div>
            )}

            <div className="bg-purple-950/40 border border-purple-900/50 px-4 py-2 rounded-xl text-center min-w-[200px] backdrop-blur-sm shadow-inner">
              <div className="flex justify-between items-center text-[10px] font-mono tracking-widest text-purple-400 font-bold mb-1">
                <span>LIVE CORE OCCUPANCY</span>
                <span>{occupancy.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-purple-950">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-indigo-400 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${occupancy}%` }}
                ></div>
              </div>
            </div>
          </div>

          <button onClick={onLogout} className="px-5 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold rounded-xl hover:bg-red-500/20 transition-all font-mono whitespace-nowrap self-stretch sm:self-auto">
            Exit
          </button>
        </div>
      </div>

      
      <div className="w-full max-w-5xl z-10">
        {message && (
          <div className="mb-6 p-4 rounded-xl bg-purple-950/50 border border-purple-800/40 backdrop-blur-md text-sm font-medium text-center text-purple-200 shadow-xl animate-fade-in">
            {message}
          </div>
        )}

        
        {userRole === 'admin' && analyticsData && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            
            <div className="bg-slate-900/40 border border-purple-900/30 backdrop-blur-md rounded-2xl p-4 shadow-xl">
              <h3 className="text-xs font-mono font-bold text-purple-300 tracking-wider mb-3 uppercase">Hourly Revenue Streams</h3>
              <Line 
                data={{
                  labels: analyticsData.hourly_revenue.map(h => h.hour),
                  datasets: [{
                    label: 'Revenue (₹)',
                    data: analyticsData.hourly_revenue.map(h => h.revenue),
                    borderColor: 'rgb(168, 85, 247)',
                    backgroundColor: 'rgba(168, 85, 247, 0.2)',
                    tension: 0.4
                  }]
                }}
                options={{ responsive: true, plugins: { legend: { display: false } } }}
              />
            </div>

           
            <div className="bg-slate-900/40 border border-purple-900/30 backdrop-blur-md rounded-2xl p-4 shadow-xl">
              <h3 className="text-xs font-mono font-bold text-purple-300 tracking-wider mb-3 uppercase">Weekly Occupancy Scaling</h3>
              <Bar 
                data={{
                  labels: analyticsData.weekly_occupancy.map(w => w.day),
                  datasets: [{
                    label: 'Occupancy %',
                    data: analyticsData.weekly_occupancy.map(w => w.occupancy),
                    backgroundColor: 'rgba(56, 189, 248, 0.6)',
                    borderColor: 'rgb(56, 189, 248)',
                    borderWidth: 1
                  }]
                }}
                options={{ responsive: true, plugins: { legend: { display: false } } }}
              />
            </div>

            
            <div className="bg-slate-900/40 border border-purple-900/30 backdrop-blur-md rounded-2xl p-4 shadow-xl flex flex-col justify-between">
              <h3 className="text-xs font-mono font-bold text-purple-300 tracking-wider mb-1 uppercase">EV vs Standard Breakdown</h3>
              <div className="max-w-[170px] mx-auto py-2">
                <Pie 
                  data={{
                    labels: analyticsData.ev_distribution.labels,
                    datasets: [{
                      data: analyticsData.ev_distribution.data,
                      backgroundColor: ['rgba(34, 211, 238, 0.6)', 'rgba(16, 185, 129, 0.4)'],
                      borderColor: ['rgb(34, 211, 238)', 'rgb(16, 185, 129)'],
                      borderWidth: 1
                    }]
                  }}
                  options={{ responsive: true, plugins: { legend: { display: false } } }}
                />
              </div>
            </div>
          </div>
        )}

        
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex flex-wrap gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Empty Space</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-cyan-400"></span> EV Charging Zone</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span> Car Parked</span>
          </div>
        </div>

       
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {slots.map((slot) => {
            const isEvSlot = slot.is_ev;
            const displayPrice = slot.current_price;
            
            return (
              <div 
                key={slot.slot_id}
                className={`relative p-3.5 h-44 rounded-xl border backdrop-blur-sm flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1 ${
                  slot.is_occupied 
                    ? 'bg-gradient-to-b from-red-950/10 to-slate-900/60 border-red-900/40 shadow-md shadow-red-950/10' 
                    : isEvSlot
                      ? 'bg-gradient-to-b from-cyan-950/20 to-slate-900/40 border-cyan-500/30 hover:border-cyan-400 shadow-md shadow-cyan-950/10'
                      : 'bg-gradient-to-b from-emerald-950/10 to-slate-900/40 border-dashed border-emerald-800/40 hover:border-emerald-500/60 shadow-sm'
                }`}
              >
                
                <div className="flex justify-between items-center">
                  <span className={`text-[11px] tracking-widest font-black ${isEvSlot ? 'text-cyan-400' : 'text-purple-400'}`} style={{ fontFamily: "'Syne', sans-serif" }}>
                    {slot.slot_id}
                  </span>
                  <div className="flex gap-1.5 items-center">
                    {isEvSlot && (
                      <span className="px-1 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[7px] font-black text-cyan-400 tracking-wider">
                        EV
                      </span>
                    )}
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase ${
                      slot.is_occupied ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {slot.is_occupied ? 'Full' : 'Free'}
                    </span>
                  </div>
                </div>

                
                <div className="flex flex-col items-center justify-center my-1 h-12 relative">
                  {slot.is_occupied ? (
                    <div className="flex flex-col items-center animate-fade-in">
                      <svg className={`w-9 h-9 ${isEvSlot ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]' : 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1s.67-1 1.5-1 1.5.67 1.5 1-.67 1-1.5 1zm11 0c-.83 0-1.5-.67-1.5-1s.67-1 1.5-1 1.5.67 1.5 1-.67 1-1.5 1zM5 11l1.5-4.5h11L19 11H5z"/>
                      </svg>
                      <span className={`text-[8px] font-bold tracking-widest uppercase mt-0.5 ${isEvSlot ? 'text-cyan-400/60' : 'text-red-400/40'}`}>
                        {isEvSlot ? 'EV' : 'LOCKED'}
                      </span>
                    </div>
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border border-dashed ${isEvSlot ? 'border-cyan-500/20' : 'border-emerald-500/20'}`}>
                      <span className={`text-sm font-black ${isEvSlot ? 'text-cyan-500/30' : 'text-emerald-500/30'}`}>
                        {isEvSlot ? '' : 'P'}
                      </span>
                    </div>
                  )}
                </div>

                
                <div className="mt-1">
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-sm font-bold text-white">₹{displayPrice}<span className="text-[10px] text-purple-400/50 font-normal">/h</span></p>
                  </div>

                  {slot.is_occupied ? (
                    <button
                      onClick={() => handleCheckoutSlot(slot.slot_id)}
                      disabled={bookingLoading !== null}
                      className="w-full py-1.5 px-2 text-[10px] font-bold font-mono tracking-wider rounded-lg bg-red-950/60 text-red-400 border border-red-900/50 hover:bg-red-900 hover:text-white transition-all uppercase"
                    >
                      {bookingLoading === slot.slot_id ? 'Wait...' : 'Free Spot 🍃'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBookSlot(slot.slot_id)}
                      disabled={bookingLoading !== null || userRole === 'admin'}
                      className={`w-full py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all ${
                        userRole === 'admin' 
                          ? 'bg-slate-900 text-purple-400/30 border border-slate-800 cursor-not-allowed'
                          : bookingLoading === slot.slot_id
                            ? 'bg-purple-600 animate-pulse text-white'
                            : isEvSlot
                              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white active:scale-[0.97]'
                              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white active:scale-[0.97]'
                      }`}
                    >
                      {userRole === 'admin' ? 'ADMIN EYE' : bookingLoading === slot.slot_id ? 'Wait...' : isEvSlot ? 'Book EV ⚡' : 'Book 🚗'}
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}

export default Dashboard

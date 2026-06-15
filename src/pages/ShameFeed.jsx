import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchDeadlines } from '../api/deadlineApi'

const BASE_URL = 'http://localhost:5001/api'

const EVENT_STYLES = {
  submitted: { bg: 'bg-green-950', border: 'border-green-800', text: 'text-green-400' },
  late: { bg: 'bg-red-950', border: 'border-red-800', text: 'text-red-400' },
  streak_died: { bg: 'bg-gray-900', border: 'border-gray-700', text: 'text-gray-400' },
  boss_win: { bg: 'bg-yellow-950', border: 'border-yellow-800', text: 'text-yellow-400' },
  boss_lose: { bg: 'bg-red-950', border: 'border-red-800', text: 'text-red-400' },
  wager_won: { bg: 'bg-purple-950', border: 'border-purple-800', text: 'text-purple-400' },
  wager_lost: { bg: 'bg-orange-950', border: 'border-orange-800', text: 'text-orange-400' },
  fake_scare: { bg: 'bg-orange-950', border: 'border-orange-800', text: 'text-orange-400' },
}

export default function ShameFeed() {
  const { user } = useUser()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [wagers, setWagers] = useState([])
  const [deadlines, setDeadlines] = useState([])
  const [selectedDeadline, setSelectedDeadline] = useState(null)
  const [betAmount, setBetAmount] = useState(50)
  const [placing, setPlacing] = useState(false)
  const [myStats, setMyStats] = useState(null)

  useEffect(() => {
    if (user) {
      Promise.all([
        fetch(`${BASE_URL}/shamefeed`).then(r => r.json()),
        fetch(`${BASE_URL}/wager/${user.id}`).then(r => r.json()),
        fetchDeadlines(user.id),
        fetch(`${BASE_URL}/user/${user.id}`).then(r => r.json())
      ]).then(([feed, wagerData, deadlineData, stats]) => {
        setEvents(Array.isArray(feed) ? feed : [])
        setWagers(Array.isArray(wagerData) ? wagerData : [])
        setDeadlines(Array.isArray(deadlineData)
          ? deadlineData.filter(d => new Date(d.dueDate) > Date.now())
          : [])
        setMyStats(stats)
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [user])

  // Auto refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${BASE_URL}/shamefeed`)
        .then(r => r.json())
        .then(data => setEvents(Array.isArray(data) ? data : []))
        .catch(() => {})
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const placeWager = async () => {
    if (!selectedDeadline || betAmount <= 0) return
    setPlacing(true)
    try {
      const res = await fetch(`${BASE_URL}/wager`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          deadlineId: selectedDeadline._id,
          deadlineTitle: selectedDeadline.title,
          betAmount
        })
      })
      const data = await res.json()
      if (data.success) {
        setWagers(prev => [data.wager, ...prev])
        alert(`🎰 Bet placed! ${betAmount} XP on "${selectedDeadline.title}"`)
      } else {
        alert(data.error)
      }
    } catch {
      alert('Error da!')
    }
    setPlacing(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <motion.div
        className="text-red-500 text-4xl font-black"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 1 }}
      >
        📢 Loading Feed...
      </motion.div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white p-8">

      <div className="mb-8">
        <h1 className="text-3xl font-black">📢 Shame Feed & Wagers</h1>
        <p className="text-gray-500 mt-1">Everyone's business is public here 😂</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Live Feed */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-white font-bold text-lg">📡 Live Feed</h2>
            <motion.div
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-2 h-2 bg-red-500 rounded-full"
            />
            <span className="text-red-400 text-xs">LIVE</span>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12 bg-gray-900 border border-gray-800 rounded-2xl">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-gray-500">No events yet da!</p>
              <p className="text-gray-600 text-sm mt-1">Submit deadlines to see activity 😄</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {events.map((event, i) => {
                  const style = EVENT_STYLES[event.type] || EVENT_STYLES.submitted
                  return (
                    <motion.div
                      key={event._id || i}
                      initial={{ opacity: 0, x: -20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      className={`${style.bg} border ${style.border} rounded-xl p-4 flex items-start gap-3`}
                    >
                      <span className="text-2xl flex-shrink-0">{event.emoji}</span>
                      <div className="flex-1">
                        <p className="text-white text-sm">{event.message}</p>
                        <p className="text-gray-600 text-xs mt-1">
                          {new Date(event.createdAt).toLocaleString('en-IN', {
                            day: 'numeric', month: 'short',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right Panel - Wager */}
        <div className="space-y-6">

          {/* Place Wager */}
          <div className="bg-gray-900 border border-purple-800 rounded-2xl p-5">
            <h3 className="text-white font-black text-lg mb-1">🎰 Place a Wager</h3>
            <p className="text-gray-500 text-xs mb-4">Bet XP on finishing a deadline! Win = 2x, Lose = Clown badge 🤡</p>

            {deadlines.length === 0 ? (
              <p className="text-gray-500 text-sm">No active deadlines to bet on da!</p>
            ) : (
              <>
                <div className="mb-3">
                  <label className="text-gray-400 text-xs mb-1 block">Select Deadline</label>
                  <select
                    onChange={e => {
                      const d = deadlines.find(d => d._id === e.target.value)
                      setSelectedDeadline(d || null)
                    }}
                    className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">Choose deadline...</option>
                    {deadlines.map(d => (
                      <option key={d._id} value={d._id}>{d.title}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="text-gray-400 text-xs mb-1 block">
                    Bet Amount - {betAmount} XP
                    <span className="text-gray-600 ml-2">(You have {myStats?.xp || 0} XP)</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max={Math.min(myStats?.xp || 0, 500)}
                    value={betAmount}
                    onChange={e => setBetAmount(parseInt(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>10 XP</span>
                    <span>Win: +{betAmount * 2} XP</span>
                    <span>Lose: -{betAmount * 2} XP 🤡</span>
                  </div>
                </div>

                <button
                  onClick={placeWager}
                  disabled={!selectedDeadline || placing || (myStats?.xp || 0) < betAmount}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all"
                >
                  {placing ? '🎰 Placing...' : `🎰 Bet ${betAmount} XP`}
                </button>
              </>
            )}
          </div>

          {/* My Wagers */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-white font-bold text-lg mb-4">🎲 My Wagers</h3>
            {wagers.length === 0 ? (
              <p className="text-gray-500 text-sm">No wagers yet da! Place one 🎰</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {wagers.map((w, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-3 border ${
                      w.status === 'won' ? 'bg-green-950 border-green-800' :
                      w.status === 'lost' ? 'bg-red-950 border-red-800' :
                      'bg-gray-800 border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-white text-sm font-bold truncate">{w.deadlineTitle}</p>
                      <span className={`text-xs font-bold ml-2 ${
                        w.status === 'won' ? 'text-green-400' :
                        w.status === 'lost' ? 'text-red-400' :
                        'text-yellow-400'
                      }`}>
                        {w.status === 'won' ? `+${w.betAmount * 2} XP 🎉` :
                         w.status === 'lost' ? `🤡 Lost` :
                         `${w.betAmount} XP pending`}
                      </span>
                    </div>
                    {w.clownBadge && (
                      <p className="text-orange-400 text-xs mt-1">🤡 Clown badge earned!</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

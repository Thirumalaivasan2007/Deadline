import { useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchDeadlines } from '../api/deadlineApi'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function formatCountdown(dueDate) {
  const diff = new Date(dueDate) - Date.now()
  if (diff <= 0) return '💀 EXPIRED'
  const h = Math.floor(diff / (1000 * 60 * 60))
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const s = Math.floor((diff % (1000 * 60)) / 1000)
  return `${h}h ${m}m ${s}s`
}

const FOCUS_QUOTES = [
  "Focus da, deadline wait pannala 💀",
  "Sid Sriram podu, code podu 🎵",
  "One task at a time da",
  "You can do this. Maybe. 😂",
  "No phone. No Netflix. Just work. 💀",
  "Professor waiting da... 😂",
  "Deep work = fast finish 🔥",
]

export default function FocusMode() {
  const { user } = useUser()
  const [deadlines, setDeadlines] = useState([])
  const [selectedDeadline, setSelectedDeadline] = useState(null)
  const [focusActive, setFocusActive] = useState(false)
  const [timer, setTimer] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [countdown, setCountdown] = useState('')
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [sessionTime, setSessionTime] = useState(0)
  const intervalRef = useRef(null)
  const sessionRef = useRef(null)

  useEffect(() => {
    if (user) {
      fetchDeadlines(user.id).then(data => {
        const active = Array.isArray(data)
          ? data.filter(d => new Date(d.dueDate) > Date.now())
          : []
        setDeadlines(active)
        if (active.length > 0) setSelectedDeadline(active[0])
      })
    }
  }, [user])

  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedDeadline) {
        setCountdown(formatCountdown(selectedDeadline.dueDate))
      }
      setQuoteIndex(prev => (prev + 1) % FOCUS_QUOTES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [selectedDeadline])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {})
            return 0
          }
          return prev - 1
        })
      }, 1000)

      sessionRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1)
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
      clearInterval(sessionRef.current)
    }
    return () => {
      clearInterval(intervalRef.current)
      clearInterval(sessionRef.current)
    }
  }, [running])

  const startFocus = () => {
    setFocusActive(true)
    setTimer(25 * 60)
    setRunning(true)
    setSessionTime(0)
    // Request fullscreen
    document.documentElement.requestFullscreen?.()
  }

  const exitFocus = () => {
    setFocusActive(false)
    setRunning(false)
    setTimer(25 * 60)
    document.exitFullscreen?.()
  }

  const circumference = 2 * Math.PI * 120
  const progress = timer / (25 * 60)
  const strokeDashoffset = circumference * progress

  // Focus Mode Active - Full Screen
  if (focusActive) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center"
      >
        {/* Subtle background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 to-black" />

        {/* Exit button */}
        <button
          onClick={exitFocus}
          className="absolute top-6 right-6 text-gray-700 hover:text-gray-400 transition-all text-sm font-bold"
        >
          ✕ Exit Focus
        </button>

        {/* Deadline info */}
        {selectedDeadline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8 z-10"
          >
            <p className="text-gray-500 text-sm">Focusing on</p>
            <h2 className="text-white font-black text-2xl">{selectedDeadline.title}</h2>
            <p className="text-gray-400 text-sm">{selectedDeadline.subject}</p>
            <p className="text-red-400 font-mono text-lg mt-1">{countdown}</p>
          </motion.div>
        )}

        {/* Timer circle */}
        <div className="relative z-10 mb-8">
          <svg width="280" height="280" className="-rotate-90">
            <circle cx="140" cy="140" r="120" fill="none" stroke="#1f2937" strokeWidth="8" />
            <motion.circle
              cx="140" cy="140" r="120"
              fill="none"
              stroke={timer < 5 * 60 ? '#ef4444' : timer < 10 * 60 ? '#f97316' : '#22c55e'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-black font-mono text-white">
              {formatTime(timer)}
            </span>
            <span className="text-gray-500 text-sm mt-1">
              {running ? '🎯 Focus mode' : '⏸ Paused'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4 z-10 mb-8">
          <button
            onClick={() => { setTimer(25 * 60); setRunning(false) }}
            className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-bold transition-all"
          >
            🔄 Reset
          </button>
          <button
            onClick={() => setRunning(!running)}
            className={`px-10 py-3 rounded-xl font-black text-lg transition-all hover:scale-105 ${
              running ? 'bg-gray-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {running ? '⏸ Pause' : '▶ Resume'}
          </button>
        </div>

        {/* Quote */}
        <AnimatePresence mode="wait">
          <motion.p
            key={quoteIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-gray-600 text-sm italic z-10"
          >
            "{FOCUS_QUOTES[quoteIndex]}"
          </motion.p>
        </AnimatePresence>

        {/* Session time */}
        <p className="text-gray-700 text-xs mt-4 z-10">
          Session time: {formatTime(sessionTime)}
        </p>
      </motion.div>
    )
  }

  // Pre-focus screen
  return (
    <div className="min-h-screen bg-black text-white p-8">

      <div className="mb-8">
        <h1 className="text-3xl font-black">🌙 Focus Mode</h1>
        <p className="text-gray-500 mt-1">Zero distractions. Just you and your deadline. 💀</p>
      </div>

      <div className="max-w-2xl">

        {/* Select Deadline */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-4">🎯 What are you focusing on?</h2>

          {deadlines.length === 0 ? (
            <p className="text-gray-500">No active deadlines da! Add one first 💀</p>
          ) : (
            <div className="space-y-3">
              {deadlines.map((d, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setSelectedDeadline(d)}
                  className={`border rounded-xl p-4 cursor-pointer transition-all ${
                    selectedDeadline?._id === d._id
                      ? 'border-red-500 bg-red-950'
                      : 'border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-white font-bold">{d.title}</h3>
                      <p className="text-gray-400 text-sm">{d.subject}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-400 font-mono text-sm">
                        {formatCountdown(d.dueDate)}
                      </p>
                      <p className="text-gray-500 text-xs">{d.progress}% done</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Focus tips */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-4">💡 Focus Tips</h2>
          <div className="space-y-3">
            {[
              { icon: '📱', tip: 'Phone vechu thoodu - seriously da' },
              { icon: '🎵', tip: 'Lo-fi or Sid Sriram podu - no lyrics' },
              { icon: '💧', tip: 'Water bottle ready ah vachi ko' },
              { icon: '🚫', tip: 'Social media - 25 minutes wait pannu' },
              { icon: '⏰', tip: '25 min focus, 5 min break - Pomodoro style' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <p className="text-gray-400 text-sm">{item.tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Start button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={startFocus}
          disabled={!selectedDeadline}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-5 rounded-2xl font-black text-2xl transition-all"
        >
          🌙 Enter Focus Mode
        </motion.button>

        {!selectedDeadline && (
          <p className="text-gray-600 text-sm text-center mt-2">Select a deadline first da 😄</p>
        )}
      </div>
    </div>
  )
}

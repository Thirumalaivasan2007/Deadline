import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const MODES = {
  focus: { label: '🍅 Focus', time: 25 * 60, color: 'text-red-400', ring: 'stroke-red-500' },
  short: { label: '☕ Short Break', time: 5 * 60, color: 'text-green-400', ring: 'stroke-green-500' },
  long: { label: '🛋️ Long Break', time: 15 * 60, color: 'text-blue-400', ring: 'stroke-blue-500' },
}

export default function Pomodoro() {
  const [mode, setMode] = useState('focus')
  const [timeLeft, setTimeLeft] = useState(MODES.focus.time)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    setTimeLeft(MODES[mode].time)
    setRunning(false)
    clearInterval(intervalRef.current)
  }, [mode])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            if (mode === 'focus') setSessions(s => s + 1)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, mode])

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0')
  const seconds = (timeLeft % 60).toString().padStart(2, '0')

  const total = MODES[mode].time
  const progress = (timeLeft / total)
  const circumference = 2 * Math.PI * 120
  const strokeDashoffset = circumference * progress

  const reset = () => {
    setRunning(false)
    setTimeLeft(MODES[mode].time)
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-black mb-2">🍅 Pomodoro Timer</h1>
      <p className="text-gray-500 mb-8">Focus. Break. Repeat. Don't die. 💀</p>

      {/* Mode selector */}
      <div className="flex gap-3 mb-12">
        {Object.entries(MODES).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`px-5 py-2 rounded-xl font-bold transition-all ${
              mode === key
                ? 'bg-red-600 text-white'
                : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
            }`}
          >
            {val.label}
          </button>
        ))}
      </div>

      {/* Timer circle */}
      <div className="flex flex-col items-center mb-12">
        <div className="relative">
          <svg width="280" height="280" className="-rotate-90">
            <circle
              cx="140" cy="140" r="120"
              fill="none"
              stroke="#1f2937"
              strokeWidth="10"
            />
            <motion.circle
              cx="140" cy="140" r="120"
              fill="none"
              className={MODES[mode].ring}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transition={{ duration: 0.5 }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-6xl font-black font-mono ${MODES[mode].color}`}>
              {minutes}:{seconds}
            </span>
            <span className="text-gray-500 text-sm mt-2">{MODES[mode].label}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={reset}
            className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-bold transition-all"
          >
            🔄 Reset
          </button>
          <button
            onClick={() => setRunning(!running)}
            className={`px-10 py-3 rounded-xl font-black text-lg transition-all hover:scale-105 ${
              running
                ? 'bg-gray-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {running ? '⏸ Pause' : '▶ Start'}
          </button>
        </div>
      </div>

      {/* Sessions */}
      <div className="max-w-md mx-auto bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
        <h2 className="text-gray-400 text-sm mb-3">Today's Sessions</h2>
        <div className="flex justify-center gap-2 mb-4">
          {Array.from({ length: Math.max(sessions, 4) }).map((_, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                i < sessions ? 'bg-red-600' : 'bg-gray-800'
              }`}
            >
              {i < sessions ? '🍅' : '○'}
            </div>
          ))}
        </div>
        <p className="text-white font-black text-3xl">{sessions}</p>
        <p className="text-gray-500 text-sm">sessions completed</p>
        {sessions >= 4 && (
          <motion.p
            className="text-green-400 font-bold mt-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            🎉 4 sessions done! Take a long break da!
          </motion.p>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchDeadlines } from '../api/deadlineApi'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const MOODS = [
  { id: 'great', emoji: '🤩', label: 'Great', color: 'border-green-500 bg-green-950', text: 'text-green-400', bar: 'bg-green-500' },
  { id: 'good', emoji: '😊', label: 'Good', color: 'border-blue-500 bg-blue-950', text: 'text-blue-400', bar: 'bg-blue-500' },
  { id: 'okay', emoji: '😐', label: 'Okay', color: 'border-yellow-500 bg-yellow-950', text: 'text-yellow-400', bar: 'bg-yellow-500' },
  { id: 'stressed', emoji: '😰', label: 'Stressed', color: 'border-orange-500 bg-orange-950', text: 'text-orange-400', bar: 'bg-orange-500' },
  { id: 'dead', emoji: '💀', label: 'Dead Inside', color: 'border-red-500 bg-red-950', text: 'text-red-400', bar: 'bg-red-500' },
]

const MOOD_NOTES = {
  great: ["Nalla iruka! Keep it up da 🔥", "Ipa productive ah iruka best time! 💪"],
  good: ["Good vibes da! Pannudu 😄", "Consistency thaan key da 🔥"],
  okay: ["Okay is okay da, push through 💪", "Middle ground - either way pannu 😄"],
  stressed: ["Stressed ah iruka? Break edu da 😮💨", "Deep breath da, one task at a time 💀"],
  dead: ["Bro... sleep pottuta ezhunthu pannu 😂", "Dead inside but still here - respect da 💀"],
}

export default function MoodTracker() {
  const { user } = useUser()
  const [todayMood, setTodayMood] = useState(null)
  const [moodHistory, setMoodHistory] = useState([])
  const [deadlines, setDeadlines] = useState([])
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      Promise.all([
        fetch(`${BASE_URL}/mood/${user.id}`).then(r => r.json()),
        fetchDeadlines(user.id)
      ]).then(([moodData, deadlineData]) => {
        setMoodHistory(Array.isArray(moodData) ? moodData : [])
        setDeadlines(Array.isArray(deadlineData) ? deadlineData : [])

        // Check if today mood already logged
        const today = new Date().toISOString().split('T')[0]
        const todayLog = moodData.find(m => m.date === today)
        if (todayLog) setTodayMood(todayLog.mood)

        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [user])

  const saveMood = async () => {
    if (!todayMood) return
    setSaving(true)
    try {
      await fetch(`${BASE_URL}/mood/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: todayMood,
          note,
          deadlineCount: deadlines.length,
          date: new Date().toISOString().split('T')[0]
        })
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)

      // Refresh history
      const data = await fetch(`${BASE_URL}/mood/${user.id}`).then(r => r.json())
      setMoodHistory(Array.isArray(data) ? data : [])
    } catch {
      alert('Error saving mood da!')
    }
    setSaving(false)
  }

  const getMoodCorrelation = () => {
    if (moodHistory.length < 2) return null
    const stressedDays = moodHistory.filter(m =>
      (m.mood === 'stressed' || m.mood === 'dead') && m.deadlineCount > 2
    ).length
    const totalStressed = moodHistory.filter(m =>
      m.mood === 'stressed' || m.mood === 'dead'
    ).length
    if (totalStressed === 0) return 0
    return Math.round((stressedDays / totalStressed) * 100)
  }

  const moodCounts = MOODS.reduce((acc, m) => {
    acc[m.id] = moodHistory.filter(h => h.mood === m.id).length
    return acc
  }, {})

  const selectedMoodData = MOODS.find(m => m.id === todayMood)
  const correlation = getMoodCorrelation()

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <motion.div
        className="text-red-500 text-4xl font-black"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 1 }}
      >
        💀 Loading...
      </motion.div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white p-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black">😊 Mood Tracker</h1>
        <p className="text-gray-500 mt-1">How are you actually feeling? 💀</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left - Today's Mood */}
        <div className="lg:col-span-2 space-y-6">

          {/* Mood selector */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg mb-2">Today's Mood</h2>
            <p className="text-gray-500 text-sm mb-6">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>

            <div className="grid grid-cols-5 gap-3 mb-6">
              {MOODS.map(mood => (
                <motion.button
                  key={mood.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTodayMood(mood.id)}
                  className={`border-2 rounded-2xl p-4 text-center transition-all ${
                    todayMood === mood.id
                      ? mood.color
                      : 'border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="text-4xl mb-2">{mood.emoji}</div>
                  <div className={`text-xs font-bold ${todayMood === mood.id ? mood.text : 'text-gray-400'}`}>
                    {mood.label}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Mood message */}
            <AnimatePresence mode="wait">
              {selectedMoodData && (
                <motion.div
                  key={todayMood}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`border ${selectedMoodData.color} rounded-xl p-4 mb-4`}
                >
                  <p className={`${selectedMoodData.text} font-semibold text-sm`}>
                    {MOOD_NOTES[todayMood][Math.floor(Math.random() * MOOD_NOTES[todayMood].length)]}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Note */}
            <div className="mb-4">
              <label className="text-gray-400 text-sm mb-2 block">Add a note (optional)</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="What's going on da? 😄"
                rows={3}
                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-red-500 focus:outline-none resize-none"
              />
            </div>

            <button
              onClick={saveMood}
              disabled={!todayMood || saving}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all"
            >
              {saving ? '💾 Saving...' : saved ? '✅ Mood Saved!' : '💾 Log Today\'s Mood'}
            </button>
          </div>

          {/* Mood History */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg mb-4">📅 Mood History</h2>
            {moodHistory.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">😶</div>
                <p className="text-gray-500">No mood logs yet da!</p>
                <p className="text-gray-600 text-sm mt-1">Log today's mood first 😄</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {[...moodHistory].reverse().map((log, i) => {
                  const moodData = MOODS.find(m => m.id === log.mood)
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-4 bg-black border border-gray-800 rounded-xl p-3"
                    >
                      <span className="text-3xl">{moodData?.emoji}</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className={`font-bold text-sm ${moodData?.text}`}>{moodData?.label}</span>
                          <span className="text-gray-600 text-xs">{log.date}</span>
                        </div>
                        {log.note && (
                          <p className="text-gray-400 text-xs mt-0.5 truncate">{log.note}</p>
                        )}
                        <p className="text-gray-600 text-xs mt-0.5">
                          {log.deadlineCount} deadline{log.deadlineCount !== 1 ? 's' : ''} that day
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-6">

          {/* Mood Stats */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-white font-bold text-lg mb-4">📊 Mood Stats</h3>
            <div className="space-y-3">
              {MOODS.map(mood => (
                <div key={mood.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">{mood.emoji} {mood.label}</span>
                    <span className="text-gray-500">{moodCounts[mood.id]} days</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <motion.div
                      className={`h-2 rounded-full ${mood.bar}`}
                      initial={{ width: 0 }}
                      animate={{
                        width: moodHistory.length > 0
                          ? `${(moodCounts[mood.id] / moodHistory.length) * 100}%`
                          : '0%'
                      }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deadline Correlation */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-white font-bold text-lg mb-2">🔗 Deadline vs Mood</h3>
            <p className="text-gray-500 text-xs mb-4">How deadlines affect your mood</p>

            {correlation !== null ? (
              <div className="text-center">
                <div className="text-5xl font-black text-orange-400 mb-2">{correlation}%</div>
                <p className="text-gray-400 text-sm">
                  of your stressed days had 2+ deadlines
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  {correlation > 70
                    ? '💀 Deadlines are killing you da!'
                    : correlation > 40
                    ? '😰 Deadlines stress you out'
                    : '😌 You handle pressure well da!'}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center">
                Log more moods to see correlation 😄
              </p>
            )}
          </div>

          {/* Today's Deadlines */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-white font-bold mb-3">📋 Active Deadlines</h3>
            {deadlines.filter(d => new Date(d.dueDate) > Date.now()).length === 0 ? (
              <p className="text-gray-500 text-sm">No active deadlines! 😌</p>
            ) : (
              <div className="space-y-2">
                {deadlines
                  .filter(d => new Date(d.dueDate) > Date.now())
                  .slice(0, 3)
                  .map((d, i) => (
                    <div key={i} className="flex justify-between items-center bg-black rounded-lg p-2">
                      <span className="text-white text-xs font-semibold truncate">{d.title}</span>
                      <span className="text-gray-500 text-xs ml-2">{d.progress}%</span>
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

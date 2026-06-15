import { UserButton, useUser } from '@clerk/clerk-react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AddDeadlineModal from '../components/AddDeadlineModal'
import EditDeadlineModal from '../components/EditDeadlineModal'
import { fetchDeadlines, addDeadline, deleteDeadline, updateDeadline, fetchUserStats, submitDeadline, updateProgress } from '../api/deadlineApi'
import { requestNotificationPermission, scheduleDeadlineNotifications } from '../utils/notifications'
import DeathScreen from '../components/DeathScreen'

function getPanicLevel(dueDate) {
  const diff = new Date(dueDate) - Date.now()
  const hours = diff / (1000 * 60 * 60)
  if (hours <= 0) return 'expired'
  if (hours <= 2) return 'critical'
  if (hours <= 24) return 'high'
  if (hours <= 72) return 'medium'
  return 'calm'
}

function formatCountdown(dueDate) {
  const diff = new Date(dueDate) - Date.now()
  if (diff <= 0) return '💀 EXPIRED'
  const h = Math.floor(diff / (1000 * 60 * 60))
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const s = Math.floor((diff % (1000 * 60)) / 1000)
  return `${h}h ${m}m ${s}s`
}

function AIRoast({ deadlines }) {
  const [roast, setRoast] = useState('')

  const roasts = {
    noDeadlines: [
      "Deadline illama calm ah iruka? Professor assignment forget pannirukaan, nee illai 😂",
      "Empty da! Either super organized ah iruka, illa ellathayum forget pannita 💀",
      "No deadlines? Nee CSE student na impossible da 😂",
    ],
    allCalm: [
      "Calm ah iruka nee? Wait pannu, professor surprise assignment kudupaan 💀",
      "Still time iruku nu relax pannura? Athu thaan problem da 😂",
      "Green zone la iruka - ipo thaana panic aagum, wait pannu 😈",
    ],
    someHigh: [
      "24 hours la submit pannanum, nee ipo enna pannura da? 😂",
      "HIGH priority deadlines iruku, nee still here pesura? GO STUDY DA 💀",
      "Deadline near ah varuthu, still progress low - classic nee style 😂",
    ],
    critical: [
      "2 HOURS DA! Nee ipo kodungaiyil iruka? OPEN YOUR LAPTOP 💀🔥",
      "Romba late ah aagiduchi da, ipo nee yaar kitta pray pannuva? 😂",
      "Critical stage da! Nee submit pannala na tomorrow professor face paaka mudiyathu 💀",
      "2 hours iruku, nee 0% progress - congratulations on your failure da 😈",
    ],
    expired: [
      "Expired da! Professor inbox la sorry mail anuppu, athu mattum thaan option 💀",
      "DEAD ah pochu! Nee fail aana naan surprised illai da 😂",
      "Assignment expired - nee life also expire aaguma? 💀😂",
      "GG da, better luck next semester! 😂",
    ],
    lowProgress: [
      "Average progress ${avg}% - romba gethu da nee! NOT 😂",
      "${avg}% panni satisfied ah iruka? Professor ${100 - avg}% more expect pannraan 💀",
      "Ipo ${avg}% - deadline la ${100 - avg}% magic aaguma? 😂",
    ],
    highProgress: [
      "Almost done! Last minute ah submit pannuva la? Nee style theriyum 😂",
      "Progress nalla iruku, but submit pannala na useless da 💀",
      "Good progress! Now actually SUBMIT it da 🔥",
    ]
  }

  const getRoast = () => {
    const critical = deadlines.filter(d => getPanicLevel(d.dueDate) === 'critical')
    const expired = deadlines.filter(d => getPanicLevel(d.dueDate) === 'expired')
    const high = deadlines.filter(d => getPanicLevel(d.dueDate) === 'high')
    const avg = deadlines.length > 0
      ? Math.round(deadlines.reduce((a, b) => a + b.progress, 0) / deadlines.length)
      : 0

    let pool = []

    if (deadlines.length === 0) {
      pool = roasts.noDeadlines
    } else if (expired.length > 0) {
      pool = roasts.expired
    } else if (critical.length > 0) {
      pool = roasts.critical
    } else if (high.length > 0) {
      pool = roasts.someHigh
    } else if (avg < 30) {
      pool = roasts.lowProgress
    } else if (avg >= 70) {
      pool = roasts.highProgress
    } else {
      pool = roasts.allCalm
    }

    const random = pool[Math.floor(Math.random() * pool.length)]
    const result = random
      .replace('${avg}', avg)
      .replace('${100 - avg}', 100 - avg)

    setRoast(result)
  }

  return (
    <div className="bg-gray-900 border border-purple-800 rounded-xl p-5 mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-white font-bold text-lg">😈 AI Roast Mode</h2>
        <button
          onClick={getRoast}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all hover:scale-105"
        >
          🔥 Roast Me
        </button>
      </div>
      {roast ? (
        <motion.p
          key={roast}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-purple-300 font-semibold text-sm italic"
        >
          "{roast}"
        </motion.p>
      ) : (
        <p className="text-gray-600 text-sm">Dare panna button press pannu da 😂</p>
      )}
    </div>
  )
}

function StreakCard({ stats }) {
  const level = stats?.level || 1
  const xp = stats?.xp || 0
  const streak = stats?.streak || 0
  const nextLevelXP = level * 200
  const xpProgress = (xp % 200) / 200 * 100

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-white font-bold text-lg mb-4">🎮 Your Stats</h2>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-3xl font-black text-orange-400">🔥 {streak}</div>
          <div className="text-gray-500 text-xs mt-1">Day Streak</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-black text-yellow-400">⭐ {xp}</div>
          <div className="text-gray-500 text-xs mt-1">Total XP</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-black text-purple-400">Lv.{level}</div>
          <div className="text-gray-500 text-xs mt-1">Level</div>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>XP Progress</span>
          <span>{xp % 200}/{200} to Lv.{level + 1}</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <motion.div
            className="h-2 rounded-full bg-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      </div>
    </div>
  )
}

function PanicCard({ deadline, onDelete, onEdit, onSubmit, onProgressUpdate }) {
  const [countdown, setCountdown] = useState(formatCountdown(deadline.dueDate))
  const [localProgress, setLocalProgress] = useState(deadline.progress)
  const [saving, setSaving] = useState(false)
  const panic = getPanicLevel(deadline.dueDate)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(formatCountdown(deadline.dueDate))
    }, 1000)
    return () => clearInterval(interval)
  }, [deadline.dueDate])

  useEffect(() => {
    setLocalProgress(deadline.progress)
  }, [deadline.progress])

  const handleProgressChange = async (val) => {
    setLocalProgress(val)
  }

  const handleProgressSave = async () => {
    setSaving(true)
    await onProgressUpdate(deadline._id, localProgress)
    setSaving(false)
  }

  const panicStyles = {
    expired: { border: 'border-gray-500', bg: 'bg-gray-900', text: 'text-gray-400', badge: 'bg-gray-600', bar: 'bg-gray-500' },
    critical: { border: 'border-red-500', bg: 'bg-red-950', text: 'text-red-400', badge: 'bg-red-500', bar: 'bg-red-500' },
    high: { border: 'border-orange-500', bg: 'bg-orange-950', text: 'text-orange-400', badge: 'bg-orange-500', bar: 'bg-orange-500' },
    medium: { border: 'border-yellow-500', bg: 'bg-yellow-950', text: 'text-yellow-400', badge: 'bg-yellow-500', bar: 'bg-yellow-500' },
    calm: { border: 'border-green-500', bg: 'bg-green-950', text: 'text-green-400', badge: 'bg-green-500', bar: 'bg-green-500' }
  }

  const style = panicStyles[panic]
  const badgeText = {
    expired: '💀 DEAD',
    critical: '🔥 PANIC',
    high: '⚠️ HIGH',
    medium: '⏳ MED',
    calm: '✅ CALM'
  }

  return (
    <motion.div
      animate={panic === 'critical' ? { x: [-2, 2, -2, 2, 0], transition: { repeat: Infinity, duration: 0.3 } } : {}}
      className={`border ${style.border} ${style.bg} rounded-xl p-5 relative overflow-hidden`}
    >
      {panic === 'critical' && (
        <motion.div
          className="absolute inset-0 bg-red-500 opacity-5 pointer-events-none"
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ repeat: Infinity, duration: 0.5 }}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-white text-lg">{deadline.title}</h3>
          <p className="text-gray-400 text-sm">{deadline.subject}</p>
        </div>
        <div className="flex items-center gap-1">
          <span className={`${style.badge} text-white text-xs px-2 py-1 rounded-full font-bold`}>
            {badgeText[panic]}
          </span>
          <button onClick={() => onEdit(deadline)} className="text-gray-600 hover:text-yellow-400 transition-all text-lg ml-1">✏️</button>
          <button onClick={() => onDelete(deadline._id)} className="text-gray-600 hover:text-red-400 transition-all text-lg">🗑️</button>
        </div>
      </div>

      {/* Countdown */}
      <div className={`${style.text} font-mono text-2xl font-black mb-3`}>
        ⏰ {countdown}
      </div>

      {/* Progress slider - direct update */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Progress</span>
          <span>{localProgress}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={localProgress}
          onChange={e => handleProgressChange(parseInt(e.target.value))}
          onMouseUp={handleProgressSave}
          onTouchEnd={handleProgressSave}
          className={`w-full mb-2 ${
            panic === 'critical' ? 'accent-red-500' :
            panic === 'high' ? 'accent-orange-500' :
            panic === 'medium' ? 'accent-yellow-500' : 'accent-green-500'
          }`}
        />
        <div className="w-full bg-gray-800 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${style.bar} transition-all`}
            style={{ width: `${localProgress}%` }}
          />
        </div>
      </div>

      {/* Submit button */}
      {localProgress === 100 && panic !== 'expired' && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => onSubmit(deadline._id, true)}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold text-sm transition-all mt-2"
        >
          ✅ Mark Submitted - Get XP! 🎮
        </motion.button>
      )}

      {panic === 'expired' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => onSubmit(deadline._id, false)}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-bold text-sm transition-all mt-2"
        >
          💀 Late Submit - Lose XP
        </motion.button>
      )}

      {saving && (
        <p className="text-xs text-gray-500 text-center mt-1">Saving...</p>
      )}
    </motion.div>
  )
}

function PanicMeter({ deadlines }) {
  const criticalCount = deadlines.filter(d => getPanicLevel(d.dueDate) === 'critical').length
  const highCount = deadlines.filter(d => getPanicLevel(d.dueDate) === 'high').length
  const overallPanic = criticalCount > 0 ? 100 : highCount > 0 ? 70 : deadlines.length > 0 ? 30 : 0

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-white font-bold text-lg mb-4">💀 Panic Meter</h2>
      <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden mb-2">
        <motion.div
          className="h-full rounded-full"
          style={{ background: overallPanic > 80 ? '#ef4444' : overallPanic > 50 ? '#f97316' : '#22c55e' }}
          initial={{ width: 0 }}
          animate={{ width: `${overallPanic}%` }}
          transition={{ duration: 1.5 }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>😌 Chill</span>
        <span className={overallPanic > 80 ? 'text-red-400 font-bold' : 'text-gray-400'}>
          {overallPanic > 80 ? '🔥 FULL PANIC MODE' : overallPanic > 50 ? '⚠️ Getting tense' : '✅ Under control'}
        </span>
        <span>😱 Dead</span>
      </div>
    </div>
  )
}

function TodayFocus({ deadlines }) {
  const active = deadlines.filter(d => getPanicLevel(d.dueDate) !== 'expired')
  if (active.length === 0) return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-white font-bold text-lg mb-2">🎯 Today's Focus</h2>
      <p className="text-gray-500 text-sm">No deadlines yet da! Add one 💀</p>
    </div>
  )

  const sorted = [...active].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  const focus = sorted[0]

  return (
    <div className="bg-gray-900 border border-red-900 rounded-xl p-5">
      <h2 className="text-white font-bold text-lg mb-2">🎯 Today's Focus</h2>
      <p className="text-gray-400 text-sm mb-3">Most urgent right now:</p>
      <div className="bg-black rounded-lg p-4 border border-red-800">
        <h3 className="text-red-400 font-black text-xl">{focus.title}</h3>
        <p className="text-gray-400 text-sm">{focus.subject}</p>
        <p className="text-red-300 text-xs mt-2 font-mono">
          Due: {new Date(focus.dueDate).toLocaleString()}
        </p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useUser()
  const [deadlines, setDeadlines] = useState([])
  const [userStats, setUserStats] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [selectedDeadline, setSelectedDeadline] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDeathScreen, setShowDeathScreen] = useState(false)

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchDeadlines(user.id),
        fetchUserStats(user.id, user.fullName, user.primaryEmailAddress?.emailAddress)
      ]).then(([deadlineData, statsData]) => {
        const data = Array.isArray(deadlineData) ? deadlineData : []
        setDeadlines(data)
        setUserStats(statsData)
        setLoading(false)

        // Check for expired deadlines
        const expired = data.filter(d => new Date(d.dueDate) <= Date.now() && d.progress < 100)
        if (expired.length > 0) {
          setTimeout(() => setShowDeathScreen(true), 2000)
        }

        // Request notification permission + schedule
        requestNotificationPermission().then(granted => {
          if (granted) scheduleDeadlineNotifications(data)
        })
      }).catch(() => setLoading(false))
    }
  }, [user])

  const handleAdd = async (deadline) => {
    const saved = await addDeadline({ ...deadline, userId: user.id })
    setDeadlines(prev => [...prev, saved])
  }

  const handleDelete = async (id) => {
    await deleteDeadline(id)
    setDeadlines(prev => prev.filter(d => d._id !== id))
  }

  const handleUpdate = async (id, data) => {
    const updated = await updateDeadline(id, data)
    setDeadlines(prev => prev.map(d => d._id === id ? updated : d))
  }

  const handleProgressUpdate = async (id, progress) => {
    const updated = await updateProgress(id, progress)
    setDeadlines(prev => prev.map(d => d._id === id ? updated : d))
  }

  const handleSubmit = async (id, isOnTime) => {
    await deleteDeadline(id)
    const stats = await submitDeadline(user.id, isOnTime)
    setDeadlines(prev => prev.filter(d => d._id !== id))
    setUserStats(stats)
  }

  const criticalCount = deadlines.filter(d => getPanicLevel(d.dueDate) === 'critical').length

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
    <div className="min-h-screen bg-black text-white">
      {showDeathScreen && (
        <DeathScreen
          deadlines={deadlines}
          onDismiss={() => setShowDeathScreen(false)}
        />
      )}
      {criticalCount > 0 && (
        <motion.div
          className="fixed inset-0 bg-red-900 pointer-events-none z-0"
          animate={{ opacity: [0.03, 0.08, 0.03] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      )}

      <div className="max-w-6xl mx-auto px-8 py-8 relative z-10">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Hey {user?.firstName}, don't panic... yet 💀</p>
          </div>
        </div>

        {/* Stats Row */}
        <StreakCard stats={userStats} />

        {/* Top widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
          <div className="md:col-span-1">
            <TodayFocus deadlines={deadlines} />
          </div>
          <div className="md:col-span-2">
            <PanicMeter deadlines={deadlines} />
          </div>
        </div>

        {/* AI Roast */}
        <AIRoast deadlines={deadlines} />

        {/* Deadlines header */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-bold">📋 Your Deadlines</h2>
          <button
            data-add-deadline
            onClick={() => setShowModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all hover:scale-105"
          >
            + Add Deadline
          </button>
        </div>

        {deadlines.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">💀</div>
            <p className="text-gray-500 text-xl">No deadlines yet!</p>
            <p className="text-gray-600 text-sm mt-2">Lucky ah iruka... or forgot pannita? 😂</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deadlines.map(deadline => (
              <PanicCard
                key={deadline._id}
                deadline={deadline}
                onDelete={handleDelete}
                onEdit={(d) => { setSelectedDeadline(d); setEditModal(true) }}
                onSubmit={handleSubmit}
                onProgressUpdate={handleProgressUpdate}
              />
            ))}
          </div>
        )}

        {/* Stats bottom */}
        <div className="grid grid-cols-4 gap-4 mt-8">
          {[
            { label: 'Total', value: deadlines.length, color: 'text-white' },
            { label: '🔥 Critical', value: deadlines.filter(d => getPanicLevel(d.dueDate) === 'critical').length, color: 'text-red-400' },
            { label: '⚠️ High', value: deadlines.filter(d => getPanicLevel(d.dueDate) === 'high').length, color: 'text-orange-400' },
            { label: '✅ Calm', value: deadlines.filter(d => getPanicLevel(d.dueDate) === 'calm').length, color: 'text-green-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <AddDeadlineModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAdd={handleAdd}
      />
      <EditDeadlineModal
        isOpen={editModal}
        onClose={() => { setEditModal(false); setSelectedDeadline(null) }}
        onUpdate={handleUpdate}
        deadline={selectedDeadline}
      />
    </div>
  )
}
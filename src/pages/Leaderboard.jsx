import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchUserStats } from '../api/deadlineApi'

const BASE_URL = 'http://localhost:5001/api'

const SHAME_MESSAGES = [
  "Shame shame puppy shame! 🐶",
  "Idhu nee pannatha? Enna da idu 😂",
  "Professor unna paatha enna solluvaanga theriyuma? 💀",
  "Late king/queen! Crown ready 👑💀",
  "Submit pannama tidur vidura style - classic! 😂",
  "Deadline? I don't know her 💀",
  "Tomorrow morning submit pannum - spoiler: won't 😂",
]

export default function Leaderboard() {
  const { user } = useUser()
  const [myStats, setMyStats] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [activeTab, setActiveTab] = useState('xp')
  const [loading, setLoading] = useState(true)
  const [deadlineId, setDeadlineId] = useState('')
  const [addingFriend, setAddingFriend] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  const [shameIndex, setShameIndex] = useState(0)

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchUserStats(user.id, user.fullName, user.primaryEmailAddress?.emailAddress),
        fetch(`${BASE_URL}/leaderboard/${user.id}`).then(r => r.json())
      ]).then(([stats, board]) => {
        setMyStats(stats)
        setLeaderboard(Array.isArray(board) ? board : [])
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [user])

  // Rotating shame messages
  useEffect(() => {
    const interval = setInterval(() => {
      setShameIndex(prev => (prev + 1) % SHAME_MESSAGES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const addFriend = async () => {
    if (!deadlineId.trim()) return
    setAddingFriend(true)
    try {
      const res = await fetch(`${BASE_URL}/friends/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, deadlineId: deadlineId.trim() })
      })
      const data = await res.json()
      if (data.success) {
        setMessage(`${data.friendName} added! 🎉`)
        setMessageType('success')
        setDeadlineId('')
        // Refresh leaderboard
        const board = await fetch(`${BASE_URL}/leaderboard/${user.id}`).then(r => r.json())
        setLeaderboard(Array.isArray(board) ? board : [])
      } else {
        setMessage(data.error || 'Something went wrong da 😅')
        setMessageType('error')
      }
    } catch {
      setMessage('Server error da 😅')
      setMessageType('error')
    }
    setAddingFriend(false)
    setTimeout(() => setMessage(''), 4000)
  }

  const sorted = [...leaderboard].sort((a, b) => {
    if (activeTab === 'xp') return b.xp - a.xp
    if (activeTab === 'streak') return b.streak - a.streak
    return b.onTimeSubmits - a.onTimeSubmits
  })

  const myRank = sorted.findIndex(u => u.userId === user?.id) + 1

  const getRankEmoji = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const getShameReasons = (u) => {
    const reasons = []
    if (u.lateSubmits > 2) reasons.push(`${u.lateSubmits} late submits 💀`)
    if (u.streak === 0) reasons.push('No streak 😴')
    if (u.expiredWithoutSubmit > 0) reasons.push(`${u.expiredWithoutSubmit} expired 🪦`)
    return reasons
  }

  const shameUsers = sorted.filter(u => getShameReasons(u).length > 0)

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
        <h1 className="text-3xl font-black">🏆 Leaderboard</h1>
        <p className="text-gray-500 mt-1">Who's the least procrastinator? 😂</p>
      </div>

      {/* My Rank Card */}
      {myStats && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-900 to-red-900 border border-purple-700 rounded-2xl p-6 mb-6"
        >
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-gray-300 text-sm">Your Standing</h2>
            <div className="bg-black bg-opacity-40 rounded-xl px-4 py-2">
              <p className="text-gray-400 text-xs">Your DeadLine ID</p>
              <p className="text-yellow-400 font-black text-lg tracking-widest">{myStats?.deadlineId || 'Loading...'}</p>
              <p className="text-gray-500 text-xs">Share this with friends!</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-black text-yellow-400">
                {myRank > 0 ? getRankEmoji(myRank) : '?'}
              </div>
              <div className="text-gray-400 text-xs mt-1">Your Rank</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-yellow-400">⭐ {myStats.xp}</div>
              <div className="text-gray-400 text-xs mt-1">XP</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-orange-400">🔥 {myStats.streak}</div>
              <div className="text-gray-400 text-xs mt-1">Streak</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-green-400">✅ {myStats.onTimeSubmits}</div>
              <div className="text-gray-400 text-xs mt-1">On Time</div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Leaderboard */}
        <div className="lg:col-span-2 space-y-4">

          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { key: 'xp', label: '⭐ XP' },
              { key: 'streak', label: '🔥 Streak' },
              { key: 'ontime', label: '✅ On Time' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                  activeTab === tab.key
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Leaderboard list */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            {sorted.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">🏆</div>
                <p className="text-gray-500">No friends yet da!</p>
                <p className="text-gray-600 text-sm mt-1">Share your DeadLine ID and add friends 😂</p>
              </div>
            ) : (
              sorted.map((u, i) => {
                const isMe = u.userId === user?.id
                const shameReasons = getShameReasons(u)
                return (
                  <motion.div
                    key={u.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-4 px-6 py-4 border-b border-gray-800 last:border-0 ${
                      isMe ? 'bg-purple-900 bg-opacity-30' : 'hover:bg-gray-800'
                    }`}
                  >
                    <div className="w-10 text-center font-black text-lg">
                      {getRankEmoji(i + 1)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white">
                          {u.name || 'Anonymous'} {isMe && '(You)'}
                        </span>
                        {i === 0 && (
                          <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded-full">
                            👑 Top Dog
                          </span>
                        )}
                        {shameReasons.length > 0 && (
                          <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full">
                            🐶 Shame
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 mt-1 flex-wrap">
                        <span className="text-gray-500 text-xs">⭐ {u.xp} XP</span>
                        <span className="text-gray-500 text-xs">🔥 {u.streak} streak</span>
                        <span className="text-gray-500 text-xs">✅ {u.onTimeSubmits} on time</span>
                        {u.lateSubmits > 0 && (
                          <span className="text-red-500 text-xs">💀 {u.lateSubmits} late</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-xl text-yellow-400">
                        {activeTab === 'xp' ? u.xp :
                         activeTab === 'streak' ? u.streak :
                         u.onTimeSubmits}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {activeTab === 'xp' ? 'XP' :
                         activeTab === 'streak' ? 'days' : 'submits'}
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-6">

          {/* Add Friend */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-white font-bold text-lg mb-1">👥 Add Friend</h3>
            <p className="text-gray-500 text-xs mb-4">Enter their DeadLine ID (DL-XXXXXX)</p>
            <input
              type="text"
              placeholder="DL-XXXXXX"
              value={deadlineId}
              onChange={e => setDeadlineId(e.target.value.toUpperCase())}
              maxLength={9}
              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-red-500 focus:outline-none mb-3 font-mono tracking-widest"
            />
            <button
              onClick={addFriend}
              disabled={addingFriend || deadlineId.length < 9}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition-all disabled:opacity-50"
            >
              {addingFriend ? 'Adding...' : '+ Add Friend'}
            </button>
            {message && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`text-sm mt-2 text-center ${messageType === 'success' ? 'text-green-400' : 'text-red-400'}`}
              >
                {message}
              </motion.p>
            )}
          </div>

          {/* Shame Wall */}
          <div className="bg-gray-900 border border-red-900 rounded-2xl p-5 overflow-hidden">
            <h3 className="text-white font-bold text-lg mb-2">🐶 Shame Wall</h3>
            <AnimatePresence mode="wait">
              <motion.p
                key={shameIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-red-400 text-xs italic mb-4"
              >
                "{SHAME_MESSAGES[shameIndex]}"
              </motion.p>
            </AnimatePresence>

            {shameUsers.length === 0 ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">😇</div>
                <p className="text-gray-500 text-sm">No one on shame wall!</p>
                <p className="text-gray-600 text-xs mt-1">Everyone submitting on time 👏</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shameUsers.map((u, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-red-950 border border-red-800 rounded-xl p-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">🐶</span>
                      <span className="text-white font-bold text-sm">
                        {u.name || 'Anonymous'} {u.userId === user?.id && '(You 😂)'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {getShameReasons(u).map((reason, j) => (
                        <p key={j} className="text-red-400 text-xs">• {reason}</p>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly Topper */}
          <div className="bg-gray-900 border border-yellow-900 rounded-2xl p-5">
            <h3 className="text-white font-bold text-lg mb-4">👑 Top Dog</h3>
            {sorted.length > 0 ? (
              <div className="text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-5xl mb-2"
                >
                  🏆
                </motion.div>
                <p className="text-yellow-400 font-black text-xl">
                  {sorted[0].name || 'Anonymous'}
                  {sorted[0].userId === user?.id && ' (You!)'}
                </p>
                <p className="text-gray-400 text-sm mt-1">⭐ {sorted[0].xp} XP</p>
                <p className="text-gray-500 text-xs mt-1">🔥 {sorted[0].streak} day streak</p>
                <p className="text-gray-500 text-xs">✅ {sorted[0].onTimeSubmits} on time submits</p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center">Submit on time to become top dog! 🏆</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

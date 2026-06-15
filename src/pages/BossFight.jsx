import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'

const BASE_URL = 'http://localhost:5001/api'

export default function BossFight() {
  const { user } = useUser()
  const [bossFights, setBossFights] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(null)

  useEffect(() => {
    if (user) {
      fetch(`${BASE_URL}/bossfight/${user.id}`)
        .then(r => r.json())
        .then(data => {
          setBossFights(Array.isArray(data) ? data : [])
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [user])

  const submitBoss = async (bossId) => {
    setSubmitting(bossId)
    try {
      const res = await fetch(`${BASE_URL}/bossfight/${bossId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userName: user.fullName })
      })
      const data = await res.json()
      setBossFights(prev => prev.map(b => b._id === bossId ? data.boss : b))
      if (data.allSubmitted) {
        alert('🎉 CLASS WON! Everyone gets +500 XP!')
      }
    } catch {
      alert('Error da!')
    }
    setSubmitting(null)
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <motion.div
        className="text-red-500 text-4xl font-black"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 1 }}
      >
        ⚔️ Loading Boss...
      </motion.div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white p-8">

      <div className="mb-8">
        <h1 className="text-3xl font-black">⚔️ Boss Fight</h1>
        <p className="text-gray-500 mt-1">5+ people, same deadline = BOSS FIGHT! 😂💀</p>
      </div>

      {/* How it works */}
      <div className="bg-gray-900 border border-yellow-800 rounded-2xl p-5 mb-8">
        <h2 className="text-yellow-400 font-bold mb-3">⚡ How Boss Fight Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: '👥', title: '5+ Students', desc: 'Same subject + same deadline = Boss spawns!' },
            { icon: '❤️', title: 'Shared Health Bar', desc: 'Each submission damages the boss!' },
            { icon: '🏆', title: 'Class Wins = +500 XP', desc: 'Everyone submits = massive XP boost! Miss = streak dies 💀' },
          ].map((item, i) => (
            <div key={i} className="bg-black rounded-xl p-4 border border-gray-800">
              <div className="text-3xl mb-2">{item.icon}</div>
              <p className="text-white font-bold text-sm">{item.title}</p>
              <p className="text-gray-500 text-xs mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Active Boss Fights */}
      {bossFights.length === 0 ? (
        <div className="text-center py-20 bg-gray-900 border border-gray-800 rounded-2xl">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-8xl mb-4"
          >
            👾
          </motion.div>
          <p className="text-gray-400 text-xl font-bold">No Boss Fights Active!</p>
          <p className="text-gray-500 text-sm mt-2">
            Need 5+ students with same subject deadline 😂
          </p>
          <p className="text-gray-600 text-xs mt-1">
            Add deadlines and get classmates to join!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {bossFights.map((boss, i) => {
            const myParticipant = boss.participants.find(p => p.userId === user?.id)
            const submitCount = boss.participants.filter(p => p.submitted).length
            const total = boss.participants.length
            const healthPercent = boss.healthBar

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 border border-red-800 rounded-2xl p-6 relative overflow-hidden"
              >
                {/* Background pulse */}
                <motion.div
                  className="absolute inset-0 bg-red-900 opacity-5"
                  animate={{ opacity: [0.03, 0.08, 0.03] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />

                {/* Boss header */}
                <div className="flex justify-between items-start mb-6 z-10 relative">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <motion.span
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-4xl"
                      >
                        👾
                      </motion.span>
                      <h2 className="text-white font-black text-2xl">{boss.subject} Boss</h2>
                    </div>
                    <p className="text-gray-400 text-sm">{boss.department} Department</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      Due: {new Date(boss.dueDate).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-400 font-black text-3xl">{healthPercent}%</p>
                    <p className="text-gray-500 text-xs">Boss HP</p>
                  </div>
                </div>

                {/* Health Bar */}
                <div className="mb-6 z-10 relative">
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>❤️ Boss Health</span>
                    <span>{submitCount}/{total} submitted</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-6 overflow-hidden">
                    <motion.div
                      className={`h-6 rounded-full flex items-center justify-end pr-2 ${
                        healthPercent > 60 ? 'bg-red-500' :
                        healthPercent > 30 ? 'bg-orange-500' : 'bg-green-500'
                      }`}
                      initial={{ width: '100%' }}
                      animate={{ width: `${healthPercent}%` }}
                      transition={{ duration: 1 }}
                    >
                      {healthPercent > 20 && (
                        <span className="text-white text-xs font-bold">{healthPercent}%</span>
                      )}
                    </motion.div>
                  </div>
                </div>

                {/* Participants */}
                <div className="mb-6 z-10 relative">
                  <p className="text-gray-400 text-sm mb-3">Participants ({total}):</p>
                  <div className="flex flex-wrap gap-2">
                    {boss.participants.map((p, j) => (
                      <div
                        key={j}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${
                          p.submitted
                            ? 'bg-green-900 text-green-300 border border-green-700'
                            : 'bg-gray-800 text-gray-400 border border-gray-700'
                        }`}
                      >
                        <span>{p.submitted ? '✅' : '⏳'}</span>
                        <span>{p.name || 'Anonymous'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* XP Pool */}
                <div className="bg-black rounded-xl p-4 mb-6 z-10 relative border border-gray-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-yellow-400 font-black text-2xl">+500 XP</p>
                      <p className="text-gray-500 text-xs">If class wins!</p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-400 font-bold">Streak Dies 💀</p>
                      <p className="text-gray-500 text-xs">If class fails</p>
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <div className="z-10 relative">
                  {myParticipant?.submitted ? (
                    <div className="w-full bg-green-900 border border-green-700 text-green-300 py-4 rounded-xl font-black text-lg text-center">
                      ✅ You submitted! Waiting for others...
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => submitBoss(boss._id)}
                      disabled={submitting === boss._id}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-4 rounded-xl font-black text-lg transition-all"
                    >
                      {submitting === boss._id ? '⚔️ Submitting...' : '⚔️ Submit & Damage Boss!'}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

const DEATH_MESSAGES = [
  "You have failed. As expected. 💀",
  "Professor inbox la sorry mail anuppu da 😂",
  "GG da, better luck next semester!",
  "Deadline killed you. Respawn? 💀",
  "Submit pannala... enna panuviya ipo? 😂",
  "RIP to your grades da 💀",
]

export default function DeathScreen({ deadlines, onDismiss }) {
  const [msgIndex, setMsgIndex] = useState(0)

  const expiredDeadlines = deadlines.filter(d => {
    const diff = new Date(d.dueDate) - Date.now()
    return diff <= 0 && d.progress < 100
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % DEATH_MESSAGES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  if (expiredDeadlines.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center"
      >
        {/* Background flash */}
        <motion.div
          className="absolute inset-0 bg-red-900"
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />

        {/* Skull */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, -5, 5, 0]
          }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-9xl mb-8 z-10"
        >
          💀
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-5xl font-black text-red-500 mb-4 z-10 text-center"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          DEADLINE EXPIRED
        </motion.h1>

        {/* Rotating message */}
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-gray-400 text-xl mb-8 z-10 text-center px-8"
          >
            {DEATH_MESSAGES[msgIndex]}
          </motion.p>
        </AnimatePresence>

        {/* Expired deadlines list */}
        <div className="z-10 mb-8 space-y-2 max-w-md w-full px-8">
          {expiredDeadlines.map((d, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-red-950 border border-red-800 rounded-xl p-3 flex justify-between"
            >
              <div>
                <p className="text-white font-bold text-sm">{d.title}</p>
                <p className="text-gray-400 text-xs">{d.subject}</p>
              </div>
              <div className="text-right">
                <p className="text-red-400 text-xs font-mono">EXPIRED</p>
                <p className="text-gray-500 text-xs">{d.progress}% done</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-4 z-10">
          <button
            onClick={onDismiss}
            className="border border-gray-700 text-gray-400 px-6 py-3 rounded-xl font-bold hover:bg-gray-900 transition-all"
          >
            😔 I know da...
          </button>
          <button
            onClick={() => {
              onDismiss()
              setTimeout(() => {
                document.querySelector('[data-add-deadline]')?.click()
              }, 100)
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold transition-all hover:scale-105"
          >
            💀 Respawn - Add New
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background flicker */}
      <motion.div
        className="absolute inset-0 bg-red-900 opacity-10"
        animate={{ opacity: [0.05, 0.15, 0.05] }}
        transition={{ repeat: Infinity, duration: 2 }}
      />

      {/* Logo */}
      <motion.h1
        className="text-7xl font-black tracking-tight mb-4 z-10"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        💀 Dead<span className="text-red-500">Line</span>
      </motion.h1>

      {/* Tagline */}
      <motion.p
        className="text-xl text-gray-400 mb-12 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Don't miss it. Or else.
      </motion.p>

      {/* Buttons */}
      <motion.div
        className="flex gap-4 z-10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <button
          onClick={() => navigate('/register')}
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-bold text-lg transition-all hover:scale-105"
        >
          Get Started
        </button>
        <button
          onClick={() => navigate('/login')}
          className="border border-gray-600 hover:border-red-500 text-gray-300 px-8 py-3 rounded-lg font-bold text-lg transition-all hover:scale-105"
        >
          Login
        </button>
      </motion.div>

      {/* Features */}
      <motion.div
        className="mt-20 grid grid-cols-3 gap-8 z-10 px-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        {[
          { icon: "⏰", title: "Live Countdown", desc: "Watch your time disappear" },
          { icon: "🔥", title: "Panic Mode", desc: "UI breaks down with you" },
          { icon: "🏆", title: "Leaderboard", desc: "Who submitted on time?" },
        ].map((f, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center hover:border-red-500 transition-all">
            <div className="text-4xl mb-3">{f.icon}</div>
            <h3 className="font-bold text-lg mb-2">{f.title}</h3>
            <p className="text-gray-500 text-sm">{f.desc}</p>
          </div>
        ))}
      </motion.div>
    </div>
  )
}
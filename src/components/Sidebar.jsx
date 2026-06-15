import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { UserButton, useUser } from '@clerk/clerk-react'
import { useState } from 'react'

const navItems = [
  { path: '/dashboard', icon: '💀', label: 'Dashboard' },
  { path: '/calendar', icon: '📅', label: 'Calendar' },
  { path: '/pomodoro', icon: '🍅', label: 'Pomodoro' },
  { path: '/focus', icon: '🌙', label: 'Focus Mode' },
  { path: '/analytics', icon: '📈', label: 'Analytics' },
  { path: '/mood', icon: '😊', label: 'Mood Tracker' },
  { path: '/studybuddy', icon: '🤝', label: 'Study Buddy' },
  { path: '/bossfight', icon: '⚔️', label: 'Boss Fight' },
  { path: '/shop', icon: '🛒', label: 'XP Shop' },
  { path: '/shamefeed', icon: '📢', label: 'Shame Feed' },
  { path: '/leaderboard', icon: '🏆', label: 'Leaderboard' },
  { path: '/settings', icon: '⚙️', label: 'Settings' },
]

export default function Sidebar() {
  const { user } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-800 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white">
            💀 Dead<span className="text-red-500">Line</span>
          </h1>
          <p className="text-gray-600 text-xs mt-1">Don't miss it. Or else.</p>
        </div>
        <button 
          onClick={() => setMobileOpen(false)}
          className="md:hidden text-gray-500 hover:text-white text-2xl p-2"
        >
          ✕
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile Bottom */}
      <div className="px-4 py-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-900">
          <UserButton afterSignOutUrl="/" />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-gray-500 text-xs truncate">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
        </div>
        <p className="text-gray-700 text-xs text-center mt-3">DeadLine v1.0 💀</p>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-gray-950 border-r border-gray-800 z-20 flex-col"
      >
        <SidebarContent />
      </motion.div>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-gray-950 border-b border-gray-800 px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-black text-white">
          💀 Dead<span className="text-red-500">Line</span>
        </h1>
        <div className="flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-white text-2xl p-1"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-black bg-opacity-70 z-30"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'tween' }}
              className="md:hidden fixed left-0 top-0 h-full w-72 bg-gray-950 border-r border-gray-800 z-40 flex flex-col"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

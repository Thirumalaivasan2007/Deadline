import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchDeadlines } from '../api/deadlineApi'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getPanicLevel(dueDate) {
  const diff = new Date(dueDate) - Date.now()
  const hours = diff / (1000 * 60 * 60)
  if (hours <= 0) return 'expired'
  if (hours <= 2) return 'critical'
  if (hours <= 24) return 'high'
  if (hours <= 72) return 'medium'
  return 'calm'
}

const panicColors = {
  expired: 'bg-gray-500',
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  calm: 'bg-green-500'
}

const panicBorder = {
  expired: 'border-gray-500',
  critical: 'border-red-500',
  high: 'border-orange-500',
  medium: 'border-yellow-500',
  calm: 'border-green-500'
}

export default function Calendar() {
  const { user } = useUser()
  const [deadlines, setDeadlines] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedDeadlines, setSelectedDeadlines] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchDeadlines(user.id).then(data => {
        setDeadlines(Array.isArray(data) ? data : [])
        setLoading(false)
      })
    }
  }, [user])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const getDeadlinesForDay = (day) => {
    return deadlines.filter(d => {
      const date = new Date(d.dueDate)
      return date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
    })
  }

  const handleDayClick = (day) => {
    setSelectedDay(day)
    setSelectedDeadlines(getDeadlinesForDay(day))
  }

  const today = new Date()
  const isToday = (day) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day

  // Build calendar grid
  const cells = []

  // Prev month days
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, current: false })
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ day: i, current: true })
  }

  // Next month days
  const remaining = 42 - cells.length
  for (let i = 1; i <= remaining; i++) {
    cells.push({ day: i, current: false })
  }

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
        <h1 className="text-3xl font-black">📅 Calendar</h1>
        <p className="text-gray-500 mt-1">See when you're going to panic 💀</p>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {[
          { color: 'bg-green-500', label: 'Calm (3+ days)' },
          { color: 'bg-yellow-500', label: 'Medium (1-3 days)' },
          { color: 'bg-orange-500', label: 'High (< 24 hrs)' },
          { color: 'bg-red-500', label: 'Critical (< 2 hrs)' },
          { color: 'bg-gray-500', label: 'Expired' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${item.color}`} />
            <span className="text-gray-400 text-xs">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Calendar */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6">

          {/* Month navigation */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={prevMonth}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-bold transition-all"
            >
              ← Prev
            </button>
            <h2 className="text-xl font-black">
              {MONTHS[month]} {year}
            </h2>
            <button
              onClick={nextMonth}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-bold transition-all"
            >
              Next →
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-gray-500 text-xs font-bold py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, i) => {
              const dayDeadlines = cell.current ? getDeadlinesForDay(cell.day) : []
              const isSelected = selectedDay === cell.day && cell.current

              return (
                <motion.div
                  key={i}
                  whileHover={cell.current ? { scale: 1.05 } : {}}
                  onClick={() => cell.current && handleDayClick(cell.day)}
                  className={`
                    relative min-h-[60px] p-1 rounded-lg cursor-pointer transition-all
                    ${!cell.current ? 'opacity-20' : ''}
                    ${isToday(cell.day) && cell.current ? 'border-2 border-red-500' : 'border border-gray-800'}
                    ${isSelected ? 'bg-gray-700' : cell.current ? 'hover:bg-gray-800' : ''}
                  `}
                >
                  <span className={`text-xs font-bold ${isToday(cell.day) && cell.current ? 'text-red-400' : 'text-gray-300'}`}>
                    {cell.day}
                  </span>

                  {/* Deadline dots */}
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    {dayDeadlines.slice(0, 3).map((d, j) => (
                      <div
                        key={j}
                        className={`w-2 h-2 rounded-full ${panicColors[getPanicLevel(d.dueDate)]}`}
                        title={d.title}
                      />
                    ))}
                    {dayDeadlines.length > 3 && (
                      <span className="text-gray-500 text-xs">+{dayDeadlines.length - 3}</span>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Selected day panel */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-white font-bold text-lg mb-4">
            {selectedDay
              ? `📋 ${selectedDay} ${MONTHS[month]}`
              : '📋 Click a day'}
          </h3>

          <AnimatePresence mode="wait">
            {selectedDeadlines.length > 0 ? (
              <motion.div
                key={selectedDay}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                {selectedDeadlines.map((d, i) => {
                  const panic = getPanicLevel(d.dueDate)
                  return (
                    <div
                      key={i}
                      className={`border ${panicBorder[panic]} bg-black rounded-xl p-4`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white font-bold">{d.title}</h4>
                        <span className={`${panicColors[panic]} text-white text-xs px-2 py-0.5 rounded-full`}>
                          {panic.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">{d.subject}</p>
                      <p className="text-gray-500 text-xs mt-1 font-mono">
                        {new Date(d.dueDate).toLocaleTimeString()}
                      </p>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{d.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${panicColors[panic]}`}
                            style={{ width: `${d.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                {selectedDay ? (
                  <>
                    <div className="text-4xl mb-2">😌</div>
                    <p className="text-gray-500">No deadlines this day!</p>
                    <p className="text-gray-600 text-sm mt-1">Lucky da 😂</p>
                  </>
                ) : (
                  <>
                    <div className="text-4xl mb-2">👆</div>
                    <p className="text-gray-500">Click any day to see deadlines</p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Monthly overview */}
      <div className="mt-6 bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="text-white font-bold text-lg mb-4">📊 This Month Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Deadlines', value: deadlines.filter(d => {
              const date = new Date(d.dueDate)
              return date.getFullYear() === year && date.getMonth() === month
            }).length, color: 'text-white', icon: '📋' },
            { label: 'Expired', value: deadlines.filter(d => {
              const date = new Date(d.dueDate)
              return date.getFullYear() === year && date.getMonth() === month && getPanicLevel(d.dueDate) === 'expired'
            }).length, color: 'text-gray-400', icon: '💀' },
            { label: 'Critical', value: deadlines.filter(d => {
              const date = new Date(d.dueDate)
              return date.getFullYear() === year && date.getMonth() === month && getPanicLevel(d.dueDate) === 'critical'
            }).length, color: 'text-red-400', icon: '🔥' },
            { label: 'Calm', value: deadlines.filter(d => {
              const date = new Date(d.dueDate)
              return date.getFullYear() === year && date.getMonth() === month && getPanicLevel(d.dueDate) === 'calm'
            }).length, color: 'text-green-400', icon: '✅' },
          ].map((stat, i) => (
            <div key={i} className="bg-black border border-gray-800 rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-gray-500 text-xs mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

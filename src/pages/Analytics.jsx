import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import { fetchDeadlines, fetchUserStats } from '../api/deadlineApi'

function getHeatmapData(deadlines) {
  const data = {}
  deadlines.forEach(d => {
    const date = new Date(d.dueDate).toISOString().split('T')[0]
    if (!data[date]) data[date] = 0
    data[date]++
  })
  return data
}

function getColor(count) {
  if (count === 0) return 'bg-gray-800'
  if (count === 1) return 'bg-green-900'
  if (count === 2) return 'bg-green-700'
  if (count === 3) return 'bg-orange-600'
  return 'bg-red-600'
}

function Heatmap({ deadlines }) {
  const heatmapData = getHeatmapData(deadlines)

  // Generate last 12 weeks
  const weeks = []
  const today = new Date()
  const start = new Date(today)
  start.setDate(start.getDate() - 83) // 12 weeks back

  for (let w = 0; w < 12; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(start)
      date.setDate(start.getDate() + w * 7 + d)
      const dateStr = date.toISOString().split('T')[0]
      week.push({
        date: dateStr,
        count: heatmapData[dateStr] || 0,
        day: date.getDate(),
        month: date.toLocaleString('default', { month: 'short' })
      })
    }
    weeks.push(week)
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h2 className="text-white font-bold text-lg mb-2">📊 Deadline Heatmap</h2>
      <p className="text-gray-500 text-sm mb-6">GitHub style - how busy were you 😂</p>

      {/* Legend */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-gray-500 text-xs">Less</span>
        {['bg-gray-800', 'bg-green-900', 'bg-green-700', 'bg-orange-600', 'bg-red-600'].map((c, i) => (
          <div key={i} className={`w-4 h-4 rounded-sm ${c}`} />
        ))}
        <span className="text-gray-500 text-xs">More</span>
      </div>

      {/* Heatmap grid */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => (
              <motion.div
                key={di}
                whileHover={{ scale: 1.5 }}
                title={`${day.date}: ${day.count} deadline${day.count !== 1 ? 's' : ''}`}
                className={`w-4 h-4 rounded-sm ${getColor(day.count)} cursor-pointer transition-all`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Month labels */}
      <div className="flex gap-1 mt-2 overflow-x-auto">
        {weeks.map((week, wi) => (
          <div key={wi} className="w-4 text-center">
            {week[0].day <= 7 && (
              <span className="text-gray-600 text-xs">{week[0].month}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function SubjectAnalysis({ deadlines }) {
  const subjects = {}
  deadlines.forEach(d => {
    if (!subjects[d.subject]) {
      subjects[d.subject] = { total: 0, completed: 0, avgProgress: 0, totalProgress: 0 }
    }
    subjects[d.subject].total++
    subjects[d.subject].totalProgress += d.progress
    if (d.progress === 100) subjects[d.subject].completed++
  })

  Object.keys(subjects).forEach(s => {
    subjects[s].avgProgress = Math.round(subjects[s].totalProgress / subjects[s].total)
  })

  const sorted = Object.entries(subjects).sort((a, b) => b[1].total - a[1].total)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h2 className="text-white font-bold text-lg mb-4">📚 Subject Analysis</h2>
      {sorted.length === 0 ? (
        <p className="text-gray-500 text-sm">No data yet da! Add deadlines first 💀</p>
      ) : (
        <div className="space-y-4">
          {sorted.map(([subject, data], i) => (
            <div key={i}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-white font-semibold text-sm">{subject}</span>
                <div className="flex gap-3">
                  <span className="text-gray-400 text-xs">{data.total} tasks</span>
                  <span className="text-green-400 text-xs">{data.completed} done</span>
                </div>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <motion.div
                  className={`h-2 rounded-full ${
                    data.avgProgress >= 70 ? 'bg-green-500' :
                    data.avgProgress >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${data.avgProgress}%` }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                />
              </div>
              <p className="text-gray-600 text-xs mt-0.5">Avg progress: {data.avgProgress}%</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Analytics() {
  const { user } = useUser()
  const [deadlines, setDeadlines] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchDeadlines(user.id),
        fetchUserStats(user.id)
      ]).then(([d, s]) => {
        setDeadlines(Array.isArray(d) ? d : [])
        setStats(s)
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [user])

  const onTimeRate = stats?.totalSubmitted > 0
    ? Math.round((stats.onTimeSubmits / stats.totalSubmitted) * 100)
    : 0

  const completed = deadlines.filter(d => d.progress === 100).length
  const pending = deadlines.filter(d => d.progress < 100).length

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
        <h1 className="text-3xl font-black">📈 Analytics</h1>
        <p className="text-gray-500 mt-1">How badly are you doing? Let's see 😂</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: '📋', label: 'Total Deadlines', value: deadlines.length, color: 'text-white' },
          { icon: '✅', label: 'Completed', value: completed, color: 'text-green-400' },
          { icon: '⏳', label: 'Pending', value: pending, color: 'text-yellow-400' },
          { icon: '🎯', label: 'On-Time Rate', value: `${onTimeRate}%`, color: onTimeRate >= 70 ? 'text-green-400' : 'text-red-400' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center"
          >
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-gray-500 text-xs mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* On time rate bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-white font-bold text-lg">🎯 On-Time Submission Rate</h2>
          <span className={`text-2xl font-black ${onTimeRate >= 70 ? 'text-green-400' : onTimeRate >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
            {onTimeRate}%
          </span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-4">
          <motion.div
            className={`h-4 rounded-full ${
              onTimeRate >= 70 ? 'bg-green-500' :
              onTimeRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${onTimeRate}%` }}
            transition={{ duration: 1.5 }}
          />
        </div>
        <p className="text-gray-500 text-sm mt-2">
          {onTimeRate >= 70 ? '🎉 Nee nalla student da!' :
           onTimeRate >= 40 ? '😐 Average ah iruka, improve pannu' :
           '💀 Bro... seriously improve pannanum da'}
        </p>
      </div>

      {/* XP Progress */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <h2 className="text-white font-bold text-lg mb-4">⭐ XP & Level Progress</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl font-black text-purple-400">Lv.{stats?.level || 1}</div>
            <div className="text-gray-500 text-sm mt-1">Current Level</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black text-yellow-400">⭐{stats?.xp || 0}</div>
            <div className="text-gray-500 text-sm mt-1">Total XP</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black text-orange-400">🔥{stats?.streak || 0}</div>
            <div className="text-gray-500 text-sm mt-1">Day Streak</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress to Lv.{(stats?.level || 1) + 1}</span>
            <span>{(stats?.xp || 0) % 200}/200 XP</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3">
            <motion.div
              className="h-3 rounded-full bg-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${((stats?.xp || 0) % 200) / 200 * 100}%` }}
              transition={{ duration: 1.5 }}
            />
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="mb-6">
        <Heatmap deadlines={deadlines} />
      </div>

      {/* Subject Analysis */}
      <SubjectAnalysis deadlines={deadlines} />
    </div>
  )
}

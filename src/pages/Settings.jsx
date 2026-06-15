import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import { fetchUserStats } from '../api/deadlineApi'

const BASE_URL = 'http://localhost:5001/api'

const THEMES = [
  {
    id: 'dark-panic',
    name: '💀 Dark Panic',
    desc: 'Default - Dark + Red panic animations',
    preview: 'bg-black border-red-500',
    accent: 'bg-red-600'
  },
  {
    id: 'vscode',
    name: '💻 VSCode',
    desc: 'Classic developer dark theme',
    preview: 'bg-gray-900 border-blue-500',
    accent: 'bg-blue-600'
  },
  {
    id: 'midnight',
    name: '🌙 Midnight',
    desc: 'Deep purple midnight vibes',
    preview: 'bg-purple-950 border-purple-500',
    accent: 'bg-purple-600'
  },
  {
    id: 'matrix',
    name: '🟢 Matrix',
    desc: 'Green on black hacker mode',
    preview: 'bg-black border-green-500',
    accent: 'bg-green-600'
  }
]

const DEPARTMENTS = [
  'CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIDS', 'AIML', 'CSD', 'Other'
]

const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8']

export default function Settings() {
  const { user } = useUser()
  const [myStats, setMyStats] = useState(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('dark-panic')

  const [profile, setProfile] = useState({
    name: '',
    college: '',
    department: 'CSE',
    semester: '4',
    rollNo: ''
  })

  const [notifications, setNotifications] = useState({
    browser: true,
    email: false,
    oneDayBefore: true,
    oneHourBefore: true,
    atDeadline: true
  })

  useEffect(() => {
    if (user) {
      fetchUserStats(user.id, user.fullName, user.primaryEmailAddress?.emailAddress)
        .then(data => {
          setMyStats(data)
          setProfile({
            name: data.name || user.fullName || '',
            college: data.college || '',
            department: data.department || 'CSE',
            semester: data.semester || '4',
            rollNo: data.rollNo || ''
          })
          if (data.theme) setSelectedTheme(data.theme)
          if (data.notifications) setNotifications(data.notifications)
        })
    }
  }, [user])

  const saveProfile = async () => {
    setSaving(true)
    try {
      await fetch(`${BASE_URL}/user/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          college: profile.college,
          department: profile.department,
          semester: profile.semester,
          rollNo: profile.rollNo,
          theme: selectedTheme,
          notifications
        })
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      alert('Error saving da!')
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black">⚙️ Settings</h1>
        <p className="text-gray-500 mt-1">Customize your DeadLine experience 💀</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {[
          { key: 'profile', label: '👤 Profile' },
          { key: 'theme', label: '🎨 Theme' },
          { key: 'notifications', label: '🔔 Notifications' },
          { key: 'account', label: '🔐 Account' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${
              activeTab === tab.key
                ? 'bg-red-600 text-white'
                : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl space-y-6"
        >
          {/* Avatar */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg mb-4">Profile Picture</h2>
            <div className="flex items-center gap-4">
              <img
                src={user?.imageUrl}
                alt="Profile"
                className="w-20 h-20 rounded-full border-2 border-red-500"
              />
              <div>
                <p className="text-white font-bold">{user?.fullName}</p>
                <p className="text-gray-400 text-sm">{user?.primaryEmailAddress?.emailAddress}</p>
                <p className="text-gray-500 text-xs mt-1">
                  DeadLine ID: <span className="text-yellow-400 font-mono font-bold">{myStats?.deadlineId}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-bold text-lg mb-2">Personal Info</h2>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">Display Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={e => setProfile({ ...profile, name: e.target.value })}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">College</label>
              <input
                type="text"
                value={profile.college}
                onChange={e => setProfile({ ...profile, college: e.target.value })}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                placeholder="Eg: Velalar College of Engineering"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Department</label>
                <select
                  value={profile.department}
                  onChange={e => setProfile({ ...profile, department: e.target.value })}
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Semester</label>
                <select
                  value={profile.semester}
                  onChange={e => setProfile({ ...profile, semester: e.target.value })}
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                >
                  {SEMESTERS.map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">Roll Number</label>
              <input
                type="text"
                value={profile.rollNo}
                onChange={e => setProfile({ ...profile, rollNo: e.target.value })}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                placeholder="Eg: 22CSE001"
              />
            </div>
          </div>

          <button
            onClick={saveProfile}
            disabled={saving}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-50"
          >
            {saving ? '💾 Saving...' : saved ? '✅ Saved!' : '💾 Save Changes'}
          </button>
        </motion.div>
      )}

      {/* Theme Tab */}
      {activeTab === 'theme' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl"
        >
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg mb-2">Choose Theme</h2>
            <p className="text-gray-500 text-sm mb-6">Pick your vibe 😄</p>

            <div className="grid grid-cols-2 gap-4">
              {THEMES.map(theme => (
                <motion.div
                  key={theme.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    selectedTheme === theme.id
                      ? 'border-red-500 bg-gray-800'
                      : 'border-gray-700 hover:border-gray-500'
                  }`}
                >
                  {/* Theme preview */}
                  <div className={`border-2 ${theme.preview} rounded-lg p-3 mb-3 h-16 flex items-end`}>
                    <div className={`${theme.accent} h-2 rounded w-3/4`} />
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-bold text-sm">{theme.name}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{theme.desc}</p>
                    </div>
                    {selectedTheme === theme.id && (
                      <span className="text-green-400 text-lg">✅</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-4 bg-yellow-900 bg-opacity-30 border border-yellow-800 rounded-xl p-4">
              <p className="text-yellow-400 text-sm">
                🚧 Theme switching coming soon da! Save pannina next update la apply aagum 😄
              </p>
            </div>

            <button
              onClick={saveProfile}
              disabled={saving}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-50 w-full"
            >
              {saving ? '💾 Saving...' : saved ? '✅ Theme Saved!' : '💾 Save Theme'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl"
        >
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-bold text-lg mb-4">Notification Settings</h2>

            {[
              { key: 'browser', label: '🌐 Browser Notifications', desc: 'Push notifications in browser' },
              { key: 'email', label: '📧 Email Digest', desc: 'Daily morning deadline summary' },
              { key: 'oneDayBefore', label: '📅 1 Day Before', desc: 'Remind 24 hours before deadline' },
              { key: 'oneHourBefore', label: '⏰ 1 Hour Before', desc: 'Remind 1 hour before deadline' },
              { key: 'atDeadline', label: '💀 At Deadline', desc: 'Notify exactly when deadline hits' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-white font-semibold">{item.label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                  className={`relative w-12 h-6 rounded-full transition-all ${
                    notifications[item.key] ? 'bg-red-500' : 'bg-gray-700'
                  }`}
                >
                  <motion.div
                    animate={{ x: notifications[item.key] ? 24 : 2 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full"
                  />
                </button>
              </div>
            ))}

            <button
              onClick={saveProfile}
              disabled={saving}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-50 w-full"
            >
              {saving ? '💾 Saving...' : saved ? '✅ Saved!' : '💾 Save Notifications'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Account Tab */}
      {activeTab === 'account' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl space-y-4"
        >
          {/* Stats Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg mb-4">📊 Your Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Total Submitted', value: myStats?.totalSubmitted || 0, icon: '📋' },
                { label: 'On Time', value: myStats?.onTimeSubmits || 0, icon: '✅' },
                { label: 'Late Submits', value: myStats?.lateSubmits || 0, icon: '💀' },
                { label: 'Total XP', value: myStats?.xp || 0, icon: '⭐' },
                { label: 'Current Level', value: `Lv.${myStats?.level || 1}`, icon: '🎮' },
                { label: 'Best Streak', value: `${myStats?.streak || 0} days`, icon: '🔥' },
              ].map((stat, i) => (
                <div key={i} className="bg-black border border-gray-800 rounded-xl p-4">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="text-white font-black text-xl">{stat.value}</div>
                  <div className="text-gray-500 text-xs mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* On-time rate */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg mb-4">🎯 On-Time Rate</h2>
            <div className="text-center mb-4">
              <span className="text-5xl font-black text-green-400">
                {myStats?.totalSubmitted > 0
                  ? Math.round((myStats.onTimeSubmits / myStats.totalSubmitted) * 100)
                  : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3">
              <motion.div
                className="h-3 rounded-full bg-green-500"
                initial={{ width: 0 }}
                animate={{
                  width: `${myStats?.totalSubmitted > 0
                    ? Math.round((myStats.onTimeSubmits / myStats.totalSubmitted) * 100)
                    : 0}%`
                }}
                transition={{ duration: 1.5 }}
              />
            </div>
            <p className="text-gray-500 text-sm text-center mt-3">
              {myStats?.onTimeSubmits || 0} on time out of {myStats?.totalSubmitted || 0} total
            </p>
          </div>

          {/* Danger zone */}
          <div className="bg-gray-900 border border-red-900 rounded-2xl p-6">
            <h2 className="text-red-400 font-bold text-lg mb-4">⚠️ Danger Zone</h2>
            <p className="text-gray-500 text-sm mb-4">These actions cannot be undone da!</p>
            <button
              onClick={() => {
                if (confirm('XP reset pannuviya? Sure ah? 💀')) {
                  fetch(`${BASE_URL}/user/${user.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ xp: 0, streak: 0, level: 1, totalSubmitted: 0, onTimeSubmits: 0, lateSubmits: 0 })
                  }).then(() => window.location.reload())
                }
              }}
              className="border border-red-700 text-red-400 px-6 py-2 rounded-lg font-bold hover:bg-red-900 transition-all text-sm"
            >
              🔄 Reset All Stats
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchDeadlines } from '../api/deadlineApi'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

export default function StudyBuddy() {
  const { user } = useUser()
  const [myDeadlines, setMyDeadlines] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [myStats, setMyStats] = useState(null)
  const [activeTab, setActiveTab] = useState('matches')

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchDeadlines(user.id),
        fetch(`${BASE_URL}/user/${user.id}`).then(r => r.json())
      ]).then(([deadlines, stats]) => {
        const active = Array.isArray(deadlines)
          ? deadlines.filter(d => new Date(d.dueDate) > Date.now())
          : []
        setMyDeadlines(active)
        setMyStats(stats)

        // Find matches
        if (active.length > 0) {
          fetch(`${BASE_URL}/studybuddy/matches`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              subjects: active.map(d => d.subject),
              deadlines: active.map(d => ({
                subject: d.subject,
                dueDate: d.dueDate
              }))
            })
          }).then(r => r.json())
            .then(data => {
              setMatches(Array.isArray(data) ? data : [])
              setLoading(false)
            })
            .catch(() => setLoading(false))
        } else {
          setLoading(false)
        }
      }).catch(() => setLoading(false))
    }
  }, [user])

  const loadMessages = async (matchUserId) => {
    try {
      const res = await fetch(`${BASE_URL}/studybuddy/messages/${user.id}/${matchUserId}`)
      const data = await res.json()
      setMessages(Array.isArray(data) ? data : [])
    } catch {
      setMessages([])
    }
  }

  const selectMatch = (match) => {
    setSelectedMatch(match)
    loadMessages(match.userId)
    setActiveTab('chat')
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedMatch) return
    setSending(true)
    try {
      await fetch(`${BASE_URL}/studybuddy/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromId: user.id,
          toId: selectedMatch.userId,
          fromName: user.fullName,
          message: newMessage
        })
      })
      setMessages(prev => [...prev, {
        fromId: user.id,
        fromName: user.fullName,
        message: newMessage,
        createdAt: new Date()
      }])
      setNewMessage('')
    } catch {
      alert('Message send aagala da!')
    }
    setSending(false)
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
        <h1 className="text-3xl font-black">🤝 Study Buddy</h1>
        <p className="text-gray-500 mt-1">Find someone suffering like you 😂</p>
      </div>

      {/* My Subjects */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
        <h2 className="text-white font-bold mb-3">📚 Your Active Subjects</h2>
        {myDeadlines.length === 0 ? (
          <p className="text-gray-500 text-sm">No active deadlines da! Add some first 💀</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {[...new Set(myDeadlines.map(d => d.subject))].map((subject, i) => (
              <span
                key={i}
                className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold"
              >
                {subject}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'matches', label: '🎯 Matches' },
          { key: 'chat', label: `💬 Chat ${selectedMatch ? `- ${selectedMatch.name}` : ''}` },
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

      {/* Matches Tab */}
      {activeTab === 'matches' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {matches.length === 0 ? (
            <div className="text-center py-20 bg-gray-900 border border-gray-800 rounded-2xl">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-400 text-xl font-bold">No matches found da!</p>
              <p className="text-gray-500 text-sm mt-2">
                No one has same subject deadlines right now 😂
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Matches appear when others add same subject deadlines
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-gray-900 border border-gray-800 hover:border-red-500 rounded-2xl p-5 transition-all"
                >
                  {/* User info */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black text-lg">
                      {match.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-white font-bold">{match.name || 'Anonymous'}</p>
                      <p className="text-gray-500 text-xs">
                        {match.college || 'Unknown College'}
                      </p>
                      <p className="text-gray-600 text-xs">
                        {match.department} • Sem {match.semester}
                      </p>
                    </div>
                  </div>

                  {/* Common subjects */}
                  <div className="mb-4">
                    <p className="text-gray-400 text-xs mb-2">Common subjects:</p>
                    <div className="flex flex-wrap gap-1">
                      {match.commonSubjects?.map((s, j) => (
                        <span
                          key={j}
                          className="bg-green-900 text-green-300 text-xs px-2 py-0.5 rounded-full"
                        >
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-3 mb-4">
                    <span className="text-gray-500 text-xs">⭐ {match.xp || 0} XP</span>
                    <span className="text-gray-500 text-xs">🔥 {match.streak || 0} streak</span>
                  </div>

                  {/* Connect button */}
                  <button
                    onClick={() => selectMatch(match)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl font-bold text-sm transition-all hover:scale-105"
                  >
                    💬 Chat with {match.name?.split(' ')[0] || 'them'}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {!selectedMatch ? (
            <div className="text-center py-20 bg-gray-900 border border-gray-800 rounded-2xl">
              <div className="text-5xl mb-3">💬</div>
              <p className="text-gray-400">Select a match to chat da!</p>
              <button
                onClick={() => setActiveTab('matches')}
                className="mt-4 bg-red-600 text-white px-6 py-2 rounded-xl font-bold text-sm"
              >
                Go to Matches
              </button>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

              {/* Chat header */}
              <div className="border-b border-gray-800 px-6 py-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black">
                  {selectedMatch.name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="text-white font-bold">{selectedMatch.name}</p>
                  <p className="text-gray-500 text-xs">
                    Common: {selectedMatch.commonSubjects?.join(', ')}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedMatch(null); setActiveTab('matches') }}
                  className="ml-auto text-gray-600 hover:text-gray-400 transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Messages */}
              <div className="h-96 overflow-y-auto p-6 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No messages yet da!</p>
                    <p className="text-gray-600 text-sm mt-1">
                      Say hi and study together 😄
                    </p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.fromId === user.id
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs px-4 py-2 rounded-2xl ${
                          isMe
                            ? 'bg-red-600 text-white rounded-br-sm'
                            : 'bg-gray-800 text-white rounded-bl-sm'
                        }`}>
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-xs mt-1 ${isMe ? 'text-red-200' : 'text-gray-500'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>

              {/* Message input */}
              <div className="border-t border-gray-800 p-4 flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message da..."
                  className="flex-1 bg-black border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-600 focus:border-red-500 focus:outline-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-2 rounded-xl font-bold transition-all"
                >
                  {sending ? '...' : '➤'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

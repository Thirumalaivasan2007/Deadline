import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchUserStats } from '../api/deadlineApi'

const BASE_URL = 'http://localhost:5001/api'

const SHOP_ITEMS = [
  {
    id: 'fake-scare',
    name: '😱 Fake Scare',
    desc: 'Send a jump-scare notification to a friend - "Deadline in 5 mins!" 😂',
    cost: 100,
    emoji: '😱',
    color: 'border-orange-500 bg-orange-950',
    badge: 'bg-orange-500'
  },
  {
    id: 'streak-freeze',
    name: '🛡️ Streak Freeze',
    desc: 'Save your streak for today even if you miss a submission!',
    cost: 200,
    emoji: '🛡️',
    color: 'border-blue-500 bg-blue-950',
    badge: 'bg-blue-500'
  },
]

export default function XPShop() {
  const { user } = useUser()
  const [myStats, setMyStats] = useState(null)
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(null)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [showFriendPicker, setShowFriendPicker] = useState(false)

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchUserStats(user.id, user.fullName),
        fetch(`${BASE_URL}/leaderboard/${user.id}`).then(r => r.json())
      ]).then(([stats, board]) => {
        setMyStats(stats)
        const friendList = Array.isArray(board)
          ? board.filter(u => u.userId !== user.id)
          : []
        setFriends(friendList)
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [user])

  const buyItem = async (item) => {
    if (!myStats || myStats.xp < item.cost) {
      setMessage(`Not enough XP da! Need ${item.cost} XP 😂`)
      setMessageType('error')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    if (item.id === 'fake-scare') {
      setShowFriendPicker(true)
      setBuying(item.id)
      return
    }

    // Streak freeze
    setBuying(item.id)
    try {
      const res = await fetch(`${BASE_URL}/shop/streak-freeze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      const data = await res.json()
      if (data.success) {
        setMessage('🛡️ Streak frozen for today!')
        setMessageType('success')
        setMyStats(prev => ({ ...prev, xp: prev.xp - 200 }))
      } else {
        setMessage(data.error)
        setMessageType('error')
      }
    } catch {
      setMessage('Error da!')
      setMessageType('error')
    }
    setBuying(null)
    setTimeout(() => setMessage(''), 3000)
  }

  const sendFakeScare = async () => {
    if (!selectedFriend) return
    try {
      const res = await fetch(`${BASE_URL}/shop/fake-scare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          targetUserId: selectedFriend.userId,
          targetName: selectedFriend.name
        })
      })
      const data = await res.json()
      if (data.success) {
        setMessage(`😱 Fake scare sent to ${selectedFriend.name}! 😂`)
        setMessageType('success')
        setMyStats(prev => ({ ...prev, xp: prev.xp - 100 }))
      } else {
        setMessage(data.error)
        setMessageType('error')
      }
    } catch {
      setMessage('Error da!')
      setMessageType('error')
    }
    setShowFriendPicker(false)
    setSelectedFriend(null)
    setBuying(null)
    setTimeout(() => setMessage(''), 3000)
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <motion.div
        className="text-yellow-400 text-4xl font-black"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 1 }}
      >
        🛒 Loading Shop...
      </motion.div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white p-8">

      <div className="mb-8">
        <h1 className="text-3xl font-black">🛒 XP Shop</h1>
        <p className="text-gray-500 mt-1">Spend your hard-earned XP on chaos 😂</p>
      </div>

      {/* XP Balance */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-yellow-900 to-orange-900 border border-yellow-700 rounded-2xl p-6 mb-8"
      >
        <p className="text-yellow-200 text-sm mb-1">Your Balance</p>
        <div className="flex items-center gap-3">
          <span className="text-5xl font-black text-yellow-400">⭐ {myStats?.xp || 0}</span>
          <div>
            <p className="text-yellow-200 text-sm">XP</p>
            <p className="text-yellow-600 text-xs">Level {myStats?.level || 1}</p>
          </div>
        </div>
      </motion.div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-6 p-4 rounded-xl font-bold text-center ${
              messageType === 'success'
                ? 'bg-green-900 border border-green-700 text-green-300'
                : 'bg-red-900 border border-red-700 text-red-300'
            }`}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shop Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {SHOP_ITEMS.map(item => (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.02 }}
            className={`border-2 ${item.color} rounded-2xl p-6`}
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-5xl">{item.emoji}</span>
              <span className={`${item.badge} text-white px-3 py-1 rounded-full font-black text-sm`}>
                ⭐ {item.cost} XP
              </span>
            </div>
            <h3 className="text-white font-black text-xl mb-2">{item.name}</h3>
            <p className="text-gray-400 text-sm mb-6">{item.desc}</p>
            <button
              onClick={() => buyItem(item)}
              disabled={buying === item.id || (myStats?.xp || 0) < item.cost}
              className={`w-full py-3 rounded-xl font-black transition-all ${
                (myStats?.xp || 0) >= item.cost
                  ? 'bg-yellow-600 hover:bg-yellow-500 text-black hover:scale-105'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {buying === item.id ? 'Buying...' :
               (myStats?.xp || 0) < item.cost ? `Need ${item.cost - (myStats?.xp || 0)} more XP` :
               `Buy - ${item.cost} XP`}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Friend Picker Modal */}
      <AnimatePresence>
        {showFriendPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-80 z-40"
              onClick={() => { setShowFriendPicker(false); setBuying(null) }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            >
              <div className="bg-gray-900 border border-orange-800 rounded-2xl p-6">
                <h3 className="text-white font-black text-xl mb-2">😱 Choose Victim</h3>
                <p className="text-gray-500 text-sm mb-4">Who to scare? 😂</p>

                {friends.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No friends yet da! Add some first 😂</p>
                ) : (
                  <div className="space-y-2 mb-4">
                    {friends.map((f, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedFriend(f)}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                          selectedFriend?.userId === f.userId
                            ? 'bg-orange-900 border border-orange-600'
                            : 'bg-gray-800 hover:bg-gray-700'
                        }`}
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black">
                          {f.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-white font-bold">{f.name || 'Anonymous'}</p>
                          <p className="text-gray-500 text-xs">⭐ {f.xp} XP • 🔥 {f.streak} streak</p>
                        </div>
                        {selectedFriend?.userId === f.userId && (
                          <span className="ml-auto text-orange-400">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowFriendPicker(false); setBuying(null) }}
                    className="flex-1 border border-gray-700 text-gray-400 py-3 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendFakeScare}
                    disabled={!selectedFriend}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold"
                  >
                    😱 SCARE!
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Coming soon items */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-gray-400 font-bold mb-4">🔒 Coming Soon</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { emoji: '🎨', name: 'Dark Red Theme', cost: 500 },
            { emoji: '👑', name: 'Gold Username', cost: 1000 },
            { emoji: '💀', name: 'Skull Avatar Frame', cost: 750 },
          ].map((item, i) => (
            <div key={i} className="bg-black border border-gray-800 rounded-xl p-4 opacity-50">
              <span className="text-3xl">{item.emoji}</span>
              <p className="text-white font-bold text-sm mt-2">{item.name}</p>
              <p className="text-gray-500 text-xs">⭐ {item.cost} XP</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

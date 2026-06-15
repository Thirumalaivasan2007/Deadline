const crypto = require('crypto')
const dns = require('dns')
dns.setServers(['8.8.8.8', '8.8.4.4'])

const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()
const Deadline = require('./models/Deadline')
const User = require('./models/User')
const Mood = require('./models/Mood')
const Message = require('./models/Message')
const BossFight = require('./models/BossFight')
const Wager = require('./models/Wager')
const ShameEvent = require('./models/ShameEvent')

const app = express()
app.use(cors())
app.use(express.json())

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected ✅'))
  .catch(err => console.log('MongoDB error:', err))

// Get all deadlines for a user
app.get('/api/deadlines/:userId', async (req, res) => {
  try {
    const deadlines = await Deadline.find({ userId: req.params.userId })
    res.json(deadlines)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Add deadline
app.post('/api/deadlines', async (req, res) => {
  try {
    const deadline = new Deadline(req.body)
    await deadline.save()
    res.json(deadline)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Update deadline
app.put('/api/deadlines/:id', async (req, res) => {
  try {
    const deadline = await Deadline.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after' }
    )
    res.json(deadline)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete deadline
app.delete('/api/deadlines/:id', async (req, res) => {
  try {
    await Deadline.findByIdAndDelete(req.params.id)
    res.json({ message: 'Deleted ✅' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get user stats - auto create with deadlineId
app.get('/api/user/:userId', async (req, res) => {
  try {
    let user = await User.findOne({ userId: req.params.userId })
    if (!user) {
      const deadlineId = 'DL-' + crypto.randomBytes(3).toString('hex').toUpperCase()
      user = await User.create({ 
        userId: req.params.userId,
        deadlineId
      })
    } else if (!user.deadlineId) {
      user.deadlineId = 'DL-' + crypto.randomBytes(3).toString('hex').toUpperCase()
      await user.save()
    }
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Update user name/email
app.put('/api/user/:userId', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { userId: req.params.userId },
      req.body,
      { new: true }
    )
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ========== BOSS FIGHT ==========

// Check/create boss fight when deadline added
app.post('/api/bossfight/check', async (req, res) => {
  try {
    const { userId, userName, subject, department, dueDate } = req.body

    // Find existing boss fight for same subject+dept+date
    let boss = await BossFight.findOne({
      subject,
      department,
      dueDate: new Date(dueDate),
      status: 'active'
    })

    if (!boss) {
      boss = await BossFight.create({
        subject,
        department,
        dueDate: new Date(dueDate),
        participants: [{ userId, name: userName, submitted: false }],
        healthBar: 100
      })
    } else {
      // Add participant if not already in
      const exists = boss.participants.find(p => p.userId === userId)
      if (!exists) {
        boss.participants.push({ userId, name: userName, submitted: false })
        await boss.save()
      }
    }

    // Boss fight activates at 5+ participants
    const isBossFight = boss.participants.length >= 5
    res.json({ boss, isBossFight })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get active boss fights for user
app.get('/api/bossfight/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId })
    const bossFights = await BossFight.find({
      'participants.userId': req.params.userId,
      status: 'active'
    })
    res.json(bossFights)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Submit in boss fight
app.post('/api/bossfight/:bossId/submit', async (req, res) => {
  try {
    const { userId, userName } = req.body
    const boss = await BossFight.findById(req.params.bossId)
    if (!boss) return res.status(404).json({ error: 'Boss fight not found' })

    // Mark user as submitted
    const participant = boss.participants.find(p => p.userId === userId)
    if (participant) participant.submitted = true

    // Reduce health bar
    const submitCount = boss.participants.filter(p => p.submitted).length
    const total = boss.participants.length
    boss.healthBar = Math.max(0, 100 - Math.round((submitCount / total) * 100))

    // Check if all submitted
    const allSubmitted = boss.participants.every(p => p.submitted)
    if (allSubmitted) {
      boss.status = 'won'
      // Give everyone +500 XP
      for (const p of boss.participants) {
        await User.findOneAndUpdate(
          { userId: p.userId },
          { $inc: { xp: 500 } }
        )
      }
      // Shame event
      await ShameEvent.create({
        userId: 'system',
        userName: 'System',
        type: 'boss_win',
        message: `${boss.department} class defeated the ${boss.subject} Boss! Everyone gets +500 XP! 🎉`,
        emoji: '🏆'
      })
    }

    await boss.save()
    res.json({ boss, allSubmitted })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ========== XP SHOP ==========

app.post('/api/shop/fake-scare', async (req, res) => {
  try {
    const { userId, targetUserId, targetName } = req.body
    const user = await User.findOne({ userId })

    if (!user || user.xp < 100) {
      return res.json({ success: false, error: 'Not enough XP da! Need 100 XP 😂' })
    }

    // Deduct XP
    user.xp -= 100
    await user.save()

    // Create shame event for target
    await ShameEvent.create({
      userId: targetUserId,
      userName: targetName,
      type: 'fake_scare',
      message: `${user.name} sent ${targetName} a fake deadline scare! 😱💀`,
      emoji: '😱'
    })

    res.json({ success: true, message: `Fake scare sent to ${targetName}! 😂` })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/shop/streak-freeze', async (req, res) => {
  try {
    const { userId } = req.body
    const user = await User.findOne({ userId })

    if (!user || user.xp < 200) {
      return res.json({ success: false, error: 'Not enough XP da! Need 200 XP 😂' })
    }

    user.xp -= 200
    user.streakFrozen = true
    await user.save()

    res.json({ success: true, message: 'Streak frozen for today! 🛡️' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ========== WAGER ==========

app.post('/api/wager', async (req, res) => {
  try {
    const { userId, deadlineId, deadlineTitle, betAmount } = req.body
    const user = await User.findOne({ userId })

    if (!user || user.xp < betAmount) {
      return res.json({ success: false, error: 'Not enough XP to bet da! 😂' })
    }

    const wager = await Wager.create({ userId, deadlineId, deadlineTitle, betAmount })
    res.json({ success: true, wager })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/wager/:wagerId/resolve', async (req, res) => {
  try {
    const { won } = req.body
    const wager = await Wager.findById(req.params.wagerId)
    if (!wager) return res.status(404).json({ error: 'Wager not found' })

    const user = await User.findOne({ userId: wager.userId })

    if (won) {
      wager.status = 'won'
      user.xp += wager.betAmount * 2
      await ShameEvent.create({
        userId: user.userId,
        userName: user.name,
        type: 'wager_won',
        message: `${user.name} won their wager on "${wager.deadlineTitle}"! +${wager.betAmount * 2} XP! 🎉`,
        emoji: '🎰'
      })
    } else {
      wager.status = 'lost'
      wager.clownBadge = true
      user.xp = Math.max(0, user.xp - wager.betAmount * 2)
      await ShameEvent.create({
        userId: user.userId,
        userName: user.name,
        type: 'wager_lost',
        message: `${user.name} lost their wager on "${wager.deadlineTitle}"! 🤡 Clown badge earned!`,
        emoji: '🤡'
      })
    }

    await wager.save()
    await user.save()
    res.json({ wager, user })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get user wagers
app.get('/api/wager/:userId', async (req, res) => {
  try {
    const wagers = await Wager.find({ userId: req.params.userId }).sort({ createdAt: -1 })
    res.json(wagers)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ========== SHAME FEED ==========

app.get('/api/shamefeed', async (req, res) => {
  try {
    const events = await ShameEvent.find({}).sort({ createdAt: -1 }).limit(50)
    res.json(events)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Submit deadline - also creates shame event
app.post('/api/user/:userId/submit', async (req, res) => {
  try {
    let user = await User.findOne({ userId: req.params.userId })
    if (!user) {
      const deadlineId = 'DL-' + crypto.randomBytes(3).toString('hex').toUpperCase()
      user = await User.create({ userId: req.params.userId, deadlineId })
    }

    const now = new Date()
    const lastSubmit = user.lastSubmit ? new Date(user.lastSubmit) : null
    const diffDays = lastSubmit
      ? Math.floor((now - lastSubmit) / (1000 * 60 * 60 * 24))
      : null

    const wasStreakAlive = user.streak > 0
    if (!lastSubmit || diffDays === 1) {
      user.streak += 1
    } else if (diffDays > 1) {
      // Streak died
      if (wasStreakAlive && !user.streakFrozen) {
        await ShameEvent.create({
          userId: user.userId,
          userName: user.name,
          type: 'streak_died',
          message: `${user.name}'s ${user.streak} day streak just DIED! Point and laugh! 😂`,
          emoji: '💀'
        })
      }
      if (!user.streakFrozen) user.streak = 1
    }

    user.streakFrozen = false

    const isOnTime = req.body.isOnTime
    const deadlineTitle = req.body.deadlineTitle || 'a deadline'

    if (isOnTime) {
      user.xp += 50
      user.onTimeSubmits += 1
      // Shame feed - on time
      const minsLeft = req.body.minsLeft || 0
      const msg = minsLeft < 10
        ? `${user.name} submitted "${deadlineTitle}" with only ${minsLeft} mins left! Escape aagitaan! 🏃‍♂️💨`
        : `${user.name} submitted "${deadlineTitle}" on time! +50 XP 🎉`

      await ShameEvent.create({
        userId: user.userId,
        userName: user.name,
        type: 'submitted',
        message: msg,
        emoji: minsLeft < 10 ? '🏃‍♂️' : '✅'
      })
    } else {
      user.xp = Math.max(0, user.xp - 10)
      user.lateSubmits += 1
      await ShameEvent.create({
        userId: user.userId,
        userName: user.name,
        type: 'late',
        message: `${user.name} submitted "${deadlineTitle}" LATE! Shame! 😂💀`,
        emoji: '🐢'
      })
    }

    user.totalSubmitted += 1
    user.lastSubmit = now
    user.level = Math.floor(user.xp / 200) + 1

    await user.save()
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// AI Roast route
app.post('/api/roast', async (req, res) => {
  try {
    const { deadlines } = req.body
    const critical = deadlines.filter(d => {
      const diff = new Date(d.dueDate) - Date.now()
      return diff > 0 && diff <= 2 * 60 * 60 * 1000
    })
    const expired = deadlines.filter(d => new Date(d.dueDate) <= Date.now())

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: `You are a savage but funny academic roaster. Roast this student in Tamil-English (Tanglish) mix. Keep it under 2 sentences. Be funny not mean.
          
          Their situation:
          - Total deadlines: ${deadlines.length}
          - Critical (under 2 hours): ${critical.length} ${critical.map(d => d.title).join(', ')}
          - Expired: ${expired.length} ${expired.map(d => d.title).join(', ')}
          - Average progress: ${deadlines.length > 0 ? Math.round(deadlines.reduce((a, b) => a + b.progress, 0) / deadlines.length) : 0}%
          
          Roast in Tanglish! Use "da" at end!`
        }]
      })
    })

    const data = await response.json()
    res.json({ roast: data.content[0].text })
  } catch (err) {
    res.status(500).json({ roast: 'Server down da, nee mathiri 💀' })
  }
})

// Add friend by DeadLine ID
app.post('/api/friends/add', async (req, res) => {
  try {
    const { userId, deadlineId } = req.body
    
    // Find friend by deadlineId
    const friend = await User.findOne({ deadlineId: deadlineId.toUpperCase() })
    if (!friend) {
      return res.json({ success: false, error: 'ID wrong ah iruku da! Check pannu 😂' })
    }
    
    if (friend.userId === userId) {
      return res.json({ success: false, error: 'Unnodaye ID enter pannita da 😂' })
    }

    // Add friend to both users
    await User.findOneAndUpdate(
      { userId },
      { $addToSet: { friends: friend.userId } }
    )
    await User.findOneAndUpdate(
      { userId: friend.userId },
      { $addToSet: { friends: userId } }
    )

    res.json({ success: true, friendName: friend.name || 'Anonymous' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Leaderboard - friends + self
app.get('/api/leaderboard/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId })
    if (!user) return res.json([])
    
    const friendIds = [...(user.friends || []), req.params.userId]
    const users = await User.find({ userId: { $in: friendIds } }).sort({ xp: -1 })
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Shame leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const users = await User.find({}).sort({ xp: -1 }).limit(50)
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get mood history
app.get('/api/mood/:userId', async (req, res) => {
  try {
    const moods = await Mood.find({ userId: req.params.userId }).sort({ date: -1 }).limit(30)
    res.json(moods)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Log mood
app.post('/api/mood/:userId', async (req, res) => {
  try {
    const { mood, note, deadlineCount, date } = req.body
    // Update if exists, create if not
    const existing = await Mood.findOneAndUpdate(
      { userId: req.params.userId, date },
      { mood, note, deadlineCount },
      { upsert: true, new: true }
    )
    res.json(existing)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Find study buddy matches
app.post('/api/studybuddy/matches', async (req, res) => {
  try {
    const { userId, subjects } = req.body

    // Find all deadlines with same subjects, different user
    const matches = await Deadline.find({
      userId: { $ne: userId },
      subject: { $in: subjects },
      dueDate: { $gte: new Date() }
    })

    // Group by userId
    const userMap = {}
    matches.forEach(d => {
      if (!userMap[d.userId]) userMap[d.userId] = []
      userMap[d.userId].push(d.subject)
    })

    // Get user details
    const matchUserIds = Object.keys(userMap)
    const matchUsers = await User.find({ userId: { $in: matchUserIds } })

    const result = matchUsers.map(u => ({
      userId: u.userId,
      name: u.name,
      college: u.college,
      department: u.department,
      semester: u.semester,
      xp: u.xp,
      streak: u.streak,
      commonSubjects: [...new Set(userMap[u.userId])]
    }))

    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get messages between two users
app.get('/api/studybuddy/messages/:userId/:matchId', async (req, res) => {
  try {
    const { userId, matchId } = req.params
    const messages = await Message.find({
      $or: [
        { fromId: userId, toId: matchId },
        { fromId: matchId, toId: userId }
      ]
    }).sort({ createdAt: 1 })
    res.json(messages)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Send message
app.post('/api/studybuddy/messages', async (req, res) => {
  try {
    const { fromId, toId, fromName, message } = req.body
    const msg = await Message.create({ fromId, toId, fromName, message })
    res.json(msg)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT} 🔥`)
})
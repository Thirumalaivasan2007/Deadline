const mongoose = require('mongoose')

const shameEventSchema = new mongoose.Schema({
  userId: { type: String },
  userName: { type: String },
  type: { type: String }, // submitted, streak_died, late, boss_win, boss_lose, wager_lost
  message: { type: String },
  emoji: { type: String }
}, { timestamps: true })

module.exports = mongoose.model('ShameEvent', shameEventSchema)

const mongoose = require('mongoose')

const moodSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  mood: { type: String, required: true },
  note: { type: String, default: '' },
  deadlineCount: { type: Number, default: 0 },
  date: { type: String, required: true }
}, { timestamps: true })

module.exports = mongoose.model('Mood', moodSchema)

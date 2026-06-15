const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, default: 'Anonymous' },
  email: { type: String },
  deadlineId: { type: String, unique: true },
  friends: [{ type: String }],
  streak: { type: Number, default: 0 },
  lastSubmit: { type: Date },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  totalSubmitted: { type: Number, default: 0 },
  onTimeSubmits: { type: Number, default: 0 },
  lateSubmits: { type: Number, default: 0 },
  expiredWithoutSubmit: { type: Number, default: 0 },
  college: { type: String, default: '' },
  department: { type: String, default: 'CSE' },
  semester: { type: String, default: '4' },
  rollNo: { type: String, default: '' },
  theme: { type: String, default: 'dark-panic' },
  notifications: {
    browser: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    oneDayBefore: { type: Boolean, default: true },
    oneHourBefore: { type: Boolean, default: true },
    atDeadline: { type: Boolean, default: true },
  },
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)

const mongoose = require('mongoose')

const wagerSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  deadlineId: { type: String, required: true },
  deadlineTitle: { type: String },
  betAmount: { type: Number, required: true },
  status: { type: String, default: 'pending' }, // pending, won, lost
  clownBadge: { type: Boolean, default: false }
}, { timestamps: true })

module.exports = mongoose.model('Wager', wagerSchema)

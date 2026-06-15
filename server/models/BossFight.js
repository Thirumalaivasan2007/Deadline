const mongoose = require('mongoose')

const bossFightSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  department: { type: String, required: true },
  dueDate: { type: Date, required: true },
  participants: [{ 
    userId: String, 
    name: String,
    submitted: { type: Boolean, default: false }
  }],
  healthBar: { type: Number, default: 100 },
  status: { type: String, default: 'active' }, // active, won, lost
  totalXPPool: { type: Number, default: 0 }
}, { timestamps: true })

module.exports = mongoose.model('BossFight', bossFightSchema)

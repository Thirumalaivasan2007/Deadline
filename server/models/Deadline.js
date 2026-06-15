const mongoose = require('mongoose')

const deadlineSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  subject: { type: String, required: true },
  dueDate: { type: Date, required: true },
  priority: { type: String, default: 'medium' },
  progress: { type: Number, default: 0 },
  completed: { type: Boolean, default: false }
}, { timestamps: true })

module.exports = mongoose.model('Deadline', deadlineSchema)
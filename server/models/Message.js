const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  fromId: { type: String, required: true },
  toId: { type: String, required: true },
  fromName: { type: String },
  message: { type: String, required: true },
}, { timestamps: true })

module.exports = mongoose.model('Message', messageSchema)

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export default function AddDeadlineModal({ isOpen, onClose, onAdd }) {
  const [form, setForm] = useState({
    title: '',
    subject: '',
    dueDate: '',
    dueTime: '',
    priority: 'medium',
    progress: 0
  })

  const handleSubmit = () => {
    if (!form.title || !form.subject || !form.dueDate || !form.dueTime) {
      alert('Ella fields um fill pannu da!')
      return
    }
    const deadline = {
      id: Date.now(),
      title: form.title,
      subject: form.subject,
      dueDate: new Date(`${form.dueDate}T${form.dueTime}`),
      priority: form.priority,
      progress: parseInt(form.progress)
    }
    onAdd(deadline)
    onClose()
    setForm({ title: '', subject: '', dueDate: '', dueTime: '', priority: 'medium', progress: 0 })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-80 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed top-1/2 left-1/2 z-50 w-full max-w-md max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.8, x: "-50%", y: "-60%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.8, x: "-50%", y: "-60%" }}
          >
            <div className="bg-gray-900 border border-red-800 rounded-2xl p-6">
              <h2 className="text-white font-black text-2xl mb-6">
                💀 Add Deadline
              </h2>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Assignment Title</label>
                  <input
                    type="text"
                    placeholder="Eg: OS Lab Record"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-red-500 focus:outline-none"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Subject</label>
                  <input
                    type="text"
                    placeholder="Eg: Operating Systems"
                    value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-red-500 focus:outline-none"
                  />
                </div>

                {/* Date + Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Due Date</label>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={e => setForm({ ...form, dueDate: e.target.value })}
                      className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Due Time</label>
                    <input
                      type="time"
                      value={form.dueTime}
                      onChange={e => setForm({ ...form, dueTime: e.target.value })}
                      className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                  >
                    <option value="high">🔥 High</option>
                    <option value="medium">⚠️ Medium</option>
                    <option value="low">✅ Low</option>
                  </select>
                </div>

                {/* Progress */}
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">
                    Progress - {form.progress}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form.progress}
                    onChange={e => setForm({ ...form, progress: e.target.value })}
                    className="w-full accent-red-500"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={onClose}
                  className="flex-1 border border-gray-700 text-gray-400 py-3 rounded-lg font-bold hover:border-gray-500 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition-all hover:scale-105"
                >
                  💀 Add It
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
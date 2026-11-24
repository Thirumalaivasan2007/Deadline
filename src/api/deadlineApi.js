export const getBaseUrl = () => {
  const raw = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
  const trimmed = raw.trim().replace(/\/+$/, '')
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

export const BASE_URL = getBaseUrl()

const STORAGE_KEY_PREFIX = 'deadline_tasks_'
const USER_STATS_PREFIX = 'deadline_user_stats_'

export const getLocalDeadlines = (userId) => {
  if (!userId) return []
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
        .filter(d => d && d._id)
        .map(d => ({
          title: d.title || 'My Deadline',
          subject: d.subject || 'General',
          dueDate: (d.dueDate && !isNaN(new Date(d.dueDate).getTime()))
            ? d.dueDate
            : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          priority: d.priority || 'high',
          progress: typeof d.progress === 'number' ? d.progress : 0,
          ...d
        }))
    }
  } catch {
    return []
  }
  return []
}

export const saveLocalDeadlines = (userId, deadlines) => {
  if (!userId) return
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(deadlines))
  } catch (e) {
    console.error('Failed to save deadlines to localStorage', e)
  }
}

export const getLocalUserStats = (userId, name, email) => {
  if (!userId) return null
  try {
    const raw = localStorage.getItem(`${USER_STATS_PREFIX}${userId}`)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn('Could not read user stats from localStorage', e)
  }
  return {
    userId,
    name: name || 'Student',
    email: email || '',
    level: 1,
    xp: 0,
    streak: 0,
    deadlineId: 'DL-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    onTimeSubmits: 0,
    totalSubmitted: 0
  }
}

export const saveLocalUserStats = (userId, stats) => {
  if (!userId || !stats) return
  try {
    localStorage.setItem(`${USER_STATS_PREFIX}${userId}`, JSON.stringify(stats))
  } catch (e) {
    console.error('Failed to save user stats to localStorage', e)
  }
}

export const fetchDeadlines = async (userId) => {
  if (!userId) return []
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(`${BASE_URL}/deadlines/${userId}`, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (res.ok) {
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const data = await res.json()
        if (Array.isArray(data)) {
          saveLocalDeadlines(userId, data)
          return data
        }
      }
    }
  } catch (err) {
    console.warn('Backend API unavailable, using offline cache for deadlines:', err?.message || err)
  }
  return getLocalDeadlines(userId)
}

export const addDeadline = async (deadline) => {
  const userId = deadline.userId
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(`${BASE_URL}/deadlines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deadline),
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const saved = await res.json()
        if (userId) {
          const current = getLocalDeadlines(userId)
          saveLocalDeadlines(userId, [...current, saved])
        }
        return saved
      }
    }
  } catch (err) {
    console.warn('Backend API unavailable, saving deadline locally:', err?.message || err)
  }

  // Fallback local save
  const newDeadline = {
    ...deadline,
    _id: 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    createdAt: new Date().toISOString()
  }
  if (userId) {
    const current = getLocalDeadlines(userId)
    saveLocalDeadlines(userId, [...current, newDeadline])
  }
  return newDeadline
}

export const updateDeadline = async (id, data, userId) => {
  let existing = null
  if (userId) {
    const current = getLocalDeadlines(userId)
    existing = current.find(d => d._id === id)
    if (existing) {
      const merged = { ...existing, ...data }
      saveLocalDeadlines(userId, current.map(d => d._id === id ? merged : d))
    }
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(`${BASE_URL}/deadlines/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const updated = await res.json()
        const merged = existing ? { ...existing, ...updated, ...data } : { _id: id, ...data, ...updated }
        if (userId) {
          const current = getLocalDeadlines(userId)
          saveLocalDeadlines(userId, current.map(d => d._id === id ? merged : d))
        }
        return merged
      }
    }
  } catch (err) {
    console.warn('Backend API unavailable, updating deadline locally:', err?.message || err)
  }

  return existing ? { ...existing, ...data } : { _id: id, ...data }
}

export const deleteDeadline = async (id, userId) => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(`${BASE_URL}/deadlines/${id}`, {
      method: 'DELETE',
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      if (userId) {
        const current = getLocalDeadlines(userId)
        saveLocalDeadlines(userId, current.filter(d => d._id !== id))
      }
      return { message: 'Deleted âœ…' }
    }
  } catch (err) {
    console.warn('Backend API unavailable, removing deadline locally:', err?.message || err)
  }

  if (userId) {
    const current = getLocalDeadlines(userId)
    saveLocalDeadlines(userId, current.filter(d => d._id !== id))
  }
  return { message: 'Deleted âœ…' }
}

export const fetchUserStats = async (userId, name, email) => {
  if (!userId) return null
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(`${BASE_URL}/user/${userId}`, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (res.ok) {
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const data = await res.json()
        if (data && typeof data === 'object') {
          saveLocalUserStats(userId, data)
          if (name && (!data.name || data.name === 'Anonymous')) {
            fetch(`${BASE_URL}/user/${userId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, email })
            }).catch(() => {})
          }
          return data
        }
      }
    }
  } catch (err) {
    console.warn('Backend API unavailable, using offline user stats:', err?.message || err)
  }
  return getLocalUserStats(userId, name, email)
}

export const submitDeadline = async (userId, isOnTime) => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(`${BASE_URL}/user/${userId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isOnTime }),
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const data = await res.json()
        saveLocalUserStats(userId, data)
        return data
      }
    }
  } catch (err) {
    console.warn('Backend API unavailable, updating user stats locally:', err?.message || err)
  }

  const current = getLocalUserStats(userId)
  const updated = {
    ...current,
    xp: current.xp + (isOnTime ? 50 : 10),
    level: Math.floor((current.xp + (isOnTime ? 50 : 10)) / 200) + 1,
    streak: isOnTime ? current.streak + 1 : 0,
    totalSubmitted: (current.totalSubmitted || 0) + 1,
    onTimeSubmits: (current.onTimeSubmits || 0) + (isOnTime ? 1 : 0)
  }
  saveLocalUserStats(userId, updated)
  return updated
}

export const getRoast = async (deadlines) => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(`${BASE_URL}/roast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deadlines }),
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        return await res.json()
      }
    }
  } catch (err) {
    console.warn('Backend API unavailable for roast:', err?.message || err)
  }
  return { roast: 'Keep pushing da! Submit on time 💀' }
}

export const updateProgress = async (id, progress, userId) => {
  let existing = null
  if (userId) {
    const current = getLocalDeadlines(userId)
    existing = current.find(d => d._id === id)
    if (existing) {
      const merged = { ...existing, progress }
      saveLocalDeadlines(userId, current.map(d => d._id === id ? merged : d))
    }
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(`${BASE_URL}/deadlines/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress }),
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const updated = await res.json()
        const merged = existing ? { ...existing, ...updated, progress } : { _id: id, progress, ...updated }
        if (userId) {
          const current = getLocalDeadlines(userId)
          saveLocalDeadlines(userId, current.map(d => d._id === id ? merged : d))
        }
        return merged
      }
    }
  } catch (err) {
    console.warn('Backend API unavailable, updating progress locally:', err?.message || err)
  }

  return existing ? { ...existing, progress } : { _id: id, progress }
}

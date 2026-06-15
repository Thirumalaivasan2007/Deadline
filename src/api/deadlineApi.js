const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

export const fetchDeadlines = async (userId) => {
  const res = await fetch(`${BASE_URL}/deadlines/${userId}`)
  return res.json()
}

export const addDeadline = async (deadline) => {
  const res = await fetch(`${BASE_URL}/deadlines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deadline)
  })
  return res.json()
}

export const updateDeadline = async (id, data) => {
  const res = await fetch(`${BASE_URL}/deadlines/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return res.json()
}

export const deleteDeadline = async (id) => {
  const res = await fetch(`${BASE_URL}/deadlines/${id}`, {
    method: 'DELETE'
  })
  return res.json()
}

export const fetchUserStats = async (userId, name, email) => {
  const res = await fetch(`${BASE_URL}/user/${userId}`)
  const data = await res.json()
  
  // Update name if not set
  if (name && (!data.name || data.name === 'Anonymous')) {
    await fetch(`${BASE_URL}/user/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    })
  }
  return data
}

export const submitDeadline = async (userId, isOnTime) => {
  const res = await fetch(`${BASE_URL}/user/${userId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isOnTime })
  })
  return res.json()
}

export const getRoast = async (deadlines) => {
  const res = await fetch(`${BASE_URL}/roast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deadlines })
  })
  return res.json()
}

export const updateProgress = async (id, progress) => {
  const res = await fetch(`${BASE_URL}/deadlines/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ progress })
  })
  return res.json()
}

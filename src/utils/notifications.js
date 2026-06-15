export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  return false
}

export const sendNotification = (title, body, icon = '💀') => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
    })
  }
}

export const scheduleDeadlineNotifications = (deadlines) => {
  deadlines.forEach(deadline => {
    const diff = new Date(deadline.dueDate) - Date.now()
    const hours = diff / (1000 * 60 * 60)

    // 24 hours before
    if (hours > 0 && hours <= 24) {
      setTimeout(() => {
        sendNotification(
          `⚠️ Deadline Tomorrow!`,
          `${deadline.title} - ${deadline.subject} due soon da!`
        )
      }, Math.max(0, diff - 24 * 60 * 60 * 1000))
    }

    // 1 hour before
    if (hours > 0 && hours <= 2) {
      setTimeout(() => {
        sendNotification(
          `🔥 1 Hour Left!`,
          `${deadline.title} - Submit pannudu da! 💀`
        )
      }, Math.max(0, diff - 60 * 60 * 1000))
    }

    // At deadline
    if (diff > 0) {
      setTimeout(() => {
        sendNotification(
          `💀 DEADLINE HIT!`,
          `${deadline.title} - Time's up da! Submit pannita illa?`
        )
      }, diff)
    }
  })
}

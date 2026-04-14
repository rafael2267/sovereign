export function formatReignDuration(reignedAt: string): string {
  const ms = Date.now() - new Date(reignedAt).getTime()
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h on top`
  if (hours > 0) return `${hours}h ${minutes % 60}m on top`
  if (minutes > 0) return `${minutes}m on top`
  return `${seconds}s on top`
}

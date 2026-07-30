export function maskPhone(phone) {
  const normalized = String(phone ?? '')
  if (normalized.length < 7) return '***'
  return `${normalized.slice(0, 3)}****${normalized.slice(-4)}`
}

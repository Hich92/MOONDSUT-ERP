import crypto from 'crypto'

const SECRET  = process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me'
const EXPIRES = 15 * 60 * 1000 // 15 minutes

function hmac(data: string): string {
  return crypto.createHmac('sha256', SECRET).update(data).digest('hex')
}

export function createResetToken(email: string): string {
  const exp = Date.now() + EXPIRES
  const payload = Buffer.from(`${email}|${exp}`).toString('base64url')
  const sig = hmac(payload)
  return `${payload}.${sig}`
}

export function verifyResetToken(token: string): { email: string } | null {
  try {
    const [payload, sig] = token.split('.')
    if (!payload || !sig) return null
    if (hmac(payload) !== sig) return null
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8')
    const [email, expStr] = decoded.split('|')
    if (!email || !expStr) return null
    if (Date.now() > parseInt(expStr)) return null
    return { email }
  } catch {
    return null
  }
}

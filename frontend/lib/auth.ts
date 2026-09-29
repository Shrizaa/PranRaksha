import { createHmac, timingSafeEqual } from "node:crypto"

// Accept any non-empty username/password — open registration
// Signing secret. In production set AUTH_SECRET; a stable dev fallback keeps
// tokens valid across serverless cold starts and dev-server restarts.
const SECRET = process.env.AUTH_SECRET ?? "indofloods-emergency-response-secret"

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url")
}

export function authenticate(username: string, password: string): string | null {
  // Accept any non-empty username and password
  if (!username.trim() || !password.trim()) return null
  const payload = `${username}.${Date.now()}`
  const encoded = Buffer.from(payload).toString("base64url")
  return `${encoded}.${sign(encoded)}`
}

export function verifyToken(token: string | null): string | null {
  if (!token) return null
  const parts = token.split(".")
  if (parts.length !== 2) return null
  const [encoded, signature] = parts
  const expected = sign(encoded)
  try {
    const a = Buffer.from(signature)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  try {
    const payload = Buffer.from(encoded, "base64url").toString("utf8")
    const username = payload.split(".")[0]
    return username || null
  } catch {
    return null
  }
}

export function bearerFromRequest(req: Request): string | null {
  const header = req.headers.get("authorization") ?? ""
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match ? match[1] : null
}

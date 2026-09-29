import { NextResponse } from "next/server"
import { authenticate } from "@/lib/auth"

export async function POST(req: Request) {
  let body: { username?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ detail: "Invalid request body" }, { status: 400 })
  }

  const username = String(body.username ?? "")
  const password = String(body.password ?? "")
  const token = authenticate(username, password)

  if (!token) {
    return NextResponse.json(
      { detail: "Invalid username or password" },
      { status: 401 },
    )
  }

  return NextResponse.json({
    message: "Login successful",
    username,
    access_token: token,
    token_type: "bearer",
  })
}

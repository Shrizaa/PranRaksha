import { NextResponse } from "next/server"
import { bearerFromRequest, verifyToken } from "@/lib/auth"

export async function POST(req: Request) {
  const token = bearerFromRequest(req)
  const username = verifyToken(token)
  if (!username) {
    return NextResponse.json(
      { detail: "Invalid or expired token" },
      { status: 401 },
    )
  }
  return NextResponse.json({ message: "Logout successful", username })
}

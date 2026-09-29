import { NextResponse } from "next/server"
import { requireUser, unauthorized } from "@/lib/api-helpers"
import { WAREHOUSES } from "@/lib/disaster-engine"

export async function GET(req: Request) {
  if (!requireUser(req)) return unauthorized()
  return NextResponse.json({ warehouses: WAREHOUSES })
}

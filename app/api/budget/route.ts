import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { verifyIdToken } from '@/lib/firebase-admin'

// ─── Helper ───────────────────────────────────────────────────────────────────

async function getVerifiedUid(request: NextRequest): Promise<string | null> {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    const decoded = await verifyIdToken(token)
    return decoded.uid
  } catch {
    return null
  }
}

// ─── GET /api/budget?month=<n>&year=<n> ──────────────────────────────────────

export async function GET(request: NextRequest) {
  const uid = await getVerifiedUid(request)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const month = Number(request.nextUrl.searchParams.get('month'))
  const year = Number(request.nextUrl.searchParams.get('year'))

  if (!month || !year) {
    return NextResponse.json({ error: 'Missing month or year query params' }, { status: 400 })
  }

  try {
    const supabase = getSupabaseServer()
    const { data, error } = await supabase
      .from('budget_plans')
      .select('*')
      .eq('firebase_uid', uid)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ budgetPlan: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ─── POST /api/budget — upsert a budget plan ─────────────────────────────────

export async function POST(request: NextRequest) {
  const uid = await getVerifiedUid(request)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = getSupabaseServer()
    const { month, year, needs_amount, wants_amount, savings_amount } = await request.json()

    const { data, error } = await supabase
      .from('budget_plans')
      .upsert(
        { firebase_uid: uid, month, year, needs_amount, wants_amount, savings_amount },
        { onConflict: 'firebase_uid,month,year' }
      )
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ budgetPlan: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

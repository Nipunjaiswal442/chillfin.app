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

// ─── GET /api/emi — fetch EMI calculation history ─────────────────────────────

export async function GET(request: NextRequest) {
  const uid = await getVerifiedUid(request)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = getSupabaseServer()
    const { data, error } = await supabase
      .from('emi_calculations')
      .select('*')
      .eq('firebase_uid', uid)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ emiHistory: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ─── POST /api/emi — save an EMI calculation ─────────────────────────────────

export async function POST(request: NextRequest) {
  const uid = await getVerifiedUid(request)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = getSupabaseServer()
    const {
      item_name,
      principal,
      interest_rate,
      tenure_months,
      monthly_emi,
      total_cost,
      affordability_score,
    } = await request.json()

    const { data, error } = await supabase
      .from('emi_calculations')
      .insert({
        firebase_uid: uid,
        item_name: item_name ?? null,
        principal,
        interest_rate,
        tenure_months,
        monthly_emi,
        total_cost,
        affordability_score,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ emiCalculation: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

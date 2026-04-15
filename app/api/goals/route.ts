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

// ─── GET /api/goals — list goals for the authenticated user ───────────────────

export async function GET(request: NextRequest) {
  const uid = await getVerifiedUid(request)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = getSupabaseServer()
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('firebase_uid', uid)
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ goals: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ─── POST /api/goals — create a new goal ─────────────────────────────────────

export async function POST(request: NextRequest) {
  const uid = await getVerifiedUid(request)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = getSupabaseServer()
    const { name, target_amount, saved_amount, target_date, emoji } = await request.json()

    const { data, error } = await supabase
      .from('goals')
      .insert({
        firebase_uid: uid,
        name,
        target_amount,
        saved_amount: saved_amount ?? 0,
        target_date: target_date ?? null,
        emoji: emoji ?? '🎯',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ goal: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ─── PATCH /api/goals?id=<uuid> — update saved_amount ────────────────────────

export async function PATCH(request: NextRequest) {
  const uid = await getVerifiedUid(request)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing goal id' }, { status: 400 })

  try {
    const supabase = getSupabaseServer()
    const { saved_amount } = await request.json()

    const { data, error } = await supabase
      .from('goals')
      .update({ saved_amount })
      .eq('id', id)
      .eq('firebase_uid', uid) // security: can only update own goals
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ goal: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ─── DELETE /api/goals?id=<uuid> — delete a goal ─────────────────────────────

export async function DELETE(request: NextRequest) {
  const uid = await getVerifiedUid(request)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing goal id' }, { status: 400 })

  try {
    const supabase = getSupabaseServer()
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('firebase_uid', uid) // security: can only delete own goals

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

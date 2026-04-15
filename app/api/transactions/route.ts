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

// ─── GET /api/transactions — list user's transactions ─────────────────────────

export async function GET(request: NextRequest) {
  const uid = await getVerifiedUid(request)
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseServer()
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('firebase_uid', uid)
      .order('date', { ascending: false })
      .limit(500)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ transactions: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ─── POST /api/transactions — add a transaction ───────────────────────────────

export async function POST(request: NextRequest) {
  const uid = await getVerifiedUid(request)
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseServer()
    const body = await request.json()
    const { type, amount, category, description, date } = body

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        firebase_uid: uid,
        type,
        amount,
        category: category ?? 'misc',
        description: description ?? null,
        date: date ?? new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ transaction: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ─── DELETE /api/transactions?id=<uuid> — delete a transaction ────────────────

export async function DELETE(request: NextRequest) {
  const uid = await getVerifiedUid(request)
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing transaction id' }, { status: 400 })
  }

  try {
    const supabase = getSupabaseServer()
    // The uid filter ensures users can only delete their own rows
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('firebase_uid', uid)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

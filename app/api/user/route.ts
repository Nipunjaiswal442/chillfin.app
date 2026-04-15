import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { verifyIdToken } from '@/lib/firebase-admin'

// ─── Helper: extract + verify token ──────────────────────────────────────────

async function getVerifiedUid(request: NextRequest): Promise<string | null> {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    const decoded = await verifyIdToken(token)
    return decoded.uid
  } catch {
    return null
  }
}

// ─── POST /api/user — upsert user profile ─────────────────────────────────────

export async function POST(request: NextRequest) {
  const uid = await getVerifiedUid(request)
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized — valid Firebase ID token required' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseServer()

    const body = await request.json()
    // uid is sourced from the verified token — never trust the request body for uid
    const { name, email, college, monthly_pocket_money } = body

    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          firebase_uid: uid,
          name: name ?? null,
          email: email ?? null,
          college: college ?? null,
          monthly_pocket_money: monthly_pocket_money ?? 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'firebase_uid' }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ user: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── GET /api/user?uid= — fetch user profile ─────────────────────────────────

export async function GET(request: NextRequest) {
  const uid = await getVerifiedUid(request)
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized — valid Firebase ID token required' }, { status: 401 })
  }

  const supabase = getSupabaseServer()

  // Always use the verified uid — ignore query param to prevent data leakage
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('firebase_uid', uid)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ user: data })
}


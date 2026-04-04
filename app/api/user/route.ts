import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase()
    if (!supabase) return NextResponse.json({ error: 'Supabase environment variables not configured' }, { status: 500 })

    const body = await request.json()
    const { firebase_uid, name, email, college, monthly_pocket_money } = body

    if (!firebase_uid) {
      return NextResponse.json({ error: 'firebase_uid is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          firebase_uid,
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

export async function GET(request: NextRequest) {
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: 'Supabase environment variables not configured' }, { status: 500 })

  const uid = request.nextUrl.searchParams.get('uid')
  if (!uid) return NextResponse.json({ error: 'uid required' }, { status: 400 })

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('firebase_uid', uid)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ user: data })
}


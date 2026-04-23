import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createCalendarEvent } from '@/lib/google-calendar'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: { users } } = await supabase.auth.admin.listUsers()
    const user = users.find(u => u.email === 'radu10318@gmail.com')
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('google_access_token, google_refresh_token')
      .eq('id', user.id)
      .single()

    if (!profile?.google_access_token) {
      return NextResponse.json({ error: 'Calendar not connected' }, { status: 400 })
    }

    const googleEventId = await createCalendarEvent(
      profile.google_access_token,
      profile.google_refresh_token,
      {
        title: body.title,
        date: body.date,
        startTime: body.startTime,
        endTime: body.endTime,
        location: body.location,
        description: body.description,
      }
    )

    if (body.eventId) {
      await supabase.from('events')
        .update({ google_calendar_event_id: googleEventId })
        .eq('id', body.eventId)
    }

    return NextResponse.json({ success: true, googleEventId })
  } catch (error) {
    console.error('Calendar error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

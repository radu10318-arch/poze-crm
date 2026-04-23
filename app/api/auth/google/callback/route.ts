import { NextRequest, NextResponse } from 'next/server'
import { getOAuthClient } from '@/lib/google-calendar'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.redirect('/setari?error=no_code')

  const oauth2Client = getOAuthClient()
  const { tokens } = await oauth2Client.getToken(code)

  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect('/auth/login')

  await supabase.from('profiles').upsert({
    id: user.id,
    google_access_token: tokens.access_token,
    google_refresh_token: tokens.refresh_token,
  })

  return NextResponse.redirect(
    new URL('/setari?success=calendar_connected', request.url)
  )
}

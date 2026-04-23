import { NextRequest, NextResponse } from 'next/server'
import { getOAuthClient } from '@/lib/google-calendar'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.redirect(new URL('/setari?error=no_code', request.url))

  try {
    const oauth2Client = getOAuthClient()
    const { tokens } = await oauth2Client.getToken(code)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: { users } } = await supabase.auth.admin.listUsers()
    const user = users.find(u => u.email === 'radu10318@gmail.com')

    if (user) {
      await supabase.from('profiles').upsert({
        id: user.id,
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
      })
    }

    return NextResponse.redirect(new URL('/setari?success=calendar_connected', request.url))
  } catch (error) {
    console.error('Calendar callback error:', error)
    return NextResponse.redirect(new URL('/setari?error=callback_failed', request.url))
  }
}

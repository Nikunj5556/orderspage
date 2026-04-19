import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { phone, otp } = await req.json()

  const { data, error } = await supabase
    .from('otp_codes')
    .select('*')
    .eq('phone', phone)
    .eq('code', otp)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (data) {
    // Optionally: Set a secure cookie/session here
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 })
}

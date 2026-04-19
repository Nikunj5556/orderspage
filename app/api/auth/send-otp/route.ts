import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { phone } = await req.json()
  const otp = Math.floor(100000 + Math.random() * 900000).toString()

  // 1. Store OTP in Supabase with Expiry
  await supabase.from('otp_codes').upsert({
    phone,
    code: otp,
    expires_at: new Date(Date.now() + 10 * 60000).toISOString()
  })

  // 2. Send via Meta API
  const response = await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: 'otp_verification', // Replace with your approved Meta template name
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: otp }]
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [{ type: 'text', text: otp }]
          }
        ]
      }
    })
  })

  return response.ok ? NextResponse.json({ success: true }) : NextResponse.json({ error: 'Failed' }, { status: 500 })
}

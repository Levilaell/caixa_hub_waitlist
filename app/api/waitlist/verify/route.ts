import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(
        new URL('/waitlist/error?message=Token inválido', request.url)
      )
    }

    // Find waitlist entry by token
    const { data: waitlistEntry, error: findError } = await supabase
      .from('waitlist')
      .select('*')
      .eq('verification_token', token)
      .single()

    if (findError || !waitlistEntry) {
      return NextResponse.redirect(
        new URL('/waitlist/error?message=Token inválido ou expirado', request.url)
      )
    }

    // Check if already verified
    if (waitlistEntry.email_verified) {
      return NextResponse.redirect(
        new URL('/waitlist/success?already=true', request.url)
      )
    }

    // Update verification status
    const { error: updateError } = await supabase
      .from('waitlist')
      .update({
        email_verified: true,
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', waitlistEntry.id)

    if (updateError) {
      throw updateError
    }

    // Track verification event
    await supabase.from('waitlist_events').insert({
      waitlist_id: waitlistEntry.id,
      event_type: 'verify',
      event_data: {
        verified_at: new Date().toISOString(),
      },
    })

    // Get updated position
    const { count } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })
      .eq('email_verified', true)
      .lte('created_at', waitlistEntry.created_at)

    return NextResponse.redirect(
      new URL(`/waitlist/success?position=${count}`, request.url)
    )

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.redirect(
      new URL('/waitlist/error?message=Erro ao verificar email', request.url)
    )
  }
}
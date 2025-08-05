import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

const signupSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(3),
  companyName: z.string().min(2),
  companySize: z.enum(['micro', 'small', 'medium']),
  phone: z.string().optional(),
  monthlyRevenue: z.string().optional(),
  mainBank: z.string().optional(),
  marketingConsent: z.boolean().default(false),
  referralSource: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = signupSchema.parse(body)

    // Get IP address for LGPD compliance
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    // Calculate priority score based on company data
    let priorityScore = 50 // Base score
    
    // Company size scoring
    if (validatedData.companySize === 'medium') priorityScore += 20
    else if (validatedData.companySize === 'small') priorityScore += 10
    
    // Monthly revenue scoring
    if (validatedData.monthlyRevenue === '500k+') priorityScore += 20
    else if (validatedData.monthlyRevenue === '200k-500k') priorityScore += 15
    else if (validatedData.monthlyRevenue === '50k-200k') priorityScore += 10
    
    // Complete profile bonus
    if (validatedData.phone) priorityScore += 5
    if (validatedData.mainBank) priorityScore += 5

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')

    // Insert into database
    const { data: waitlistEntry, error: insertError } = await supabase
      .from('waitlist')
      .insert({
        email: validatedData.email,
        full_name: validatedData.fullName,
        company_name: validatedData.companyName,
        company_size: validatedData.companySize,
        phone: validatedData.phone,
        monthly_revenue: validatedData.monthlyRevenue,
        main_bank: validatedData.mainBank,
        marketing_consent: validatedData.marketingConsent,
        privacy_policy_accepted: true,
        terms_accepted: true,
        consent_ip: ip,
        consent_timestamp: new Date().toISOString(),
        referral_source: validatedData.referralSource,
        utm_source: validatedData.utmSource,
        utm_medium: validatedData.utmMedium,
        utm_campaign: validatedData.utmCampaign,
        priority_score: priorityScore,
        verification_token: verificationToken,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      // Check if email already exists
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Este email já está cadastrado na lista de espera' },
          { status: 409 }
        )
      }
      throw insertError
    }

    // Get position in waitlist (starting from 77)
    const { count } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })
      .lte('created_at', waitlistEntry.created_at)
    
    // Add 76 to start counting from 77
    const adjustedPosition = (count || 1) + 76

    // Send welcome email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/waitlist/verify?token=${verificationToken}`
    
    await resend.emails.send({
      from: 'CaixaHub <noreply@caixahub.com.br>',
      to: validatedData.email,
      subject: 'Bem-vindo à lista de espera do CaixaHub! 🚀',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bem-vindo ao CaixaHub</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">CaixaHub</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Sistema Financeiro Inteligente</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
            <h2 style="color: #111827; margin-top: 0;">Olá ${validatedData.fullName}! 👋</h2>
            
            <p style="color: #4b5563; font-size: 16px;">
              Parabéns! Você acaba de dar o primeiro passo para revolucionar a gestão financeira da <strong>${validatedData.companyName}</strong>.
            </p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #374151; text-align: center;">
                <strong>Sua posição na fila:</strong><br>
                <span style="font-size: 36px; color: #10b981; font-weight: bold;">#${adjustedPosition}</span>
              </p>
            </div>
            
            <p style="color: #4b5563;">
              <strong>Por favor, confirme seu email clicando no botão abaixo:</strong>
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                Confirmar meu email
              </a>
            </div>
            
            <h3 style="color: #111827; margin-top: 30px;">O que esperar agora?</h3>
            
            <ul style="color: #4b5563; padding-left: 20px;">
              <li>📧 Você receberá atualizações exclusivas sobre o desenvolvimento</li>
              <li>🎁 Acesso antecipado com condições especiais para early adopters</li>
              <li>📊 Conteúdo educativo sobre gestão financeira para PMEs</li>
              <li>🚀 Convite prioritário quando lançarmos oficialmente</li>
            </ul>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;">
                <strong>💡 Dica:</strong> Compartilhe com amigos empresários e suba na fila! Quanto mais pessoas você indicar, mais cedo terá acesso.
              </p>
            </div>
            
            <p style="color: #4b5563; margin-top: 30px;">
              Seu link de indicação:<br>
              <code style="background: #f3f4f6; padding: 10px; border-radius: 4px; display: block; margin-top: 10px; word-break: break-all;">
                ${process.env.NEXT_PUBLIC_APP_URL}?ref=${encodeURIComponent(validatedData.email)}
              </code>
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Tem alguma dúvida? Responda este email ou entre em contato:<br>
              <a href="mailto:contato@caixahub.com.br" style="color: #3b82f6;">contato@caixahub.com.br</a>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>
              © 2025 CaixaHub. Todos os direitos reservados.<br>
              Você recebeu este email porque se cadastrou na lista de espera do CaixaHub.
            </p>
          </div>
        </body>
        </html>
      `,
    })

    // Track event
    await supabase.from('waitlist_events').insert({
      waitlist_id: waitlistEntry.id,
      event_type: 'signup',
      event_data: {
        priority_score: priorityScore,
        has_phone: !!validatedData.phone,
        marketing_consent: validatedData.marketingConsent,
      },
    })

    return NextResponse.json({
      success: true,
      position: adjustedPosition,
      message: 'Cadastro realizado com sucesso! Verifique seu email.',
    })

  } catch (error) {
    console.error('Waitlist signup error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao processar cadastro. Tente novamente.' },
      { status: 500 }
    )
  }
}
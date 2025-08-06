'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ArrowRight, CheckCircle, Shield, Clock, TrendingUp, Users, Sparkles, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import confetti from 'canvas-confetti'

const waitlistSchema = z.object({
  email: z.string().email('Email inválido'),
  fullName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  companyName: z.string().min(2, 'Nome da empresa é obrigatório'),
  companySize: z.enum(['micro', 'small', 'medium'], {
    required_error: 'Selecione o tamanho da empresa',
  }),
  phone: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Formato inválido. Use: (11) 99999-9999').optional().or(z.literal('')),
  monthlyRevenue: z.string().optional(),
  mainBank: z.string().optional(),
  marketingConsent: z.boolean().default(false),
})

type WaitlistFormData = z.infer<typeof waitlistSchema>

export default function WaitlistPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [position, setPosition] = useState<number | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    getValues,
  } = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      marketingConsent: false,
    },
  })

  const onSubmit = async (data: WaitlistFormData) => {
    setIsSubmitting(true)
    
    try {
      // Clean up phone field - send undefined instead of empty string
      const cleanedData = {
        ...data,
        phone: data.phone?.trim() || undefined,
        monthlyRevenue: data.monthlyRevenue || undefined,
        mainBank: data.mainBank || undefined,
      }
      
      // Handle UTM parameters - convert null to undefined
      const params = new URLSearchParams(window.location.search)
      const payload = {
        ...cleanedData,
        referralSource: params.get('ref') || 'direct',
        utmSource: params.get('utm_source') || undefined,
        utmMedium: params.get('utm_medium') || undefined,
        utmCampaign: params.get('utm_campaign') || undefined,
      }
      
      console.log('Sending payload:', payload)
      
      const response = await fetch('/api/waitlist/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      console.log('Response:', response.ok, result)

      if (response.ok) {
        setIsSuccess(true)
        setPosition(result.position)
        
        // Fire confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#ec4899', '#7c3aed'],
        })

        // Track conversion
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'waitlist_signup', {
            company_size: data.companySize,
            has_phone: !!data.phone,
            marketing_consent: data.marketingConsent,
          })
        }
      } else {
        console.error('Validation errors:', result.details)
        const errorMessage = result.details && Array.isArray(result.details) 
          ? result.details.map((err: any) => `${err.path?.join('.')}: ${err.message}`).join(', ')
          : result.message || 'Tente novamente mais tarde'
        
        toast({
          title: 'Erro ao cadastrar',
          description: errorMessage,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Erro ao cadastrar',
        description: 'Verifique sua conexão e tente novamente',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const features = [
    {
      icon: Clock,
      title: 'Economize 15h/mês',
      description: 'Automatize tarefas repetitivas e foque no crescimento',
    },
    {
      icon: TrendingUp,
      title: 'Insights com IA',
      description: 'Recomendações personalizadas para melhorar suas finanças',
    },
    {
      icon: Users,
      title: 'Relatórios Inteligentes',
      description: 'Dashboards personalizados com insights acionáveis para seu negócio',
    },
    {
      icon: Shield,
      title: 'Segurança Bancária',
      description: 'Certificado pelo Banco Central com criptografia de nível militar',
    },
  ]

  const stats = [
    { value: '2min', label: 'Setup inicial' },
    { value: '99%', label: 'Precisão da IA' },
    { value: '20+', label: 'Bancos conectados' },
    { value: '24/7', label: 'Sincronização' },
  ]

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-10 h-10 text-primary" />
          </motion.div>
          
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Você está na lista! 🎉
          </h2>
          
          {position && (
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg p-4 mb-6">
              <p className="text-sm opacity-90">Sua posição na fila</p>
              <p className="text-4xl font-bold">#{position}</p>
            </div>
          )}
          
          <p className="text-muted-foreground mb-8">
          </p>
          
          <div className="space-y-4">

            
            <div className="text-sm text-muted-foreground">
            </div>
            
            <div className="flex justify-center space-x-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const url = `https://waitlist.caixahub.com.br?ref=${encodeURIComponent(watch('email'))}`
                  navigator.clipboard.writeText(url)
                  toast({ title: 'Link copiado!' })
                }}
              >
                Copiar link de indicação
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        
        <div className="container mx-auto px-4 pt-20 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              Lançamento em breve • Lista de espera aberta
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              O sistema financeiro que{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                funciona sozinho
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Conecte seus bancos em 5 minutos. Nossa IA organiza tudo automaticamente, 
              categoriza despesas e ainda te ajuda a tomar decisões melhores. 
              Sem planilhas, sem trabalho manual.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground mb-12">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-primary mr-2" />
                Grátis para testar
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-primary mr-2" />
                Sem cartão de crédito
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-primary mr-2" />
                LGPD compliant
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
              {stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Waitlist Form Section */}
      <section className="relative -mt-20 pb-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-card rounded-2xl shadow-xl border border-border p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  Entre na lista de espera
                </h2>
                <p className="text-muted-foreground">
                  Seja um dos primeiros a revolucionar sua gestão financeira
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="fullName">Nome completo *</Label>
                    <Input
                      id="fullName"
                      placeholder="João Silva"
                      {...register('fullName')}
                      className={errors.fullName ? 'border-red-500' : ''}
                    />
                    {errors.fullName && (
                      <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email profissional *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="joao@empresa.com.br"
                      {...register('email')}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="companyName">Nome da empresa *</Label>
                    <Input
                      id="companyName"
                      placeholder="Minha Empresa Ltda"
                      {...register('companyName')}
                      className={errors.companyName ? 'border-red-500' : ''}
                    />
                    {errors.companyName && (
                      <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="companySize">Tamanho da empresa *</Label>
                    <input
                      type="hidden"
                      {...register('companySize')}
                    />
                    <Select 
                      onValueChange={(value) => setValue('companySize', value as 'micro' | 'small' | 'medium', { shouldValidate: true, shouldDirty: true })}
                      value={watch('companySize')}
                    >
                      <SelectTrigger className={errors.companySize ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="micro">Micro (até 10 funcionários)</SelectItem>
                        <SelectItem value="small">Pequena (11-50 funcionários)</SelectItem>
                        <SelectItem value="medium">Média (51-200 funcionários)</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.companySize && (
                      <p className="text-red-500 text-sm mt-1">{errors.companySize.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="phone">WhatsApp (opcional)</Label>
                    <Input
                      id="phone"
                      placeholder="(11) 99999-9999"
                      {...register('phone')}
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="monthlyRevenue">Faturamento mensal (opcional)</Label>
                    <Select onValueChange={(value) => setValue('monthlyRevenue', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-50k">Até R$ 50 mil</SelectItem>
                        <SelectItem value="50k-200k">R$ 50 mil - R$ 200 mil</SelectItem>
                        <SelectItem value="200k-500k">R$ 200 mil - R$ 500 mil</SelectItem>
                        <SelectItem value="500k+">Acima de R$ 500 mil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="mainBank">Banco principal (opcional)</Label>
                  <Select onValueChange={(value) => setValue('mainBank', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione seu banco" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="itau">Itaú</SelectItem>
                      <SelectItem value="bradesco">Bradesco</SelectItem>
                      <SelectItem value="santander">Santander</SelectItem>
                      <SelectItem value="bb">Banco do Brasil</SelectItem>
                      <SelectItem value="caixa">Caixa Econômica</SelectItem>
                      <SelectItem value="nubank">Nubank</SelectItem>
                      <SelectItem value="inter">Banco Inter</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="marketing"
                      onCheckedChange={(checked) => setValue('marketingConsent', checked as boolean)}
                    />
                    <Label htmlFor="marketing" className="text-sm text-muted-foreground cursor-pointer">
                      Quero receber novidades e ofertas exclusivas do CaixaHub
                    </Label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Cadastrando...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      Garantir meu acesso
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </div>
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Ao se cadastrar, você concorda em receber um email de confirmação
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Por que o CaixaHub é diferente?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Enquanto outros sistemas exigem horas de configuração e treinamento, 
              o CaixaHub funciona sozinho desde o primeiro minuto
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-border"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 bg-card overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Não perca a chance de transformar sua gestão financeira
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto text-muted-foreground">
            Entre agora na lista de espera e garanta condições exclusivas
          </p>
          <Button
            size="lg"
            variant="default"
            onClick={() => document.getElementById('fullName')?.focus()}
            className="h-12 px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
          >
            Quero meu desconto exclusivo
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/90 text-muted-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Building className="h-8 w-8 text-primary mr-2" />
              <span className="text-xl font-bold text-white">CaixaHub</span>
            </div>
            
            <div className="flex space-x-6">
              <a href="/termos" className="hover:text-white transition-colors">
                Termos
              </a>
              <a href="/privacidade" className="hover:text-white transition-colors">
                Privacidade
              </a>
              <a href="mailto:contato@caixahub.com.br" className="hover:text-white transition-colors">
                Contato
              </a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-border text-center text-sm">
            © 2025 CaixaHub. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}
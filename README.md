# CaixaHub Waitlist System

Sistema completo de lista de espera para o CaixaHub - plataforma de gestão financeira inteligente para PMEs brasileiras.

## 🚀 Overview

O CaixaHub Waitlist é um sistema moderno e otimizado para captura de leads, construído com as melhores práticas de desenvolvimento e total conformidade com a LGPD.

### Principais Features

- ✅ Landing page otimizada para conversão
- 🔐 Segurança de nível bancário
- 📊 Analytics avançado com GA4 e Hotjar
- 📧 Email automation com sequência de nutrição
- 🏃‍♂️ Performance otimizada (Lighthouse 90+)
- 🇧🇷 100% LGPD compliant
- 🎯 A/B testing integrado
- 📱 Mobile-first responsive design

## 🏗️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Hosting**: Vercel (São Paulo region)
- **Email**: Resend
- **CDN**: Cloudflare
- **Analytics**: Google Analytics 4, Hotjar, Mixpanel
- **Security**: Rate limiting (Upstash Redis), reCAPTCHA v3

## 📁 Project Structure

```
caixa_hub_waitlist/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   └── waitlist/         # Waitlist endpoints
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Landing page
├── components/               # React components
│   └── ui/                   # UI components
├── lib/                      # Utility functions
├── prisma/                   # Database schema
├── supabase/                 # Database migrations
├── email-templates/          # Email templates
└── public/                   # Static assets
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account
- Vercel account

### Local Development

```bash
# Clone the repository
git clone https://github.com/caixahub/waitlist.git
cd waitlist

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Configure your environment variables
# Edit .env.local with your credentials

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_HOTJAR_ID=1234567

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Security
RECAPTCHA_SITE_KEY=your-site-key
RECAPTCHA_SECRET_KEY=your-secret-key
ENCRYPTION_KEY=your-32-byte-hex-key
```

## 📊 Key Metrics

The system tracks:

- **Conversion Rate**: Visitors → Signups
- **Verification Rate**: Signups → Verified
- **Engagement Rate**: Email opens/clicks
- **Lead Quality Score**: 0-100 based on company data
- **Referral Rate**: Users who share the waitlist

## 🔐 Security Features

- **Rate Limiting**: 5 signups per IP per hour
- **CAPTCHA**: Google reCAPTCHA v3
- **Input Validation**: Zod schemas
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Content Security Policy
- **HTTPS Only**: Enforced via HSTS
- **Data Encryption**: AES-256-GCM for sensitive data

## 📧 Email Sequence

1. **Welcome Email** (Immediate): Confirmation link + position
2. **Week 1**: "Como o CaixaHub vai revolucionar sua gestão"
3. **Week 2**: "Case: Como a Empresa X economizou 20h/mês"
4. **Week 3**: "5 erros financeiros que você está cometendo"
5. **Week 4**: "Prévia exclusiva: Tour pelo CaixaHub"
6. **Pre-Launch**: Exclusive early access offer
7. **Launch Day**: Access link + special discount

## 🚀 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Database Setup

1. Create Supabase project in São Paulo region
2. Run migrations from `supabase/migrations/`
3. Configure Row Level Security

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## 📈 Analytics Implementation

- **Google Analytics 4**: Conversion tracking
- **Hotjar**: Heatmaps and recordings
- **Mixpanel**: User journey analysis
- **Custom Dashboard**: Real-time metrics

See [ANALYTICS_IMPLEMENTATION.md](./ANALYTICS_IMPLEMENTATION.md) for setup.

## 🔒 LGPD Compliance

Full compliance with Brazilian data protection law:

- ✅ Explicit consent collection
- ✅ Data minimization
- ✅ Right to access/rectification/deletion
- ✅ Data portability
- ✅ Breach notification protocol
- ✅ Privacy by design

See [SECURITY_LGPD_COMPLIANCE.md](./SECURITY_LGPD_COMPLIANCE.md) for details.

## 🧪 Testing

```bash
# Run type checking
npm run typecheck

# Run linter
npm run lint

# Run tests (when implemented)
npm test
```

## 📝 Documentation

- [Architecture Overview](./WAITLIST_ARCHITECTURE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Analytics Guide](./ANALYTICS_IMPLEMENTATION.md)
- [Security & LGPD](./SECURITY_LGPD_COMPLIANCE.md)
- [Email Templates](./email-templates/nurture-sequence.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential. All rights reserved by CaixaHub.

## 📞 Support

- **Email**: dev@caixahub.com.br
- **Slack**: #dev-waitlist
- **Issues**: GitHub Issues

---

Built with ❤️ by CaixaHub Team
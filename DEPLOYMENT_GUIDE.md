# Deployment & Infrastructure Guide - CaixaHub Waitlist

## Overview
Complete deployment guide for the CaixaHub waitlist system using Vercel, Supabase, and supporting services.

## 1. Prerequisites

### Required Accounts
- [ ] Vercel account (for hosting)
- [ ] Supabase account (for database)
- [ ] Resend account (for emails)
- [ ] Google account (for analytics & reCAPTCHA)
- [ ] Cloudflare account (for DNS & CDN)
- [ ] Upstash account (for Redis rate limiting)

### Domain Setup
- [ ] Purchase `caixahub.com.br` domain
- [ ] Configure DNS with Cloudflare
- [ ] Set up subdomain `waitlist.caixahub.com.br`

## 2. Local Development Setup

### Install Dependencies
```bash
# Clone repository
git clone https://github.com/caixahub/waitlist.git
cd waitlist

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

### Environment Variables Setup
```bash
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email
RESEND_API_KEY=re_xxxxxxxxxxxx

# Analytics (optional for dev)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_HOTJAR_ID=1234567

# Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

## 3. Supabase Setup

### Create Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project in São Paulo region
3. Note your project URL and keys

### Run Migrations
```bash
# Using Supabase CLI
supabase link --project-ref your-project-ref
supabase db push

# Or manually in SQL editor
-- Copy contents from supabase/migrations/001_create_waitlist_tables.sql
```

### Configure Auth
```sql
-- Disable email auth (we're using custom waitlist)
UPDATE auth.config 
SET enable_signup = false;
```

### Enable Row Level Security
Already configured in migration file.

## 4. Vercel Deployment

### Initial Setup
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Configure project
vercel env pull
```

### Environment Variables
Add all variables from `.env.local` to Vercel:
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... add all other variables
```

### Deploy
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Vercel Configuration
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["gru1"], // São Paulo
  "functions": {
    "app/api/waitlist/signup/route.ts": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

## 5. Cloudflare Configuration

### DNS Setup
```
# A Records
waitlist.caixahub.com.br -> Vercel IP (76.76.21.21)

# CNAME Records (alternative)
waitlist.caixahub.com.br -> cname.vercel-dns.com
```

### SSL/TLS
- Set SSL/TLS encryption mode to "Full (strict)"
- Enable "Always Use HTTPS"
- Enable "Automatic HTTPS Rewrites"

### Page Rules
```
# Force HTTPS
*caixahub.com.br/*
- Always Use HTTPS: On

# Cache static assets
*caixahub.com.br/*.js
*caixahub.com.br/*.css
*caixahub.com.br/*.png
- Cache Level: Cache Everything
- Edge Cache TTL: 1 month
```

### Security Settings
- Enable Bot Fight Mode
- Configure Web Application Firewall (WAF)
- Set Security Level to "Medium"
- Enable Email Address Obfuscation

## 6. Email Service (Resend) Setup

### Configuration
1. Sign up at [resend.com](https://resend.com)
2. Verify domain `caixahub.com.br`
3. Add DNS records:
```
# MX Record
caixahub.com.br -> feedback-smtp.us-east-1.amazonses.com (10)

# TXT Records (SPF)
caixahub.com.br -> "v=spf1 include:amazonses.com ~all"

# CNAME Records (DKIM)
resend._domainkey -> resend.domainkey.u4w7...
```

### Email Templates
Upload templates from `/email-templates/` directory.

## 7. Analytics Setup

### Google Analytics 4
1. Create new GA4 property
2. Configure data streams for `waitlist.caixahub.com.br`
3. Set up conversions:
   - Waitlist signup
   - Email verification
   - Referral shared

### Hotjar
1. Create new site for waitlist
2. Install tracking code (already in layout.tsx)
3. Set up heatmaps for key pages

## 8. Redis Setup (Upstash)

### Create Database
1. Sign up at [upstash.com](https://upstash.com)
2. Create Redis database in São Paulo region
3. Copy REST URL and token

### Configure Rate Limiting
```typescript
// Already implemented in lib/rateLimiter.ts
const signupLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
});
```

## 9. Monitoring Setup

### Vercel Analytics
Automatically enabled for Next.js projects.

### Sentry Error Tracking
```bash
# Install Sentry
npm install @sentry/nextjs

# Configure
npx @sentry/wizard -i nextjs
```

### Datadog (Optional)
```yaml
# datadog.yaml
api_key: ${DD_API_KEY}
site: datadoghq.com
logs_enabled: true
apm_config:
  enabled: true
  env: production
```

## 10. CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Run type check
        run: npm run typecheck
        
      - name: Run linter
        run: npm run lint
        
      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Pre-deployment Checklist
```bash
#!/bin/bash
# scripts/pre-deploy.sh

echo "🚀 Pre-deployment checks..."

# Type check
echo "📝 Running type check..."
npm run typecheck || exit 1

# Lint
echo "🔍 Running linter..."
npm run lint || exit 1

# Test
echo "🧪 Running tests..."
npm test || exit 1

# Build
echo "🏗️ Building project..."
npm run build || exit 1

echo "✅ All checks passed!"
```

## 11. Production Launch Checklist

### Technical
- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] SSL certificate active
- [ ] Rate limiting tested
- [ ] CAPTCHA working
- [ ] Email sending verified
- [ ] Analytics tracking confirmed

### Security
- [ ] Security headers configured
- [ ] LGPD compliance verified
- [ ] Data encryption active
- [ ] Backup system configured
- [ ] Incident response plan ready

### Performance
- [ ] Page load time < 3s
- [ ] Lighthouse score > 90
- [ ] CDN configured
- [ ] Image optimization active

### Monitoring
- [ ] Error tracking active
- [ ] Uptime monitoring configured
- [ ] Alerts configured
- [ ] Analytics dashboards ready

## 12. Rollback Procedure

### Vercel Instant Rollback
```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback <deployment-url>
```

### Database Rollback
```sql
-- Restore from point-in-time backup
-- Supabase Dashboard > Database > Backups
```

### Emergency Contacts
- **DevOps Lead**: +55 11 XXXX-XXXX
- **Database Admin**: +55 11 XXXX-XXXX
- **Security Team**: security@caixahub.com.br
- **Vercel Support**: support.vercel.com
- **Supabase Support**: support.supabase.com

## 13. Post-Launch Tasks

### Week 1
- [ ] Monitor error rates
- [ ] Check conversion metrics
- [ ] Review user feedback
- [ ] Optimize slow queries
- [ ] A/B test analysis

### Month 1
- [ ] Security audit
- [ ] Performance optimization
- [ ] Cost analysis
- [ ] Scale planning
- [ ] Feature roadmap update

### Ongoing
- [ ] Weekly deployments
- [ ] Monthly security updates
- [ ] Quarterly infrastructure review
- [ ] Annual disaster recovery test
# CaixaHub Waitlist System Architecture

## 🎯 Overview
Complete waitlist system for CaixaHub - Brazilian financial automation SaaS for SMEs.

## 🏗️ System Architecture

### Tech Stack

#### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Shadcn/ui
- **Language**: TypeScript
- **Animations**: Framer Motion
- **Form Handling**: React Hook Form + Zod
- **Analytics**: Google Analytics 4 + Hotjar
- **A/B Testing**: Split.io

#### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Validation**: Zod
- **Rate Limiting**: Upstash Redis
- **Queue**: Vercel Queue (for email sending)

#### Infrastructure
- **Hosting**: Vercel (Brazil region)
- **Database**: Supabase (São Paulo region)
- **CDN**: Cloudflare (Brazilian PoPs)
- **Domain**: caixahub.com.br
- **SSL**: Cloudflare SSL

#### Services
- **Email**: Resend (primary) + SendGrid (backup)
- **SMS**: Twilio (for high-value leads)
- **Analytics**: Google Analytics 4 + Mixpanel
- **Error Tracking**: Sentry
- **Monitoring**: Vercel Analytics + Datadog
- **A/B Testing**: Split.io

## 📊 Data Architecture

### Waitlist Database Schema

```sql
-- Waitlist entries
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  company_name VARCHAR(255),
  company_size VARCHAR(50), -- 'micro', 'small', 'medium'
  phone VARCHAR(20), -- Brazilian format
  cnpj VARCHAR(18), -- Optional
  monthly_revenue VARCHAR(50), -- Revenue range
  main_bank VARCHAR(100), -- Primary bank used
  
  -- Tracking
  referral_source VARCHAR(100),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_content VARCHAR(100),
  utm_term VARCHAR(100),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, invited, converted
  priority_score INTEGER DEFAULT 0, -- 0-100 based on lead quality
  
  -- Engagement
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  verification_sent_at TIMESTAMPTZ,
  last_email_sent_at TIMESTAMPTZ,
  email_open_count INTEGER DEFAULT 0,
  email_click_count INTEGER DEFAULT 0,
  
  -- Consent (LGPD)
  marketing_consent BOOLEAN DEFAULT FALSE,
  privacy_policy_accepted BOOLEAN NOT NULL,
  terms_accepted BOOLEAN NOT NULL,
  consent_ip VARCHAR(45),
  consent_timestamp TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  invited_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  
  -- A/B Testing
  variant_group VARCHAR(50),
  conversion_path JSONB
);

-- Indexes for performance
CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_status ON waitlist(status);
CREATE INDEX idx_waitlist_created_at ON waitlist(created_at DESC);
CREATE INDEX idx_waitlist_priority_score ON waitlist(priority_score DESC);

-- Waitlist events tracking
CREATE TABLE waitlist_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waitlist_id UUID REFERENCES waitlist(id),
  event_type VARCHAR(50) NOT NULL, -- signup, verify, email_open, email_click, etc
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email campaigns
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  template_id VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, sent
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  
  -- Metrics
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔐 Security & Compliance

### LGPD Compliance
- **Explicit Consent**: Clear opt-in for marketing communications
- **Data Minimization**: Only collect necessary data
- **Right to Access**: API endpoint for data export
- **Right to Deletion**: Automated deletion workflow
- **Data Retention**: 2 years for waitlist data
- **Encryption**: All PII encrypted at rest
- **Audit Trail**: All data access logged

### Security Measures
- **Rate Limiting**: 5 signups per IP per hour
- **CAPTCHA**: Google reCAPTCHA v3 for bot protection
- **Email Validation**: Double opt-in process
- **HTTPS Only**: Enforced via HSTS
- **CSP Headers**: Strict Content Security Policy
- **Input Sanitization**: All inputs validated and sanitized
- **SQL Injection Protection**: Parameterized queries via Prisma

## 📧 Email Flow

### 1. Welcome Email (Immediate)
- Confirmation link
- What to expect
- Company introduction
- Social media links

### 2. Confirmation Email (After click)
- Position in waitlist
- Estimated launch date
- Early access benefits
- Referral program info

### 3. Nurture Sequence (Weekly)
- Week 1: "Como o CaixaHub vai revolucionar sua gestão financeira"
- Week 2: "Case: Como a Empresa X economizou 20h/mês"
- Week 3: "5 erros financeiros que você está cometendo"
- Week 4: "Prévia exclusiva: Tour pelo CaixaHub"

### 4. Pre-Launch (2 weeks before)
- Exclusive early access offer
- Special pricing for waitlist
- Countdown to launch

### 5. Launch Day
- Your access is ready!
- Special waitlist-only discount
- Limited time offer

## 📈 Analytics & Tracking

### Key Metrics
- **Conversion Rate**: Visitors → Waitlist
- **Verification Rate**: Signups → Verified
- **Engagement Rate**: Email opens/clicks
- **Lead Quality Score**: Based on company data
- **Referral Rate**: Users who share

### Tracking Implementation
```javascript
// Event structure
{
  event: 'waitlist_signup',
  properties: {
    email: 'hashed_email',
    company_size: 'small',
    referral_source: 'organic',
    variant: 'hero_a',
    priority_score: 85
  }
}
```

### A/B Testing Strategy
- Hero section variations
- CTA button text/color
- Form fields (minimal vs detailed)
- Value propositions
- Social proof placement

## 🚀 API Endpoints

### Public Endpoints
```
POST   /api/waitlist/signup
POST   /api/waitlist/verify
GET    /api/waitlist/position/:email
POST   /api/waitlist/refer
```

### Admin Endpoints
```
GET    /api/admin/waitlist
GET    /api/admin/waitlist/export
POST   /api/admin/waitlist/invite
GET    /api/admin/analytics
POST   /api/admin/email/campaign
```

## 🔄 Integration Points

### CRM Integration (Future)
- HubSpot / RD Station
- Automatic lead scoring
- Sales pipeline integration

### Marketing Automation
- Email sequences
- SMS for high-priority leads
- Retargeting pixel data

### Product Integration
- Seamless transition from waitlist to user
- Special onboarding for waitlist members
- Priority support channel

## 📱 Mobile Optimization

### Performance Targets
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Lighthouse Score: > 90

### Mobile-First Features
- One-thumb form completion
- WhatsApp signup option
- Progressive Web App capabilities
- Offline support

## 🎯 Success Metrics

### Phase 1 (Launch - 3 months)
- 10,000 waitlist signups
- 70% email verification rate
- 30% email engagement rate

### Phase 2 (3-6 months)
- 25,000 waitlist signups
- 15% referral rate
- 40% high-quality leads (score > 70)

### Phase 3 (6+ months)
- 50,000 waitlist signups
- 25% conversion to paid users
- R$ 2M ARR from waitlist converts
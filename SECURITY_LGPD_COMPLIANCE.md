# Security & LGPD Compliance Guide - CaixaHub Waitlist

## Overview
Comprehensive security measures and LGPD (Lei Geral de Proteção de Dados) compliance for the CaixaHub waitlist system.

## 1. Security Architecture

### Infrastructure Security

#### SSL/TLS Configuration
```nginx
# Nginx configuration
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;
}
```

#### Security Headers
```typescript
// middleware/security.ts
export function securityHeaders(req: NextRequest) {
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.resend.com;"
  );
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );
  
  return response;
}
```

### Application Security

#### Input Validation & Sanitization
```typescript
// lib/validation.ts
import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

// Email validation with additional security checks
export const secureEmailSchema = z.string()
  .email()
  .max(255)
  .refine((email) => {
    // Prevent email injection attacks
    const dangerous = ['<', '>', '"', "'", '&', '\n', '\r', '%0a', '%0d'];
    return !dangerous.some(char => email.toLowerCase().includes(char));
  }, 'Email contains invalid characters');

// Sanitize all text inputs
export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  }).trim();
}

// SQL injection prevention (using Prisma parameterized queries)
export async function findUserByEmail(email: string) {
  return await prisma.waitlist.findUnique({
    where: { email } // Parameterized, safe from SQL injection
  });
}
```

#### Rate Limiting
```typescript
// lib/rateLimiter.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create rate limiters
export const signupLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 requests per hour
  analytics: true,
});

export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
});

// Middleware implementation
export async function rateLimit(req: NextRequest, limiter: Ratelimit) {
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  const { success, limit, reset, remaining } = await limiter.limit(ip);
  
  if (!success) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(reset).toISOString(),
      },
    });
  }
  
  return null;
}
```

#### CAPTCHA Implementation
```typescript
// components/ReCaptcha.tsx
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

export function useRecaptcha() {
  const { executeRecaptcha } = useGoogleReCaptcha();
  
  const verifyRecaptcha = async (action: string) => {
    if (!executeRecaptcha) {
      throw new Error('Recaptcha not loaded');
    }
    
    const token = await executeRecaptcha(action);
    
    const response = await fetch('/api/verify-recaptcha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action }),
    });
    
    const data = await response.json();
    
    if (!data.success || data.score < 0.5) {
      throw new Error('Recaptcha verification failed');
    }
    
    return true;
  };
  
  return { verifyRecaptcha };
}

// API route
export async function POST(req: NextRequest) {
  const { token, action } = await req.json();
  
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
  });
  
  const data = await response.json();
  
  return NextResponse.json({
    success: data.success,
    score: data.score,
    action: data.action,
  });
}
```

### Data Security

#### Encryption at Rest
```typescript
// lib/encryption.ts
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const secretKey = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

export function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Usage for sensitive data
export async function storeEncryptedPhone(userId: string, phone: string) {
  const encryptedPhone = encrypt(phone);
  
  await prisma.waitlist.update({
    where: { id: userId },
    data: { phone: encryptedPhone },
  });
}
```

#### Password Hashing (for admin accounts)
```typescript
// lib/auth.ts
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

## 2. LGPD Compliance

### Legal Basis for Processing
```typescript
// Legal basis enum
enum LegalBasis {
  CONSENT = 'consent',
  CONTRACT = 'contract',
  LEGAL_OBLIGATION = 'legal_obligation',
  VITAL_INTERESTS = 'vital_interests',
  PUBLIC_TASK = 'public_task',
  LEGITIMATE_INTERESTS = 'legitimate_interests',
}

// Track legal basis for each processing activity
interface ProcessingActivity {
  purpose: string;
  legalBasis: LegalBasis;
  dataCategories: string[];
  retention: string;
  recipients: string[];
}

export const processingActivities: ProcessingActivity[] = [
  {
    purpose: 'Waitlist management',
    legalBasis: LegalBasis.CONSENT,
    dataCategories: ['name', 'email', 'company_data'],
    retention: '2 years after last interaction',
    recipients: ['CaixaHub team', 'Email service provider'],
  },
  {
    purpose: 'Marketing communications',
    legalBasis: LegalBasis.CONSENT,
    dataCategories: ['email', 'name', 'preferences'],
    retention: 'Until consent withdrawal',
    recipients: ['CaixaHub marketing team', 'Email service provider'],
  },
];
```

### Consent Management
```typescript
// lib/consent.ts
export interface ConsentRecord {
  userId: string;
  purpose: string;
  granted: boolean;
  timestamp: Date;
  ip: string;
  userAgent: string;
  withdrawnAt?: Date;
}

export async function recordConsent(
  userId: string,
  purpose: string,
  granted: boolean,
  req: NextRequest
): Promise<void> {
  const consent: ConsentRecord = {
    userId,
    purpose,
    granted,
    timestamp: new Date(),
    ip: req.headers.get('x-forwarded-for') || 'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
  };
  
  await prisma.consentLog.create({
    data: consent,
  });
  
  // Update user record
  if (purpose === 'marketing') {
    await prisma.waitlist.update({
      where: { id: userId },
      data: { marketingConsent: granted },
    });
  }
}

export async function withdrawConsent(
  userId: string,
  purpose: string
): Promise<void> {
  await prisma.consentLog.updateMany({
    where: {
      userId,
      purpose,
      withdrawnAt: null,
    },
    data: {
      withdrawnAt: new Date(),
    },
  });
  
  // Stop processing for this purpose
  if (purpose === 'marketing') {
    await prisma.waitlist.update({
      where: { id: userId },
      data: { 
        marketingConsent: false,
        status: 'consent_withdrawn',
      },
    });
  }
}
```

### Data Subject Rights

#### Right to Access
```typescript
// app/api/lgpd/access/route.ts
export async function POST(req: NextRequest) {
  const { email, verificationCode } = await req.json();
  
  // Verify user identity
  const user = await verifyUserIdentity(email, verificationCode);
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  
  // Collect all user data
  const userData = await collectUserData(user.id);
  
  // Generate report
  const report = {
    personalData: {
      email: user.email,
      fullName: user.fullName,
      companyName: user.companyName,
      phone: user.phone ? decrypt(user.phone) : null,
      // ... other fields
    },
    processingActivities: await getProcessingActivities(user.id),
    consentHistory: await getConsentHistory(user.id),
    dataSharing: await getDataSharingInfo(user.id),
    exportDate: new Date().toISOString(),
  };
  
  // Log access request
  await logDataRequest(user.id, 'access', req);
  
  return NextResponse.json(report);
}
```

#### Right to Rectification
```typescript
// app/api/lgpd/rectify/route.ts
export async function PUT(req: NextRequest) {
  const { email, verificationCode, updates } = await req.json();
  
  // Verify user identity
  const user = await verifyUserIdentity(email, verificationCode);
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  
  // Validate updates
  const validatedUpdates = await validateDataUpdates(updates);
  
  // Apply updates
  await prisma.waitlist.update({
    where: { id: user.id },
    data: {
      ...validatedUpdates,
      updatedAt: new Date(),
    },
  });
  
  // Log rectification
  await logDataRequest(user.id, 'rectification', req, { updates: validatedUpdates });
  
  return NextResponse.json({ success: true });
}
```

#### Right to Deletion
```typescript
// app/api/lgpd/delete/route.ts
export async function DELETE(req: NextRequest) {
  const { email, verificationCode, confirmation } = await req.json();
  
  // Verify user identity
  const user = await verifyUserIdentity(email, verificationCode);
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  
  // Double confirmation
  if (confirmation !== `DELETE-${user.email}`) {
    return NextResponse.json({ error: 'Invalid confirmation' }, { status: 400 });
  }
  
  // Check legal obligations
  const canDelete = await checkDeletionEligibility(user.id);
  if (!canDelete.eligible) {
    return NextResponse.json({ 
      error: 'Cannot delete due to legal obligations',
      reason: canDelete.reason,
      retryAfter: canDelete.retryAfter,
    }, { status: 403 });
  }
  
  // Anonymize instead of hard delete
  await anonymizeUserData(user.id);
  
  // Log deletion
  await logDataRequest(user.id, 'deletion', req);
  
  return NextResponse.json({ success: true });
}

async function anonymizeUserData(userId: string) {
  const anonymousData = {
    email: `deleted-${userId}@anonymous.local`,
    fullName: 'DELETED USER',
    companyName: 'DELETED COMPANY',
    phone: null,
    cnpj: null,
    status: 'deleted',
    // Preserve only non-identifying analytics data
    companySize: true,
    monthlyRevenue: true,
    createdAt: true,
  };
  
  await prisma.waitlist.update({
    where: { id: userId },
    data: anonymousData,
  });
}
```

#### Right to Data Portability
```typescript
// app/api/lgpd/export/route.ts
export async function POST(req: NextRequest) {
  const { email, verificationCode, format = 'json' } = await req.json();
  
  // Verify user identity
  const user = await verifyUserIdentity(email, verificationCode);
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  
  // Collect portable data
  const portableData = await collectPortableData(user.id);
  
  // Format data
  let exportData: string;
  let contentType: string;
  
  switch (format) {
    case 'csv':
      exportData = convertToCSV(portableData);
      contentType = 'text/csv';
      break;
    case 'xml':
      exportData = convertToXML(portableData);
      contentType = 'application/xml';
      break;
    default:
      exportData = JSON.stringify(portableData, null, 2);
      contentType = 'application/json';
  }
  
  // Log export
  await logDataRequest(user.id, 'portability', req, { format });
  
  return new NextResponse(exportData, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="caixahub-data-${user.id}.${format}"`,
    },
  });
}
```

### Data Breach Protocol
```typescript
// lib/breach-protocol.ts
export interface DataBreachIncident {
  id: string;
  detectedAt: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedRecords: number;
  dataTypes: string[];
  cause: string;
  containedAt?: Date;
  notifiedAuthoritiesAt?: Date;
  notifiedUsersAt?: Date;
}

export async function handleDataBreach(incident: Partial<DataBreachIncident>) {
  const breach = await recordBreach(incident);
  
  // Immediate actions
  await containBreach(breach);
  await assessImpact(breach);
  
  // Notification timeline (LGPD: 72 hours)
  if (breach.severity === 'high' || breach.severity === 'critical') {
    // Notify authorities within 72 hours
    setTimeout(() => notifyAuthorities(breach), 1000 * 60 * 60 * 24); // 24h
    
    // Notify affected users
    await notifyAffectedUsers(breach);
  }
  
  // Generate report
  await generateBreachReport(breach);
}

async function notifyAuthorities(breach: DataBreachIncident) {
  const report = {
    incidentId: breach.id,
    detectedAt: breach.detectedAt,
    description: breach.cause,
    affectedDataSubjects: breach.affectedRecords,
    likelyConsequences: assessConsequences(breach),
    measuresTaken: await getMeasuresTaken(breach.id),
    contactPoint: {
      name: 'DPO - CaixaHub',
      email: 'dpo@caixahub.com.br',
      phone: '+55 11 XXXX-XXXX',
    },
  };
  
  // Send to ANPD (Autoridade Nacional de Proteção de Dados)
  await sendToANPD(report);
}
```

### Privacy by Design Implementation
```typescript
// Privacy-first data collection
export const minimalDataCollection = {
  required: ['email', 'fullName', 'companyName', 'termsAccepted'],
  optional: ['phone', 'cnpj', 'monthlyRevenue', 'mainBank'],
  marketing: ['marketingConsent'], // Separate opt-in
};

// Data minimization in API responses
export function minimizeUserData(user: any, purpose: string) {
  switch (purpose) {
    case 'public_display':
      return { id: user.id, companySize: user.companySize };
    case 'email_campaign':
      return { email: user.email, fullName: user.fullName };
    case 'analytics':
      return { 
        companySize: user.companySize,
        monthlyRevenue: user.monthlyRevenue,
        createdAt: user.createdAt,
      };
    default:
      return user;
  }
}
```

## 3. Security Monitoring & Incident Response

### Real-time Monitoring
```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
  tracesSampleRate: 0.1,
  beforeSend(event, hint) {
    // Remove sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    if (event.extra) {
      delete event.extra.password;
      delete event.extra.email;
    }
    return event;
  },
});

// Custom security monitoring
export async function logSecurityEvent(
  type: string,
  severity: 'info' | 'warning' | 'error' | 'critical',
  details: any,
  req?: NextRequest
) {
  const event = {
    type,
    severity,
    timestamp: new Date(),
    ip: req?.headers.get('x-forwarded-for') || 'unknown',
    userAgent: req?.headers.get('user-agent') || 'unknown',
    details,
  };
  
  // Log to database
  await prisma.securityLog.create({ data: event });
  
  // Alert on critical events
  if (severity === 'critical') {
    await sendSecurityAlert(event);
  }
  
  // Send to Sentry
  Sentry.captureEvent({
    message: `Security Event: ${type}`,
    level: severity,
    extra: event,
  });
}
```

### Incident Response Plan
```yaml
incident_response:
  detection:
    - Automated monitoring alerts
    - User reports
    - Security scans
    
  classification:
    - P1: Data breach, system compromise
    - P2: Authentication bypass, XSS/CSRF
    - P3: Rate limit bypass, minor vulnerabilities
    - P4: Potential vulnerabilities
    
  response_team:
    - Security Lead: Initial assessment
    - Development Lead: Technical response
    - Legal/DPO: Compliance obligations
    - Communications: User notification
    
  timeline:
    - 0-15min: Initial assessment
    - 15-60min: Containment measures
    - 1-4h: Impact analysis
    - 4-24h: Remediation plan
    - 24-72h: Authority notification (if required)
    
  post_incident:
    - Root cause analysis
    - Security improvements
    - Process updates
    - Team training
```

## 4. Compliance Checklist

### Pre-Launch
- [ ] SSL/TLS certificate installed
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] Input validation on all forms
- [ ] CAPTCHA integrated
- [ ] Encryption keys generated and secured
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Cookie consent banner implemented
- [ ] DPO contact information published

### Ongoing
- [ ] Weekly security scans
- [ ] Monthly penetration testing
- [ ] Quarterly privacy impact assessments
- [ ] Annual LGPD compliance audit
- [ ] Regular security training for team
- [ ] Incident response drills
- [ ] Third-party vendor assessments
- [ ] Data retention policy enforcement
- [ ] Consent renewal campaigns
- [ ] Security patch management

### Documentation
- [ ] Data flow diagrams
- [ ] Processing activities record
- [ ] Risk assessment reports
- [ ] Incident response procedures
- [ ] Data breach notification templates
- [ ] Subject rights request procedures
- [ ] Vendor processing agreements
- [ ] Employee data handling policies
- [ ] Security awareness materials
- [ ] Compliance certificates
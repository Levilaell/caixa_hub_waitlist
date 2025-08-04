# Analytics Implementation Guide - CaixaHub Waitlist

## Overview
Complete analytics setup for tracking waitlist conversion, user behavior, and campaign performance.

## 1. Google Analytics 4 Setup

### Installation
Already included in `app/layout.tsx`. Configure `NEXT_PUBLIC_GA_ID` in `.env`.

### Custom Events

#### Waitlist Signup
```javascript
gtag('event', 'waitlist_signup', {
  event_category: 'engagement',
  event_label: 'form_submission',
  company_size: 'small',
  has_phone: true,
  marketing_consent: true,
  referral_source: 'organic',
  priority_score: 85
});
```

#### Email Verification
```javascript
gtag('event', 'email_verified', {
  event_category: 'engagement',
  event_label: 'email_confirmation',
  time_to_verify: 120, // seconds
  position_in_queue: 245
});
```

#### Referral Link Shared
```javascript
gtag('event', 'referral_shared', {
  event_category: 'viral',
  event_label: 'link_copy',
  share_method: 'copy_link'
});
```

### Conversion Goals
1. **Primary**: Waitlist signup completed
2. **Secondary**: Email verified
3. **Tertiary**: Referral link shared

### Custom Dimensions
- `company_size`: micro/small/medium
- `priority_score`: 0-100
- `referral_source`: organic/referral/paid
- `variant_group`: A/B test variant

## 2. Hotjar Setup

### Installation
Already included in `app/layout.tsx`. Configure `NEXT_PUBLIC_HOTJAR_ID` in `.env`.

### Heatmaps
- Landing page scroll depth
- Form field interaction
- CTA button clicks
- Feature section engagement

### Recordings
- Form abandonment analysis
- Error message triggers
- Success page behavior
- Mobile vs desktop patterns

### Surveys
1. **Exit Intent**: "What stopped you from signing up?"
2. **Post-Signup**: "What feature are you most excited about?"
3. **NPS**: "How likely are you to recommend CaixaHub?"

## 3. Mixpanel Setup

### Installation
```typescript
// lib/mixpanel.ts
import mixpanel from 'mixpanel-browser';

mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN!, {
  debug: process.env.NODE_ENV === 'development',
  track_pageview: true,
  persistence: 'localStorage',
  ignore_dnt: false
});

export default mixpanel;
```

### User Properties
```typescript
mixpanel.people.set({
  '$email': email,
  '$name': fullName,
  'company_name': companyName,
  'company_size': companySize,
  'priority_score': priorityScore,
  'signup_date': new Date().toISOString(),
  'referral_source': referralSource
});
```

### Key Events
```typescript
// Signup flow
mixpanel.track('Waitlist Signup Started', {
  form_variant: 'detailed'
});

mixpanel.track('Waitlist Signup Completed', {
  company_size: companySize,
  has_phone: !!phone,
  time_to_complete: timeSpent,
  fields_filled: filledFields
});

// Engagement
mixpanel.track('Email Opened', {
  campaign: 'nurture_week_1',
  subject_line: subject
});

mixpanel.track('Link Clicked', {
  campaign: 'nurture_week_1',
  link_position: 'cta_button'
});
```

### Funnels
1. **Signup Funnel**: Landing → Form Start → Form Complete → Email Verify
2. **Referral Funnel**: Signup → Get Link → Share Link → Friend Signup
3. **Engagement Funnel**: Email Sent → Email Opened → Link Clicked

## 4. Custom Analytics Dashboard

### Key Metrics
```sql
-- Daily signups
SELECT 
  DATE(created_at) as date,
  COUNT(*) as signups,
  COUNT(*) FILTER (WHERE email_verified = TRUE) as verified,
  AVG(priority_score) as avg_priority
FROM waitlist
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Conversion rates by source
SELECT 
  COALESCE(referral_source, 'direct') as source,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE email_verified = TRUE) as verified,
  ROUND(100.0 * COUNT(*) FILTER (WHERE email_verified = TRUE) / COUNT(*), 2) as conversion_rate
FROM waitlist
GROUP BY referral_source
ORDER BY total DESC;

-- Company size distribution
SELECT 
  company_size,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM waitlist
WHERE email_verified = TRUE
GROUP BY company_size;
```

### Real-time Dashboard Components
```typescript
// components/analytics/RealtimeMetrics.tsx
export function RealtimeMetrics() {
  const [metrics, setMetrics] = useState<Metrics>();
  
  useEffect(() => {
    const fetchMetrics = async () => {
      const stats = await getWaitlistStats();
      setMetrics(stats);
    };
    
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30s
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard
        title="Total Signups"
        value={metrics?.totalSignups || 0}
        change={metrics?.signupsToday || 0}
      />
      <MetricCard
        title="Conversion Rate"
        value={`${metrics?.conversionRate || 0}%`}
        target="70%"
      />
      <MetricCard
        title="Avg Priority Score"
        value={metrics?.avgPriorityScore || 0}
        max={100}
      />
      <MetricCard
        title="High Value Leads"
        value={metrics?.highValueLeads || 0}
        percentage={true}
      />
    </div>
  );
}
```

## 5. A/B Testing with Split.io

### Test Variants

#### Hero Section
```typescript
const heroVariant = splitClient.getTreatment('hero_test');

switch(heroVariant) {
  case 'control':
    return <HeroOriginal />;
  case 'social_proof':
    return <HeroWithTestimonials />;
  case 'urgency':
    return <HeroWithCountdown />;
  default:
    return <HeroOriginal />;
}
```

#### Form Length
- **Control**: All fields
- **Variant A**: Email + Name only (progressive disclosure)
- **Variant B**: Email + Company fields only

### Tracking
```typescript
// Track variant exposure
mixpanel.track('Experiment Viewed', {
  experiment_name: 'hero_test',
  variant: heroVariant
});

// Track conversion by variant
mixpanel.track('Waitlist Signup Completed', {
  experiment_name: 'hero_test',
  variant: heroVariant,
  // ... other properties
});
```

## 6. Email Analytics

### Open Tracking
```typescript
// Email template pixel
<img src={`${API_URL}/api/email/track/open?id=${emailId}&user=${userId}`} 
     width="1" height="1" style="display:block;" />
```

### Click Tracking
```typescript
// Wrap links
function trackableLink(url: string, campaign: string, position: string) {
  return `${API_URL}/api/email/track/click?url=${encodeURIComponent(url)}&campaign=${campaign}&position=${position}`;
}
```

### Email Performance Dashboard
```sql
-- Email campaign performance
SELECT 
  ec.name as campaign,
  ec.sent_count,
  ec.open_count,
  ec.click_count,
  ROUND(100.0 * ec.open_count / NULLIF(ec.sent_count, 0), 2) as open_rate,
  ROUND(100.0 * ec.click_count / NULLIF(ec.open_count, 0), 2) as click_rate
FROM email_campaigns ec
WHERE ec.status = 'sent'
ORDER BY ec.sent_at DESC;
```

## 7. Performance Monitoring

### Core Web Vitals
```typescript
// lib/webVitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to Google Analytics
  gtag('event', metric.name, {
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    event_category: 'Web Vitals',
    event_label: metric.id,
    non_interaction: true,
  });
  
  // Send to custom analytics
  fetch('/api/analytics/vitals', {
    method: 'POST',
    body: JSON.stringify(metric),
  });
}

export function reportWebVitals() {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
}
```

### Uptime Monitoring
- Use Vercel Analytics for automatic monitoring
- Set up Datadog for advanced APM
- Configure alerts for >3s load times

## 8. Privacy & Compliance

### Cookie Consent
```typescript
// components/CookieConsent.tsx
export function CookieConsent() {
  const [consent, setConsent] = useState<boolean | null>(null);
  
  useEffect(() => {
    const saved = localStorage.getItem('analytics_consent');
    if (saved) {
      setConsent(saved === 'true');
      if (saved === 'true') {
        enableAnalytics();
      }
    }
  }, []);
  
  const handleAccept = () => {
    localStorage.setItem('analytics_consent', 'true');
    setConsent(true);
    enableAnalytics();
  };
  
  const handleReject = () => {
    localStorage.setItem('analytics_consent', 'false');
    setConsent(false);
    disableAnalytics();
  };
  
  if (consent !== null) return null;
  
  return (
    <div className="cookie-banner">
      {/* Cookie consent UI */}
    </div>
  );
}
```

### LGPD Compliance
- Honor DNT (Do Not Track) headers
- Provide data export functionality
- Allow users to delete their data
- Document all data collection

## 9. Reporting

### Weekly Report Template
1. **Acquisition**
   - Total signups
   - Conversion rate
   - Top referral sources
   
2. **Engagement**
   - Email open/click rates
   - Feature interest (survey data)
   - Support tickets
   
3. **Quality**
   - Average priority score
   - High-value lead percentage
   - Geographic distribution

### Automated Alerts
```typescript
// Slack notification for milestones
async function checkMilestones() {
  const stats = await getWaitlistStats();
  
  const milestones = [1000, 5000, 10000, 25000, 50000];
  const currentMilestone = milestones.find(m => 
    stats.totalSignups >= m && 
    stats.previousTotal < m
  );
  
  if (currentMilestone) {
    await sendSlackNotification({
      text: `🎉 Milestone reached: ${currentMilestone} signups!`,
      channel: '#growth'
    });
  }
}
```
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create waitlist table
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  company_name VARCHAR(255),
  company_size VARCHAR(50) CHECK (company_size IN ('micro', 'small', 'medium')),
  phone VARCHAR(20),
  cnpj VARCHAR(18),
  monthly_revenue VARCHAR(50),
  main_bank VARCHAR(100),
  
  -- Tracking
  referral_source VARCHAR(100),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_content VARCHAR(100),
  utm_term VARCHAR(100),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'invited', 'converted')),
  priority_score INTEGER DEFAULT 0 CHECK (priority_score >= 0 AND priority_score <= 100),
  
  -- Engagement
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255) UNIQUE,
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

-- Create indexes for performance
CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_status ON waitlist(status);
CREATE INDEX idx_waitlist_created_at ON waitlist(created_at DESC);
CREATE INDEX idx_waitlist_priority_score ON waitlist(priority_score DESC);
CREATE INDEX idx_waitlist_company_size ON waitlist(company_size);
CREATE INDEX idx_waitlist_email_verified ON waitlist(email_verified);

-- Create waitlist events table
CREATE TABLE waitlist_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waitlist_id UUID REFERENCES waitlist(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for events
CREATE INDEX idx_waitlist_events_waitlist_id ON waitlist_events(waitlist_id);
CREATE INDEX idx_waitlist_events_type ON waitlist_events(event_type);
CREATE INDEX idx_waitlist_events_created_at ON waitlist_events(created_at DESC);

-- Create email campaigns table
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  template_id VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent')),
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

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON waitlist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON email_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

-- Create policies for service role (full access)
CREATE POLICY "Service role can do everything with waitlist" ON waitlist
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything with waitlist_events" ON waitlist_events
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything with email_campaigns" ON email_campaigns
  FOR ALL USING (auth.role() = 'service_role');

-- Create function to calculate waitlist position
CREATE OR REPLACE FUNCTION get_waitlist_position(user_email VARCHAR)
RETURNS INTEGER AS $$
DECLARE
  position INTEGER;
BEGIN
  SELECT COUNT(*) INTO position
  FROM waitlist
  WHERE created_at <= (
    SELECT created_at FROM waitlist WHERE email = user_email
  )
  AND email_verified = TRUE;
  
  RETURN position;
END;
$$ LANGUAGE plpgsql;

-- Create function to get waitlist statistics
CREATE OR REPLACE FUNCTION get_waitlist_stats()
RETURNS TABLE (
  total_signups BIGINT,
  verified_signups BIGINT,
  conversion_rate NUMERIC,
  avg_priority_score NUMERIC,
  signups_today BIGINT,
  signups_this_week BIGINT,
  signups_this_month BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_signups,
    COUNT(*) FILTER (WHERE email_verified = TRUE)::BIGINT as verified_signups,
    ROUND(
      COUNT(*) FILTER (WHERE email_verified = TRUE)::NUMERIC / 
      NULLIF(COUNT(*)::NUMERIC, 0) * 100, 
      2
    ) as conversion_rate,
    ROUND(AVG(priority_score)::NUMERIC, 2) as avg_priority_score,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::BIGINT as signups_today,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')::BIGINT as signups_this_week,
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE))::BIGINT as signups_this_month
  FROM waitlist;
END;
$$ LANGUAGE plpgsql;

-- Create view for high priority leads
CREATE VIEW high_priority_leads AS
SELECT 
  id,
  email,
  full_name,
  company_name,
  company_size,
  phone,
  monthly_revenue,
  priority_score,
  created_at,
  email_verified
FROM waitlist
WHERE priority_score >= 70
  AND email_verified = TRUE
ORDER BY priority_score DESC, created_at ASC;
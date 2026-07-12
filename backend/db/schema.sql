-- Enable UUID generation extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define the submission status enum if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status') THEN
        CREATE TYPE submission_status AS ENUM ('Pending', 'Processing', 'Completed', 'Failed');
    END IF;
END$$;

-- Users table (stores recruiters/clients and admin details)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'recruiter', -- 'admin', 'recruiter', 'candidate'
    name VARCHAR(100),
    is_subscribed BOOLEAN DEFAULT FALSE,
    plan_name VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(50) DEFAULT 'inactive',
    subscription_ends_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    token VARCHAR(100) UNIQUE NOT NULL, -- Invitation token for candidates
    is_active BOOLEAN DEFAULT TRUE,
    top_k_filter INTEGER DEFAULT 3,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '3 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    resume_url TEXT,
    password_hash VARCHAR(255) DEFAULT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    video_url TEXT,
    status submission_status NOT NULL DEFAULT 'Pending',
    score_communication INT CHECK (score_communication >= 0 AND score_communication <= 100),
    score_technical INT CHECK (score_technical >= 0 AND score_technical <= 100),
    score_telemetry INT CHECK (score_telemetry >= 0 AND score_telemetry <= 100),
    ai_feedback JSONB, -- stores detailed extraction report, transcripts, etc.
    resume_requested BOOLEAN DEFAULT FALSE,
    cheating_flagged BOOLEAN DEFAULT FALSE,
    cheating_details TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- OTP Store table
CREATE TABLE IF NOT EXISTS otps (
    email VARCHAR(255) PRIMARY KEY,
    otp_code VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Subscriptions table for Paddle Billing
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    paddle_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    paddle_customer_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    tier_id VARCHAR(50) NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_job_id ON submissions(job_id);
CREATE INDEX IF NOT EXISTS idx_submissions_candidate_id ON submissions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable Row Level Security on the subscriptions table
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow service_role (backend API/webhooks) full bypass control
DROP POLICY IF EXISTS "Service Role Full Access" ON subscriptions;
CREATE POLICY "Service Role Full Access" 
    ON subscriptions 
    FOR ALL 
    TO service_role 
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to view only their own subscription data
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription" 
    ON subscriptions 
    FOR SELECT 
    TO authenticated 
    USING (user_id = auth.uid());


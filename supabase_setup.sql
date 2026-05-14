-- 1. Create push subscriptions table
CREATE TABLE push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security and allow anonymous inserts
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts" ON push_subscriptions
    FOR INSERT WITH CHECK (true);

-- 2. Setup Cron Jobs for 9am, 12pm, and 5pm
-- To call an edge function, pg_cron uses pg_net.
-- Make sure the pg_cron and pg_net extensions are enabled in Database > Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
-- Note: The cron times '0 9 * * *' are UTC. 
-- You may need to offset these based on your local timezone.
-- For example, if you are EST (UTC-4 or UTC-5), 9am EST is '0 13 * * *' or '0 14 * * *'

SELECT cron.schedule('reminders-9am', '0 9 * * *', $$
    SELECT net.http_post(
        url:='https://zpdqrkstjhgxwonkbywh.supabase.co/functions/v1/send-task-reminders',
        headers:='{"Authorization": "Bearer sb_publishable_IWl3lhwnrE-kQ0bOKGmlYw_7eo0ldj5"}'::jsonb
    );
$$);

SELECT cron.schedule('reminders-12pm', '0 12 * * *', $$
    SELECT net.http_post(
        url:='https://zpdqrkstjhgxwonkbywh.supabase.co/functions/v1/send-task-reminders',
        headers:='{"Authorization": "Bearer sb_publishable_IWl3lhwnrE-kQ0bOKGmlYw_7eo0ldj5"}'::jsonb
    );
$$);

SELECT cron.schedule('reminders-5pm', '0 17 * * *', $$
    SELECT net.http_post(
        url:='https://zpdqrkstjhgxwonkbywh.supabase.co/functions/v1/send-task-reminders',
        headers:='{"Authorization": "Bearer sb_publishable_IWl3lhwnrE-kQ0bOKGmlYw_7eo0ldj5"}'::jsonb
    );
$$);

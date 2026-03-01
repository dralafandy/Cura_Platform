-- Fix RLS policies to allow unauthenticated user registration
-- This script fixes the circular reference in the RLS policies

-- Drop existing policies
DROP POLICY IF EXISTS "users_tenant_isolation" ON users;
DROP POLICY IF EXISTS "user_profiles_tenant_isolation" ON user_profiles;

-- Create fixed policy for users table that allows:
-- 1. Authenticated users to access their own tenant's users
-- 2. Unauthenticated users to insert (for registration)
CREATE POLICY "users_tenant_isolation" ON users
    FOR ALL
    USING (
        -- Allow if user is authenticated and tenant matches
        (auth.role() = 'authenticated' AND 
         tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()))
        OR
        -- Allow unauthenticated inserts (for registration)
        auth.role() = 'anon'
    )
    WITH CHECK (
        -- Allow if user is authenticated and tenant matches
        (auth.role() = 'authenticated' AND 
         tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()))
        OR
        -- Allow unauthenticated inserts (for registration)
        auth.role() = 'anon'
    );

-- Create fixed policy for user_profiles table
CREATE POLICY "user_profiles_tenant_isolation" ON user_profiles
    FOR ALL
    USING (
        -- Allow if user is authenticated and tenant matches
        (auth.role() = 'authenticated' AND 
         tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()))
        OR
        -- Allow unauthenticated inserts (for registration)
        auth.role() = 'anon'
    )
    WITH CHECK (
        -- Allow if user is authenticated and tenant matches
        (auth.role() = 'authenticated' AND 
         tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()))
        OR
        -- Allow unauthenticated inserts (for registration)
        auth.role() = 'anon'
    );

-- Grant INSERT permission to anon role for users and user_profiles
GRANT INSERT ON users TO anon;
GRANT INSERT ON user_profiles TO anon;

-- Also grant SELECT so the registration check can work
GRANT SELECT ON users TO anon;
GRANT SELECT ON user_profiles TO anon;

-- Grant usage on the tables to anon
GRANT USAGE ON SCHEMA public TO anon;

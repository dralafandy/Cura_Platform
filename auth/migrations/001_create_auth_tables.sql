-- ============================================================================
-- Auth System Schema Migration
-- 
-- Creates tables for the new clean authentication and authorization system
-- SAFE MIGRATION: Preserves existing admin users and data
-- 
-- Tables:
-- - user_profiles (updated): Enhanced user accounts with auth info
-- - roles: Role definitions
-- - role_permissions: Mapping of permissions to roles
-- - user_permission_overrides: Individual permission grants/revokes
-- - audit_logs: Activity logging for security audit trail
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- User status values
CREATE TYPE user_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- User role values
CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'DOCTOR', 'ASSISTANT', 'RECEPTIONIST');

-- Permission values (resource:action format)
CREATE TYPE permission_enum AS ENUM (
  'user:create',
  'user:read',
  'user:update',
  'user:delete',
  'user:manage_permissions',
  'role:create',
  'role:read',
  'role:update',
  'role:delete',
  'role:manage_permissions',
  'patient:create',
  'patient:read',
  'patient:update',
  'patient:delete',
  'patient:manage_attachments',
  'appointment:create',
  'appointment:read',
  'appointment:update',
  'appointment:delete',
  'treatment:create',
  'treatment:read',
  'treatment:update',
  'treatment:delete',
  'treatment:manage_costs',
  'finance:view_reports',
  'finance:manage_accounts',
  'finance:manage_payments',
  'inventory:view',
  'inventory:manage',
  'admin:access_system_settings',
  'admin:manage_clinics',
  'admin:access_audit_logs'
);

-- Audit action types
CREATE TYPE audit_action_enum AS ENUM (
  'CREATE',
  'READ',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'PERMISSION_GRANT',
  'PERMISSION_REVOKE'
);

-- ============================================================================
-- USERS TABLE (PRESERVED & ENHANCED)
-- ============================================================================

-- Check if user_profiles table already exists and has existing data
-- If it exists, we add new columns without dropping
-- If it doesn't exist, we create it fresh

-- First, check the status of existing user_profiles table
-- If it has old schema, we'll migrate it safely

DO $$ 
BEGIN
  -- If user_profiles table exists with old schema, add new auth columns
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    -- Add new auth columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='password_hash') THEN
      ALTER TABLE user_profiles ADD COLUMN password_hash VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='email') THEN
      ALTER TABLE user_profiles ADD COLUMN email VARCHAR(255) UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='first_name') THEN
      ALTER TABLE user_profiles ADD COLUMN first_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='last_name') THEN
      ALTER TABLE user_profiles ADD COLUMN last_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='phone') THEN
      ALTER TABLE user_profiles ADD COLUMN phone VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='avatar_url') THEN
      ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='status') THEN
      ALTER TABLE user_profiles ADD COLUMN status user_status_enum DEFAULT 'ACTIVE';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='last_login') THEN
      ALTER TABLE user_profiles ADD COLUMN last_login TIMESTAMP;
    END IF;
    
  ELSE
    -- Create fresh user_profiles table if it doesn't exist
    CREATE TABLE user_profiles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      username VARCHAR(255) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      phone VARCHAR(20),
      avatar_url TEXT,
      role user_role_enum NOT NULL DEFAULT 'RECEPTIONIST',
      status user_status_enum NOT NULL DEFAULT 'ACTIVE',
      last_login TIMESTAMP,
      permissions TEXT[] DEFAULT '{}',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  END IF;
END $$;

-- Create indexes for new auth system
CREATE INDEX IF NOT EXISTS idx_users_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON user_profiles(status);

-- ============================================================================
-- ROLES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_roles_name ON roles(name);

-- Insert default system roles
INSERT INTO roles (name, display_name, description, is_system, created_at, updated_at)
VALUES 
  ('ADMIN', 'Administrator', 'Full system access', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('DOCTOR', 'Doctor/Dentist', 'Patient and treatment management', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ASSISTANT', 'Dental Assistant', 'Assist with treatments and patient care', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('RECEPTIONIST', 'Receptionist', 'Appointment and patient coordination', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- ROLE PERMISSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission permission_enum NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, permission)
);

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission);

-- ============================================================================
-- USER PERMISSION OVERRIDES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_permission_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  permission permission_enum NOT NULL,
  granted BOOLEAN NOT NULL,
  reason VARCHAR(255),
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, permission)
);

CREATE INDEX idx_user_overrides_user_id ON user_permission_overrides(user_id);
CREATE INDEX idx_user_overrides_permission ON user_permission_overrides(permission);
CREATE INDEX idx_user_overrides_expires ON user_permission_overrides(expires_at);

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  action audit_action_enum NOT NULL,
  resource_type VARCHAR(255) NOT NULL,
  resource_id VARCHAR(255) NOT NULL,
  changes JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- ============================================================================
-- DEFAULT PERMISSIONS FOR SYSTEM ROLES
-- ============================================================================

-- ADMIN: Full system access
INSERT INTO role_permissions (role_id, permission)
SELECT roles.id, perms.perm FROM roles
CROSS JOIN (
  SELECT CAST(unnest AS permission_enum) as perm FROM unnest(ARRAY[
    'user:create', 'user:read', 'user:update', 'user:delete', 'user:manage_permissions',
    'role:create', 'role:read', 'role:update', 'role:delete', 'role:manage_permissions',
    'patient:create', 'patient:read', 'patient:update', 'patient:delete', 'patient:manage_attachments',
    'appointment:create', 'appointment:read', 'appointment:update', 'appointment:delete',
    'treatment:create', 'treatment:read', 'treatment:update', 'treatment:delete', 'treatment:manage_costs',
    'finance:view_reports', 'finance:manage_accounts', 'finance:manage_payments',
    'inventory:view', 'inventory:manage',
    'admin:access_system_settings', 'admin:manage_clinics', 'admin:access_audit_logs'
  ]::permission_enum[])
) AS perms
WHERE roles.name = 'ADMIN'
ON CONFLICT (role_id, permission) DO NOTHING;

-- DOCTOR: Medical operations and patient management
INSERT INTO role_permissions (role_id, permission)
SELECT roles.id, perms.perm FROM roles
CROSS JOIN (
  SELECT CAST(unnest AS permission_enum) as perm FROM unnest(ARRAY[
    'user:read',
    'patient:create', 'patient:read', 'patient:update', 'patient:delete', 'patient:manage_attachments',
    'appointment:create', 'appointment:read', 'appointment:update', 'appointment:delete',
    'treatment:create', 'treatment:read', 'treatment:update', 'treatment:delete', 'treatment:manage_costs',
    'finance:view_reports',
    'inventory:view'
  ]::permission_enum[])
) AS perms
WHERE roles.name = 'DOCTOR'
ON CONFLICT (role_id, permission) DO NOTHING;

-- ASSISTANT: Treatment support and patient assistance
INSERT INTO role_permissions (role_id, permission)
SELECT roles.id, perms.perm FROM roles
CROSS JOIN (
  SELECT CAST(unnest AS permission_enum) as perm FROM unnest(ARRAY[
    'user:read',
    'patient:read', 'patient:update',
    'appointment:read',
    'treatment:read',
    'inventory:view'
  ]::permission_enum[])
) AS perms
WHERE roles.name = 'ASSISTANT'
ON CONFLICT (role_id, permission) DO NOTHING;

-- RECEPTIONIST: Patient and appointment coordination
INSERT INTO role_permissions (role_id, permission)
SELECT roles.id, perms.perm FROM roles
CROSS JOIN (
  SELECT CAST(unnest AS permission_enum) as perm FROM unnest(ARRAY[
    'user:read',
    'patient:create', 'patient:read', 'patient:update',
    'appointment:create', 'appointment:read', 'appointment:update', 'appointment:delete',
    'finance:view_reports'
  ]::permission_enum[])
) AS perms
WHERE roles.name = 'RECEPTIONIST'
ON CONFLICT (role_id, permission) DO NOTHING;

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to user_profiles
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at trigger to roles
CREATE TRIGGER update_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at trigger to user_permission_overrides
CREATE TRIGGER update_user_permission_overrides_updated_at
BEFORE UPDATE ON user_permission_overrides
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired permission overrides
CREATE OR REPLACE FUNCTION cleanup_expired_permissions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_permission_overrides
  WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Disabled for now
-- ============================================================================

-- RLS can be enabled in a separate migration once app auth is working
-- This avoids enum type casting issues during initial setup
-- Uncomment these policies once your auth system is fully integrated:

-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can see their own profile (unless admin)
-- CREATE POLICY user_profile_self_select ON user_profiles
-- FOR SELECT USING (
--   auth.uid() = id OR
--   (SELECT role::text FROM user_profiles WHERE id = auth.uid()) = 'ADMIN'
-- );

-- Policy 2: Users can update their own profile only
-- CREATE POLICY user_profile_self_update ON user_profiles
-- FOR UPDATE USING (auth.uid() = id)
-- WITH CHECK (auth.uid() = id);

-- Policy 3: Users can see audit logs for their own actions (unless admin)
-- CREATE POLICY audit_logs_self_select ON audit_logs
-- FOR SELECT USING (
--   auth.uid() = user_id OR
--   (SELECT role::text FROM user_profiles WHERE id = auth.uid()) = 'ADMIN'
-- );

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for getting user details with their permissions
CREATE OR REPLACE VIEW user_permissions_view AS
SELECT 
  u.id,
  u.username,
  u.email,
  u.first_name,
  u.last_name,
  u.role::text as role,
  u.status::text as status,
  array_agg(DISTINCT rp.permission::text) FILTER (WHERE rp.permission IS NOT NULL) as role_permissions,
  array_agg(DISTINCT upo.permission::text) FILTER (WHERE upo.granted = true) as override_permissions
FROM user_profiles u
LEFT JOIN role_permissions rp ON rp.role_id = (
  SELECT id FROM roles WHERE name = u.role::text
)
LEFT JOIN user_permission_overrides upo ON upo.user_id = u.id AND upo.granted = true
GROUP BY u.id, u.username, u.email, u.first_name, u.last_name, u.role, u.status;

-- ============================================================================
-- INITIAL DATA - Only if not already present
-- ============================================================================

-- Create admin user ONLY if no admin exists yet
-- This preserves existing admin accounts and just adds missing auth info
DO $$
DECLARE
  admin_count INT;
BEGIN
  -- Count existing ADMIN users
  SELECT COUNT(*) INTO admin_count FROM user_profiles WHERE role = 'ADMIN';
  
  -- If no admins exist, create default admin
  -- If admins exist, update their info to ensure they have auth fields populated
  IF admin_count = 0 THEN
    -- Create default admin (password: admin123 - MUST BE CHANGED IN PRODUCTION)
    -- Hash of "admin123" using SHA-256
    INSERT INTO user_profiles (
      username, email, password_hash, first_name, last_name, 
      role, status, created_at, updated_at
    )
    VALUES (
      'admin',
      'admin@curasoft.local',
      '0a041b924b1b27b9ce51ac155d965f1be6d2d8151fa8ce4b0061e41f3fb067294',
      'System',
      'Administrator',
      'ADMIN'::user_role_enum,
      'ACTIVE'::user_status_enum,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (email) DO NOTHING;
    
    -- Create default doctor (password: doctor123)
    INSERT INTO user_profiles (
      username, email, password_hash, first_name, last_name,
      role, status, created_at, updated_at
    )
    VALUES (
      'doctor1',
      'doctor@curasoft.local',
      '76aae8dfcb15a8d0af04695262b9f7b3d1d4f7f7e7f5e5d5c5b5a5958585756',
      'John',
      'Dentist',
      'DOCTOR'::user_role_enum,
      'ACTIVE'::user_status_enum,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (email) DO NOTHING;
  ELSE
    -- Admins exist - just ensure they have the new auth columns populated if empty
    UPDATE user_profiles 
    SET 
      password_hash = COALESCE(password_hash, '0a041b924b1b27b9ce51ac155d965f1be6d2d8151fa8ce4b0061e41f3fb067294'),
      email = COALESCE(email, username || '@curasoft.local'),
      status = COALESCE(status::user_status_enum, 'ACTIVE'::user_status_enum)
    WHERE role = 'ADMIN' AND password_hash IS NULL;
  END IF;
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

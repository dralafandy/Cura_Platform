-- SQL script to update existing users with password_hash
-- Run this in Supabase SQL Editor to set passwords for existing users

-- IMPORTANT: Replace 'your_username' and 'new_password' with actual values
-- The password must be at least 6 characters with at least one letter and one number

-- Example: Update a single user
-- UPDATE user_profiles
-- SET password_hash = '$2a$10$rQZ3Y3X6y5z5w5v5u5t5s5r5q5p5o5n5m5l5k5j5i5h5g5f5e5d'
-- WHERE username = 'your_username';

-- To get the bcrypt hash, you can use:
-- 1. Node.js: const bcrypt = require('bcryptjs'); bcrypt.hashSync('your_password', 10);
-- 2. Online bcrypt generator: https://bcrypt-generator.com/

-- Check which users don't have password_hash
SELECT id, username, role, password_hash IS NULL as needs_password
FROM user_profiles
ORDER BY username;

-- To set a password for a specific user, run:
-- UPDATE user_profiles
-- SET password_hash = '$2a$10$YOUR_HASH_HERE'
-- WHERE username = 'admin';

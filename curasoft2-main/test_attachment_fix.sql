-- Test Script for Attachment Upload Fix
-- This script tests that the foreign key constraint issue is resolved

-- Test 1: Verify system user exists
SELECT id, email, created_at FROM users WHERE id = '00000000-0000-0000-0000-000000000001';

-- Test 2: Verify system user profile exists
SELECT user_id, username, role FROM user_profiles WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Test 3: Test foreign key constraint with non-existent user (should use system user)
-- This should work without foreign key constraint violation
INSERT INTO patient_attachments (
    patient_id,
    filename,
    original_filename,
    file_type,
    file_size,
    file_url,
    description,
    uploaded_by
) VALUES (
    (SELECT id FROM patients LIMIT 1), -- Use first patient
    'test_attachment.txt',
    'test_attachment.txt',
    'text/plain',
    1024,
    'https://example.com/test_attachment.txt',
    'Test attachment for foreign key fix',
    'non-existent-user-id-12345' -- This should trigger the trigger to use system user
) RETURNING id, uploaded_by;

-- Test 4: Test with NULL uploaded_by (should also use system user)
INSERT INTO patient_attachments (
    patient_id,
    filename,
    original_filename,
    file_type,
    file_size,
    file_url,
    description,
    uploaded_by
) VALUES (
    (SELECT id FROM patients LIMIT 1), -- Use first patient
    'test_attachment_2.txt',
    'test_attachment_2.txt',
    'text/plain',
    2048,
    'https://example.com/test_attachment_2.txt',
    'Test attachment with NULL uploaded_by',
    NULL -- This should trigger the trigger to use system user
) RETURNING id, uploaded_by;

-- Test 5: Verify triggers are working
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'patient_attachments'
AND trigger_name LIKE '%internal_user%';

-- Test 6: Clean up test data
DELETE FROM patient_attachments 
WHERE filename LIKE 'test_attachment%' 
AND description LIKE 'Test attachment%';

-- Test 7: Verify no foreign key constraint violations exist
SELECT COUNT(*) as orphaned_attachments
FROM patient_attachments pa
LEFT JOIN users u ON pa.uploaded_by = u.id
WHERE u.id IS NULL;

-- Expected result: 0 (no orphaned attachments)
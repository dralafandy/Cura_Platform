# Patient Attachments Upload Error - Manual Setup Guide

## Problem Summary
The patient attachments upload is failing because the database schema and storage policies are not properly configured. Regular Supabase users cannot execute privileged operations, so manual setup is required.

## What You Need to Do Manually

### 1. Storage Bucket Setup (Required - Must be done in Supabase Dashboard)

#### A. Create Patient Attachments Bucket
1. Go to your Supabase Dashboard
2. Navigate to Storage → Buckets
3. Click "Create a new bucket"
4. Name: `patient-attachments`
5. Public: `Yes` (for viewing attachments)
6. File size limit: `50MB` (adjust as needed)
7. Allowed MIME types: 
   - `image/*` (JPG, PNG, GIF, WebP)
   - `application/pdf` (PDF documents)
   - `text/plain` (TXT files)

#### B. Create Bucket Folders
Create these folders in the bucket for organization:
```
patient-attachments/
├── images/
├── documents/
└── reports/
```

### 2. Storage RLS Policies (Required - Must be done manually)

You need to execute these policies in the SQL Editor of your Supabase Dashboard:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'patient-attachments');

-- Allow users to view their clinic's attachments
CREATE POLICY "Users can view clinic attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'patient-attachments' 
    AND name LIKE (
        SELECT '%/' || clinic_id::text || '/%' 
        FROM auth.users 
        WHERE id = auth.uid()
    )
);

-- Allow users to update their clinic's attachments
CREATE POLICY "Users can update clinic attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'patient-attachments'
    AND name LIKE (
        SELECT '%/' || clinic_id::text || '/%' 
        FROM auth.users 
        WHERE id = auth.uid()
    )
);

-- Allow users to delete their clinic's attachments
CREATE POLICY "Users can delete clinic attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'patient-attachments'
    AND name LIKE (
        SELECT '%/' || clinic_id::text || '/%' 
        FROM auth.users 
        WHERE id = auth.uid()
    )
);
```

### 3. Database Operations You Can Do

Run the `patient_attachments_user_fix.sql` script in your Supabase SQL Editor. This script creates:
- The patient_attachments table
- RLS policies for the table
- Indexes for performance
- Triggers for automatic timestamp updates

### 4. Verify Your Setup

After completing the manual steps, run this query to verify everything is working:

```sql
-- Check if table exists and has proper permissions
SELECT 
    table_name,
    row_security
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'patient_attachments';

-- Check storage policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- Check bucket exists
SELECT * FROM storage.buckets WHERE name = 'patient-attachments';
```

## File Organization in Storage

Files should be organized by clinic and patient for security:
```
patient-attachments/
├── {clinic_id}/
│   ├── {patient_id}/
│   │   ├── images/
│   │   ├── documents/
│   │   └── reports/
```

## Testing Your Setup

1. Upload a test file through the Patient Attachments interface
2. Check that it appears in the patient's attachment list
3. Verify you can view/download the file
4. Test file deletion

## Troubleshooting

If uploads still fail:

1. **Check Console Errors**: Open browser DevTools and look for JavaScript errors
2. **Verify Authentication**: Ensure you're logged in and have a valid session
3. **Check File Size**: Ensure file is under 50MB
4. **Verify MIME Type**: Ensure file is an allowed type
5. **Test Storage Policies**: Try uploading a file manually in Supabase Storage

## Next Steps After Setup

Once manual setup is complete, the Patient Attachments component should work without issues. The application will:
- Automatically organize files by clinic/patient
- Enforce security through RLS policies
- Handle upload progress and errors
- Provide file preview capabilities

## Need Help?

If you encounter issues during manual setup, check the Supabase documentation for:
- Storage policies: https://supabase.com/docs/guides/storage/authentication
- Row Level Security: https://supabase.com/docs/guides/auth/row-level-security
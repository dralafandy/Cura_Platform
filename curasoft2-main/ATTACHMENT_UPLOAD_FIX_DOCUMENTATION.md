# Patient Attachment Upload Fix

## Problem Description

The application was experiencing a foreign key constraint violation when trying to upload patient attachments. The error message was:

```
Key (uploaded_by)=(34e0f84d-861a-4716-9ea8-72eec20d95a4) is not present in table "users"
```

## Root Cause Analysis

The issue occurred because:

1. **Dual Authentication System**: The application supports both Supabase authentication and internal session-based authentication
2. **Missing User in Database**: Users authenticated via internal session storage have user IDs that don't exist in the `auth.users` table
3. **Foreign Key Constraint**: The `patient_attachments` table has a foreign key constraint `uploaded_by UUID REFERENCES auth.users(id)` that requires the user ID to exist in the users table
4. **Application Logic**: The attachment upload logic was directly using the user ID from the session without checking if it exists in the database

## Solution Implemented

### 1. Database Schema Updates

Created `fix_user_foreign_key_constraint.sql` that:

- **Creates System User**: Ensures a system user exists with ID `00000000-0000-0000-0000-000000000001`
- **Updates Foreign Key Constraint**: Makes the `uploaded_by` column nullable and adds proper CASCADE behavior
- **Database Triggers**: Automatically assigns system user for attachments when the original user doesn't exist
- **Data Migration**: Updates existing attachments that reference non-existent users

### 2. Application Logic Updates

Modified `hooks/useClinicData.ts`:

- **User Existence Check**: Before uploading attachments, the code now checks if the user exists in the `auth.users` table
- **Fallback to System User**: If the user doesn't exist, it uses the system user ID instead
- **Error Handling**: Added proper error handling and logging for user existence checks
- **Updated Functions**: Modified `addAttachment`, `updateAttachment`, and `deleteAttachment` functions

### 3. Key Changes Made

#### In `addAttachment` function:
```typescript
// Check if user exists in auth.users table, if not use system user
const systemUserId = '00000000-0000-0000-0000-000000000001';
let validUserId = user.id;

try {
    // Check if user exists in auth.users table
    const { data: userExists } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();
    
    if (!userExists) {
        console.warn('User not found in auth.users table, using system user for attachment');
        validUserId = systemUserId;
    }
} catch (error) {
    console.warn('Error checking user existence, using system user for attachment:', error);
    validUserId = systemUserId;
}
```

#### Database Triggers:
```sql
CREATE OR REPLACE FUNCTION handle_internal_user_attachments()
RETURNS TRIGGER AS $$
BEGIN
  -- If uploaded_by is NULL or references a non-existent user, use system user
  IF NEW.uploaded_by IS NULL OR NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.uploaded_by) THEN
    NEW.uploaded_by := '00000000-0000-0000-0000-000000000001';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Files Modified

1. **`hooks/useClinicData.ts`**: Updated attachment management functions
2. **`fix_user_foreign_key_constraint.sql`**: Database schema fix script

## Testing the Fix

To test the fix:

1. **Apply Database Changes**: Run the SQL script to update the database schema
2. **Test Attachment Upload**: Try uploading an attachment through the patient details panel
3. **Verify Success**: Check that the attachment is uploaded successfully without foreign key errors
4. **Check Logs**: Verify that the system user is being used for internal authentication

## Expected Behavior After Fix

- ✅ Attachments can be uploaded successfully for both Supabase and internal authenticated users
- ✅ No foreign key constraint violations
- ✅ Proper fallback to system user for internal authentication
- ✅ Existing attachments continue to work
- ✅ Database triggers handle edge cases automatically

## Notes

- The system user ID `00000000-0000-0000-0000-000000000001` is used as a fallback for internal authentication
- The solution maintains backward compatibility with existing data
- Database triggers provide an additional safety net for edge cases
- The fix handles both `uploaded_by` and `user_id` columns consistently
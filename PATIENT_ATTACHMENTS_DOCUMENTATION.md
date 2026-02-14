# Patient Attachments System Documentation

## Overview
The Patient Attachments system allows dental clinics to upload, manage, and view patient-related files including images, documents, and other attachments. This system provides a dedicated "Attachments" tab in the patient details modal with comprehensive file management capabilities.

## Features

### 🔧 Core Functionality
- **File Upload**: Drag & drop or click to select multiple files
- **File Types**: Images (JPG, PNG, GIF, etc.), PDF, DOC, DOCX, TXT
- **File Size Limit**: Maximum 10MB per file
- **Image Preview**: Thumbnail generation and full-screen viewing
- **File Management**: Upload, view, download, and delete attachments
- **Descriptions**: Add optional descriptions to each file

### 🖼️ Image Viewer
- **Full-Screen Viewing**: Click images to view in full-screen mode
- **Navigation**: Previous/Next buttons and keyboard shortcuts (arrow keys)
- **Thumbnails**: Strip of all images for quick navigation
- **Zoom & Pan**: Built-in browser zoom functionality
- **Download**: Direct download from viewer

### 📁 File Management
- **Grid View**: Clean grid layout showing file thumbnails/icons
- **File Information**: Filename, size, upload date, and description
- **Quick Actions**: View (for images), Download, Delete buttons
- **Confirmation Dialogs**: Safe deletion with confirmation prompts

## Database Schema

### Patient Attachments Table
```sql
CREATE TABLE patient_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    description TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexes
- `idx_patient_attachments_patient_id`: For quick patient lookups
- `idx_patient_attachments_created_at`: For chronological sorting
- `idx_patient_attachments_file_type`: For file type filtering

### Security
- **Row Level Security (RLS)**: Enabled with proper policies
- **Clinic-based Access**: Users can only access attachments for their clinic's patients
- **User Permissions**: Insert, update, delete based on user roles

## File Structure

### New Components
```
components/patient/
├── PatientAttachments.tsx      # Main attachments component
├── ImageViewerModal.tsx        # Full-screen image viewer
└── PatientDetailsModal.tsx     # Updated with attachments tab
```

### Updated Files
- `types.ts`: Added `PatientAttachment` interface and updated `PatientDetailTab`
- `locales/en.ts`: Added English translations
- `locales/ar.json`: Added Arabic translations
- `patient_attachments_schema.sql`: Database schema

## Usage Instructions

### For Users
1. **Open Patient Details**: Click on any patient to view their details
2. **Navigate to Attachments**: Click the "Attachments" tab
3. **Upload Files**: 
   - Drag and drop files onto the upload area, or
   - Click "Select Files" to browse and choose files
4. **Add Descriptions**: Optionally add descriptions for each file
5. **Upload**: Click "Upload" to save the files
6. **View Files**: 
   - Click the "View" icon on images for full-screen viewing
   - Click "Download" to save files locally
   - Click "Delete" to remove files (with confirmation)

### For Developers

#### Adding New File Types
To add support for additional file types, update the `accept` attribute in the file input:

```tsx
<input
    type="file"
    multiple
    accept="image/*,.pdf,.doc,.docx,.txt,.newExtension"
    onChange={handleFileSelect}
    className="hidden"
/>
```

#### Customizing File Size Limits
Modify the file size validation in `PatientAttachments.tsx`:

```tsx
const validFiles = fileArray.filter(file => {
    if (file.size > 20 * 1024 * 1024) { // Changed to 20MB
        addNotification(`${file.name}: File size exceeds 20MB limit`, NotificationType.ERROR);
        return false;
    }
    return true;
});
```

#### Integrating with Cloud Storage
To integrate with Supabase Storage or other cloud providers:

1. Replace the mock upload function in `PatientDetailsModal.tsx`
2. Implement actual file upload to storage
3. Save storage URLs in the database
4. Handle thumbnail generation if needed

Example integration:
```tsx
const handleUploadAttachments = async (files: File[], descriptions: string[]) => {
    const uploadPromises = files.map(async (file, index) => {
        // Upload to storage
        const { data, error } = await supabase.storage
            .from('patient-attachments')
            .upload(`${patientId}/${Date.now()}_${file.name}`, file);
            
        if (error) throw error;
        
        // Save to database
        const attachment = {
            patient_id: patientId,
            filename: data.path,
            original_filename: file.name,
            file_type: file.type,
            file_size: file.size,
            file_url: data.path,
            description: descriptions[index] || '',
            uploaded_by: userId
        };
        
        return supabase.from('patient_attachments').insert(attachment);
    });
    
    await Promise.all(uploadPromises);
    // Refresh attachments list
};
```

## API Endpoints (When Implemented)

### GET /api/attachments/:patientId
Retrieve all attachments for a specific patient

### POST /api/attachments
Upload new attachments (multipart/form-data)

### DELETE /api/attachments/:attachmentId
Delete a specific attachment

### GET /api/attachments/:attachmentId/download
Download a specific attachment

## Error Handling

### Common Issues
1. **File Too Large**: Files over 10MB are rejected with notification
2. **Unsupported Format**: Non-image files show document icons
3. **Upload Failures**: Network errors show error notifications
4. **Permission Denied**: Users without proper permissions cannot access attachments

### User Feedback
- **Success Notifications**: File upload/delete confirmations
- **Error Notifications**: Clear error messages with actionable advice
- **Loading States**: Upload progress and loading indicators
- **Confirmation Dialogs**: Prevent accidental deletions

## Localization

The system supports both English and Arabic with the following translations:
- Navigation tabs
- Upload interface
- Error messages
- Confirmation dialogs
- File type descriptions

## Browser Compatibility

- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **File API**: Required for file upload functionality
- **Drag & Drop**: HTML5 drag and drop API
- **Keyboard Navigation**: Arrow keys and ESC for image viewer

## Performance Considerations

- **Lazy Loading**: Images load only when needed
- **Thumbnail Generation**: Reduces bandwidth for large images
- **Pagination**: Consider for patients with many attachments
- **File Compression**: Implement compression for large files
- **CDN**: Use content delivery network for file storage

## Security Best Practices

1. **File Type Validation**: Strict file type checking
2. **Virus Scanning**: Implement virus scanning for uploads
3. **Access Control**: Proper RLS policies in database
4. **Secure Storage**: Use encrypted cloud storage
5. **Audit Logs**: Track file access and modifications

## Future Enhancements

### Planned Features
- **File Categories**: Organize attachments by type (X-rays, Reports, etc.)
- **File Versioning**: Track changes and maintain file history
- **Search & Filter**: Search attachments by filename or description
- **Bulk Operations**: Select and delete multiple files
- **File Sharing**: Generate secure links for external sharing
- **OCR Integration**: Extract text from uploaded documents
- **File Encryption**: End-to-end encryption for sensitive files

### Integration Opportunities
- **DICOM Support**: Medical imaging standard for X-rays
- **Electronic Health Records**: Integration with external EHR systems
- **Telemedicine**: Share attachments during virtual consultations
- **Insurance Systems**: Automatic attachment submission to insurance
- **Laboratory Systems**: Integration with dental labs

## Troubleshooting

### Common Problems
1. **Files not uploading**: Check file size and format restrictions
2. **Images not displaying**: Verify file URLs and permissions
3. **Slow performance**: Consider implementing file compression
4. **Storage limits**: Monitor cloud storage usage and costs

### Debug Mode
Enable debug logging by adding:
```tsx
console.log('Attachment operation:', { action, file, patientId });
```

## Support and Maintenance

### Regular Tasks
- Monitor file storage usage
- Clean up orphaned attachments
- Update file type restrictions as needed
- Review security policies
- Backup attachment metadata

### Monitoring
- Track upload success rates
- Monitor file access patterns
- Review security logs
- Performance metrics
- User feedback and issues

---

## Implementation Status
✅ **Completed Features:**
- Database schema and RLS policies
- File upload component with drag & drop
- Image viewer modal with navigation
- File management (view, download, delete)
- Localization support
- Patient integration

🔄 **In Progress:**
- Cloud storage integration
- File compression
- Advanced search

📋 **Planned:**
- File categorization
- Version control
- OCR text extraction
- DICOM support
- Bulk operations

This attachments system provides a solid foundation for managing patient files while maintaining security, usability, and performance standards.
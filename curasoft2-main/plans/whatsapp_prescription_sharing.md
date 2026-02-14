# WhatsApp Prescription PDF Sharing Feature

## Overview
Add ability to share prescription PDFs directly via WhatsApp from the prescription details modal.

## Current WhatsApp Implementation
The app currently sends WhatsApp messages using:
- WhatsApp Web API: `https://wa.me/{phone}?text={encodedMessage}`
- Patient phone number from patient records
- Message templates stored in `clinicData.whatsappMessageTemplate`

## Proposed Implementation

### 1. Add WhatsApp Share Button to PrescriptionDetailsModal
- Add a "Share via WhatsApp" button next to the Print button
- Button opens a patient phone number selection dialog (if multiple numbers exist)

### 2. Generate PDF from PrintablePrescription
- Use existing `PrintablePrescription` component
- Convert to PDF using browser's print-to-PDF functionality
- Alternative: Use a library like `html2pdf.js` or `jspdf`

### 3. Share PDF via WhatsApp
Since WhatsApp Web doesn't support direct file attachments, we have two approaches:

**Approach A - Web Share API (Recommended for Mobile):**
```typescript
if (navigator.share && navigator.canShare({ files: [pdfBlob] })) {
  await navigator.share({
    title: `Prescription - ${patient.name}`,
    files: [pdfBlob]
  });
}
```
Then user selects WhatsApp from share sheet.

**Approach B - Text Message with Link (Fallback):**
```typescript
const message = `Prescription for ${patient.name}\n\n`;
message += `Date: ${dateFormatter.format(new Date(prescription.prescriptionDate))}\n`;
message += `Medications: ${items.map(i => i.medicationName).join(', ')}\n\n`;
message += `Please find the prescription PDF attached.`;

const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
window.open(whatsappUrl, '_blank');
```

### 4. Settings - Prescription WhatsApp Template
Add a new template setting in `Settings.tsx`:
```typescript
// In ClinicData interface
whatsappPrescriptionTemplate?: string;

// In Settings.tsx - New section
{/* Prescription WhatsApp Message Template */}
<div className="border-t pt-8">
  <h3 className="text-lg font-semibold mb-4">قالب رسالة واتس الروشتة</h3>
  <textarea
    value={clinicData.whatsappPrescriptionTemplate}
    onChange={(e) => clinicData.updateWhatsappPrescriptionTemplate(e.target.value)}
    placeholder="رسالة واتس للروشتة..."
    className="..."
  />
  <p className="text-sm text-gray-500 mt-2">
    المتغيرات: {patientName}, {date}, {medications}
  </p>
</div>
```

## Files to Modify

### 1. `types.ts`
- Add `whatsappPrescriptionTemplate` to `ClinicData` interface

### 2. `hooks/useClinicData.ts`
- Add `updateWhatsappPrescriptionTemplate` function
- Initialize template from localStorage

### 3. `components/patient/PrescriptionDetailsModal.tsx`
- Add WhatsApp share button
- Add phone number selection (if patient has multiple numbers)
- Implement PDF generation and sharing logic

### 4. `components/patient/PrintablePrescription.tsx`
- Ensure component is optimized for PDF generation
- Add print-specific styles if needed

### 5. `components/Settings.tsx`
- Add prescription WhatsApp template section
- Add save functionality

## Message Template Variables
- `{patientName}` - Patient name
- `{date}` - Prescription date
- `{medications}` - List of medications
- `{dentist}` - Dentist name
- `{clinicName}` - Clinic name

## Implementation Steps

1. **Add template storage** - Add `whatsappPrescriptionTemplate` to clinic data
2. **Create template UI** - Add template editor in Settings
3. **Implement PDF generation** - Create utility to generate PDF blob from prescription
4. **Add share button** - Add WhatsApp button to PrescriptionDetailsModal
5. **Implement sharing logic** - Use Web Share API or fallback to text message
6. **Add dark mode** - Ensure all new UI elements support dark mode

## Technical Considerations

### PDF Generation Options
1. **Browser Print to PDF** - Use `window.print()` with print-specific CSS
2. **html2pdf.js** - Client-side PDF generation
3. **jspdf** - Lower level PDF generation

### Browser Compatibility
- Web Share API: Chrome 85+, Edge 85+, Safari 14.1+ (mobile)
- Fallback: Open WhatsApp Web with text message

### User Experience
- Show loading state during PDF generation
- Provide feedback on success/failure
- Offer fallback option if Web Share API not available

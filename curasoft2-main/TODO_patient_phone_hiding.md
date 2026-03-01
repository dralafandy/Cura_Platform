# TODO: Hide Patient Phone Number on Patient Details Page

## Task
Hide the patient phone number (or patient ID) on the patient details page for privacy.

## Files Edited:
1. `components/patient/PatientDetailsPanel.tsx` - Main patient details page

## Changes Made:
- Removed the patient ID display from below the patient's name in the header section
- The patient ID was previously shown as `{t('patientDetails.patientId')}: {patient.id.slice(-8)}`

## Status: COMPLETED

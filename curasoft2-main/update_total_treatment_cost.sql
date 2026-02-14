-- Update existing treatment records to set total_treatment_cost
UPDATE treatment_records 
SET total_treatment_cost = (doctor_share + clinic_share)
WHERE total_treatment_cost IS NULL OR total_treatment_cost = 0;

-- Verify the update
SELECT id, doctor_share, clinic_share, total_treatment_cost 
FROM treatment_records 
WHERE total_treatment_cost IS NULL OR total_treatment_cost = 0;

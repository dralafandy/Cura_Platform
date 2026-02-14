-- Fix payments method check constraint and ensure method is not null with default

-- First, update any existing null methods to 'Cash'
UPDATE payments SET method = 'Cash' WHERE method IS NULL;

-- Drop the existing constraint if it exists
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_method_check;

-- Set default and not null
ALTER TABLE payments ALTER COLUMN method SET DEFAULT 'Cash';
ALTER TABLE payments ALTER COLUMN method SET NOT NULL;

-- Recreate the constraint with correct values
ALTER TABLE payments ADD CONSTRAINT payments_method_check CHECK (method IN ('Cash', 'Instapay', 'Vodafone Cash', 'Other', 'Discount'));

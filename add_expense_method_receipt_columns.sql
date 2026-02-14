-- SQL Script to add method and expense_receipt_image_url columns to expenses table
-- This script adds the new columns to the existing expenses table

-- Add method column with check constraint
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS method TEXT CHECK (method IN ('Cash', 'Instapay', 'Vodafone Cash', 'Other'));

-- Add expense_receipt_image_url column
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS expense_receipt_image_url TEXT;

-- Set default value for method column
UPDATE expenses SET method = 'Cash' WHERE method IS NULL;
ALTER TABLE expenses ALTER COLUMN method SET DEFAULT 'Cash';

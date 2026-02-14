-- SQL Script to add payment_receipt_image_url column to payments table
-- This script adds the new column to the existing payments table

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_receipt_image_url TEXT;
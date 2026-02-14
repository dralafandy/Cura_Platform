-- SQL Script to drop all clinic management database tables
-- This script drops all tables in reverse order to avoid foreign key constraint issues
-- Designed for PostgreSQL (Supabase)
-- Use with caution as this will permanently delete all data

-- Drop tables in reverse order of creation to handle dependencies

DROP TABLE IF EXISTS doctor_payments CASCADE;
DROP TABLE IF EXISTS supplier_invoices CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS lab_cases CASCADE;
DROP TABLE IF EXISTS treatment_records CASCADE;
DROP TABLE IF EXISTS treatment_definitions CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS dentists CASCADE;
DROP TABLE IF EXISTS patients CASCADE;

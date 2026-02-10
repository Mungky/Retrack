-- Add description column to transactions table
-- Run this in Supabase SQL Editor or via: supabase db push

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN transactions.description IS 'User-entered description of the transaction (e.g. "Makan siang", "Gaji bulanan")';

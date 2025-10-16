-- Fix application approval constraint issues
-- Run this in Supabase SQL Editor

-- First, let's check the current constraints
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'applications'::regclass 
  AND contype = 'c';

SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'application_form_responses'::regclass 
  AND contype = 'c';

-- If the constraints don't match what we expect, let's fix them
-- Drop and recreate the applications status constraint if needed
DO $$
BEGIN
    -- Check if applications_status_check exists and has correct values
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'applications'::regclass 
        AND conname = 'applications_status_check'
        AND pg_get_constraintdef(oid) LIKE '%pending%approved%rejected%'
    ) THEN
        -- Drop existing constraint if it exists
        ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
        
        -- Add the correct constraint
        ALTER TABLE applications ADD CONSTRAINT applications_status_check 
        CHECK (status IN ('pending', 'approved', 'rejected'));
        
        RAISE NOTICE 'Fixed applications status constraint';
    ELSE
        RAISE NOTICE 'Applications status constraint is already correct';
    END IF;
END $$;

-- Fix application_form_responses constraint if needed
DO $$
BEGIN
    -- Check if the constraint exists and has correct values
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'application_form_responses'::regclass 
        AND conname = 'application_form_responses_status_check'
        AND pg_get_constraintdef(oid) LIKE '%submitted%under_review%approved%rejected%'
    ) THEN
        -- Drop existing constraint if it exists
        ALTER TABLE application_form_responses DROP CONSTRAINT IF EXISTS application_form_responses_status_check;
        
        -- Add the correct constraint
        ALTER TABLE application_form_responses ADD CONSTRAINT application_form_responses_status_check 
        CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected'));
        
        RAISE NOTICE 'Fixed application_form_responses status constraint';
    ELSE
        RAISE NOTICE 'Application_form_responses status constraint is already correct';
    END IF;
END $$;

-- Verify the constraints are now correct
SELECT 
  'applications' as table_name,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'applications'::regclass 
  AND contype = 'c'
  AND conname LIKE '%status%'

UNION ALL

SELECT 
  'application_form_responses' as table_name,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'application_form_responses'::regclass 
  AND contype = 'c'
  AND conname LIKE '%status%';

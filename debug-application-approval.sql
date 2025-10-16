-- Debug application approval constraint violation
-- Run this in Supabase SQL Editor

-- Check the current status constraint on applications table
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'applications'::regclass 
  AND contype = 'c';

-- Check the current status constraint on application_form_responses table
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'application_form_responses'::regclass 
  AND contype = 'c';

-- Check sample data in applications table
SELECT id, status, created_at 
FROM applications 
ORDER BY created_at DESC 
LIMIT 5;

-- Check sample data in application_form_responses table
SELECT id, status, submitted_at 
FROM application_form_responses 
ORDER BY submitted_at DESC 
LIMIT 5;

-- Check if there are any applications with invalid status values
SELECT id, status 
FROM applications 
WHERE status NOT IN ('pending', 'approved', 'rejected');

-- Check if there are any form responses with invalid status values
SELECT id, status 
FROM application_form_responses 
WHERE status NOT IN ('submitted', 'under_review', 'approved', 'rejected');

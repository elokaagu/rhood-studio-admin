-- Adds e-signature support for brand booking agreements.
-- Run this once in the Supabase SQL editor.

ALTER TABLE booking_requests
  ADD COLUMN IF NOT EXISTS agreement_signed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS agreement_signed_by TEXT;

-- Existing "Brands can update pending booking requests" policy only allows
-- updates while status = 'pending', so signing (which happens after the DJ
-- has accepted) needs its own policy.
DROP POLICY IF EXISTS "Brands can sign accepted booking requests" ON booking_requests;
CREATE POLICY "Brands can sign accepted booking requests"
ON booking_requests
FOR UPDATE
TO authenticated
USING (
  brand_id = auth.uid()
  AND status = 'accepted'
)
WITH CHECK (
  brand_id = auth.uid()
  AND status = 'accepted'
);

-- notify_dj_membership_approved() inserts 'membership_approved', which the type check
-- rejected. That failed the whole approval update, so Studio fell back to setting
-- is_verified and the "You're in" push never went out.

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check CHECK (
    type::text = ANY (ARRAY[
      'opportunity',
      'application',
      'message',
      'system',
      'connection_request',
      'connection_accepted',
      'application_approved',
      'application_rejected',
      'membership_approved'
    ]::text[])
  );

-- Mix likes: one row per user per mix, unique constraint prevents duplicates
CREATE TABLE IF NOT EXISTS public.mix_likes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mix_id      UUID NOT NULL REFERENCES public.mixes(id) ON DELETE CASCADE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT mix_likes_unique UNIQUE (user_id, mix_id)
);

CREATE INDEX IF NOT EXISTS idx_mix_likes_user_id ON public.mix_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_mix_likes_mix_id  ON public.mix_likes(mix_id);

ALTER TABLE public.mix_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can read like counts
CREATE POLICY "Anyone can view mix likes"
  ON public.mix_likes FOR SELECT
  USING (true);

-- Users can like mixes
CREATE POLICY "Users can like mixes"
  ON public.mix_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can unlike (delete) their own likes
CREATE POLICY "Users can unlike mixes"
  ON public.mix_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

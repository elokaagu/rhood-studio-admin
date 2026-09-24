-- Approving a DJ inserts a gigs row and copies opportunities.genre onto
-- gigs.genre. That column is varchar(100); listings with a long genre list
-- (e.g. Protect Your Set at 103 characters) fail with:
--   value too long for type character varying(100)

DO $$
DECLARE
  r RECORD;
BEGIN
  IF to_regclass('public.gigs') IS NULL THEN
    RETURN;
  END IF;

  FOR r IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'gigs'
      AND data_type = 'character varying'
      AND character_maximum_length = 100
  LOOP
    EXECUTE format(
      'ALTER TABLE public.gigs ALTER COLUMN %I TYPE TEXT',
      r.column_name
    );
  END LOOP;
END $$;

-- Clip any remaining limited varchar columns so a long title or location
-- cannot block the approve trigger.
CREATE OR REPLACE FUNCTION public.clip_varchar_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  payload jsonb := to_jsonb(NEW);
  r RECORD;
  current_value text;
BEGIN
  FOR r IN
    SELECT column_name, character_maximum_length
    FROM information_schema.columns
    WHERE table_schema = TG_TABLE_SCHEMA
      AND table_name = TG_TABLE_NAME
      AND data_type = 'character varying'
      AND character_maximum_length IS NOT NULL
  LOOP
    current_value := payload ->> r.column_name;
    IF current_value IS NOT NULL
       AND char_length(current_value) > r.character_maximum_length THEN
      payload := payload || jsonb_build_object(
        r.column_name,
        left(current_value, r.character_maximum_length)
      );
    END IF;
  END LOOP;
  NEW := jsonb_populate_record(NEW, payload);
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.gigs') IS NULL THEN
    RETURN;
  END IF;

  DROP TRIGGER IF EXISTS clip_gigs_varchar_columns ON public.gigs;
  CREATE TRIGGER clip_gigs_varchar_columns
  BEFORE INSERT OR UPDATE ON public.gigs
  FOR EACH ROW
  EXECUTE FUNCTION public.clip_varchar_columns();
END $$;

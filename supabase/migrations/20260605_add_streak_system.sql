-- ============================================================
-- Streak system — Phase 1
-- Colonnes sur profiles + table historique + triggers + RPC
-- ============================================================

-- 1. Colonnes streak sur profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_streak         INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS best_streak            INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_streak_date       DATE,
  ADD COLUMN IF NOT EXISTS last_valid_activity_at TIMESTAMPTZ;

-- 2. Table d'historique : une ligne par user par jour
--    UNIQUE (user_id, activity_date) sert d'anti-doublon
CREATE TABLE IF NOT EXISTS public.user_streak_days (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  source_type   TEXT NOT NULL CHECK (source_type IN ('post', 'event')),
  source_id     UUID NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, activity_date)
);

ALTER TABLE public.user_streak_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read streak days"
  ON public.user_streak_days FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated can insert own streak days"
  ON public.user_streak_days FOR INSERT TO authenticated
  WITH CHECK (true);

-- 3. Fonction centrale de traitement de streak
CREATE OR REPLACE FUNCTION public.process_streak_for_user(
  p_user_id     UUID,
  p_source_type TEXT,
  p_source_id   UUID
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_today     DATE;
  v_last_date DATE;
BEGIN
  -- Fuseau Europe/Paris (minuit local = début de journée de streak)
  v_today := (NOW() AT TIME ZONE 'Europe/Paris')::date;

  -- Tente d'insérer la journée ; si déjà faite → ON CONFLICT DO NOTHING
  INSERT INTO public.user_streak_days (user_id, activity_date, source_type, source_id)
  VALUES (p_user_id, v_today, p_source_type, p_source_id)
  ON CONFLICT (user_id, activity_date) DO NOTHING;

  -- Si aucune ligne insérée : journée déjà validée, on sort
  IF NOT FOUND THEN RETURN; END IF;

  -- Récupère la dernière date validée
  SELECT last_streak_date INTO v_last_date FROM public.profiles WHERE id = p_user_id;

  -- Met à jour les compteurs
  UPDATE public.profiles SET
    last_valid_activity_at = NOW(),
    last_streak_date       = v_today,
    current_streak = CASE
      WHEN v_last_date = v_today - 1 THEN current_streak + 1
      ELSE 1
    END,
    best_streak = GREATEST(
      best_streak,
      CASE
        WHEN v_last_date = v_today - 1 THEN current_streak + 1
        ELSE 1
      END
    )
  WHERE id = p_user_id;
END;
$$;

-- 4. Trigger pour les posts (user_id)
CREATE OR REPLACE FUNCTION public.trg_streak_post()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM public.process_streak_for_user(NEW.user_id, 'post', NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_streak_on_post ON public.posts;
CREATE TRIGGER trg_streak_on_post
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.trg_streak_post();

-- 5. Trigger pour les events (creator_id)
CREATE OR REPLACE FUNCTION public.trg_streak_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM public.process_streak_for_user(NEW.creator_id, 'event', NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_streak_on_event ON public.events;
CREATE TRIGGER trg_streak_on_event
  AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.trg_streak_event();

-- 6. RPC leaderboard streaks
CREATE OR REPLACE FUNCTION public.leaderboard_streaks(limit_n integer DEFAULT 20)
RETURNS TABLE (
  user_id      uuid,
  username     text,
  display_name text,
  avatar_url   text,
  score        bigint,
  best_streak  bigint
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    p.id                      AS user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.current_streak::bigint  AS score,
    p.best_streak::bigint     AS best_streak
  FROM public.profiles p
  WHERE p.current_streak > 0
  ORDER BY p.current_streak DESC, p.best_streak DESC
  LIMIT limit_n;
$$;

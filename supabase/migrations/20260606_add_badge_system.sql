-- Badge system: table user_badges + RPC check_and_grant_badges

CREATE TABLE IF NOT EXISTS public.user_badges (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id  TEXT        NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_badges_select_public"
  ON public.user_badges FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS user_badges_user_id_idx ON public.user_badges (user_id);

-- ---------------------------------------------------------------------------
-- check_and_grant_badges : calcule les badges mérités et les insère
-- Idempotent — ON CONFLICT DO NOTHING, safe à appeler plusieurs fois
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_and_grant_badges(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_count     INTEGER;
  v_follower_count INTEGER;
  v_likes_count    INTEGER;
  v_owned_cars     INTEGER;
  v_events_joined  INTEGER;
  v_events_created INTEGER;
  v_best_streak    INTEGER;
  v_has_gold       BOOLEAN;
  v_has_silver     BOOLEAN;
  v_has_bronze_pos BOOLEAN;
  v_early_adopter  BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO v_post_count
    FROM posts WHERE user_id = p_user_id AND hidden_at IS NULL;

  SELECT COUNT(*) INTO v_follower_count
    FROM follows WHERE following_id = p_user_id;

  SELECT COUNT(*) INTO v_likes_count
    FROM post_likes
    WHERE post_id IN (SELECT id FROM posts WHERE user_id = p_user_id AND hidden_at IS NULL);

  SELECT COUNT(*) INTO v_owned_cars
    FROM user_cars WHERE user_id = p_user_id AND owned = true;

  SELECT COUNT(*) INTO v_events_joined
    FROM event_participants WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_events_created
    FROM events WHERE creator_id = p_user_id;

  SELECT COALESCE(best_streak, 0) INTO v_best_streak
    FROM profiles WHERE id = p_user_id;

  SELECT EXISTS(SELECT 1 FROM event_results WHERE user_id = p_user_id AND position = 1) INTO v_has_gold;
  SELECT EXISTS(SELECT 1 FROM event_results WHERE user_id = p_user_id AND position = 2) INTO v_has_silver;
  SELECT EXISTS(SELECT 1 FROM event_results WHERE user_id = p_user_id AND position = 3) INTO v_has_bronze_pos;

  -- Pionnier : membres inscrits dans la 1ère semaine du lancement (4 juin 2026)
  SELECT (created_at <= TIMESTAMPTZ '2026-06-15 00:00:00+00') INTO v_early_adopter
    FROM profiles WHERE id = p_user_id;

  INSERT INTO user_badges (user_id, badge_id)
  SELECT p_user_id, t.badge_id
  FROM (
    SELECT 'first_post'          AS badge_id, (v_post_count >= 1)     AS earned UNION ALL
    SELECT 'posts_10',                        (v_post_count >= 10)              UNION ALL
    SELECT 'posts_50',                        (v_post_count >= 50)              UNION ALL
    SELECT 'posts_100',                       (v_post_count >= 100)             UNION ALL
    SELECT 'first_like',                      (v_likes_count >= 1)              UNION ALL
    SELECT 'liked_50',                        (v_likes_count >= 50)             UNION ALL
    SELECT 'liked_200',                       (v_likes_count >= 200)            UNION ALL
    SELECT 'liked_500',                       (v_likes_count >= 500)            UNION ALL
    SELECT 'first_follow',                    (v_follower_count >= 1)           UNION ALL
    SELECT 'followers_10',                    (v_follower_count >= 10)          UNION ALL
    SELECT 'followers_50',                    (v_follower_count >= 50)          UNION ALL
    SELECT 'followers_100',                   (v_follower_count >= 100)         UNION ALL
    SELECT 'garage_20',                       (v_owned_cars >= 20)              UNION ALL
    SELECT 'garage_50',                       (v_owned_cars >= 50)              UNION ALL
    SELECT 'first_event',                     (v_events_joined >= 1)            UNION ALL
    SELECT 'events_5',                        (v_events_joined >= 5)            UNION ALL
    SELECT 'events_10',                       (v_events_joined >= 10)           UNION ALL
    SELECT 'events_25',                       (v_events_joined >= 25)           UNION ALL
    SELECT 'first_event_created',             (v_events_created >= 1)           UNION ALL
    SELECT 'streak_3',                        (v_best_streak >= 3)              UNION ALL
    SELECT 'streak_7',                        (v_best_streak >= 7)              UNION ALL
    SELECT 'streak_30',                       (v_best_streak >= 30)             UNION ALL
    SELECT 'streak_100',                      (v_best_streak >= 100)            UNION ALL
    SELECT 'event_podium_1st',                v_has_gold                        UNION ALL
    SELECT 'event_podium_2nd',                v_has_silver                      UNION ALL
    SELECT 'event_podium_3rd',                v_has_bronze_pos                  UNION ALL
    SELECT 'early_adopter',                   v_early_adopter
  ) AS t
  WHERE t.earned
  ON CONFLICT (user_id, badge_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_and_grant_badges(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_grant_badges(UUID) TO service_role;

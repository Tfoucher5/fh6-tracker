-- Fix: Allow authenticated users to read ALL profiles
-- The is_public flag now only restricts anonymous (unauthenticated) access.
-- Previously, profiles with is_public=false were invisible to other logged-in users,
-- which caused a null profile join in the feed (React crash → black screen)
-- and "Profil introuvable" on public profile pages.
CREATE POLICY "Authenticated users can read all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Fix: Allow authenticated users to read any user's garage
-- Needed for the public profile "Garage" tab and the "Compare" feature.
-- Write operations remain restricted to own rows only.
DROP POLICY IF EXISTS "Users can read own garage" ON public.user_cars;

CREATE POLICY "Authenticated users can read any garage"
  ON public.user_cars
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow anonymous (non-logged-in) visitors to read garages
-- Consistent with "Anyone can read profiles" (public role, qual=true)
CREATE POLICY "Anyone can read any garage"
  ON public.user_cars FOR SELECT
  TO anon
  USING (true);

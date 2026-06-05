-- ============================================================
-- Admin system — Phase 1
-- account_status + user_roles + guards + admin RPCs
-- ============================================================

-- 1. Statut de compte sur profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'warned', 'restricted', 'suspended', 'banned'));

-- 2. Backfill created_at depuis auth.users (utile pour le tri admin)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

UPDATE public.profiles p
SET created_at = au.created_at
FROM auth.users au
WHERE au.id = p.id AND p.created_at IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN created_at SET DEFAULT NOW();

-- 3. Table des rôles (1 rôle par utilisateur)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'user'
                CHECK (role IN ('user', 'moderator', 'admin', 'owner')),
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by  UUID REFERENCES public.profiles(id),
  UNIQUE (user_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read roles"
  ON public.user_roles FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'owner')
    )
  );

-- 4. Rôle 'user' par défaut pour tous les profils existants
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user' FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- 5. Trigger : rôle 'user' auto à la création d'un profil
CREATE OR REPLACE FUNCTION public.create_default_user_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_user_role ON public.profiles;
CREATE TRIGGER trg_create_user_role
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_user_role();

-- 6. Fonctions helper
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid()),
    'user'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_above()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT role IN ('admin', 'owner')
     FROM public.user_roles WHERE user_id = auth.uid()),
    false
  );
$$;

-- 7. Trigger : protection account_status (seul un admin peut le changer)
CREATE OR REPLACE FUNCTION public.protect_account_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.account_status IS DISTINCT FROM OLD.account_status
    AND NOT public.is_admin_or_above()
  THEN
    RAISE EXCEPTION 'Seul un admin peut modifier le statut du compte';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_account_status ON public.profiles;
CREATE TRIGGER trg_protect_account_status
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_account_status();

-- 8. RPC admin : liste des utilisateurs
CREATE OR REPLACE FUNCTION public.admin_list_users(
  search_query TEXT    DEFAULT '',
  limit_n      INTEGER DEFAULT 50,
  offset_n     INTEGER DEFAULT 0
)
RETURNS TABLE (
  id             uuid,
  username       text,
  display_name   text,
  avatar_url     text,
  account_status text,
  role           text,
  current_streak integer,
  joined_at      timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.account_status,
    COALESCE(ur.role, 'user') AS role,
    p.current_streak,
    au.created_at             AS joined_at
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  JOIN  auth.users au ON au.id = p.id
  WHERE public.is_admin_or_above()
    AND (
      search_query = ''
      OR p.username    ILIKE '%' || search_query || '%'
      OR p.display_name ILIKE '%' || search_query || '%'
    )
  ORDER BY au.created_at DESC
  LIMIT limit_n OFFSET offset_n;
$$;

-- 9. RPC admin : changer le statut d'un compte
CREATE OR REPLACE FUNCTION public.admin_set_account_status(
  p_user_id UUID,
  p_status  TEXT
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_admin_or_above() THEN
    RAISE EXCEPTION 'Permissions insuffisantes';
  END IF;
  IF p_status NOT IN ('active', 'warned', 'restricted', 'suspended', 'banned') THEN
    RAISE EXCEPTION 'Statut invalide : %', p_status;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Impossible de modifier le statut du propriétaire';
  END IF;
  UPDATE public.profiles SET account_status = p_status WHERE id = p_user_id;
END;
$$;

-- 10. RPC admin : changer le rôle d'un utilisateur
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_user_id UUID,
  p_role    TEXT
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_my_role TEXT := public.get_my_role();
BEGIN
  IF v_my_role NOT IN ('admin', 'owner') THEN
    RAISE EXCEPTION 'Permissions insuffisantes';
  END IF;
  IF p_role NOT IN ('user', 'moderator', 'admin', 'owner') THEN
    RAISE EXCEPTION 'Rôle invalide : %', p_role;
  END IF;
  IF p_role IN ('admin', 'owner') AND v_my_role != 'owner' THEN
    RAISE EXCEPTION 'Seul le propriétaire peut accorder le rôle admin ou owner';
  END IF;
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Impossible de modifier son propre rôle';
  END IF;
  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (p_user_id, p_role, auth.uid())
  ON CONFLICT (user_id)
  DO UPDATE SET role = EXCLUDED.role, granted_by = EXCLUDED.granted_by, granted_at = NOW();
END;
$$;

-- ============================================================
-- BOOTSTRAP OWNER : exécute cette requête une fois dans le
-- dashboard Supabase pour te définir comme propriétaire :
--
--   UPDATE public.user_roles
--   SET role = 'owner'
--   WHERE user_id = (
--     SELECT id FROM public.profiles WHERE username = 'TON_USERNAME'
--   );
-- ============================================================

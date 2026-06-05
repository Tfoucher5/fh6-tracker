# Modération FH6 Tracker — Phase 2 + 3

**Date :** 2026-06-05  
**Scope :** Statuts de contenu + système de signalements  
**Priorité :** Sécurité avant SEO/engagement

---

## Contexte

Phase 1 admin terminée : rôles (user/moderator/admin/owner), statuts de compte (active/warned/restricted/suspended/banned), StatusGate, CommunityGuard, BannedPage, AdminPage basique.

Phase 2+3 : rendre la plateforme sûre pour une croissance communautaire — les admins/modos peuvent masquer du contenu, les users peuvent signaler.

---

## Architecture

### BDD — 3 migrations

**1. Colonnes de modération sur `posts`**
```sql
status text DEFAULT 'published' CHECK (IN 'published','hidden','deleted')
hidden_at timestamptz
hidden_by uuid → profiles.id
hidden_reason text
```

**2. Colonnes de modération sur `post_comments`**
Idem posts.

**3. Colonnes de modération sur `events`**
```sql
status text DEFAULT 'scheduled' CHECK (IN 'scheduled','completed','cancelled','hidden','deleted')
hidden_at timestamptz
hidden_by uuid → profiles.id
hidden_reason text
```

**4. Table `reports`**
```sql
id, reporter_id, target_type (post/comment/event/profile),
target_id, reason (spam/harassment/offensive_content/
inappropriate_content/cheating/fake_event/impersonation/other),
details text, status (open/reviewing/resolved/dismissed),
reviewed_by, reviewed_at, resolution, created_at, updated_at
UNIQUE(reporter_id, target_type, target_id)  -- 1 signalement par user par cible
```

### RPCs (SECURITY DEFINER)

| Fonction | Accès |
|---|---|
| `admin_hide_post(p_post_id, p_reason)` | moderator/admin/owner |
| `admin_restore_post(p_post_id)` | moderator/admin/owner |
| `admin_hide_comment(p_comment_id, p_reason)` | moderator/admin/owner |
| `admin_restore_comment(p_comment_id)` | moderator/admin/owner |
| `admin_hide_event(p_event_id, p_reason)` | moderator/admin/owner |
| `admin_restore_event(p_event_id)` | moderator/admin/owner |
| `create_report(target_type, target_id, reason, details)` | tout user authentifié |
| `admin_list_reports(status_filter, limit_n, offset_n)` | moderator/admin/owner |
| `admin_resolve_report(p_report_id, p_resolution, p_dismiss)` | moderator/admin/owner |
| `admin_list_hidden_content(limit_n, offset_n)` | moderator/admin/owner |

### RLS `reports`
- INSERT : `reporter_id = auth.uid()`
- SELECT : reporter peut voir ses signalements ; moderator/admin/owner voient tout
- UPDATE/DELETE : moderator/admin/owner uniquement

---

## Comportement frontend

### Feed & listes
- `useFeed.ts` : ajouter `.eq('status', 'published')` sur la requête posts
- `useEvents.ts` : filtrer `status IN ('scheduled','completed','cancelled')` (pas hidden/deleted)
- `PostCard.tsx` sur page directe `/posts/:id` : si status=hidden → placeholder *"Publication masquée par un modérateur."*

### Commentaires masqués (`FeedComments.tsx`)
- Commentaire avec `status = 'hidden'` → remplacer contenu + avatar + pseudo par :
  > *"Commentaire masqué par un modérateur."*
- Les actions (like/répondre) sont cachées
- Pour admin/modo : affiche le placeholder + bouton "Voir le détail" (optionnel phase suivante)

### Bouton Signaler
- `PostCard.tsx` : icône flag dans le menu kebab (⋯) existant
- `FeedComments.tsx` : icône flag sur chaque ligne commentaire (visible au hover)
- Ouvre `ReportModal` → select raison + textarea optionnel → appel `create_report`
- Toast de confirmation : *"Signalement envoyé."*
- Si déjà signalé par cet user → toast : *"Tu as déjà signalé ce contenu."*

### `ReportModal.tsx`
Composant modal standalone. Props : `targetType`, `targetId`, `onClose`.  
Raisons affichées en français. Bouton soumettre désactivé si aucune raison sélectionnée.

---

## AdminPage — onglet Modération

Nouvelle tab "Modération" dans AdminPage (à côté de "Utilisateurs").

**Sous-sections (via sous-tabs ou accordéons) :**

1. **Signalements ouverts** — liste avec : cible, raison, date, boutons Résoudre/Ignorer + lien vers le contenu
2. **Contenus masqués** — liste posts + comments masqués, avec bouton Restaurer

Actions dans la liste signalements :
- "Voir le contenu" → ouvre le post/commentaire dans un panneau latéral ou nouveau tab
- "Masquer le contenu" → appelle hide_post ou hide_comment
- "Résoudre" → marque le report resolved
- "Ignorer" → marque dismissed

---

## Ce qui n'est PAS dans ce scope

- Suppression définitive (owner only, phase suivante)
- Avertissements utilisateurs (user_warnings — phase suivante)
- Logs admin (phase suivante)
- Modération des events depuis l'onglet modération (masquage events direct = phase suivante, les events sont peu utilisés pour l'instant)

---

## Ordre d'implémentation

1. Migration BDD (colonnes + table reports + RPCs)
2. Frontend filtrage (useFeed, useEvents)
3. Affichage commentaires masqués (FeedComments)
4. ReportModal + bouton signaler (PostCard, FeedComments)
5. AdminPage onglet Modération
6. Vérification TypeScript + test manuel

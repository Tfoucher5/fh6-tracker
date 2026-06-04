# FH6 Social Network — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer FH6 Tracker en réseau social complet centré sur Forza Horizon 6 : feed de posts avec photos/likes/commentaires, système d'abonnements (follow/followers), profils publics, comparaison de garages, et événements communautaires.

**Architecture:** Feed social basé sur une table `posts` indépendante (peut référencer une voiture et/ou une photo). Les follows sont stockés dans `follows (follower_id, following_id)`. Les événements dans `events` + `event_participants`. RLS Supabase strict sur toutes les tables. Frontend React organisé en `features/social/` et `features/events/` avec hooks dédiés.

**Tech Stack:** React 19, Supabase (Postgres + RLS + Storage), Tailwind v4, Lucide React, React Router v7

---

## Fichiers créés / modifiés

### Nouveaux
- `src/features/social/types.ts`
- `src/features/social/hooks/useFeed.ts`
- `src/features/social/hooks/useFollows.ts`
- `src/features/social/hooks/usePost.ts`
- `src/features/social/components/UserAvatar.tsx`
- `src/features/social/components/FollowButton.tsx`
- `src/features/social/components/PostCard.tsx`
- `src/features/social/components/PostComposer.tsx`
- `src/features/social/components/FeedComments.tsx`
- `src/features/events/types.ts`
- `src/features/events/hooks/useEvents.ts`
- `src/features/events/hooks/useEventDetail.ts`
- `src/features/events/components/EventCard.tsx`
- `src/features/events/components/EventForm.tsx`
- `src/features/events/components/ParticipantList.tsx`
- `src/pages/FeedPage.tsx`
- `src/pages/EventsPage.tsx`
- `src/pages/EventDetailPage.tsx`
- `src/pages/PublicProfilePage.tsx`

### Modifiés
- `src/App.tsx` — nouvelles routes
- `src/components/Navbar.tsx` — liens Feed + Events
- `src/pages/ProfilePage.tsx` — followers/following + lien profil public
- `src/features/cars/components/CarStatusPanel.tsx` — bouton "Partager dans le feed"

---

## Task 1 : Migration Supabase — Toutes les tables sociales

**Fichiers:** Supabase MCP → migration `social_network`

- [ ] Appliquer la migration SQL complète (follows, posts, post_likes, post_comments, events, event_participants + RLS)

---

## Task 2 : Types TypeScript sociaux

**Fichiers:**
- Create: `src/features/social/types.ts`
- Create: `src/features/events/types.ts`

- [ ] Définir `Post`, `PostLike`, `PostComment`, `Follow`, `FeedPost` (join avec profiles + cars)
- [ ] Définir `Event`, `EventParticipant`, `EventDetail`

---

## Task 3 : Hook useFeed

**Fichiers:**
- Create: `src/features/social/hooks/useFeed.ts`

- [ ] Charger les posts avec join profiles + cars + count likes/comments
- [ ] Pagination (load more, PAGE_SIZE=20)
- [ ] Filtre "Tous" / "Abonnements"

---

## Task 4 : Hook usePost

**Fichiers:**
- Create: `src/features/social/hooks/usePost.ts`

- [ ] like/unlike un post
- [ ] Ajouter/supprimer un commentaire
- [ ] Supprimer un post (owner only)
- [ ] Créer un post (photo upload vers storage `post-photos` + insert)

---

## Task 5 : Hook useFollows

**Fichiers:**
- Create: `src/features/social/hooks/useFollows.ts`

- [ ] Charger followers/following d'un user
- [ ] follow(userId) / unfollow(userId)
- [ ] isFollowing(userId)

---

## Task 6 : Composants sociaux de base

**Fichiers:**
- Create: `src/features/social/components/UserAvatar.tsx`
- Create: `src/features/social/components/FollowButton.tsx`

- [ ] `UserAvatar` : avatar_url ou initiales colorées (couleur dérivée du username)
- [ ] `FollowButton` : bouton follow/unfollow avec état optimiste

---

## Task 7 : PostCard

**Fichiers:**
- Create: `src/features/social/components/PostCard.tsx`
- Create: `src/features/social/components/FeedComments.tsx`

- [ ] Photo du post (ou image de la voiture par défaut)
- [ ] Header : avatar + username + date relative
- [ ] Badge classe de la voiture référencée (ClassBadge)
- [ ] Caption
- [ ] Ligne like (Heart) + commentaire (MessageCircle) + count
- [ ] Toggle commentaires inline (FeedComments)

---

## Task 8 : PostComposer

**Fichiers:**
- Create: `src/features/social/components/PostComposer.tsx`

- [ ] Modal/drawer pour créer un post
- [ ] Upload photo (drag & drop ou input)
- [ ] Recherche + sélection voiture (autocomplete)
- [ ] Caption textarea
- [ ] Submit

---

## Task 9 : FeedPage

**Fichiers:**
- Create: `src/pages/FeedPage.tsx`

- [ ] Tabs "Tous" / "Abonnements"
- [ ] Bouton "Nouveau post" → PostComposer
- [ ] Liste de PostCard
- [ ] LoadMore

---

## Task 10 : Hooks événements

**Fichiers:**
- Create: `src/features/events/hooks/useEvents.ts`
- Create: `src/features/events/hooks/useEventDetail.ts`

- [ ] Lister événements futurs (triés par date)
- [ ] Créer un événement
- [ ] join/leave event
- [ ] Charger détail + participants

---

## Task 11 : Composants événements

**Fichiers:**
- Create: `src/features/events/components/EventCard.tsx`
- Create: `src/features/events/components/EventForm.tsx`
- Create: `src/features/events/components/ParticipantList.tsx`

- [ ] `EventCard` : titre, date, lieu FH, nb participants, badge "Inscrit"
- [ ] `EventForm` : formulaire création événement
- [ ] `ParticipantList` : liste des inscrits avec avatars

---

## Task 12 : EventsPage + EventDetailPage

**Fichiers:**
- Create: `src/pages/EventsPage.tsx`
- Create: `src/pages/EventDetailPage.tsx`

- [ ] Liste des événements à venir + passés
- [ ] Bouton créer événement (EventForm)
- [ ] Page détail : info + bouton rejoindre/quitter + ParticipantList

---

## Task 13 : PublicProfilePage

**Fichiers:**
- Create: `src/pages/PublicProfilePage.tsx`

- [ ] Header : avatar, display_name, username, bio, xbox_gamertag
- [ ] Compteurs followers/following (cliquables)
- [ ] FollowButton
- [ ] Onglets : Posts | Garage (stats ownership/photos) | Comparaison (si tous les deux connectés)
- [ ] Grille de posts de l'utilisateur
- [ ] Comparaison de garage : voitures en commun / exclusives

---

## Task 14 : Intégration Navbar + Routes + ProfilePage

**Fichiers:**
- Modify: `src/App.tsx`
- Modify: `src/components/Navbar.tsx`
- Modify: `src/pages/ProfilePage.tsx`

- [ ] Ajouter routes `/feed`, `/events`, `/events/:id`, `/u/:username`
- [ ] Navbar : icônes Feed (Rss) + Events (CalendarDays)
- [ ] ProfilePage : afficher followers/following count + lien vers profil public

---

## Task 15 : Bouton "Partager dans le feed" depuis CarDetail

**Fichiers:**
- Modify: `src/features/cars/components/CarStatusPanel.tsx`

- [ ] Bouton Share2 → ouvre PostComposer pré-rempli avec la voiture courante

# Optimisation Performance FH6 Tracker — Plan d'Implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre tous les chargements instantanés — bundle splitting, images WebP adaptatives, polices auto-hébergées, headers HTTP optimaux, re-renders React ciblés, prefetch JS des pages au hover.

**Architecture:** 8 tâches (Task 7 → Task 8 séquentiel, les autres indépendantes). Chaque tâche se conclut par `npm run build` + commit. Pas de tests unitaires (SPA React sans suite de tests configurée) — la vérification est visuelle + build success.

**Tech Stack:** React 19, Vite 8, Tailwind v4, @fontsource, vite-plugin-compression, Supabase Render API (`transformImage`)

---

## Fichiers impactés

| Fichier | Nature |
|---------|--------|
| `vite.config.ts` | manualChunks, target esnext, plugin compression |
| `vercel.json` | Cache-Control index.html, X-DNS-Prefetch-Control |
| `index.html` | Supprimer Google Fonts, ajouter preconnect Supabase |
| `src/main.tsx` | Imports @fontsource |
| `src/features/social/components/UserAvatar.tsx` | transformImage(80) + lazy + decoding |
| `src/features/catalogue/components/CarImage.tsx` | transformImage(480) + priority prop |
| `src/features/cars/components/CarDetailHeader.tsx` | transformImage(900) |
| `src/features/cars/components/CarPhotoGallery.tsx` | transformImage(640) |
| `src/features/social/components/PostLightbox.tsx` | transformImage(1600) |
| `src/features/social/components/PostCard.tsx` | priority prop + sizes + fetchPriority + memo |
| `src/features/catalogue/components/CatalogueCard.tsx` | priority prop + memo |
| `src/pages/FeedPage.tsx` | priority={index===0} |
| `src/pages/CataloguePage.tsx` | priority={index===0} |
| `src/features/social/hooks/useFeed.ts` | postsRef + useCallback sur toutes les actions |
| `src/features/social/hooks/useSavedPosts.ts` | savedIdsRef + useCallback toggleSave |
| `src/features/catalogue/hooks/useCatalogueData.ts` | useCallback getStatus + toggleStatus |
| `src/features/catalogue/hooks/useCatalogueFilters.ts` | useMemo visibleCars |
| `src/lib/prefetchRoute.ts` | Nouveau fichier |
| `src/components/Navbar.tsx` | prefetchRoute au hover, NavItem.prefetch |
| `src/components/BottomTabBar.tsx` | prefetchRoute au hover sur les tabs |

---

### Task 1 — Bundle splitting + compression Vite

**Files:**
- Modify: `vite.config.ts`
- Install: `vite-plugin-compression`

- [ ] **Step 1 : Installer vite-plugin-compression**

```bash
npm install -D vite-plugin-compression
```

- [ ] **Step 2 : Mettre à jour vite.config.ts**

Remplacer le contenu entier :

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import compression from "vite-plugin-compression";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    compression({ algorithm: "gzip" }),
    compression({ algorithm: "brotliCompress", ext: ".br" }),
  ],
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-icons": ["lucide-react"],
        },
      },
    },
  },
});
```

- [ ] **Step 3 : Vérifier le build**

```bash
npm run build
```

Expected : build success. Dans `dist/assets/`, des fichiers `.gz` et `.br` doivent apparaître à côté de chaque `.js`/`.css`. Les chunks `vendor-react-XXXXX.js`, `vendor-supabase-XXXXX.js`, `vendor-icons-XXXXX.js` doivent être présents séparément.

- [ ] **Step 4 : Commit**

```bash
git add vite.config.ts package.json package-lock.json
git commit -m "perf(build): vendor chunk splitting + gzip/brotli compression"
```

---

### Task 2 — Polices auto-hébergées avec @fontsource

**Files:**
- Install: `@fontsource/barlow @fontsource/barlow-condensed @fontsource/jetbrains-mono`
- Modify: `src/main.tsx`
- Modify: `index.html`

- [ ] **Step 1 : Installer les packages @fontsource**

```bash
npm install @fontsource/barlow @fontsource/barlow-condensed @fontsource/jetbrains-mono
```

- [ ] **Step 2 : Mettre à jour src/main.tsx**

Ajouter les imports de polices **avant** l'import `./index.css`. Remplacer les 3 premières lignes non-import en ajoutant en tête de fichier :

```typescript
// Polices auto-hébergées — élimine le round-trip Google Fonts
import "@fontsource/barlow/400.css";
import "@fontsource/barlow/400-italic.css";
import "@fontsource/barlow/500.css";
import "@fontsource/barlow/600.css";
import "@fontsource/barlow/700.css";
import "@fontsource/barlow-condensed/400.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import "@fontsource/barlow-condensed/900.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/600.css";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from "@vercel/analytics/react"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <SpeedInsights />
    <Analytics />
  </StrictMode>,
)
```

- [ ] **Step 3 : Mettre à jour index.html — supprimer le bloc Google Fonts**

Dans `index.html`, supprimer entièrement le bloc suivant (lignes 78–91 environ) :

```html
    <!-- Polices — chargement asynchrone, display=optional évite le CLS du font swap -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="preload"
      as="style"
      href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;600&display=optional"
      onload="this.onload=null;this.rel='stylesheet'"
    />
    <noscript>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;600&display=optional"
      />
    </noscript>
```

Le commentaire `<!-- Polices … -->` et tout son contenu jusqu'au `</noscript>` inclusif doivent disparaître.

- [ ] **Step 4 : Vérifier le build**

```bash
npm run build
```

Expected : build success. Dans `dist/assets/`, des fichiers `.woff2` avec hash doivent apparaître (ex: `barlow-latin-400-normal-XXXXX.woff2`). Le fichier `dist/index.html` ne doit plus contenir de référence à `fonts.googleapis.com`.

- [ ] **Step 5 : Commit**

```bash
git add src/main.tsx index.html package.json package-lock.json
git commit -m "perf(fonts): self-host Barlow + JetBrains Mono via @fontsource"
```

---

### Task 3 — Headers Vercel + Preconnect Supabase

**Files:**
- Modify: `vercel.json`
- Modify: `index.html`

- [ ] **Step 1 : Mettre à jour vercel.json**

Remplacer le contenu entier :

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/index.html",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, must-revalidate" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "X-DNS-Prefetch-Control", "value": "on" }
      ]
    }
  ]
}
```

- [ ] **Step 2 : Ajouter le preconnect Supabase dans index.html**

Juste avant la balise `</head>` (ou juste avant le `<script>` principal), ajouter :

```html
    <!-- Preconnect Supabase — réduit la latence de la 1re requête DB/storage -->
    <link rel="preconnect" href="https://pnazdsjgcwwkuysxrbcd.supabase.co" />
    <link rel="dns-prefetch" href="https://pnazdsjgcwwkuysxrbcd.supabase.co" />
```

- [ ] **Step 3 : Vérifier**

```bash
npm run build
```

Expected : build success. Vérifier dans `dist/index.html` que le preconnect Supabase est présent.

- [ ] **Step 4 : Commit**

```bash
git add vercel.json index.html
git commit -m "perf(network): Supabase preconnect, no-cache index.html, DNS prefetch"
```

---

### Task 4 — transformImage() exhaustif

**Files:**
- Modify: `src/features/social/components/UserAvatar.tsx`
- Modify: `src/features/catalogue/components/CarImage.tsx`
- Modify: `src/features/cars/components/CarDetailHeader.tsx`
- Modify: `src/features/cars/components/CarPhotoGallery.tsx`
- Modify: `src/features/social/components/PostLightbox.tsx`

- [ ] **Step 1 : UserAvatar.tsx — transformImage(80) + lazy + decoding**

Remplacer le contenu entier de `src/features/social/components/UserAvatar.tsx` :

```typescript
import { Link } from "react-router-dom";
import { transformImage } from "../../../lib/imageTransform";

type UserAvatarProps = {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  linkToProfile?: boolean;
};

const sizeMap = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-xl",
  xl: "w-20 h-20 text-2xl",
};

const colors = [
  "bg-red-600",
  "bg-violet-600",
  "bg-blue-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-orange-600",
  "bg-cyan-600",
  "bg-pink-600",
];

function getColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) & 0xffffffff;
  }
  return colors[Math.abs(hash) % colors.length];
}

export function UserAvatar({ username, displayName, avatarUrl, size = "md", linkToProfile = false }: UserAvatarProps) {
  const initials = (displayName ?? username).slice(0, 2).toUpperCase();
  const sizeClass = sizeMap[size];
  const bgColor = getColor(username);

  const inner = avatarUrl ? (
    <img
      src={transformImage(avatarUrl, 80) ?? avatarUrl}
      alt={username}
      loading="lazy"
      decoding="async"
      className={`${sizeClass} rounded-full object-cover shrink-0`}
    />
  ) : (
    <div className={`${sizeClass} ${bgColor} rounded-full flex items-center justify-center font-bold font-mono text-white shrink-0`}>
      {initials}
    </div>
  );

  if (linkToProfile) {
    return (
      <Link to={`/u/${username}`} className="shrink-0">
        {inner}
      </Link>
    );
  }

  return inner;
}
```

- [ ] **Step 2 : CarDetailHeader.tsx — transformImage(900)**

Dans `src/features/cars/components/CarDetailHeader.tsx`, ajouter l'import après les imports existants :

```typescript
import { transformImage } from "../../../lib/imageTransform";
```

Puis modifier le `<img>` dans le composant (remplacer `src={car.image_url}`) :

```typescript
          {car.image_url ? (
            <img
              src={transformImage(car.image_url, 900) ?? car.image_url}
              alt={title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
```

- [ ] **Step 3 : CarPhotoGallery.tsx — transformImage(640)**

Dans `src/features/cars/components/CarPhotoGallery.tsx`, ajouter l'import :

```typescript
import { transformImage } from "../../../lib/imageTransform";
```

Modifier le `<img>` dans la galerie :

```typescript
                <img
                  src={transformImage(photo.image_url, 640) ?? photo.image_url}
                  alt={photo.caption ?? "Photo voiture"}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-56 object-cover"
                />
```

- [ ] **Step 4 : PostLightbox.tsx — transformImage(1600, 90)**

Dans `src/features/social/components/PostLightbox.tsx`, ajouter l'import :

```typescript
import { transformImage } from "../../../lib/imageTransform";
```

Modifier le `<img>` dans `PostLightbox` :

```typescript
      <img
        src={transformImage(src, 1600, 90) ?? src}
        alt={alt}
        className="max-w-full max-h-[90dvh] object-contain rounded-xl shadow-2xl cursor-default"
        onClick={(e) => e.stopPropagation()}
      />
```

- [ ] **Step 5 : Vérifier le build**

```bash
npm run build
```

Expected : build success, 0 erreurs TypeScript.

- [ ] **Step 6 : Commit**

```bash
git add src/features/social/components/UserAvatar.tsx src/features/cars/components/CarDetailHeader.tsx src/features/cars/components/CarPhotoGallery.tsx src/features/social/components/PostLightbox.tsx
git commit -m "perf(images): apply transformImage WebP+resize on UserAvatar, CarDetailHeader, CarPhotoGallery, PostLightbox"
```

---

### Task 5 — CarImage priority + PostCard LCP + CataloguePage/FeedPage

**Files:**
- Modify: `src/features/catalogue/components/CarImage.tsx`
- Modify: `src/features/social/components/PostCard.tsx`
- Modify: `src/features/catalogue/components/CatalogueCard.tsx`
- Modify: `src/pages/FeedPage.tsx`
- Modify: `src/pages/CataloguePage.tsx`

- [ ] **Step 1 : CarImage.tsx — transformImage(480) + priority prop**

Remplacer le contenu entier de `src/features/catalogue/components/CarImage.tsx` :

```typescript
import { Car } from "lucide-react";
import { transformImage } from "../../../lib/imageTransform";

type CarImageProps = {
  imageUrl: string | null;
  alt: string;
  priority?: boolean;
};

export function CarImage({ imageUrl, alt, priority = false }: CarImageProps) {
  return (
    <div className="h-36 bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center overflow-hidden">
      {imageUrl ? (
        <img
          src={transformImage(imageUrl, 480) ?? imageUrl}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          className="w-full h-full object-cover"
        />
      ) : (
        <Car className="w-12 h-12 text-slate-600" />
      )}
    </div>
  );
}
```

- [ ] **Step 2 : CatalogueCard.tsx — ajouter prop priority**

Modifier `src/features/catalogue/components/CatalogueCard.tsx` :

Changer le type `CatalogueCardProps` en ajoutant `priority?: boolean` :

```typescript
type CatalogueCardProps = {
  car: CarRow;
  status: UserCarRow;
  saving: boolean;
  toggleStatus: (carId: string, field: ToggleField) => void;
  priority?: boolean;
};
```

Changer la signature de la fonction :

```typescript
export function CatalogueCard({ car, status, saving, toggleStatus, priority = false }: CatalogueCardProps) {
```

Passer `priority` à `CarImage` :

```typescript
      <CarImage imageUrl={car.image_url} alt={title} priority={priority} />
```

- [ ] **Step 3 : PostCard.tsx — priority prop + fetchPriority + sizes**

Dans `src/features/social/components/PostCard.tsx`, ajouter `priority?: boolean` au type :

```typescript
type PostCardProps = {
  post: FeedPost;
  currentUserId: string | null;
  isSaved?: boolean;
  isAdmin?: boolean;
  isChallengeEntry?: boolean;
  priority?: boolean;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
  onAdminHide?: (postId: string) => void;
  onSave?: (postId: string) => void;
  onCommentAdded: (postId: string) => void;
};
```

Ajouter `priority = false` dans la déstructuration :

```typescript
export function PostCard({ post, currentUserId, isSaved = false, isAdmin = false, isChallengeEntry = false, priority = false, onLike, onDelete, onAdminHide, onSave, onCommentAdded }: PostCardProps) {
```

Modifier le `<img>` dans la section `{/* Photo */}` :

```typescript
      {imageUrl ? (
        <LightboxTrigger src={imageUrl} alt={post.car ? `${post.car.make} ${post.car.model}` : "Post"} onOpen={setLightbox}>
          <img
            src={transformImage(imageUrl, 900) ?? imageUrl}
            alt={post.car ? `${post.car.make} ${post.car.model}` : "Post"}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
            sizes="(max-width: 768px) 100vw, 672px"
            className="w-full aspect-video object-cover"
          />
        </LightboxTrigger>
```

- [ ] **Step 4 : FeedPage.tsx — passer priority={index === 0}**

Dans `src/pages/FeedPage.tsx`, dans le `.map((post) => ...)`, ajouter l'index et la prop priority :

```typescript
              {posts.map((post, index) => {
                const isChallengeEntry = !!(
                  challenge?.car_id &&
                  post.car_id === challenge.car_id &&
                  post.created_at >= challenge.starts_at &&
                  post.created_at <= challenge.ends_at
                );
                return (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={user?.id ?? null}
                    isSaved={savedIds.has(post.id)}
                    isAdmin={isAdmin}
                    isChallengeEntry={isChallengeEntry}
                    priority={index === 0}
                    onLike={toggleLike}
                    onDelete={deletePost}
                    onAdminHide={removePostFromFeed}
                    onSave={toggleSave}
                    onCommentAdded={incrementCommentCount}
                  />
                );
              })}
```

- [ ] **Step 5 : CataloguePage.tsx — passer priority={index === 0}**

Dans `src/pages/CataloguePage.tsx`, dans le `.map((car) => ...)` de la vue cards :

```typescript
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filters.visibleCars.map((car, index) => (
                  <CatalogueCard
                    key={car.id}
                    car={car}
                    status={getStatus(car.id)}
                    saving={savingCarId === car.id}
                    toggleStatus={toggleStatus}
                    priority={index === 0}
                  />
                ))}
              </div>
```

- [ ] **Step 6 : Vérifier le build**

```bash
npm run build
```

Expected : build success, 0 erreurs TypeScript.

- [ ] **Step 7 : Commit**

```bash
git add src/features/catalogue/components/CarImage.tsx src/features/catalogue/components/CatalogueCard.tsx src/features/social/components/PostCard.tsx src/pages/FeedPage.tsx src/pages/CataloguePage.tsx
git commit -m "perf(images): LCP priority hint + fetchPriority + sizes on PostCard/CatalogueCard"
```

---

### Task 6 — useCallback dans useFeed, useSavedPosts, useCatalogueData + useMemo visibleCars

**Files:**
- Modify: `src/features/social/hooks/useFeed.ts`
- Modify: `src/features/social/hooks/useSavedPosts.ts`
- Modify: `src/features/catalogue/hooks/useCatalogueData.ts`
- Modify: `src/features/catalogue/hooks/useCatalogueFilters.ts`

- [ ] **Step 1 : useFeed.ts — postsRef + useCallback sur toutes les actions**

Remplacer le contenu entier de `src/features/social/hooks/useFeed.ts` :

```typescript
import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";
import type { FeedPost } from "../types";

const PAGE_SIZE = 20;

const POST_SELECT = `
  id, user_id, car_id, photo_url, storage_path, caption, created_at,
  profile:profiles!posts_user_id_fkey(id, username, display_name, avatar_url),
  car:cars(id, make, model, year, car_class, pi, image_url),
  post_likes(user_id),
  post_comments(id)
` as const;

export function useFeed(filter: "all" | "following") {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterRef = useRef(filter);
  filterRef.current = filter;
  const postsRef = useRef(posts);
  postsRef.current = posts;
  const loadingMoreRef = useRef(loadingMore);
  loadingMoreRef.current = loadingMore;
  const hasMoreRef = useRef(hasMore);
  hasMoreRef.current = hasMore;

  const loadPosts = useCallback(
    async (offset: number, currentUser: User | null, reset: boolean) => {
      let userIds: string[] | null = null;

      if (filterRef.current === "following" && currentUser) {
        const { data: followData } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", currentUser.id);

        userIds = (followData ?? []).map((f) => f.following_id);
        if (userIds.length === 0) {
          if (reset) setPosts([]);
          setHasMore(false);
          return;
        }
      }

      let query = supabase
        .from("posts")
        .select(POST_SELECT)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (userIds) {
        query = query.in("user_id", userIds);
      }

      const { data, error } = await query;
      if (error) {
        console.error("[useFeed] query error:", error);
        setError(error.message);
        return;
      }
      if (!data) return;
      setError(null);

      const newPosts = data as unknown as FeedPost[];
      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }
      setHasMore(newPosts.length === PAGE_SIZE);
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPosts([]);
    setHasMore(true);

    (async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (cancelled) return;
      setUser(currentUser);
      await loadPosts(0, currentUser, true);
      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [filter, loadPosts]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;
    setLoadingMore(true);
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    await loadPosts(postsRef.current.length, currentUser, false);
    setLoadingMore(false);
  }, [loadPosts]);

  const toggleLike = useCallback((postId: string) => {
    if (!user) return;
    const userId = user.id;
    const post = postsRef.current.find((p) => p.id === postId);
    if (!post) return;
    const liked = post.post_likes.some((l) => l.user_id === userId);

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          post_likes: liked
            ? p.post_likes.filter((l) => l.user_id !== userId)
            : [...p.post_likes, { user_id: userId }],
        };
      })
    );

    if (liked) {
      supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId).then(() => {});
    } else {
      supabase.from("post_likes").insert({ post_id: postId, user_id: userId }).then(() => {});
    }
  }, [user]);

  const incrementCommentCount = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, post_comments: [...p.post_comments, { id: "tmp" }] } : p
      )
    );
  }, []);

  const deletePost = useCallback((postId: string) => {
    const post = postsRef.current.find((p) => p.id === postId);
    if (!post || post.user_id !== user?.id) return;

    setPosts((prev) => prev.filter((p) => p.id !== postId));
    supabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .then(async () => {
        if (post.storage_path) {
          await supabase.storage.from("post-photos").remove([post.storage_path]);
        }
      });
  }, [user?.id]);

  const removePostFromFeed = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const addPost = useCallback((post: FeedPost) => {
    setPosts((prev) => [post, ...prev]);
  }, []);

  return {
    user,
    posts,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    toggleLike,
    incrementCommentCount,
    deletePost,
    removePostFromFeed,
    addPost,
  };
}
```

- [ ] **Step 2 : useSavedPosts.ts — savedIdsRef + useCallback toggleSave**

Remplacer le contenu entier de `src/features/social/hooks/useSavedPosts.ts` :

```typescript
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";

export function useSavedPosts() {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const savedIdsRef = useRef(savedIds);
  savedIdsRef.current = savedIds;

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data } = await supabase
        .from("saved_posts")
        .select("post_id")
        .eq("user_id", user.id);

      setSavedIds(new Set((data ?? []).map((r: { post_id: string }) => r.post_id)));
      setLoading(false);
    })();
  }, []);

  const toggleSave = useCallback(async (postId: string) => {
    if (!userId) return;
    const isSaved = savedIdsRef.current.has(postId);

    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(postId);
      else next.add(postId);
      return next;
    });

    if (isSaved) {
      await supabase.from("saved_posts").delete().eq("post_id", postId).eq("user_id", userId);
    } else {
      await supabase.from("saved_posts").insert({ post_id: postId, user_id: userId });
    }
  }, [userId]);

  return { savedIds, toggleSave, userId, loading };
}
```

- [ ] **Step 3 : useCatalogueData.ts — useCallback sur getStatus + toggleStatus**

Remplacer le contenu entier de `src/features/catalogue/hooks/useCatalogueData.ts` :

```typescript
import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";
import type { CarRow, StatusMap, UserCarRow } from "../types";

type ToggleField = "owned" | "photographed" | "favorite";

export function useCatalogueData() {
  const [user, setUser] = useState<User | null>(null);
  const [cars, setCars] = useState<CarRow[]>([]);
  const [statuses, setStatuses] = useState<StatusMap>({});
  const [loading, setLoading] = useState(true);
  const [savingCarId, setSavingCarId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadCatalogue();
  }, []);

  async function loadCatalogue() {
    setLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;

    setUser(currentUser);

    const { data: carsData, error: carsError } = await supabase
      .from("cars")
      .select(
        "id, source_key, make, model, year, car_type, car_class, pi, country, availability, dlc, image_url"
      )
      .order("make", { ascending: true })
      .order("model", { ascending: true });

    if (carsError) {
      setMessage(carsError.message);
      setLoading(false);
      return;
    }

    setCars((carsData ?? []) as CarRow[]);

    if (currentUser) {
      const { data: statusData, error: statusError } = await supabase
        .from("user_cars")
        .select(
          "user_id, car_id, owned, photographed, favorite, acquired_at, photographed_at"
        )
        .eq("user_id", currentUser.id);

      if (statusError) {
        setMessage(statusError.message);
        setLoading(false);
        return;
      }

      const map: StatusMap = {};
      for (const row of (statusData ?? []) as UserCarRow[]) {
        map[row.car_id] = row;
      }
      setStatuses(map);
    }

    setLoading(false);
  }

  const getStatus = useCallback((carId: string): UserCarRow => {
    return (
      statuses[carId] ?? {
        user_id: user?.id ?? "",
        car_id: carId,
        owned: false,
        photographed: false,
        favorite: false,
        acquired_at: null,
        photographed_at: null,
      }
    );
  }, [statuses, user?.id]);

  const toggleStatus = useCallback(async (carId: string, field: ToggleField) => {
    if (!user) {
      window.location.href = "/auth";
      return;
    }

    setSavingCarId(carId);
    setMessage("");

    const current = getStatus(carId);

    const next: UserCarRow = {
      ...current,
      user_id: user.id,
      car_id: carId,
      [field]: !current[field],
    };

    if (field === "owned") {
      next.acquired_at = next.owned
        ? current.acquired_at ?? new Date().toISOString()
        : null;
    }

    if (field === "photographed") {
      next.photographed_at = next.photographed
        ? current.photographed_at ?? new Date().toISOString()
        : null;
    }

    const { data, error } = await supabase
      .from("user_cars")
      .upsert(
        {
          user_id: user.id,
          car_id: carId,
          owned: next.owned,
          photographed: next.photographed,
          favorite: next.favorite,
          acquired_at: next.acquired_at,
          photographed_at: next.photographed_at,
        },
        { onConflict: "user_id,car_id" }
      )
      .select(
        "user_id, car_id, owned, photographed, favorite, acquired_at, photographed_at"
      )
      .single();

    if (error) {
      setMessage(error.message);
      setSavingCarId(null);
      return;
    }

    setStatuses((prev) => ({
      ...prev,
      [carId]: data as UserCarRow,
    }));

    setSavingCarId(null);
  }, [user, getStatus]);

  return {
    user,
    cars,
    statuses,
    loading,
    savingCarId,
    message,
    getStatus,
    toggleStatus,
  };
}
```

- [ ] **Step 4 : useCatalogueFilters.ts — useMemo sur visibleCars**

Dans `src/features/catalogue/hooks/useCatalogueFilters.ts`, remplacer la ligne :

```typescript
  const visibleCars = filteredCars.slice(0, visibleCount);
```

par :

```typescript
  const visibleCars = useMemo(
    () => filteredCars.slice(0, visibleCount),
    [filteredCars, visibleCount]
  );
```

Le `useMemo` est déjà importé en haut du fichier — vérifier qu'il n'y a pas de doublon dans l'import.

- [ ] **Step 5 : Vérifier le build**

```bash
npm run build
```

Expected : build success, 0 erreurs TypeScript.

- [ ] **Step 6 : Commit**

```bash
git add src/features/social/hooks/useFeed.ts src/features/social/hooks/useSavedPosts.ts src/features/catalogue/hooks/useCatalogueData.ts src/features/catalogue/hooks/useCatalogueFilters.ts
git commit -m "perf(react): useCallback stable sur useFeed/useSavedPosts/useCatalogueData + useMemo visibleCars"
```

---

### Task 7 — React.memo sur PostCard + CatalogueCard

**Dépend de Task 6** (les callbacks doivent être stables pour que memo soit efficace).

**Files:**
- Modify: `src/features/social/components/PostCard.tsx`
- Modify: `src/features/catalogue/components/CatalogueCard.tsx`

- [ ] **Step 1 : PostCard.tsx — wrapper avec memo**

Dans `src/features/social/components/PostCard.tsx`, ajouter l'import `memo` :

```typescript
import { memo, useState } from "react";
```

Envelopper l'export à la fin du fichier. Actuellement :

```typescript
export function PostCard({ ... }: PostCardProps) {
  // ...
}
```

Changer en export nommé mémoïsé. La façon la plus simple sans toucher au reste du code : transformer en expression de fonction et wraper avec `memo`.

Remplacer :

```typescript
export function PostCard({ post, currentUserId, isSaved = false, isAdmin = false, isChallengeEntry = false, priority = false, onLike, onDelete, onAdminHide, onSave, onCommentAdded }: PostCardProps) {
```

par :

```typescript
export const PostCard = memo(function PostCard({ post, currentUserId, isSaved = false, isAdmin = false, isChallengeEntry = false, priority = false, onLike, onDelete, onAdminHide, onSave, onCommentAdded }: PostCardProps) {
```

Et ajouter la parenthèse fermante de `memo(` juste après la dernière accolade `}` du composant (avant la ligne des sous-composants `function TabButton`, `function LoadingState`, etc. — mais PostCard.tsx ne contient que `PostCard`. La dernière ligne du composant est `}` à la ligne 226 environ). Remplacer ce `}` final par `});`.

Vérifier que le fichier se termine par :

```typescript
    {showReport && (
      <ReportModal targetType="post" targetId={post.id} onClose={() => setShowReport(false)} />
    )}
  </article>
);
});
```

- [ ] **Step 2 : CatalogueCard.tsx — wraper avec memo**

Dans `src/features/catalogue/components/CatalogueCard.tsx`, ajouter l'import `memo` :

```typescript
import { memo } from "react";
import { Camera, Check, Star, X } from "lucide-react";
```

Remplacer :

```typescript
export function CatalogueCard({ car, status, saving, toggleStatus, priority = false }: CatalogueCardProps) {
```

par :

```typescript
export const CatalogueCard = memo(function CatalogueCard({ car, status, saving, toggleStatus, priority = false }: CatalogueCardProps) {
```

Et fermer `memo(` à la fin du composant en remplaçant le `}` final par `});`.

- [ ] **Step 3 : Vérifier le build**

```bash
npm run build
```

Expected : build success, 0 erreurs TypeScript.

- [ ] **Step 4 : Commit**

```bash
git add src/features/social/components/PostCard.tsx src/features/catalogue/components/CatalogueCard.tsx
git commit -m "perf(react): memo on PostCard + CatalogueCard — prevent cascade re-renders"
```

---

### Task 8 — Prefetch JS des pages au hover

**Files:**
- Create: `src/lib/prefetchRoute.ts`
- Modify: `src/components/Navbar.tsx`
- Modify: `src/components/BottomTabBar.tsx`

- [ ] **Step 1 : Créer src/lib/prefetchRoute.ts**

```typescript
export function prefetchRoute(importer: () => Promise<unknown>): void {
  importer().catch(() => {});
}
```

- [ ] **Step 2 : Mettre à jour Navbar.tsx — ajouter prefetch au hover sur les liens**

Dans `src/components/Navbar.tsx`, ajouter l'import en haut du fichier (après les autres imports) :

```typescript
import { prefetchRoute } from "../lib/prefetchRoute";
```

Modifier le type `NavItem` pour accepter une fonction optionnelle `prefetch` :

```typescript
type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  prefetch?: () => void;
};
```

Modifier les tableaux de liens pour ajouter les prefetch :

```typescript
const trackingLinks: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, prefetch: () => prefetchRoute(() => import("../pages/DashboardPage")) },
  { to: "/catalogue", label: "Catalogue", icon: BookOpen, prefetch: () => prefetchRoute(() => import("../pages/CataloguePage")) },
  { to: "/leaderboard", label: "Classement", icon: Trophy, prefetch: () => prefetchRoute(() => import("../pages/LeaderboardPage")) },
];

const communityLinks: NavItem[] = [
  { to: "/feed", label: "Feed", icon: Rss, prefetch: () => prefetchRoute(() => import("../pages/FeedPage")) },
  { to: "/events", label: "Événements", icon: CalendarDays, prefetch: () => prefetchRoute(() => import("../pages/EventsPage")) },
];
```

Dans la fonction `Dropdown`, modifier le rendu des items pour utiliser `prefetch` :

```typescript
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={closeMenus}
                  onMouseEnter={item.prefetch}
                  className={`relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    itemActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/70"
                  }`}
                >
```

Note : dans `Dropdown`, les items sont itérés en déstructurant `{ to, label, icon: Icon }`. Modifier la déstructuration en `item` pour accéder à `item.prefetch` :

```typescript
            {items.map((item) => {
              const { to, label, icon: Icon } = item;
              const itemActive = isActive(to);
              const showBadge = to === "/inbox" && unreadCount && unreadCount > 0;

              return (
                <Link
                  key={to}
                  to={to}
                  onClick={closeMenus}
                  onMouseEnter={item.prefetch}
                  className={...}
                >
```

- [ ] **Step 3 : Mettre à jour BottomTabBar.tsx — prefetch au hover sur les tabs**

Dans `src/components/BottomTabBar.tsx`, ajouter l'import :

```typescript
import { prefetchRoute } from "../lib/prefetchRoute";
```

Modifier le type des tabs en ajoutant `prefetchFn?: () => void` et mettre à jour le tableau :

```typescript
  const tabs = [
    { to: "/feed", label: "Feed", Icon: Rss, badge: 0, prefetchFn: () => prefetchRoute(() => import("../pages/FeedPage")) },
    { to: "/events", label: "Events", Icon: CalendarDays, badge: 0, prefetchFn: () => prefetchRoute(() => import("../pages/EventsPage")) },
    { to: "/search", label: "Recherche", Icon: Search, badge: 0, prefetchFn: () => prefetchRoute(() => import("../pages/SearchPage")) },
    { to: "/inbox", label: "Inbox", Icon: Bell, badge: unreadCount, prefetchFn: () => prefetchRoute(() => import("../pages/InboxPage")) },
    { to: profileTo, label: "Profil", Icon: UserRound, badge: 0, prefetchFn: () => prefetchRoute(() => import("../pages/PublicProfilePage")) },
  ];
```

Dans le rendu de chaque tab, ajouter `onMouseEnter` :

```typescript
          return (
            <Link
              key={to}
              to={to}
              onMouseEnter={prefetchFn}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                active ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
```

Modifier la déstructuration du map pour inclure `prefetchFn` :

```typescript
        {tabs.map(({ to, label, Icon, badge, prefetchFn }) => {
```

- [ ] **Step 4 : Vérifier le build**

```bash
npm run build
```

Expected : build success, 0 erreurs TypeScript. Note : les appels `import("../pages/...")` dans les arrow functions sont valides — Vite/Rollup les reconnaît comme des dynamic imports et génère les chunks correspondants.

- [ ] **Step 5 : Commit**

```bash
git add src/lib/prefetchRoute.ts src/components/Navbar.tsx src/components/BottomTabBar.tsx
git commit -m "perf(nav): prefetch page chunks on link hover via dynamic import"
```

---

## Vérification finale

Après toutes les tâches, lancer un build final et vérifier :

```bash
npm run build
```

Checklist visuelle dans le navigateur (dev ou preview) :
- [ ] Les polices s'affichent sans flash (Barlow Condensed dans les titres, JetBrains Mono dans les compteurs)
- [ ] Le feed charge avec la première image en `fetchpriority="high"` (DevTools → Network → Images → vérifier `Priority: Highest` sur la 1re)
- [ ] Les images du catalogue sont bien en WebP dans le Network panel (filtre `Img`)
- [ ] Survol d'un lien de la Navbar → Network panel → un nouveau JS chunk se précharge
- [ ] `npm run build` → `dist/assets/vendor-react-*.js.gz` et `.br` présents

```bash
git add -A
git commit -m "perf: final build verification — v1.4.0 perf release"
```

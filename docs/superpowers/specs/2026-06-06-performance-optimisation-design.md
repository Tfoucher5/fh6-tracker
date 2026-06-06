# Design — Optimisation performance maximale (Approche B)

**Date :** 2026-06-06  
**Auteur :** Theo Foucher  
**Statut :** Approuvé

---

## Contexte

FH6 Tracker est une SPA React 19 + Vite + Tailwind v4 déployée sur Vercel, avec Supabase comme backend. L'objectif est de rendre tous les chargements aussi instantanés que possible : premier chargement, navigation entre pages, images du feed et du catalogue.

**Déjà en place (ne pas toucher) :**
- Code splitting `lazy()` + `Suspense` sur toutes les pages
- `loading="lazy"` + `decoding="async"` sur la majorité des images
- `transformImage()` WebP+resize via Supabase Render API
- Infinite scroll IntersectionObserver sur le feed
- Skeletons/pulse sur les états de chargement
- `preconnect` Google Fonts + chargement async avec `display=optional`
- `Cache-Control: immutable` sur `/assets/` dans `vercel.json`

---

## Section 1 — Bundle & Build

### Objectif
Réduire la taille du bundle initial et activer la compression réseau.

### Changements `vite.config.ts`
- `build.target: 'esnext'` — output ES moderne, pas de transpilation inutile
- `build.rollupOptions.output.manualChunks` :
  - `vendor-react` : `react`, `react-dom`, `react-router-dom`
  - `vendor-supabase` : `@supabase/supabase-js`
  - `vendor-icons` : `lucide-react`
- Installer `vite-plugin-compression` (gzip + brotli) — Vercel sert automatiquement le format compressé selon l'`Accept-Encoding`

### Changements `vercel.json`
- Ajouter source `/(index\.html)` avec header `Cache-Control: no-cache, must-revalidate` — garantit que les nouveaux déploiements sont immédiatement visibles sans vider le cache manuellement

---

## Section 2 — Polices auto-hébergées

### Objectif
Éliminer le round-trip vers Google Fonts (~100-200ms de latence sur la 1re visite).

### Implémentation
1. Télécharger les fichiers `.woff2` nécessaires depuis Google Fonts :
   - **Barlow** : 400, 400i, 500, 600, 700
   - **Barlow Condensed** : 400, 600, 700, 800, 900
   - **JetBrains Mono** : 400, 600
2. Déposer dans `public/fonts/`
3. Remplacer le `<link>` Google Fonts dans `index.html` par `<link rel="preload">` sur les fichiers `.woff2` critiques (Barlow 400 + Barlow Condensed 700)
4. Déclarer les `@font-face` dans `src/index.css` avec `font-display: optional`
5. Supprimer le bloc `<link rel="preconnect" href="https://fonts.googleapis.com">` devenu inutile

---

## Section 3 — Images

### Objectif
Appliquer `transformImage()` de façon exhaustive, indiquer les priorités de chargement au navigateur.

### Couverture `transformImage()`

| Composant | Taille cible | Actuellement |
|-----------|-------------|--------------|
| `UserAvatar` (img) | 80px | ❌ URL raw |
| `CarImage` (catalogue) | 480px | ❌ URL raw |
| `CarPhotoGallery` | 640px | ❌ URL raw |
| `CarDetailHeader` | 900px | ❌ URL raw |
| `PostCard` feed | 900px | ✅ déjà fait |
| `PostLightbox` | 1600px | ❌ URL raw |

### `fetchpriority="high"` (LCP)
- Dans `PostCard` et `CatalogueCard` : ajouter une prop `priority?: boolean`
- Quand `priority={true}` : `fetchpriority="high"` sur l'image + `loading="eager"`
- Passer `priority={index === 0}` depuis les listes (premier item = LCP probable)

### Attributs manquants sur `UserAvatar`
- Ajouter `loading="lazy"` et `decoding="async"` sur le `<img>` avatar

### `sizes` adaptatif sur `PostCard`
```html
sizes="(max-width: 768px) 100vw, 672px"
```

---

## Section 4 — React Performance

### Objectif
Éviter les re-renders en cascade sur les listes longues et précharger les chunks de navigation.

### `React.memo`
- `PostCard` : wrappé avec `memo` — évite les re-renders quand un autre post est liké/commenté dans la liste
- `CatalogueCard` : wrappé avec `memo` — évite les re-renders quand un autre car est togglé

### `useMemo` dans `useCatalogueFilters`
- `filteredCars` est **déjà mémoïsé** avec `useMemo` — aucun changement requis ✅
- Ajouter `useMemo` sur `visibleCars` (`filteredCars.slice(0, visibleCount)`) pour éviter le re-slice sur les renders non liés aux filtres

### `useCallback` sur les fonctions de `useCatalogueData`
- `getStatus` et `toggleStatus` sont des fonctions inline non mémoïsées → elles changent à chaque render → invalident le `useMemo(filteredCars)` inutilement
- Les wrpper avec `useCallback` : `getStatus` dépend de `[statuses]`, `toggleStatus` dépend de `[user, statuses]`

### `useCallback` sur les actions de `useFeed`
- `toggleLike`, `deletePost`, `removePostFromFeed`, `addPost`, `incrementCommentCount` sont des fonctions inline non mémoïsées dans `useFeed`
- **`memo` sur `PostCard` n'aura d'effet que si ces callbacks sont stables** — les wrapper avec `useCallback`
- `loadMore` également

### Prefetch de chunks au hover
- Créer `src/hooks/usePrefetchRoute.ts` — un hook qui, sur `onMouseEnter`, appelle `import('./pages/XxxPage')` pour précharger le chunk JS avant le clic
- L'intégrer dans `Navbar` et `BottomTabBar` sur chaque lien de navigation

---

## Section 5 — Réseau & Headers

### Objectif
Réduire la latence de la première connexion Supabase et activer le DNS prefetch navigateur.

### `index.html` — Preconnect Supabase
Ajouter après le bloc Google Fonts (qui sera supprimé) :
```html
<link rel="preconnect" href="https://pnazdsjgcwwkuysxrbcd.supabase.co" />
<link rel="dns-prefetch" href="https://pnazdsjgcwwkuysxrbcd.supabase.co" />
```
L'URL Supabase est statique (project ref `pnazdsjgcwwkuysxrbcd`, ne change pas entre environments).

### `vercel.json` — X-DNS-Prefetch-Control
Ajouter dans le header global `/(.*)`  :
```json
{ "key": "X-DNS-Prefetch-Control", "value": "on" }
```

---

## Résumé des fichiers modifiés

| Fichier | Type de changement |
|---------|-------------------|
| `vite.config.ts` | manualChunks, target esnext, compression plugin |
| `vercel.json` | Cache-Control index.html, X-DNS-Prefetch-Control |
| `index.html` | Supprimer Google Fonts, preconnect Supabase, preload woff2 |
| `src/index.css` | @font-face auto-hébergés |
| `public/fonts/` | Fichiers .woff2 (nouveaux) |
| `src/lib/imageTransform.ts` | Inchangé |
| `src/features/social/components/UserAvatar.tsx` | lazy + decoding + transformImage |
| `src/features/catalogue/components/CarImage.tsx` | transformImage(480) |
| `src/features/cars/components/CarPhotoGallery.tsx` | transformImage(640) |
| `src/features/social/components/PostLightbox.tsx` | transformImage(1600) |
| `src/features/social/components/PostCard.tsx` | memo + priority prop + sizes |
| `src/features/catalogue/components/CatalogueCard.tsx` | memo + priority prop |
| `src/features/catalogue/hooks/useCatalogueFilters.ts` | useMemo sur visibleCars (filteredCars déjà mémoïsé) |
| `src/features/catalogue/hooks/useCatalogueData.ts` | useCallback sur getStatus + toggleStatus |
| `src/features/social/hooks/useFeed.ts` | useCallback sur toggleLike, deletePost, removePostFromFeed, addPost, incrementCommentCount, loadMore |
| `src/hooks/usePrefetchRoute.ts` | nouveau hook |
| `src/components/Navbar.tsx` | usePrefetchRoute sur les liens |
| `src/components/BottomTabBar.tsx` | usePrefetchRoute sur les liens |
| `src/pages/FeedPage.tsx` | priority={index===0} sur PostCard |
| `src/pages/CataloguePage.tsx` | priority={index===0} sur CatalogueCard |

---

## Hors scope

- Service Worker / PWA (choix explicite de l'utilisateur)
- Virtualisation de liste (catalogue déjà paginé côté client à 60 items)
- Fetch conditionnel Supabase selon vue active (Approche C, non retenue)

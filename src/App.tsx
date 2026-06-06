import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { NotificationToast } from "./features/notifications/components/NotificationToast";
import { StatusGate } from "./components/StatusGate";
import { CommunityGuard } from "./components/CommunityGuard";
import { AuthGuard } from "./components/AuthGuard";

const AuthPage = lazy(() => import("./pages/AuthPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const CataloguePage = lazy(() => import("./pages/CataloguePage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const CarDetailPage = lazy(() => import("./pages/CarDetailPage"));
const FeedPage = lazy(() => import("./pages/FeedPage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const EventDetailPage = lazy(() => import("./pages/EventDetailPage"));
const PublicProfilePage = lazy(() => import("./pages/PublicProfilePage"));
const InboxPage = lazy(() => import("./pages/InboxPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const SavedPage = lazy(() => import("./pages/SavedPage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const BannedPage = lazy(() => import("./pages/BannedPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const ChallengePage = lazy(() => import("./pages/ChallengePage"));
const SetupProfilePage = lazy(() => import("./pages/SetupProfilePage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-slate-700 border-t-red-500 rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <StatusGate>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Racine → feed */}
            <Route path="/" element={<Navigate to="/feed" replace />} />

            {/* Routes publiques */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/setup-profile" element={<SetupProfilePage />} />
            <Route path="/banned" element={<BannedPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/catalogue" element={<CataloguePage />} />
            <Route path="/cars/:id" element={<CarDetailPage />} />
            <Route path="/u/:username" element={<PublicProfilePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/admin" element={<AdminPage />} />

            {/* Routes publiques communautaires — lisibles sans compte */}
            <Route element={<CommunityGuard />}>
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/challenge/:id" element={<ChallengePage />} />
              <Route path="/search" element={<SearchPage />} />
            </Route>

            {/* Routes privées — redirigent vers /auth si non connecté */}
            <Route element={<AuthGuard />}>
              <Route path="/inbox" element={<InboxPage />} />
              <Route path="/saved" element={<SavedPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        <NotificationToast />
      </StatusGate>
    </BrowserRouter>
  );
}

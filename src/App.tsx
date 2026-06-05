import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import CataloguePage from "./pages/CataloguePage";
import DashboardPage from "./pages/DashboardPage";
import CarDetailPage from "./pages/CarDetailPage";
import FeedPage from "./pages/FeedPage";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import PublicProfilePage from "./pages/PublicProfilePage";
import InboxPage from "./pages/InboxPage";
import SearchPage from "./pages/SearchPage";
import SavedPage from "./pages/SavedPage";
import WishlistPage from "./pages/WishlistPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import BannedPage from "./pages/BannedPage";
import AdminPage from "./pages/AdminPage";
import { NotificationToast } from "./features/notifications/components/NotificationToast";
import { StatusGate } from "./components/StatusGate";
import { CommunityGuard } from "./components/CommunityGuard";

export default function App() {
  return (
    <BrowserRouter>
      <StatusGate>
        <Routes>
          {/* Routes publiques / catalogue */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/banned" element={<BannedPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/catalogue" element={<CataloguePage />} />
          <Route path="/cars/:id" element={<CarDetailPage />} />
          <Route path="/u/:username" element={<PublicProfilePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/admin" element={<AdminPage />} />

          {/* Routes communautaires — bloquées si compte suspendu */}
          <Route element={<CommunityGuard />}>
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/inbox" element={<InboxPage />} />
            <Route path="/search" element={<SearchPage />} />
          </Route>
        </Routes>
        <NotificationToast />
      </StatusGate>
    </BrowserRouter>
  );
}

import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import CataloguePage from "./pages/CataloguePage";
import DashboardPage from "./pages/DashboardPage";
import CarDetailPage from "./pages/CarDetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/catalogue" element={<CataloguePage />} />
        <Route path="/cars/:id" element={<CarDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

import { Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import { AuthProvider } from "@/context/AuthContext";
import NotFound from "@/pages/NotFound";
import UserManagement from "@/pages/UserManagement";
import Announcements from "@/pages/Announcements";
import CreateAnnouncement from "@/pages/CreateAnnouncement";
import AnnouncementDetail from "@/pages/AnnouncementDetail";
import Support from "@/pages/Support";
import UserProfile from "@/pages/UserProfile";
import WordPressManagement from "@/pages/WordPressManagement";
import TomeManagement from "@/pages/TomeManagement";
import { Navigate } from "react-router-dom";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/announcements/create" element={<CreateAnnouncement />} />
        <Route path="/announcements/:id" element={<AnnouncementDetail />} />
        <Route path="/support" element={<Support />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/wordpress" element={<WordPressManagement />} />
        <Route path="/tome" element={<TomeManagement />} />
        {/* Ajout d'une redirection de /create vers /announcements/create */}
        <Route path="/create" element={<Navigate to="/announcements/create" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </AuthProvider>
  );
}

export default App;

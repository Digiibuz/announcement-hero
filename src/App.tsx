
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import NotFound from "@/pages/NotFound";
import UserManagement from "@/pages/UserManagement";
import Announcements from "@/pages/Announcements";
import CreateAnnouncement from "@/pages/CreateAnnouncement";
import AnnouncementDetail from "@/pages/AnnouncementDetail";
import Support from "@/pages/Support";
import UserProfile from "@/pages/UserProfile";
import WordPressManagement from "@/pages/WordPressManagement";
import TomeManagement from "@/pages/TomeManagement";

// Composant pour protéger les routes qui nécessitent une authentification
const PrivateRoute = ({ element }: { element: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  // Pendant le chargement, ne rien afficher pour éviter un flash de redirection
  if (isLoading) {
    return null;
  }
  
  // Si l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
  // en conservant l'URL d'origine pour pouvoir y revenir après connexion
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Si l'utilisateur est authentifié, afficher le composant demandé
  return <>{element}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/login" element={<Login />} />
      
      {/* Routes protégées - nécessitent une authentification */}
      <Route path="/" element={<PrivateRoute element={<Dashboard />} />} />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route path="/users" element={<PrivateRoute element={<UserManagement />} />} />
      <Route path="/announcements" element={<PrivateRoute element={<Announcements />} />} />
      <Route path="/announcements/create" element={<PrivateRoute element={<CreateAnnouncement />} />} />
      <Route path="/announcements/:id" element={<PrivateRoute element={<AnnouncementDetail />} />} />
      <Route path="/support" element={<PrivateRoute element={<Support />} />} />
      <Route path="/profile" element={<PrivateRoute element={<UserProfile />} />} />
      <Route path="/wordpress" element={<PrivateRoute element={<WordPressManagement />} />} />
      <Route path="/tome/*" element={<PrivateRoute element={<TomeManagement />} />} />
      <Route path="/create" element={<Navigate to="/announcements/create" replace />} />
      
      {/* Route par défaut - page non trouvée */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster />
    </AuthProvider>
  );
}

export default App;

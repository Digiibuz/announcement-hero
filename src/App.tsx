
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Announcements from "@/pages/Announcements";
import AnnouncementDetail from "@/pages/AnnouncementDetail";
import CreateAnnouncement from "@/pages/CreateAnnouncement";
import NotFound from "@/pages/NotFound";
import UserManagement from "@/pages/UserManagement";
import WordPressManagement from "@/pages/WordPressManagement";
import DivipixelPublications from "@/pages/DivipixelPublications";
import CreateDivipixelPublication from "@/pages/CreateDivipixelPublication";

const queryClient = new QueryClient();

function App() {
  return (
    <div className="min-h-screen bg-background">
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="dark" storageKey="divipixel-ui-theme">
            <Toaster />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/announcements" element={<Announcements />} />
                <Route path="/announcements/create" element={<CreateAnnouncement />} />
                <Route path="/announcements/:id" element={<AnnouncementDetail />} />
                <Route path="/divipixel-publications" element={<DivipixelPublications />} />
                <Route path="/divipixel-publications/create" element={<CreateDivipixelPublication />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/wordpress" element={<WordPressManagement />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ThemeProvider>
        </QueryClientProvider>
      </AuthProvider>
    </div>
  );
}

export default App;

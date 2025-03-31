
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to appropriate page on load
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Return minimal loading component while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <img 
        src="/lovable-uploads/2c24c6a4-9faf-497a-9be8-27907f99af47.png" 
        alt="Digiibuz" 
        className="h-16 w-auto animate-pulse" 
      />
    </div>
  );
};

export default Index;

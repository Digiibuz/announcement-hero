
import { Routes, Route, useRoutes } from "react-router-dom";
import { Suspense } from 'react';
import { LoadingFallback } from "@/components/ui/loading-fallback";
import { publicRoutes } from "./routeDefinitions/publicRoutes";
import { protectedRoutes } from "./routeDefinitions/protectedRoutes";
import { adminRoutes } from "./routeDefinitions/adminRoutes";

/**
 * Main application routes component
 * Uses route definitions from separate files for better organization
 */
export const AppRoutes = () => {
  // Combine all routes
  const allRoutes = [...publicRoutes, ...protectedRoutes, ...adminRoutes];
  
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {allRoutes.map((routeProps, index) => (
          <Route 
            key={`route-${index}`}
            path={routeProps.path}
            element={routeProps.element}
          />
        ))}
      </Routes>
    </Suspense>
  );
};


import React from "react";

export const BrandLogo: React.FC = () => {
  return (
    <div className="flex justify-center pt-6">
      <div className="flex flex-col items-center">
        <img 
          src="/lovable-uploads/2c24c6a4-9faf-497a-9be8-27907f99af47.png" 
          alt="DigiiBuz" 
          className="h-16 w-auto mb-2"
          onError={(e) => {
            console.error("Erreur de chargement de l'image:", e);
            e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzM2E0NSIgLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSI+RGlnaWlCdXo8L3RleHQ+PC9zdmc+";
          }}
        />
        <span className="text-xl font-bold text-digibuz-navy dark:text-digibuz-yellow">
          DigiiBuz
        </span>
      </div>
    </div>
  );
};

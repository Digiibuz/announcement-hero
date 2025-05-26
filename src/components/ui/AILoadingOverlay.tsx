
import React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Loader2 } from 'lucide-react';

interface AILoadingOverlayProps {
  isVisible: boolean;
  className?: string;
}

const AILoadingOverlay = ({ isVisible, className }: AILoadingOverlayProps) => {
  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-black/20 backdrop-blur-sm",
        "animate-fade-in",
        className
      )}
    >
      {/* Animated background stars */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large floating stars */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`large-${i}`}
            className="absolute w-2 h-2 bg-purple-400 rounded-full ai-loading-star"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
        
        {/* Medium stars */}
        {[...Array(12)].map((_, i) => (
          <div
            key={`medium-${i}`}
            className="absolute w-1.5 h-1.5 bg-purple-300 rounded-full ai-loading-star-medium"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.15}s`,
              animationDuration: `${1.5 + Math.random() * 1.5}s`,
            }}
          />
        ))}
        
        {/* Small twinkling stars */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`small-${i}`}
            className="absolute w-1 h-1 bg-purple-200 rounded-full ai-loading-star-small"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.1}s`,
              animationDuration: `${1 + Math.random() * 1}s`,
            }}
          />
        ))}
      </div>

      {/* Central loading indicator */}
      <div className="relative z-10 flex flex-col items-center justify-center p-8 rounded-2xl bg-white/90 backdrop-blur-md shadow-2xl border border-purple-200/50 ai-loading-pulse">
        <div className="relative mb-4">
          <Sparkles className="w-12 h-12 text-purple-600 ai-sparkle-rotate" />
          <Loader2 className="absolute inset-0 w-12 h-12 text-purple-400 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        
        <div className="text-center">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">IA en cours de génération</h3>
          <p className="text-sm text-purple-700/80">Création de contenu optimisé...</p>
        </div>
        
        {/* Progress dots */}
        <div className="flex space-x-1 mt-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-purple-500 rounded-full ai-loading-dot"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AILoadingOverlay;

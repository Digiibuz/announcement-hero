
import React from 'react';
import { cn } from '@/lib/utils';

interface SparklingStarsProps {
  className?: string;
  isVisible?: boolean;
}

const SparklingStars = ({ className, isVisible = false }: SparklingStarsProps) => {
  return (
    <div 
      className={cn(
        "absolute inset-0 pointer-events-none transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {/* Star 1 - Grande étoile qui se déplace */}
      <div 
        className="absolute w-1.5 h-1.5 bg-purple-300 rounded-full sparkle-star"
        style={{
          top: '20%',
          left: '15%',
          animationDelay: '0s',
        }}
      />
      
      {/* Star 2 - Petite étoile qui tourbillonne */}
      <div 
        className="absolute w-0.5 h-0.5 bg-purple-400 rounded-full twinkle-star"
        style={{
          top: '70%',
          left: '80%',
          animationDelay: '0.3s',
        }}
      />
      
      {/* Star 3 - Étoile moyenne qui pulse */}
      <div 
        className="absolute w-1 h-1 bg-purple-500 rounded-full sparkle-star"
        style={{
          top: '40%',
          left: '75%',
          animationDelay: '0.6s',
        }}
      />
      
      {/* Star 4 - Petite étoile rapide */}
      <div 
        className="absolute w-0.5 h-0.5 bg-purple-300 rounded-full twinkle-star"
        style={{
          top: '60%',
          left: '25%',
          animationDelay: '0.9s',
        }}
      />
      
      {/* Star 5 - Étoile qui se déplace horizontalement */}
      <div 
        className="absolute w-1 h-1 bg-purple-400 rounded-full sparkle-star"
        style={{
          top: '15%',
          left: '60%',
          animationDelay: '1.2s',
        }}
      />
      
      {/* Star 6 - Petite étoile qui pulse */}
      <div 
        className="absolute w-0.5 h-0.5 bg-purple-500 rounded-full twinkle-star"
        style={{
          top: '80%',
          left: '50%',
          animationDelay: '1.5s',
        }}
      />
      
      {/* Star 7 - Nouvelle étoile grande qui bouge */}
      <div 
        className="absolute w-1.5 h-1.5 bg-purple-200 rounded-full sparkle-star"
        style={{
          top: '30%',
          left: '10%',
          animationDelay: '0.2s',
        }}
      />
      
      {/* Star 8 - Étoile centrale qui pulse */}
      <div 
        className="absolute w-1 h-1 bg-purple-600 rounded-full twinkle-star"
        style={{
          top: '50%',
          left: '50%',
          animationDelay: '0.8s',
        }}
      />
    </div>
  );
};

export default SparklingStars;

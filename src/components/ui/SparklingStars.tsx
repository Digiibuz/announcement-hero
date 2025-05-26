
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
      {/* Star 1 */}
      <div 
        className="absolute w-1 h-1 bg-purple-400 rounded-full animate-pulse"
        style={{
          top: '20%',
          left: '15%',
          animationDelay: '0s',
          animationDuration: '1.5s'
        }}
      />
      
      {/* Star 2 */}
      <div 
        className="absolute w-0.5 h-0.5 bg-purple-300 rounded-full animate-pulse"
        style={{
          top: '70%',
          left: '80%',
          animationDelay: '0.3s',
          animationDuration: '1.2s'
        }}
      />
      
      {/* Star 3 */}
      <div 
        className="absolute w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"
        style={{
          top: '40%',
          left: '75%',
          animationDelay: '0.6s',
          animationDuration: '1.8s'
        }}
      />
      
      {/* Star 4 */}
      <div 
        className="absolute w-0.5 h-0.5 bg-purple-400 rounded-full animate-pulse"
        style={{
          top: '60%',
          left: '25%',
          animationDelay: '0.9s',
          animationDuration: '1.4s'
        }}
      />
      
      {/* Star 5 */}
      <div 
        className="absolute w-1 h-1 bg-purple-300 rounded-full animate-pulse"
        style={{
          top: '15%',
          left: '60%',
          animationDelay: '1.2s',
          animationDuration: '1.6s'
        }}
      />
      
      {/* Star 6 */}
      <div 
        className="absolute w-0.5 h-0.5 bg-purple-500 rounded-full animate-pulse"
        style={{
          top: '80%',
          left: '50%',
          animationDelay: '1.5s',
          animationDuration: '1.3s'
        }}
      />
    </div>
  );
};

export default SparklingStars;

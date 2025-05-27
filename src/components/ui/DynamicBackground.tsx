
import React from "react";
import { cn } from "@/lib/utils";

interface DynamicBackgroundProps {
  className?: string;
  children: React.ReactNode;
}

const DynamicBackground = ({ className, children }: DynamicBackgroundProps) => {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-green-50" />
      
      {/* Animated Geometric Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large Circle */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full animate-pulse-subtle transform rotate-12" />
        
        {/* Medium Triangle */}
        <div className="absolute top-20 -left-20 w-60 h-60 bg-gradient-to-br from-green-200/25 to-blue-200/25 transform rotate-45 animate-float" 
             style={{
               clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
               animation: 'float 6s ease-in-out infinite'
             }} />
        
        {/* Small Squares */}
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-lg transform rotate-12 animate-float-delayed" />
        
        <div className="absolute top-1/3 left-1/4 w-24 h-24 bg-gradient-to-br from-yellow-200/25 to-orange-200/25 rounded-full animate-pulse-subtle" />
        
        {/* Hexagon */}
        <div className="absolute bottom-1/3 left-10 w-40 h-40 bg-gradient-to-br from-indigo-200/20 to-blue-200/20 transform rotate-30 animate-float-slow"
             style={{
               clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)'
             }} />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default DynamicBackground;

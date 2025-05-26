
import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePublicationLimits } from "@/hooks/usePublicationLimits";
import SparklingStars from "@/components/ui/SparklingStars";

interface PublicationCounterProps {
  className?: string;
}

interface StarTrail {
  id: number;
  x: number;
  y: number;
  opacity: number;
  scale: number;
}

const PublicationCounter = ({ className }: PublicationCounterProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const [starTrails, setStarTrails] = useState<StarTrail[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const starIdRef = useRef(0);
  const { 
    stats, 
    isLoading, 
    getProgressPercentage, 
    getStatusColor, 
    getBadgeText 
  } = usePublicationLimits();

  const percentage = getProgressPercentage();
  const statusColor = getStatusColor();
  const badgeText = getBadgeText();

  const getCardBorderClass = () => {
    if (percentage >= 90) return "border-red-200 shadow-red-100/50";
    if (percentage >= 70) return "border-orange-200 shadow-orange-100/50";
    return "border-green-200 shadow-green-100/50";
  };

  const shouldShowSparkles = percentage >= 80 || badgeText === "Expert";

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !isHovering) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newStar: StarTrail = {
      id: starIdRef.current++,
      x,
      y,
      opacity: 1,
      scale: Math.random() * 0.5 + 0.5,
    };

    setStarTrails(prev => [...prev.slice(-8), newStar]);

    // Fade out stars gradually
    setTimeout(() => {
      setStarTrails(prev => 
        prev.map(star => 
          star.id === newStar.id 
            ? { ...star, opacity: 0.7, scale: star.scale * 0.8 }
            : star
        )
      );
    }, 50);

    setTimeout(() => {
      setStarTrails(prev => 
        prev.map(star => 
          star.id === newStar.id 
            ? { ...star, opacity: 0.4, scale: star.scale * 0.6 }
            : star
        )
      );
    }, 150);

    setTimeout(() => {
      setStarTrails(prev => prev.filter(star => star.id !== newStar.id));
    }, 300);
  }, [isHovering]);

  if (isLoading) {
    return (
      <Card className={cn("relative overflow-hidden", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Publications ce mois-ci
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      ref={cardRef}
      className={cn(
        "relative overflow-hidden transition-all duration-300", 
        getCardBorderClass(),
        className
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setStarTrails([]);
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Star Trail Effect */}
      {starTrails.map((star) => (
        <div
          key={star.id}
          className="absolute pointer-events-none z-10"
          style={{
            left: star.x - 4,
            top: star.y - 4,
            opacity: star.opacity,
            transform: `scale(${star.scale})`,
            transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
          }}
        >
          <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse" />
        </div>
      ))}

      {/* Sparkles effect for high achievers */}
      {shouldShowSparkles && (
        <div className="absolute inset-0 pointer-events-none">
          <SparklingStars isVisible={isHovering} />
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Publications ce mois-ci
          </CardTitle>
          {badgeText && (
            <Badge 
              variant="outline" 
              className={cn(
                "font-semibold flex items-center gap-1",
                statusColor === "green" && "border-green-500 text-green-700 bg-green-50",
                statusColor === "orange" && "border-orange-500 text-orange-700 bg-orange-50",
                statusColor === "red" && "border-red-500 text-red-700 bg-red-50"
              )}
            >
              <Award className="h-3 w-3" />
              {badgeText}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main counter */}
        <div className="flex items-baseline gap-1">
          <span 
            className={cn(
              "text-3xl font-bold transition-colors duration-300",
              statusColor === "green" && "text-green-600",
              statusColor === "orange" && "text-orange-600", 
              statusColor === "red" && "text-red-600"
            )}
          >
            {stats.publishedCount}
          </span>
          <span className="text-xl text-muted-foreground">/{stats.maxLimit}</span>
        </div>

        {/* Animated Progress bar */}
        <div className="space-y-2">
          <div className="relative w-full bg-gray-100 rounded-full h-4 overflow-hidden shadow-inner">
            {/* Animated background pattern */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                background: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.3) 10px, rgba(255,255,255,0.3) 20px)',
                animation: 'slide-bg 2s linear infinite'
              }}
            />
            
            {/* Main progress bar with enhanced animation */}
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden",
                statusColor === "green" && "bg-gradient-to-r from-green-400 via-green-500 to-emerald-600",
                statusColor === "orange" && "bg-gradient-to-r from-orange-400 via-orange-500 to-amber-600",
                statusColor === "red" && "bg-gradient-to-r from-red-400 via-red-500 to-rose-600",
                isHovering && "animate-pulse"
              )}
              style={{ 
                width: `${percentage}%`,
                boxShadow: `0 0 10px ${
                  statusColor === "green" ? "rgba(34, 197, 94, 0.4)" :
                  statusColor === "orange" ? "rgba(249, 115, 22, 0.4)" :
                  "rgba(239, 68, 68, 0.4)"
                }`
              }}
            >
              {/* Shimmer effect */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{
                  animation: 'shimmer 2s ease-in-out infinite',
                  transform: 'translateX(-100%)'
                }}
              />
              
              {/* Pulse dots on high progress */}
              {percentage >= 70 && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-white/80 rounded-full animate-ping" />
                </div>
              )}
            </div>

            {/* Glowing border effect on hover */}
            {isHovering && (
              <div 
                className={cn(
                  "absolute inset-0 rounded-full border-2 opacity-70",
                  statusColor === "green" && "border-green-400",
                  statusColor === "orange" && "border-orange-400",
                  statusColor === "red" && "border-red-400"
                )}
                style={{
                  animation: 'glow-pulse 1.5s ease-in-out infinite'
                }}
              />
            )}
          </div>
        </div>

        {/* Status text */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {stats.remaining > 0 
              ? `${stats.remaining} publication${stats.remaining > 1 ? 's' : ''} restante${stats.remaining > 1 ? 's' : ''}`
              : "Limite atteinte ce mois-ci"
            }
          </span>
          {percentage >= 90 && stats.remaining > 0 && (
            <div className="flex items-center gap-1 text-orange-600 animate-pulse">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">Presque fini !</span>
            </div>
          )}
        </div>

        {/* Achievement message */}
        {percentage === 100 && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-purple-700 font-medium">
              <Award className="h-4 w-4" />
              Objectif mensuel atteint ! 🎉
            </div>
            <p className="text-xs text-purple-600 mt-1">
              Nouveau quota disponible le mois prochain
            </p>
          </div>
        )}
      </CardContent>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes slide-bg {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes glow-pulse {
          0%, 100% { 
            box-shadow: 0 0 5px currentColor;
            opacity: 0.7;
          }
          50% { 
            box-shadow: 0 0 15px currentColor;
            opacity: 1;
          }
        }
      `}</style>
    </Card>
  );
};

export default PublicationCounter;

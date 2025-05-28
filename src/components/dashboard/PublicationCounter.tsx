
import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Award, Trophy } from "lucide-react";
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

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  delay: number;
}

const PublicationCounter = ({ className }: PublicationCounterProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const [starTrails, setStarTrails] = useState<StarTrail[]>([]);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
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
  const isOverAchieving = percentage > 100;
  const overAchievementPercentage = Math.round(percentage - 100);
  
  // Logique des couleurs avec design spécial pour dépassement
  const getInvertedStatusColor = () => {
    if (isOverAchieving) return "premium"; // Nouveau statut premium
    if (percentage >= 80) return "green";
    if (percentage >= 40) return "orange";
    return "red";
  };

  const getInvertedBadgeText = () => {
    if (isOverAchieving) return `🏆 Champion +${overAchievementPercentage}%`;
    if (percentage >= 100) return "🎯 Objectif atteint";
    if (percentage >= 80) return "⭐ Excellent";
    if (percentage >= 40) return "📈 En progression";
    return "🚀 À améliorer";
  };

  const statusColor = getInvertedStatusColor();
  const badgeText = getInvertedBadgeText();

  const getCardBorderClass = () => {
    if (isOverAchieving) return "border-amber-300 shadow-amber-200/60 shadow-xl";
    if (percentage >= 80) return "border-green-200 shadow-green-100/50";
    if (percentage >= 40) return "border-orange-200 shadow-orange-100/50";
    return "border-red-200 shadow-red-100/50";
  };

  const shouldShowSparkles = percentage >= 80 || badgeText.includes("Excellent");
  const shouldShowConfetti = isOverAchieving;

  // Génération des confettis pour les surperformances
  const generateConfetti = useCallback(() => {
    if (!shouldShowConfetti || !cardRef.current) return;

    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    const newConfetti: ConfettiPiece[] = [];
    
    for (let i = 0; i < 15; i++) {
      newConfetti.push({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: -10,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 2000
      });
    }
    
    setConfetti(newConfetti);
    
    // Nettoyer les confettis après l'animation
    setTimeout(() => setConfetti([]), 3000);
  }, [shouldShowConfetti]);

  // Déclencher les confettis au survol si surperformance
  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
    if (shouldShowConfetti) {
      generateConfetti();
    }
  }, [shouldShowConfetti, generateConfetti]);

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
        isOverAchieving && "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => {
        setIsHovering(false);
        setStarTrails([]);
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Halo lumineux pour les surperformances */}
      {isOverAchieving && (
        <div className="absolute inset-0 bg-gradient-to-r from-amber-200/20 via-yellow-200/20 to-orange-200/20 animate-pulse" />
      )}

      {/* Confetti Animation */}
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-2 h-2 pointer-events-none z-20"
          style={{
            left: `${piece.x}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}ms`,
            animation: 'confetti-fall 3s ease-out forwards',
            transform: `rotate(${piece.rotation}deg)`,
          }}
        />
      ))}

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
          <div className={cn(
            "w-2 h-2 rounded-full animate-pulse",
            isOverAchieving 
              ? "bg-gradient-to-r from-amber-400 to-yellow-400" 
              : "bg-gradient-to-r from-purple-400 to-pink-400"
          )} />
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
            {isOverAchieving ? (
              <Trophy className="h-5 w-5 text-amber-600" />
            ) : (
              <TrendingUp className="h-5 w-5" />
            )}
            Publications ce mois-ci
          </CardTitle>
          {badgeText && (
            <Badge 
              variant="outline" 
              className={cn(
                "font-semibold flex items-center gap-1",
                statusColor === "premium" && "border-amber-500 text-amber-800 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-lg",
                statusColor === "green" && "border-green-500 text-green-700 bg-green-50",
                statusColor === "orange" && "border-orange-500 text-orange-700 bg-orange-50",
                statusColor === "red" && "border-red-500 text-red-700 bg-red-50"
              )}
            >
              {isOverAchieving ? (
                <Trophy className="h-3 w-3" />
              ) : (
                <Award className="h-3 w-3" />
              )}
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
              statusColor === "premium" && "text-transparent bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 bg-clip-text animate-pulse",
              statusColor === "green" && "text-green-600",
              statusColor === "orange" && "text-orange-600", 
              statusColor === "red" && "text-red-600"
            )}
          >
            {stats.publishedCount}
          </span>
          <span className="text-xl text-muted-foreground">/{stats.maxLimit}</span>
          {isOverAchieving && (
            <span className="text-sm font-semibold text-amber-600 ml-2 animate-bounce">
              🎉 +{stats.publishedCount - stats.maxLimit}
            </span>
          )}
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
                statusColor === "premium" && "bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500",
                statusColor === "green" && "bg-gradient-to-r from-green-400 via-green-500 to-emerald-600",
                statusColor === "orange" && "bg-gradient-to-r from-orange-400 via-orange-500 to-amber-600",
                statusColor === "red" && "bg-gradient-to-r from-red-400 via-red-500 to-rose-600",
                isHovering && "animate-pulse"
              )}
              style={{ 
                width: `${Math.min(percentage, 100)}%`,
                boxShadow: `0 0 ${isOverAchieving ? '15px' : '10px'} ${
                  statusColor === "premium" ? "rgba(245, 158, 11, 0.6)" :
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
              {percentage >= 80 && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className={cn(
                    "w-2 h-2 rounded-full animate-ping",
                    isOverAchieving ? "bg-amber-200" : "bg-white/80"
                  )} />
                </div>
              )}
            </div>

            {/* Overflow indicator for >100% */}
            {isOverAchieving && (
              <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-amber-500 to-orange-500 animate-pulse">
                <div className="absolute -right-1 top-1/2 transform -translate-y-1/2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce">
                    <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full" />
                  </div>
                </div>
              </div>
            )}

            {/* Glowing border effect on hover */}
            {isHovering && (
              <div 
                className={cn(
                  "absolute inset-0 rounded-full border-2 opacity-70",
                  statusColor === "premium" && "border-amber-400",
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
            {isOverAchieving 
              ? `🎯 Objectif dépassé de ${overAchievementPercentage}% !`
              : stats.remaining > 0 
                ? `Objectif : ${stats.remaining} publication${stats.remaining > 1 ? 's' : ''} restante${stats.remaining > 1 ? 's' : ''}`
                : "Objectif atteint ce mois-ci"
            }
          </span>
          {percentage >= 80 && stats.remaining > 0 && !isOverAchieving && (
            <div className="flex items-center gap-1 text-green-600 animate-pulse">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">Excellent travail !</span>
            </div>
          )}
          {isOverAchieving && (
            <div className="flex items-center gap-1 text-amber-600 animate-bounce">
              <Trophy className="h-4 w-4" />
              <span className="font-bold">Surperformance !</span>
            </div>
          )}
        </div>

        {/* Achievement message */}
        {percentage === 100 && !isOverAchieving && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-green-700 font-medium">
              <Award className="h-4 w-4" />
              Objectif mensuel atteint ! 🎉
            </div>
            <p className="text-xs text-green-600 mt-1">
              Nouveau quota disponible le mois prochain
            </p>
          </div>
        )}

        {/* Super achievement message for >100% */}
        {isOverAchieving && (
          <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-300 rounded-lg p-4 text-center shadow-lg">
            <div className="flex items-center justify-center gap-2 text-amber-800 font-bold text-lg">
              <Trophy className="h-5 w-5" />
              Champion du mois ! 🏆
            </div>
            <p className="text-sm text-amber-700 mt-1 font-medium">
              Objectif dépassé de {overAchievementPercentage}% - Performance exceptionnelle !
            </p>
            <div className="mt-2 flex items-center justify-center gap-1 text-xs text-amber-600">
              <span>🌟</span>
              <span>Continuez sur cette lancée</span>
              <span>🌟</span>
            </div>
          </div>
        )}
      </CardContent>

      {/* CSS Animations using style element */}
      <style>{`
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
        
        @keyframes confetti-fall {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(400px) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </Card>
  );
};

export default PublicationCounter;

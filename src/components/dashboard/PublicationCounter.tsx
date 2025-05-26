
import React, { useState } from "react";
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

const PublicationCounter = ({ className }: PublicationCounterProps) => {
  const [isHovering, setIsHovering] = useState(false);
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
      className={cn(
        "relative overflow-hidden transition-all duration-300", 
        getCardBorderClass(),
        className
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
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

        {/* Progress bar with custom styling */}
        <div className="space-y-2">
          <div className="relative w-full bg-gray-100 rounded-full h-3">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                statusColor === "green" && "bg-gradient-to-r from-green-500 to-emerald-500",
                statusColor === "orange" && "bg-gradient-to-r from-orange-500 to-amber-500",
                statusColor === "red" && "bg-gradient-to-r from-red-500 to-rose-500"
              )}
              style={{ width: `${percentage}%` }}
            />
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
    </Card>
  );
};

export default PublicationCounter;

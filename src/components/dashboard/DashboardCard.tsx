import React from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import SparklingStars from "@/components/ui/SparklingStars";

interface DashboardCardProps {
  title: string;
  icon: React.ReactNode;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  to?: string;
  className?: string;
  isLoading?: boolean;
}

const DashboardCard = ({
  title,
  icon,
  value,
  description,
  trend,
  to,
  className,
  isLoading = false,
}: DashboardCardProps) => {
  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (to) {
      return (
        <Link to={to} className="block">
          <Card className={cn("hover-scale overflow-hidden h-full transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:-translate-y-1 group relative", className)}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            <SparklingStars className="opacity-0 group-hover:opacity-100 transition-opacity duration-500" isVisible={true} />
            {children}
          </Card>
        </Link>
      );
    }
    return (
      <Card className={cn("overflow-hidden h-full transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:-translate-y-1 group relative", className)}>
        <SparklingStars className="opacity-0 group-hover:opacity-100 transition-opacity duration-500" isVisible={true} />
        {children}
      </Card>
    );
  };

  return (
    <CardWrapper>
      <CardHeader className="pb-2 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground transition-colors duration-300 group-hover:text-foreground">{title}</span>
          <div className="text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">{icon}</div>
        </div>
      </CardHeader>
      <CardContent className="pb-2 relative z-10">
        {isLoading ? (
          <Skeleton className="h-8 w-12" />
        ) : (
          <div className="text-2xl font-bold transition-colors duration-300 group-hover:text-primary">{value}</div>
        )}
        {description && (
          <p className="text-sm text-muted-foreground mt-1 transition-colors duration-300 group-hover:text-foreground/80">{description}</p>
        )}
      </CardContent>
      {trend && (
        <CardFooter className="pt-0 relative z-10">
          <div
            className={cn(
              "text-xs font-medium flex items-center transition-all duration-300",
              trend.isPositive ? "text-green-500 group-hover:text-green-400" : "text-red-500 group-hover:text-red-400"
            )}
          >
            {trend.isPositive ? "↑" : "↓"} {trend.value}%
          </div>
        </CardFooter>
      )}
    </CardWrapper>
  );
};

export default DashboardCard;

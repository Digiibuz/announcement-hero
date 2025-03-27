
import React from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

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
}

const DashboardCard = ({
  title,
  icon,
  value,
  description,
  trend,
  to,
  className,
}: DashboardCardProps) => {
  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (to) {
      return (
        <Link to={to} className="block">
          <Card className={cn("hover-scale overflow-hidden", className)}>
            {children}
          </Card>
        </Link>
      );
    }
    return <Card className={cn("overflow-hidden", className)}>{children}</Card>;
  };

  return (
    <CardWrapper>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <div className="text-primary">{icon}</div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
      {trend && (
        <CardFooter className="pt-0">
          <div
            className={cn(
              "text-xs font-medium flex items-center",
              trend.isPositive ? "text-green-500" : "text-red-500"
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

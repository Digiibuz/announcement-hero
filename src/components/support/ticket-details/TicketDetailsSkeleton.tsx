
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const TicketDetailsSkeleton: React.FC = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-5 w-24" />
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

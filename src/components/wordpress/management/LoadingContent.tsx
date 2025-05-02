
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

const LoadingContent: React.FC = () => {
  return (
    <Card className="mt-4">
      <CardContent className="py-8 flex justify-center">
        <LoadingIndicator size={32} variant="dots" />
      </CardContent>
    </Card>
  );
};

export default LoadingContent;

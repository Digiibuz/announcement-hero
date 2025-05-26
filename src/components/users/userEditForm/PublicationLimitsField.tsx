
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Save, TrendingUp } from "lucide-react";
import { usePublicationLimits } from "@/hooks/usePublicationLimits";
import { UserProfile } from "@/types/auth";

interface PublicationLimitsFieldProps {
  user: UserProfile;
  isUpdating: boolean;
}

const PublicationLimitsField: React.FC<PublicationLimitsFieldProps> = ({
  user,
  isUpdating
}) => {
  const { stats, isLoading, updateMaxLimit, getProgressPercentage } = usePublicationLimits(user.id);
  const [newLimit, setNewLimit] = useState(stats.maxLimit);
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdateLimit = async () => {
    if (newLimit < 1 || newLimit > 100) {
      return;
    }

    setIsSaving(true);
    const success = await updateMaxLimit(newLimit);
    if (success) {
      setNewLimit(stats.maxLimit);
    }
    setIsSaving(false);
  };

  if (user.role !== 'client') {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Limites de publication
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

  const percentage = getProgressPercentage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Limites de publication mensuelle
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Publications ce mois-ci:</span>
            <Badge variant="outline">
              {stats.publishedCount}/{stats.maxLimit}
            </Badge>
          </div>
          <Progress value={percentage} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {stats.remaining} publication{stats.remaining > 1 ? 's' : ''} restante{stats.remaining > 1 ? 's' : ''}
          </div>
        </div>

        {/* Admin controls */}
        <div className="space-y-2 pt-2 border-t">
          <Label htmlFor="publication-limit" className="text-sm font-medium">
            Limite mensuelle
          </Label>
          <div className="flex gap-2">
            <Input
              id="publication-limit"
              type="number"
              min="1"
              max="100"
              value={newLimit}
              onChange={(e) => setNewLimit(Number(e.target.value))}
              className="flex-1"
            />
            <Button
              onClick={handleUpdateLimit}
              disabled={isSaving || isUpdating || newLimit === stats.maxLimit}
              size="sm"
              variant="outline"
            >
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? "..." : "Sauver"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Définit le nombre maximum de publications autorisées par mois
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PublicationLimitsField;


import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Save, TrendingUp, RotateCcw } from "lucide-react";
import { usePublicationLimits } from "@/hooks/usePublicationLimits";
import { UserProfile } from "@/types/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PublicationLimitsFieldProps {
  user: UserProfile;
  isUpdating: boolean;
}

const PublicationLimitsField: React.FC<PublicationLimitsFieldProps> = ({
  user,
  isUpdating
}) => {
  const { stats, isLoading, updateMaxLimit, getProgressPercentage, refetch } = usePublicationLimits(user.id);
  const [newLimit, setNewLimit] = useState(stats.maxLimit);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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

  const handleResetCount = async () => {
    setIsResetting(true);
    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      // Remettre le compteur à 0 pour le mois actuel
      const { error } = await supabase
        .from('monthly_publication_limits')
        .upsert({
          user_id: user.id,
          year: currentYear,
          month: currentMonth,
          max_limit: stats.maxLimit,
          published_count: 0,
        }, {
          onConflict: 'user_id,year,month'
        });

      if (error) throw error;

      // Actualiser les statistiques
      await refetch();
      toast.success("Compteur de publications remis à zéro");
    } catch (error) {
      console.error('Error resetting publication count:', error);
      toast.error("Erreur lors de la remise à zéro");
    } finally {
      setIsResetting(false);
    }
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
        <div className="space-y-3 pt-2 border-t">
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

          {/* Reset counter button */}
          <div className="pt-2 border-t">
            <Label className="text-sm font-medium mb-2 block">
              Actions
            </Label>
            <Button
              onClick={handleResetCount}
              disabled={isResetting || isUpdating || stats.publishedCount === 0}
              size="sm"
              variant="outline"
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {isResetting ? "Remise à zéro..." : "Remettre le compteur à 0"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Remet le compteur de publications du mois actuel à zéro
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PublicationLimitsField;

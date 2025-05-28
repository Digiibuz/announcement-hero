
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePublicationLimits } from "@/hooks/usePublicationLimits";
import { UserProfile } from "@/types/auth";
import { Loader2, Target } from "lucide-react";
import { toast } from "sonner";

interface PublicationLimitsFieldProps {
  user: UserProfile;
  isUpdating: boolean;
}

const PublicationLimitsField: React.FC<PublicationLimitsFieldProps> = ({ user, isUpdating }) => {
  const { stats, isLoading, updateMaxLimit } = usePublicationLimits(user.id);
  const [localLimit, setLocalLimit] = useState(stats.maxLimit);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalLimit(stats.maxLimit);
  }, [stats.maxLimit]);

  const handleSaveLimit = async () => {
    if (localLimit === stats.maxLimit) return;
    
    setIsSaving(true);
    const success = await updateMaxLimit(localLimit);
    
    if (success) {
      toast.success("Objectif de publication mis à jour avec succès");
    }
    
    setIsSaving(false);
  };

  const hasChanges = localLimit !== stats.maxLimit;

  if (user.role !== 'client') {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Objectifs de publication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Objectifs de publication
        </CardTitle>
        <CardDescription>
          Suivez les objectifs mensuels de publication pour cet utilisateur
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.publishedCount}</div>
            <div className="text-sm text-blue-600">Publications ce mois</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.remaining}</div>
            <div className="text-sm text-green-600">Restantes</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.maxLimit}</div>
            <div className="text-sm text-purple-600">Objectif actuel</div>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="publicationLimit" className="text-sm font-medium">
            Objectif mensuel de publications
          </label>
          <div className="flex gap-2">
            <Input
              id="publicationLimit"
              type="number"
              min="1"
              max="100"
              value={localLimit}
              onChange={(e) => setLocalLimit(Number(e.target.value))}
              className="flex-1"
            />
            <Button 
              onClick={handleSaveLimit}
              disabled={!hasChanges || isSaving || isUpdating}
              variant={hasChanges ? "default" : "outline"}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                "Sauvegarder"
              )}
            </Button>
          </div>
          {hasChanges && (
            <p className="text-sm text-orange-600">
              Modifications non sauvegardées
            </p>
          )}
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Informations</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Les objectifs sont indicatifs et n'empêchent pas la publication</li>
            <li>• Ils aident à suivre la performance mensuelle</li>
            <li>• Le compteur se remet à zéro chaque mois</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PublicationLimitsField;

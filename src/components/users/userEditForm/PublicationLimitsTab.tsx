
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePublicationLimits } from "@/hooks/usePublicationLimits";
import { UserProfile } from "@/types/auth";
import { Loader2, Target, TrendingUp } from "lucide-react";
import PublicationLimitsField from "./PublicationLimitsField";

interface PublicationLimitsTabProps {
  user: UserProfile;
  isUpdating: boolean;
  onCancel: () => void;
  onSubmit: (data: any) => void;
  form: UseFormReturn<any>;
}

const PublicationLimitsTab: React.FC<PublicationLimitsTabProps> = ({
  user,
  isUpdating,
  onCancel,
  onSubmit,
  form
}) => {
  const { stats, isLoading } = usePublicationLimits();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const progressColor = stats.percentage >= 100 ? "bg-green-500" : 
                       stats.percentage >= 75 ? "bg-yellow-500" : "bg-blue-500";

  return (
    <div className="space-y-6">
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
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{stats.publishedCount}</div>
              <div className="text-sm text-blue-600">Publications ce mois</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{stats.maxLimit}</div>
              <div className="text-sm text-green-600">Objectif mensuel</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{Math.round(stats.percentage)}%</div>
              <div className="text-sm text-purple-600">Progression</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progression vers l'objectif</span>
              <span className="font-medium">{stats.publishedCount} / {stats.maxLimit}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${progressColor}`}
                style={{ width: `${Math.min(100, stats.percentage)}%` }}
              />
            </div>
          </div>

          {stats.percentage >= 100 && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
              <TrendingUp className="h-5 w-5" />
              <span className="font-medium">Objectif atteint ! Félicitations ! 🎉</span>
            </div>
          )}

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

      <PublicationLimitsField user={user} isUpdating={isUpdating} />
      
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Fermer
        </Button>
      </div>
    </div>
  );
};

export default PublicationLimitsTab;

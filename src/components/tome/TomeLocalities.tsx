
import React, { useState } from "react";
import { useLocalities } from "@/hooks/tome";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Trash2, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TomeLocalitiesProps {
  configId: string;
}

const TomeLocalities: React.FC<TomeLocalitiesProps> = ({ configId }) => {
  const { 
    localities, 
    isLoading, 
    isSubmitting,
    addLocality,
    updateLocalityStatus,
    deleteLocality,
    fetchLocalities
  } = useLocalities(configId);

  const [newLocalityName, setNewLocalityName] = useState("");
  const [newRegion, setNewRegion] = useState("");
  const [localityToDelete, setLocalityToDelete] = useState<string | null>(null);

  const handleAddLocality = async () => {
    if (!newLocalityName.trim()) return;

    await addLocality(newLocalityName, newRegion.trim() || null);
    setNewLocalityName("");
    setNewRegion("");
  };

  const handleDeleteLocality = async () => {
    if (!localityToDelete) return;
    
    await deleteLocality(localityToDelete);
    setLocalityToDelete(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchLocalities()}
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Rafraîchir
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Ajouter une localité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="localityName">Nom de la localité</Label>
              <Input
                id="localityName"
                placeholder="Ex: Paris"
                value={newLocalityName}
                onChange={(e) => setNewLocalityName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="region">Région (optionnel)</Label>
              <Input
                id="region"
                placeholder="Ex: Île-de-France"
                value={newRegion}
                onChange={(e) => setNewRegion(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAddLocality}
                disabled={!newLocalityName.trim() || isSubmitting}
                className="w-full md:w-auto"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Ajouter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Liste des localités</CardTitle>
        </CardHeader>
        <CardContent>
          {localities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Aucune localité n'a été ajoutée
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {localities.map((locality) => (
                <div key={locality.id} className="border rounded-md p-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-medium">{locality.name}</h3>
                      {locality.region && (
                        <p className="text-sm text-muted-foreground">
                          Région: {locality.region}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`active-${locality.id}`}
                          checked={locality.active}
                          onCheckedChange={(checked) => 
                            updateLocalityStatus(locality.id, checked)
                          }
                        />
                        <Label htmlFor={`active-${locality.id}`}>Active</Label>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="h-9 w-9 hover:bg-red-100 hover:text-red-600"
                            onClick={() => setLocalityToDelete(locality.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action va supprimer la localité "{locality.name}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setLocalityToDelete(null)}>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteLocality}>Supprimer</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TomeLocalities;

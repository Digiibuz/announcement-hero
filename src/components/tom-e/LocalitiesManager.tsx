
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Trash2, AlertCircle } from "lucide-react";
import { useLocalities } from "@/hooks/useLocalities";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const LocalitiesManager = () => {
  const [newLocality, setNewLocality] = useState("");
  const [deleteLocalityId, setDeleteLocalityId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    localities,
    isLoading,
    error,
    addLocality,
    deleteLocality
  } = useLocalities();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocality.trim()) return;
    
    try {
      await addLocality(newLocality.trim());
      setNewLocality("");
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteLocalityId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteLocalityId) {
      try {
        await deleteLocality(deleteLocalityId);
      } catch (error) {
        // L'erreur est déjà gérée dans le hook
      } finally {
        setDeleteLocalityId(null);
        setIsDeleteDialogOpen(false);
      }
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gestion des localités</CardTitle>
          <CardDescription>
            Ajoutez les villes et localités pour lesquelles vous souhaitez générer du contenu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-6">
            <Input
              placeholder="Nouvelle localité (ex: Paris, Lyon, Marseille...)"
              value={newLocality}
              onChange={(e) => setNewLocality(e.target.value)}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={!newLocality.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Ajouter
            </Button>
          </form>

          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-4 text-destructive">
              <AlertCircle className="h-5 w-5 inline-block mr-2" />
              Erreur lors du chargement des localités
            </div>
          ) : localities.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Aucune localité n'a été ajoutée
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Localité</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localities.map((locality) => (
                  <TableRow key={locality.id}>
                    <TableCell>{locality.name}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(locality.id)}
                        title="Supprimer cette localité"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cette localité sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default LocalitiesManager;

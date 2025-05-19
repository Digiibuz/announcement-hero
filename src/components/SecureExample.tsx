
import React, { useState, useEffect } from "react";
import { secureClient } from "../lib/secureClient";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface ExampleData {
  id: string;
  title: string;
  created_at: string;
}

const SecureExample = () => {
  const [data, setData] = useState<ExampleData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Utilisation du client sécurisé
      const result = await secureClient.select('announcements', {
        limit: 10,
        order: { column: 'created_at', ascending: false }
      });
      
      if (result.error) {
        throw new Error(result.error.message || "Erreur lors de la récupération des données");
      }
      
      setData(result.data || []);
      toast.success("Données récupérées avec succès via l'Edge Function");
    } catch (err) {
      console.error("Erreur lors de la récupération des données:", err);
      setError(err.message || "Une erreur s'est produite");
      toast.error("Échec de la récupération des données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto my-8">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Exemple d'accès sécurisé à Supabase</span>
          <Button onClick={fetchData} disabled={loading} variant="outline" size="sm">
            Rafraîchir
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center py-4">Chargement des données...</p>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <p className="text-sm mt-2">
              Assurez-vous que l'Edge Function est déployée et que les variables d'environnement sont configurées correctement.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-muted-foreground">
              Ces données ont été récupérées via une Edge Function, sans exposer l'URL ou la clé Supabase.
            </p>
            
            {data.length === 0 ? (
              <p>Aucune donnée trouvée.</p>
            ) : (
              <div className="space-y-2">
                {data.map((item) => (
                  <div key={item.id} className="p-3 border rounded-md">
                    <h3 className="font-medium">{item.title || "Sans titre"}</h3>
                    <p className="text-sm text-muted-foreground">
                      ID: {item.id} | Créé le: {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SecureExample;

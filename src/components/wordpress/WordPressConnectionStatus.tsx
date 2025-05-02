
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useWordPressConnection } from "@/hooks/wordpress/useWordPressConnection";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import { useWordPressPages } from "@/hooks/wordpress/useWordPressPages";
import { RefreshCw, Loader2, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import StatusBadge from "./connection-status/StatusBadge";
import TroubleshootingDialog from "./connection-status/TroubleshootingDialog";
import ConnectionDetailsCard from "./connection-status/ConnectionDetailsCard";

interface WordPressConnectionStatusProps {
  configId?: string;
  showDetails?: boolean;
  className?: string;
}

const WordPressConnectionStatus: React.FC<WordPressConnectionStatusProps> = ({
  configId,
  showDetails = false,
  className
}) => {
  const { userProfile } = useAuth();
  const { status, isChecking, errorDetails, checkConnection } = useWordPressConnection();
  const [configDetails, setConfigDetails] = useState<{name?: string, site_url?: string}>({});
  const [showHelp, setShowHelp] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  
  const { 
    categories, 
    isLoading: isCategoriesLoading, 
    refetch: refetchCategories,
    hasCategories,
    error: categoriesError
  } = useWordPressCategories();
  
  const { 
    pages, 
    isLoading: isPagesLoading, 
    refetch: refetchPages,
    hasPages,
    error: pagesError
  } = useWordPressPages();

  useEffect(() => {
    // Fetch WordPress config details for additional info
    const fetchConfigDetails = async () => {
      const id = configId || userProfile?.wordpressConfigId;
      if (id) {
        try {
          const { data, error } = await supabase
            .from('wordpress_configs')
            .select('name, site_url')
            .eq('id', id)
            .single();
          
          if (!error && data) {
            setConfigDetails(data);
          }
        } catch (err) {
          console.error("Error fetching WordPress config details:", err);
        }
      }
    };
    
    fetchConfigDetails();
  }, [configId, userProfile?.wordpressConfigId]);

  // Vérifier la connexion au chargement du composant
  useEffect(() => {
    if (status === "unknown" && configId) {
      checkConnection(configId);
      setLastChecked(new Date());
    }
  }, [configId, status, checkConnection]);

  const handleSync = async () => {
    try {
      const effectiveConfigId = configId || userProfile?.wordpressConfigId;
      
      if (!effectiveConfigId) {
        toast.error("Aucune configuration WordPress associée");
        return;
      }
      
      const result = await checkConnection(effectiveConfigId);
      setLastChecked(new Date());
      
      if (result.success) {
        toast.success("Connexion WordPress établie avec succès");
        // Actualiser les catégories et les pages
        await Promise.all([refetchCategories(), refetchPages()]);
        toast.success("Données WordPress synchronisées avec succès");
      } else {
        toast.error(`Échec de connexion: ${result.message}`);
        
        // Si on a un message d'erreur détaillé, afficher l'aide
        if (result.message?.includes("Erreur réseau") || result.message?.includes("impossible d'accéder")) {
          setShowHelp(true);
        }
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Erreur lors de la synchronisation");
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <StatusBadge 
        status={status} 
        isChecking={isChecking} 
        errorDetails={errorDetails}
        lastChecked={lastChecked} 
        configDetails={configDetails} 
      />

      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleSync}
        disabled={isChecking || isCategoriesLoading || isPagesLoading}
        className="px-2 h-8"
      >
        {(isChecking || isCategoriesLoading || isPagesLoading) ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <RefreshCw className="h-3 w-3" />
        )}
        <span className="ml-1">Synchroniser</span>
      </Button>

      {status === "disconnected" && errorDetails && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowHelp(true)}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 h-8"
        >
          <HelpCircle className="h-3 w-3 mr-1" />
          <span>Aide</span>
        </Button>
      )}

      {showDetails && status === "connected" && (
        <ConnectionDetailsCard 
          categoriesError={categoriesError} 
          pagesError={pagesError}
          hasCategories={hasCategories}
          hasPages={hasPages}
          categories={categories}
          pages={pages}
          configDetails={configDetails}
        />
      )}

      {status === "disconnected" && errorDetails && (
        <TroubleshootingDialog 
          open={showHelp}
          onOpenChange={setShowHelp}
          errorDetails={errorDetails}
          configDetails={configDetails}
          onRetry={handleSync}
        />
      )}
    </div>
  );
};

export default WordPressConnectionStatus;

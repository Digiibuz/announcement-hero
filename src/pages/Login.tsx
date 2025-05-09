
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Eye, EyeOff, Lock, LogIn, Loader2, RefreshCcw, AlertCircle, 
  AlertTriangle, Bug, Terminal, Wifi, WifiOff, RotateCw, Download
} from "lucide-react";
import ImpersonationBanner from "@/components/ui/ImpersonationBanner";
import { 
  initializeSecureClient, 
  supabase, 
  withInitializedClient, 
  cleanupAuthState, 
  needsAuthReset,
  getDebugInfo,
  testEdgeFunctionConnection,
  testSupabaseConnection
} from "@/integrations/supabase/client";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

// Composant pour télécharger les logs de débogage
const DebugDownloadButton = ({ debugInfo }: { debugInfo: Record<string, any> | null }) => {
  const handleDownload = () => {
    if (!debugInfo) return;
    
    const debugData = JSON.stringify(debugInfo, null, 2);
    const blob = new Blob([debugData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `debug-auth-${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Logs de débogage téléchargés");
  };

  return (
    <Button 
      onClick={handleDownload} 
      variant="outline" 
      size="sm" 
      className="flex items-center gap-1"
      disabled={!debugInfo}
    >
      <Download className="h-3 w-3" />
      <span className="text-xs">Télécharger les logs</span>
    </Button>
  );
};

// Composant pour les informations de débogage détaillées
const DebugPanel = ({ debugInfo }: { debugInfo: Record<string, any> | null }) => {
  if (!debugInfo) return null;
  
  // Function to sort entries by timestamp
  const sortedEntries = () => {
    return Object.entries(debugInfo)
      .sort((a, b) => {
        // Extract timestamp from key if present
        const extractTimestamp = (key: string) => {
          const isoDateMatch = key.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)_/);
          return isoDateMatch ? isoDateMatch[1] : '';
        };
        
        const timeA = extractTimestamp(a[0]) || (a[1]?.time || '');
        const timeB = extractTimestamp(b[0]) || (b[1]?.time || '');
        return timeA.localeCompare(timeB);
      });
  };

  // Group logs by category for better organization
  const groupedLogs = {
    network: sortedEntries().filter(([key]) => key.includes('fetch') || key.includes('edge') || key.includes('test')),
    auth: sortedEntries().filter(([key]) => key.includes('auth') || key.includes('login')),
    client: sortedEntries().filter(([key]) => key.includes('client') || key.includes('init')),
    other: sortedEntries().filter(([key]) => 
      !key.includes('fetch') && !key.includes('edge') && 
      !key.includes('auth') && !key.includes('login') &&
      !key.includes('client') && !key.includes('init')
    )
  };
  
  return (
    <div className="mt-4 p-3 bg-muted/50 backdrop-blur-sm rounded-md text-xs">
      <div className="flex justify-between mb-2">
        <div className="font-semibold flex items-center">
          <Terminal className="h-3 w-3 mr-1" />
          Débogage
          <span className="ml-1 text-xs text-muted-foreground">({Object.keys(debugInfo).length} entrées)</span>
        </div>
        <DebugDownloadButton debugInfo={debugInfo} />
      </div>
      <Accordion type="multiple" className="w-full">
        {Object.keys(groupedLogs).map(category => (
          !!groupedLogs[category].length && (
            <AccordionItem key={category} value={`category-${category}`}>
              <AccordionTrigger className="text-xs py-1">
                {category === 'network' ? 'Réseau' : 
                 category === 'auth' ? 'Authentification' : 
                 category === 'client' ? 'Client Supabase' : 'Autres'}
                <span className="ml-1 text-muted-foreground">({groupedLogs[category].length})</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="mt-1 whitespace-pre-wrap overflow-auto max-h-[150px] p-2 bg-black/80 rounded text-green-400 font-mono">
                  {groupedLogs[category].map(([key, value]) => (
                    <div key={key} className="mb-1 border-b border-green-900/30 pb-1">
                      <span className="text-yellow-400">{key}</span>: 
                      <span className="text-green-300">{JSON.stringify(value, null, 1)}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        ))}
      </Accordion>
    </div>
  );
};

// Composant pour afficher le statut de connexion réseau
const NetworkStatus = ({ online = true, onCheck }: { online?: boolean; onCheck: () => void }) => {
  return (
    <div className="flex items-center justify-center gap-2 text-xs">
      {online ? (
        <Wifi className="h-3 w-3 text-emerald-500" />
      ) : (
        <WifiOff className="h-3 w-3 text-destructive" />
      )}
      <span className={online ? "text-emerald-600" : "text-destructive"}>
        {online ? "Connecté" : "Déconnecté"}
      </span>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-5 w-5 rounded-full"
        onClick={onCheck}
      >
        <RotateCw className="h-3 w-3" />
      </Button>
    </div>
  );
};

// Composant pour le bouton de réinitialisation
const ResetConnectionButton = ({ onReset, isLoading }: { onReset: () => Promise<void>; isLoading: boolean }) => {
  return (
    <Button 
      onClick={onReset} 
      className="flex items-center gap-2 w-full"
      variant="outline"
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <RefreshCcw className="h-4 w-4 mr-2" />
      )}
      Réinitialiser la connexion
    </Button>
  );
};

// Composant pour l'état de connexion
const ConnectionStatus = ({ initError, isResetting }: { initError: string | null; isResetting: boolean }) => {
  if (!initError) return null;
  
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="text-destructive text-center mb-2 flex flex-col items-center">
        <AlertCircle className="h-8 w-8 mb-2 text-destructive" />
        <p className="font-medium mb-1">Problème de configuration du serveur</p>
        <p className="text-sm text-muted-foreground">{initError}</p>
      </div>
      {isResetting && (
        <div className="text-center mt-2">
          <p className="text-sm">Réinitialisation en cours...</p>
          <Loader2 className="h-5 w-5 animate-spin mx-auto mt-2" />
        </div>
      )}
    </div>
  );
};

// Composant pour le résultat du test de connexion
const ConnectionTestResult = ({ result }: { result: any }) => {
  if (!result) return null;
  
  return (
    <Alert className="mt-3" variant={result.success ? "default" : "destructive"}>
      <AlertDescription className="text-xs flex flex-col">
        {result.success ? (
          <>
            <span className="font-medium">Connexion réussie</span>
            <span>Le serveur est accessible et répond correctement.</span>
            {result.data && (
              <ul className="list-disc list-inside mt-1">
                <li>Version: {result.data.keyLength} caractères</li>
                <li>URL: {result.data.url?.substring(0, 15)}...</li>
              </ul>
            )}
          </>
        ) : (
          <>
            <span className="font-medium">Échec de connexion</span>
            <span>{result.error || "Erreur inconnue"}</span>
            {result.status && <span>Code: {result.status}</span>}
          </>
        )}
      </AlertDescription>
    </Alert>
  );
};

// Composant principal Login
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [forceReset, setForceReset] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebugMode, setShowDebugMode] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean>(navigator.onLine);
  const [edgeFunctionTest, setEdgeFunctionTest] = useState<any>(null);
  const [supabaseUrlTest, setSupabaseUrlTest] = useState<any>(null);
  const debugTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Vérification du statut réseau
  useEffect(() => {
    const handleOnline = () => setIsConnected(true);
    const handleOffline = () => setIsConnected(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Active le mode de débogage immédiatement en développement
  useEffect(() => {
    // Toujours activer le mode débogage pour identifier les problèmes
    setShowDebugMode(true);
    
    return () => {
      if (debugTimerRef.current) {
        clearTimeout(debugTimerRef.current);
      }
    };
  }, []);
  
  // Mise à jour périodique des infos de débogage
  useEffect(() => {
    const updateDebugInfo = () => {
      try {
        const info = getDebugInfo();
        setDebugInfo(info);
      } catch (e) {
        console.error("Erreur lors de la récupération des infos de débogage:", e);
      }
    };
    
    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 1500);
    
    return () => clearInterval(interval);
  }, []);

  // Afficher des informations de débogage dans la console
  const logDebugInfo = (message: string, data?: any) => {
    console.log(`[DEBUG] ${message}`, data || '');
    if (data) {
      setDebugInfo(prev => ({...prev, [message]: data}));
    }
  };

  // Vérification de la connectivité réseau
  const checkNetworkConnection = async () => {
    try {
      // Test de connectivité basique
      const start = Date.now();
      await fetch('https://www.google.com/favicon.ico', { 
        mode: 'no-cors',
        cache: 'no-store'
      });
      const latency = Date.now() - start;
      
      setIsConnected(true);
      logDebugInfo('network-check', { 
        connected: true,
        latency: `${latency}ms`,
        time: new Date().toISOString()
      });
      return true;
    } catch (error: any) {
      setIsConnected(false);
      logDebugInfo('network-check', { 
        connected: false,
        error: error.message,
        time: new Date().toISOString()
      });
      return false;
    }
  };

  // Test de communication avec l'URL Supabase directement
  const testSupabaseUrl = async () => {
    try {
      setIsResetting(true);
      setSupabaseUrlTest({ status: 'testing' });
      
      logDebugInfo("Test URL Supabase", { time: new Date().toISOString() });
      
      // Premier test: connectivité réseau
      const isNetworkConnected = await checkNetworkConnection();
      if (!isNetworkConnected) {
        setSupabaseUrlTest({ 
          status: 'error',
          message: "Pas de connexion Internet. Vérifiez votre réseau." 
        });
        toast.error("Pas de connexion Internet", {
          description: "Vérifiez votre connexion réseau"
        });
        setIsResetting(false);
        return;
      }
      
      // Test direct de l'URL Supabase
      const result = await testSupabaseConnection();
      setSupabaseUrlTest(result);
      
      logDebugInfo("Test URL Supabase Result", result);
      
      if (result.success) {
        toast.success("Test de l'URL Supabase réussi", {
          description: "Connexion directe au serveur établie"
        });
      } else {
        toast.error("Échec du test de l'URL Supabase", {
          description: result.error || "Erreur inconnue"
        });
      }
    } catch (error: any) {
      logDebugInfo("Test URL Supabase Error", { error: error.message });
      setSupabaseUrlTest({ 
        status: 'error',
        error: error.message 
      });
      
      toast.error("Échec du test de l'URL Supabase", {
        description: error.message || "Erreur inconnue"
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Test de communication avec l'Edge Function
  const testEdgeFunction = async () => {
    try {
      setIsResetting(true);
      setEdgeFunctionTest({ status: 'testing' });
      
      logDebugInfo("Test Edge Function", { time: new Date().toISOString() });
      
      // Premier test: connectivité réseau
      const isNetworkConnected = await checkNetworkConnection();
      if (!isNetworkConnected) {
        setEdgeFunctionTest({ 
          status: 'error',
          message: "Pas de connexion Internet. Vérifiez votre réseau." 
        });
        toast.error("Pas de connexion Internet", {
          description: "Vérifiez votre connexion réseau"
        });
        setIsResetting(false);
        return;
      }
      
      // Second test: accès à l'Edge Function
      const result = await testEdgeFunctionConnection();
      setEdgeFunctionTest(result);
      
      logDebugInfo("Test Edge Function Result", result);
      
      if (result.success) {
        toast.success("Test de l'Edge Function réussi", {
          description: "Communication avec le serveur établie"
        });
      } else {
        toast.error("Échec du test de l'Edge Function", {
          description: result.error || "Erreur inconnue"
        });
      }
    } catch (error: any) {
      logDebugInfo("Test Edge Function Error", { error: error.message });
      setEdgeFunctionTest({ 
        status: 'error',
        error: error.message 
      });
      
      toast.error("Échec du test de l'Edge Function", {
        description: error.message || "Erreur inconnue"
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Fonction pour réinitialiser la connexion
  const handleReinitialize = async () => {
    setInitError(null);
    setIsResetting(true);
    setDebugInfo({
      startTime: new Date().toISOString(),
      action: 'handleReinitialize'
    });
    
    try {
      toast.info("Réinitialisation complète de la connexion en cours...", {
        duration: 5000
      });
      
      logDebugInfo("Début réinitialisation", {time: new Date().toISOString()});
      
      // Vérifier la connectivité avant tout
      const isNetworkOk = await checkNetworkConnection();
      if (!isNetworkOk) {
        setInitError("Pas de connexion Internet. Vérifiez votre réseau.");
        toast.error("Pas de connexion Internet", {
          description: "La réinitialisation nécessite une connexion réseau"
        });
        setIsResetting(false);
        return;
      }
      
      // Forcer le nettoyage complet
      sessionStorage.clear();
      setForceReset(true);
      
      logDebugInfo("Avant nettoyage", { 
        localStorage: Object.keys(localStorage),
        sessionStorage: Object.keys(sessionStorage)
      });
      
      // Nettoyage complet
      await cleanupAuthState();
      
      logDebugInfo("Après nettoyage", { 
        localStorage: Object.keys(localStorage),
        sessionStorage: Object.keys(sessionStorage)
      });
      
      // Tester la connectivité à l'Edge Function
      const edgeResult = await testEdgeFunctionConnection();
      logDebugInfo("Test Edge Function après réinitialisation", edgeResult);
      
      if (!edgeResult.success) {
        setInitError(`Problème de connexion à l'Edge Function: ${edgeResult.error || "Erreur inconnue"}`);
        toast.error("Problème de connexion à l'Edge Function", {
          description: edgeResult.error || "Erreur inconnue"
        });
        setIsResetting(false);
        return;
      }
      
      // Nouvel essai d'initialisation
      const success = await initializeSecureClient(true);
      
      logDebugInfo("Résultat initialisation", { success });
      
      if (success) {
        toast.success("Connexion au serveur rétablie", {
          duration: 5000
        });
        setInitError(null);
        setShowResetDialog(false);
        
        // Vérification supplémentaire
        try {
          const { data } = await supabase.auth.getSession();
          logDebugInfo("Session après réinitialisation", { 
            hasSession: !!data.session,
            time: new Date().toISOString()
          });
        } catch (e: any) {
          logDebugInfo("Erreur vérification session après réinitialisation", { error: e.message });
        }
      } else {
        setInitError("La réinitialisation a échoué, veuillez réessayer");
        toast.error("Échec de la réinitialisation", {
          description: "Veuillez vérifier la console pour plus de détails"
        });
      }
    } catch (error: any) {
      console.error("Erreur lors de la réinitialisation:", error);
      logDebugInfo("Erreur réinitialisation", { error: error.message });
      setInitError("Une erreur est survenue pendant la réinitialisation");
      toast.error("La réinitialisation a échoué", {
        description: error.message || "Erreur inconnue"
      });
    } finally {
      setIsResetting(false);
      setForceReset(false);
    }
  };

  // Forcer une réinitialisation complète si nécessaire
  useEffect(() => {
    if (forceReset) {
      logDebugInfo("Force reset activé", {time: new Date().toISOString()});
      
      // Effacer tous les tokens
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('auth') || key.includes('sb-')) {
          localStorage.removeItem(key);
          logDebugInfo(`Suppression localStorage: ${key}`);
        }
      });
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('auth') || key.includes('sb-')) {
          sessionStorage.removeItem(key);
          logDebugInfo(`Suppression sessionStorage: ${key}`);
        }
      });
    }
  }, [forceReset]);

  // Vérification de l'initialisation
  useEffect(() => {
    logDebugInfo("Démarrage vérification initialisation", {
      url: window.location.href,
      userAgent: navigator.userAgent,
      time: new Date().toISOString()
    });
    
    // Vérifier la connectivité réseau
    checkNetworkConnection();
    
    // Vérifier si réinitialisation nécessaire
    if (needsAuthReset()) {
      setInitError("Une réinitialisation est nécessaire");
      setIsInitializing(false);
      setShowResetDialog(true);
      logDebugInfo("Réinitialisation nécessaire détectée");
      return;
    }

    // Vérifier l'initialisation du client
    const initClient = async () => {
      try {
        logDebugInfo("Initialisation du client Supabase...");
        
        setIsInitializing(true);
        const success = await initializeSecureClient();
        
        logDebugInfo("Résultat initialisation", { success });
        
        if (success) {
          logDebugInfo("Client initialisé avec succès");
          
          // Test de validation
          try {
            const { data, error } = await supabase.auth.getSession();
            logDebugInfo("Test session", { success: !error, error });
            
            if (error) {
              console.error("Erreur de session:", error);
              if (error.message?.includes("Invalid API key")) {
                setInitError("Problème avec la clé API");
                setShowResetDialog(true);
              } else if (error.status === 401 || error.message?.includes("Unauthorized")) {
                setInitError("Problème d'authentification avec le serveur (401)");
                setShowResetDialog(true);
              } else {
                setInitError("Problème de connexion avec le serveur");
              }
            } else {
              logDebugInfo("Connexion serveur établie");
              setInitError(null);
            }
          } catch (e) {
            console.error("Erreur de vérification:", e);
            logDebugInfo("Erreur test session", { error: e });
            setInitError("Erreur de communication serveur");
            setShowResetDialog(true);
          }
        } else {
          console.error("Échec d'initialisation");
          logDebugInfo("Échec initialisation");
          setInitError("Problème de connexion avec le serveur");
          setShowResetDialog(true);
        }
      } catch (error) {
        console.error("Erreur critique:", error);
        logDebugInfo("Erreur critique initialisation", { error });
        setInitError("Impossible de se connecter au serveur");
        setShowResetDialog(true);
      } finally {
        setIsInitializing(false);
      }
    };
    
    initClient();
  }, []);

  // Redirection si déjà authentifié
  useEffect(() => {
    if (isAuthenticated) {
      logDebugInfo("Utilisateur authentifié, redirection");
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  // Gestionnaire de soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    logDebugInfo("Tentative de soumission", { 
      email, 
      password: "***", 
      time: new Date().toISOString() 
    });
    
    if (isInitializing) {
      toast.error("Initialisation en cours, veuillez patienter");
      return;
    }
    
    if (initError) {
      toast.error("Veuillez réinitialiser la connexion", {
        action: {
          label: "Réinitialiser",
          onClick: handleReinitialize
        }
      });
      setShowResetDialog(true);
      return;
    }
    
    // Vérifier la connexion réseau d'abord
    if (!isConnected) {
      const networkCheck = await checkNetworkConnection();
      if (!networkCheck) {
        toast.error("Pas de connexion Internet", {
          description: "Vérifiez votre connexion réseau et réessayez"
        });
        return;
      }
    }
    
    setIsLoading(true);
    setLoginAttempts(prev => prev + 1);
    
    try {
      logDebugInfo("Tentative de connexion...", { 
        attempt: loginAttempts + 1,
        time: new Date().toISOString() 
      });
      
      // Nettoyage après échecs multiples
      if (loginAttempts >= 1) {
        logDebugInfo("Nettoyage préventif...");
        await cleanupAuthState();
      }
      
      await withInitializedClient(async () => {
        // Test préliminaire
        try {
          logDebugInfo("Test préliminaire");
          const { data: sessionCheck } = await supabase.auth.getSession();
          logDebugInfo("État de session:", sessionCheck ? "OK" : "Pas de session");
        } catch (e) {
          console.error("Erreur préliminaire:", e);
          logDebugInfo("Erreur préliminaire", { error: e });
          throw new Error("Problème de communication");
        }
        
        logDebugInfo("Appel login avec email", { 
          email,
          time: new Date().toISOString() 
        });
        await login(email, password);
        logDebugInfo("Connexion réussie", { time: new Date().toISOString() });
        toast.success("Connexion réussie");
        
        // Reset compteur
        setLoginAttempts(0);
        
        setTimeout(() => {
          navigate("/dashboard");
        }, 500);
      });
    } catch (error: any) {
      console.error("Erreur complète:", error);
      logDebugInfo("Erreur de connexion", { 
        error: error.message,
        time: new Date().toISOString()
      });
      
      if (error.message?.includes("Invalid login")) {
        toast.error("Email ou mot de passe incorrect");
      } else if (error.message?.includes("Invalid API key")) {
        toast.error("Problème de configuration");
        setShowResetDialog(true);
        await handleReinitialize();
      } else if (error.message?.includes("network") || error.message?.includes("failed")) {
        toast.error("Problème de connexion réseau");
        setShowResetDialog(true);
      } else if (error.message?.includes("401") || error.status === 401) {
        toast.error("Problème d'authentification avec le serveur (401)");
        setShowResetDialog(true);
        await handleReinitialize();
      } else if (!error.message || error.message === "Login error") {
        toast.error("Erreur de connexion - Vérifiez la console pour plus de détails");
        setShowResetDialog(true);
      } else {
        toast.error(error.message || "Échec de la connexion");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <ImpersonationBanner />
      <AnimatedContainer direction="up" className="w-full max-w-md">
        <Card className="glass-panel shadow-lg border-white/20">
          <div className="flex justify-center pt-6">
            <div className="flex flex-col items-center">
              <img 
                src="/lovable-uploads/2c24c6a4-9faf-497a-9be8-27907f99af47.png" 
                alt="DigiiBuz" 
                className="h-16 w-auto mb-2"
              />
              <span className="text-xl font-bold text-digibuz-navy dark:text-digibuz-yellow">
                DigiiBuz
              </span>
            </div>
          </div>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Lock className="h-6 w-6" />
              Connexion
            </CardTitle>
            <CardDescription>
              Entrez vos identifiants pour accéder à votre compte
            </CardDescription>
            {/* Network status indicator */}
            <div className="pt-1">
              <NetworkStatus online={isConnected} onCheck={checkNetworkConnection} />
            </div>
          </CardHeader>
          <CardContent>
            {isInitializing ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Initialisation de la connexion sécurisée...</p>
              </div>
            ) : initError ? (
              <ConnectionStatus initError={initError} isResetting={isResetting} />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">              
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                    autoComplete="email"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-xs" 
                      type="button" 
                      disabled={isLoading}
                      asChild
                    >
                      <Link to="/forgot-password">Mot de passe oublié ?</Link>
                    </Button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading || isInitializing || !!initError || !isConnected}>
                  {isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion en cours...
                    </div>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Se connecter
                    </>
                  )}
                </Button>

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-sm"
                    onClick={() => setShowResetDialog(true)}
                    disabled={!isConnected}
                  >
                    <AlertTriangle className="mr-2 h-3 w-3" />
                    Problèmes de connexion ?
                  </Button>
                </div>
              </form>
            )}
            
            {(!!initError || isResetting || !isConnected) && !isInitializing && (
              <div className="mt-4">
                <ResetConnectionButton onReset={handleReinitialize} isLoading={isResetting} />
              </div>
            )}
            
            {/* Zone de diagnostic */}
            <div className="mt-4 pt-4 border-t border-border">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="diagnostics">
                  <AccordionTrigger className="text-xs">
                    <div className="flex items-center">
                      <Terminal className="h-3 w-3 mr-1" /> 
                      Outils de diagnostic
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-xs flex items-center justify-center"
                        onClick={testEdgeFunction}
                        disabled={isResetting || !isConnected}
                      >
                        <Bug className="mr-1 h-3 w-3" />
                        Tester Edge Function
                      </Button>
                      
                      {edgeFunctionTest && (
                        <ConnectionTestResult result={edgeFunctionTest} />
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-xs flex items-center justify-center mt-2"
                        onClick={testSupabaseUrl}
                        disabled={isResetting || !isConnected}
                      >
                        <Bug className="mr-1 h-3 w-3" />
                        Tester URL Supabase
                      </Button>
                      
                      {supabaseUrlTest && (
                        <ConnectionTestResult result={supabaseUrlTest} />
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              {/* Informations de débogage (toujours visibles) */}
              {debugInfo && <DebugPanel debugInfo={debugInfo} />}
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-center text-muted-foreground w-full">
              Contactez votre administrateur si vous n'avez pas de compte
            </p>
          </CardFooter>
        </Card>
      </AnimatedContainer>

      {/* Dialogue de réinitialisation */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCcw className="h-5 w-5" />
              Réinitialiser la connexion au serveur
            </DialogTitle>
            <DialogDescription>
              Résoudre les problèmes de connexion en réinitialisant la configuration client.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-4">Cette opération va :</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Nettoyer toutes les données d'authentification stockées</li>
              <li>Rétablir la connexion sécurisée avec le serveur</li>
              <li>Résoudre les problèmes d'API key et de sessions expirées</li>
              <li>Résoudre l'erreur 401 "Unauthorized"</li>
              <li>Réinitialiser complètement le cache du navigateur pour cette application</li>
            </ul>
            
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-md">
              <p className="text-sm text-amber-800 dark:text-amber-300 mb-2">
                <strong>Conseils supplémentaires :</strong>
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-xs text-amber-700 dark:text-amber-400">
                <li>Essayez d'ouvrir le site en navigation privée</li>
                <li>Désactivez les extensions de navigateur</li>
                <li>Videz le cache du navigateur</li>
                <li>Essayez un autre navigateur</li>
                <li>Si le problème persiste, contactez l'administrateur</li>
              </ol>
            </div>
            
            {showDebugMode && debugInfo && (
              <div className="mt-4 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-md">
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Informations de diagnostic : {Object.keys(debugInfo || {}).length} entrées collectées
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowResetDialog(false)}
              disabled={isResetting}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleReinitialize}
              disabled={isResetting}
              className="min-w-[120px]"
            >
              {isResetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Réinitialisation...
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Réinitialiser
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;

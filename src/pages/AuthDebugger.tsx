
import React, { useEffect } from 'react';
import { useAuthDebugger } from '@/hooks/useAuthDebugger';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, LogOut, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AuthDebugger = () => {
  const { authDebugInfo, updateDebugInfo } = useAuthDebugger();
  const navigate = useNavigate();

  // Force refresh on mount to capture current URL parameters
  useEffect(() => {
    updateDebugInfo();
  }, [updateDebugInfo]);

  const handleClearAndRefresh = () => {
    // Clear local storage and session storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear supabase auth state
    supabase.auth.signOut().then(() => {
      toast.success('Auth state cleared');
      
      // Clear URL parameters by replacing state
      if (window.history && (window.location.hash || window.location.search)) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      
      // Force reload the page
      window.location.reload();
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
    navigate('/login');
  };

  const formatJsonDisplay = (obj: Record<string, any>) => {
    if (Object.keys(obj).length === 0) {
      return <span className="text-muted-foreground italic">None</span>;
    }
    
    return (
      <div className="bg-muted rounded-md p-3 overflow-auto max-h-48">
        <pre>{JSON.stringify(obj, null, 2)}</pre>
      </div>
    );
  };

  return (
    <div className="container max-w-4xl py-10">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Authentication Debugger</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/dashboard')}
              >
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={updateDebugInfo}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Troubleshooting tool to diagnose authentication issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Current URL</h3>
            <div className="bg-muted rounded-md p-3 break-all">
              {window.location.href}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Session Status</h3>
            <div className="bg-muted rounded-md p-3">
              {authDebugInfo.sessionStatus}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Auth Callback Detection</h3>
            <div className="bg-muted rounded-md p-3">
              {authDebugInfo.callbackDetected ? 
                <span className="text-green-500 font-medium">Authentication callback detected</span> : 
                <span className="text-amber-500 font-medium">No authentication callback detected in URL</span>
              }
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">URL Hash Parameters</h3>
            {formatJsonDisplay(authDebugInfo.hashParams)}
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">URL Query Parameters</h3>
            {formatJsonDisplay(authDebugInfo.urlParams)}
          </div>

          {authDebugInfo.lastError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {authDebugInfo.lastError}
              </AlertDescription>
            </Alert>
          )}

          <div>
            <h3 className="text-lg font-medium mb-2">Last Checked</h3>
            <div className="bg-muted rounded-md p-3">
              {authDebugInfo.timeChecked}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="destructive" 
            className="w-full"
            onClick={handleClearAndRefresh}
          >
            Clear Auth State & Refresh
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AuthDebugger;

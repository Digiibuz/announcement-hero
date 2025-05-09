
import React, { useState, useEffect } from "react";
import { supabase, typedData } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/auth";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMediaQuery } from "@/hooks/use-media-query";

const WordPressClientUsers = () => {
  const [clientUsers, setClientUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useMediaQuery("(max-width: 767px)");

  useEffect(() => {
    const fetchClientUsers = async () => {
      try {
        setIsLoading(true);
        
        // Fetch client users
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*, wordpress_configs(name, site_url)')
          .eq('role', 'client');
        
        if (profilesError) {
          throw profilesError;
        }
        
        // Format client user data with proper type assertions
        const formattedUsers: UserProfile[] = profilesData.map(profile => {
          // Check if profile.wordpress_configs exists and has name/site_url properties
          let wordpressConfig = null;
          if (profile.wordpress_configs) {
            // Handle potential SelectQueryError
            const wpConfig = profile.wordpress_configs as any;
            if (wpConfig && typeof wpConfig === 'object' && 'name' in wpConfig && 'site_url' in wpConfig) {
              wordpressConfig = {
                name: String(wpConfig.name),
                site_url: String(wpConfig.site_url)
              };
            }
          }

          return {
            id: typedData<string>(profile.id),
            email: typedData<string>(profile.email),
            name: typedData<string>(profile.name),
            role: "client",
            clientId: typedData<string>(profile.client_id),
            wordpressConfigId: typedData<string>(profile.wordpress_config_id) || null,
            wordpressConfig: wordpressConfig
          };
        });
        
        setClientUsers(formattedUsers);
      } catch (error) {
        console.error("Error fetching client users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientUsers();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Chargement des utilisateurs clients...</span>
      </div>
    );
  }

  if (clientUsers.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Aucun utilisateur client trouvé.
        </CardContent>
      </Card>
    );
  }

  // Mobile view with cards
  if (isMobile) {
    return (
      <div className="space-y-4">
        {clientUsers.map(user => (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle className="text-lg">{user.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="text-sm font-medium">{user.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Configuration WordPress:</span>
                  {user.wordpressConfig ? (
                    <Badge variant="outline" className="font-normal">
                      {user.wordpressConfig.name}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">Non configuré</span>
                  )}
                </div>
                {user.wordpressConfig && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">URL du site:</span>
                    <a 
                      href={user.wordpressConfig.site_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {user.wordpressConfig.site_url}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Desktop view with table
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Configuration WordPress</TableHead>
            <TableHead>URL du site</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientUsers.map(user => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                {user.wordpressConfig ? (
                  <Badge variant="outline">{user.wordpressConfig.name}</Badge>
                ) : (
                  <span className="text-muted-foreground">Non configuré</span>
                )}
              </TableCell>
              <TableCell>
                {user.wordpressConfig ? (
                  <a 
                    href={user.wordpressConfig.site_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {user.wordpressConfig.site_url}
                  </a>
                ) : (
                  "-"
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default WordPressClientUsers;


import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useWordPressConfigsList } from "@/hooks/wordpress/useWordPressConfigsList";
import WordPressConnectionStatus from "./WordPressConnectionStatus";
import { ExternalLink } from "lucide-react";

const WordPressInfo = () => {
  const { user } = useAuth();
  const { getUserConfigs } = useWordPressConfigsList();
  const userSites = getUserConfigs();

  if (!user || userSites.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Mon site WordPress</CardTitle>
      </CardHeader>
      <CardContent>
        {userSites.map(site => (
          <div key={site.id} className="flex flex-col space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{site.name}</h3>
                <a
                  href={site.site_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline flex items-center gap-1 mt-1"
                >
                  {site.site_url} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <WordPressConnectionStatus configId={site.id} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default WordPressInfo;

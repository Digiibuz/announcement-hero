
import React from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WordPressPage } from "@/hooks/wordpress/useWordPressPages";
import { DipiCptCategory } from "@/types/announcement";

interface ConnectionDetailsCardProps {
  categoriesError: string | null;
  pagesError: string | null;
  hasCategories: boolean;
  hasPages: boolean;
  categories: DipiCptCategory[];
  pages: WordPressPage[];
  configDetails: { site_url?: string };
}

const ConnectionDetailsCard: React.FC<ConnectionDetailsCardProps> = ({
  categoriesError,
  pagesError,
  hasCategories,
  hasPages,
  categories,
  pages,
  configDetails
}) => {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs p-0 h-auto">
          Détails
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Données WordPress</h4>
          {categoriesError || pagesError ? (
            <div className="text-xs text-red-500">
              {categoriesError || pagesError}
            </div>
          ) : (
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Catégories:</span>
                <Badge variant={hasCategories ? "secondary" : "outline"}>
                  {hasCategories ? categories.length : 'Aucune'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Pages:</span>
                <Badge variant={hasPages ? "secondary" : "outline"}>
                  {hasPages ? pages.length : 'Aucune'}
                </Badge>
              </div>
              {configDetails.site_url && (
                <div className="mt-2 pt-2 border-t border-border">
                  <a 
                    href={configDetails.site_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline"
                  >
                    {configDetails.site_url}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default ConnectionDetailsCard;

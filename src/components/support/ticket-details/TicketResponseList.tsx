
import React from "react";
import { TicketResponse } from "@/hooks/tickets";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TicketResponseListProps {
  responses: TicketResponse[];
}

export const TicketResponseList: React.FC<TicketResponseListProps> = ({ responses }) => {
  if (!responses || responses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Réponses</h3>
      {responses.map((response, index) => (
        <div 
          key={index} 
          className={`p-4 rounded-md ${
            response.is_admin 
              ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500" 
              : "bg-muted"
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-medium">
              {response.is_admin ? `${response.username} (Support)` : response.username}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(response.created_at), 'PPP à HH:mm', { locale: fr })}
            </span>
          </div>
          <p className="whitespace-pre-wrap">{response.message}</p>
        </div>
      ))}
    </div>
  );
};

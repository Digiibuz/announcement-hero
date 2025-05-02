
import React from "react";
import { Paperclip } from "lucide-react";

interface TicketAttachmentsProps {
  attachments?: string[];
}

export const TicketAttachments: React.FC<TicketAttachmentsProps> = ({ attachments = [] }) => {
  if (!attachments.length) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium flex items-center gap-2">
        <Paperclip className="h-4 w-4" /> Pièces jointes
      </h3>
      <div className="flex flex-wrap gap-2">
        {attachments.map((attachment, index) => (
          <div 
            key={index} 
            className="border rounded-md p-2 text-sm flex items-center gap-2"
          >
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <span>{attachment}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

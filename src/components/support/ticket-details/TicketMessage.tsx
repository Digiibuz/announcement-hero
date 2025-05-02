
import React from "react";

interface TicketMessageProps {
  message: string;
}

export const TicketMessage: React.FC<TicketMessageProps> = ({ message }) => {
  return (
    <div className="p-4 bg-muted rounded-md">
      <p className="whitespace-pre-wrap">{message}</p>
    </div>
  );
};

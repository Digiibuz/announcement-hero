
import { useState } from "react";
import { ConnectionStatus } from "./types";

export const useConnectionState = () => {
  const [status, setStatus] = useState<ConnectionStatus>("unknown");
  const [isChecking, setIsChecking] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
  const updateStatus = (newStatus: ConnectionStatus, error: string | null = null) => {
    setStatus(newStatus);
    setErrorDetails(error);
  };
  
  const startChecking = () => {
    setIsChecking(true);
    setStatus("checking");
    setErrorDetails(null);
  };
  
  const finishChecking = () => {
    setIsChecking(false);
  };
  
  return {
    status,
    isChecking,
    errorDetails,
    startChecking,
    finishChecking,
    updateStatus
  };
};

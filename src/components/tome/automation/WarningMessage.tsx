
import React, { useState, useEffect } from "react";
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";

interface WarningMessageProps {
  hasNecessaryData: boolean;
  automationLogs?: string[];
}

const WarningMessage: React.FC<WarningMessageProps> = ({ 
  hasNecessaryData, 
  automationLogs = [] 
}) => {
  if (!hasNecessaryData) {
    return (
      <div className="bg-amber-100 text-amber-800 p-3 rounded-md text-sm">
        You must add categories and keywords before you can use automation.
      </div>
    );
  }
  
  if (automationLogs.length === 0) return null;
  
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mb-4">
      <h3 className="font-medium text-sm mb-2 flex items-center gap-1">
        <Clock size={16} />
        Automation Logs
      </h3>
      <div className="max-h-48 overflow-y-auto">
        <ul className="space-y-1 text-sm">
          {automationLogs.map((log, index) => {
            const isError = log.toLowerCase().includes('error') || log.toLowerCase().includes('failed');
            const isSuccess = log.toLowerCase().includes('success') || log.toLowerCase().includes('generated');
            
            return (
              <li 
                key={index} 
                className={`flex items-start gap-2 py-1 px-2 rounded ${
                  isError ? 'text-red-700 bg-red-50' : 
                  isSuccess ? 'text-green-700 bg-green-50' : 
                  'text-slate-700'
                }`}
              >
                {isError ? (
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                ) : isSuccess ? (
                  <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                ) : (
                  <Clock size={16} className="mt-0.5 flex-shrink-0" />
                )}
                <span>{log}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default WarningMessage;

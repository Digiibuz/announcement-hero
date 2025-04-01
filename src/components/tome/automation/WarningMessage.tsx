
import React from "react";

interface WarningMessageProps {
  hasNecessaryData: boolean;
}

const WarningMessage: React.FC<WarningMessageProps> = ({ hasNecessaryData }) => {
  if (hasNecessaryData) return null;
  
  return (
    <div className="bg-amber-100 text-amber-800 p-3 rounded-md text-sm">
      You must add categories and keywords before you can use automation.
    </div>
  );
};

export default WarningMessage;

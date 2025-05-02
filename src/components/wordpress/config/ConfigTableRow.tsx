
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { ConfigActions } from "@/components/wordpress/config";
import { WordPressConfig } from "@/types/wordpress";
import WordPressConnectionStatus from "@/components/wordpress/WordPressConnectionStatus";

interface ConfigTableRowProps {
  config: WordPressConfig;
  onEdit: (config: WordPressConfig) => void;
  onDelete: (id: string) => Promise<void>;
  readOnly?: boolean;
}

const ConfigTableRow: React.FC<ConfigTableRowProps> = ({
  config,
  onEdit,
  onDelete,
  readOnly = false
}) => {
  return (
    <TableRow>
      <TableCell className="font-medium">{config.name}</TableCell>
      <TableCell>{config.site_url}</TableCell>
      <TableCell className="text-center">
        <WordPressConnectionStatus configId={config.id} />
      </TableCell>
      {!readOnly && (
        <TableCell>
          <ConfigActions 
            config={config} 
            onEdit={onEdit} 
            onDelete={onDelete} 
          />
        </TableCell>
      )}
    </TableRow>
  );
};

export default ConfigTableRow;


import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { WordPressConfig } from "@/types/wordpress";
import WordPressConnectionStatus from "@/components/wordpress/WordPressConnectionStatus";
import ConfigActions from "./ConfigActions";

interface ConfigTableRowProps {
  config: WordPressConfig;
  readOnly: boolean;
  onEdit: (config: WordPressConfig) => void;
  onDelete: (id: string) => Promise<void>;
}

const ConfigTableRow: React.FC<ConfigTableRowProps> = ({
  config,
  readOnly,
  onEdit,
  onDelete,
}) => {
  return (
    <TableRow key={config.id}>
      <TableCell>{config.name}</TableCell>
      <TableCell>
        <a
          href={config.site_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          {config.site_url}
        </a>
      </TableCell>
      <TableCell className="text-center">
        <WordPressConnectionStatus configId={config.id} showDetails={true} />
      </TableCell>
      {!readOnly && (
        <TableCell className="text-right">
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

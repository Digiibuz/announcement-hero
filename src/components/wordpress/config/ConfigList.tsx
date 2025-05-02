
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WordPressConfig } from "@/types/wordpress";
import ConfigTableRow from "./ConfigTableRow";
import EditConfigDialog from "./EditConfigDialog";

interface ConfigListProps {
  configs: WordPressConfig[];
  isLoading: boolean;
  isSubmitting: boolean;
  onUpdateConfig: (id: string, data: Partial<WordPressConfig>) => Promise<void>;
  onDeleteConfig: (id: string) => Promise<void>;
  readOnly?: boolean;
}

const ConfigList: React.FC<ConfigListProps> = ({
  configs,
  isLoading,
  isSubmitting,
  onUpdateConfig,
  onDeleteConfig,
  readOnly = false,
}) => {
  const [editConfigId, setEditConfigId] = useState<string | null>(null);
  const [configToEdit, setConfigToEdit] = useState<WordPressConfig | null>(null);

  const handleEditConfig = (config: WordPressConfig) => {
    setConfigToEdit(config);
    setEditConfigId(config.id);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setEditConfigId(null);
      setConfigToEdit(null);
    }
  };

  return (
    <div className="w-full">
      <Table>
        <TableCaption>
          Liste des configurations WordPress{" "}
          {isLoading ? "(Chargement...)" : `(${configs.length})`}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>URL du site</TableHead>
            <TableHead className="text-center">Statut</TableHead>
            {!readOnly && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {configs.map((config) => (
            <ConfigTableRow
              key={config.id}
              config={config}
              readOnly={readOnly}
              onEdit={handleEditConfig}
              onDelete={onDeleteConfig}
            />
          ))}
        </TableBody>
      </Table>

      <EditConfigDialog
        open={editConfigId !== null}
        onOpenChange={handleDialogOpenChange}
        config={configToEdit}
        onUpdateConfig={onUpdateConfig}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default ConfigList;

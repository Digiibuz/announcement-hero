
import React from "react";
import { WordPressConfig } from "@/types/wordpress";
import WordPressConfigList from "@/components/wordpress/WordPressConfigList";
import ErrorAlert from "./ErrorAlert";
import NoSiteMessage from "./NoSiteMessage";
import LoadingContent from "./LoadingContent";

interface WordPressConfigContentProps {
  isClient: boolean | undefined;
  configs: WordPressConfig[];
  isLoading: boolean;
  isFetching: boolean;
  isSubmitting: boolean;
  error: string | null;
  handleUpdateConfig: (id: string, data: Partial<WordPressConfig>) => Promise<void>;
  deleteConfig: (id: string) => Promise<void>;
}

const WordPressConfigContent: React.FC<WordPressConfigContentProps> = ({
  isClient,
  configs,
  isLoading,
  isFetching,
  isSubmitting,
  error,
  handleUpdateConfig,
  deleteConfig,
}) => {
  return (
    <div className="w-full">
      <ErrorAlert error={error} />
      
      {isLoading || isFetching ? (
        <LoadingContent />
      ) : isClient && configs.length === 0 ? (
        <NoSiteMessage />
      ) : (
        <WordPressConfigList
          configs={configs}
          isLoading={isLoading || isFetching}
          isSubmitting={isSubmitting}
          onUpdateConfig={handleUpdateConfig}
          onDeleteConfig={deleteConfig}
          readOnly={isClient} // Read-only mode for clients
        />
      )}
    </div>
  );
};

export default WordPressConfigContent;

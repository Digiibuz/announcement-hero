
import React from "react";
import { WordPressConfig } from "@/types/wordpress";
import { ConfigList } from "@/components/wordpress/config";

interface WordPressConfigListProps {
  configs: WordPressConfig[];
  isLoading: boolean;
  isSubmitting: boolean;
  onUpdateConfig: (id: string, data: Partial<WordPressConfig>) => Promise<void>;
  onDeleteConfig: (id: string) => Promise<void>;
  readOnly?: boolean;
}

// This is a wrapper component to maintain backward compatibility
const WordPressConfigList: React.FC<WordPressConfigListProps> = (props) => {
  return <ConfigList {...props} />;
};

export default WordPressConfigList;

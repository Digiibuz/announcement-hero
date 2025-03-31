
import React, { forwardRef } from 'react';
import { Editor as TinyMCEEditor } from '@tinymce/tinymce-react';

interface EditorProps {
  value: string;
  onEditorChange: (content: string) => void;
  onInit?: (editor: any) => void;
  init?: Record<string, any>;
}

const Editor = forwardRef<any, EditorProps>(({ value, onEditorChange, onInit, init }, ref) => {
  return (
    <TinyMCEEditor
      apiKey="uokdf5g65zpuyzw9vg6hkysg4kej10vg2v1n3ln98uiqlv0q"
      value={value}
      onEditorChange={onEditorChange}
      onInit={onInit}
      init={{
        height: 500,
        menubar: false,
        ...init
      }}
    />
  );
});

Editor.displayName = 'Editor';

export default Editor;


import React from 'react';
import { Editor as TinyMCEEditor } from '@tinymce/tinymce-react';

interface EditorProps {
  value: string;
  onEditorChange: (content: string) => void;
  onInit?: (editor: any) => void;
  init?: any;
}

const Editor = ({ value, onEditorChange, onInit, init }: EditorProps) => {
  return (
    <TinyMCEEditor
      apiKey="no-api-key"
      value={value}
      onEditorChange={onEditorChange}
      onInit={onInit}
      init={{
        height: 500,
        menubar: false,
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor',
          'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
        ],
        toolbar: 'undo redo | blocks | ' +
          'bold italic forecolor | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist outdent indent | ' +
          'removeformat | help',
        content_style: 'body { font-family:Inter,Arial,sans-serif; font-size:16px }',
        ...init
      }}
    />
  );
};

export default Editor;

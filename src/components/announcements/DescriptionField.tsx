
import React, { useRef } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Textarea } from "@/components/ui/textarea";

// Import de l'éditeur uniquement s'il n'est pas en environnement mobile
const Editor = React.lazy(() => import('@/components/announcements/editor/Editor'));

interface DescriptionFieldProps {
  form: any;
  isForDiviPixel?: boolean;
}

const DescriptionField = ({ form, isForDiviPixel = false }: DescriptionFieldProps) => {
  const editorRef = useRef<any>(null);
  const isMobile = useMediaQuery("(max-width: 767px)");
  
  // Placeholder spécifique au type de contenu
  const placeholder = isForDiviPixel 
    ? "Entrez la description de votre page DiviPixel..." 
    : "Entrez la description de votre annonce...";

  return (
    <FormField
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Description</FormLabel>
          <FormControl>
            {isMobile ? (
              <Textarea 
                placeholder={placeholder}
                className="min-h-[200px]"
                {...field}
              />
            ) : (
              <React.Suspense fallback={<div className="h-[400px] bg-muted/20 animate-pulse rounded-md"></div>}>
                <Editor
                  value={field.value || ""}
                  onEditorChange={(content: string) => {
                    field.onChange(content);
                  }}
                  onInit={(editor: any) => {
                    editorRef.current = editor;
                  }}
                  init={{
                    plugins: [
                      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                      'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                    ],
                    toolbar: 'undo redo | blocks | ' +
                      'bold italic forecolor | alignleft aligncenter ' +
                      'alignright alignjustify | bullist numlist outdent indent | ' +
                      'removeformat | help',
                    content_style: 'body { font-family:Inter,Arial,sans-serif; font-size:16px }',
                    placeholder: placeholder,
                    height: 400
                  }}
                />
              </React.Suspense>
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default DescriptionField;

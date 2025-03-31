
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Textarea } from "@/components/ui/textarea";

// Create a simple version of the DescriptionField that doesn't rely on TinyMCE
const DescriptionField = ({ 
  form, 
  isForDiviPixel = false 
}: { 
  form: any;
  isForDiviPixel?: boolean;
}) => {
  const isMobile = useMediaQuery("(max-width: 767px)");
  
  // Placeholder specific to content type
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
            <Textarea 
              placeholder={placeholder}
              className="min-h-[200px]"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default DescriptionField;

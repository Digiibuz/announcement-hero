
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Textarea } from "@/components/ui/textarea";

// Create a simple version of the DescriptionField that doesn't rely on TinyMCE
const DescriptionField = ({ 
  form, 
  isForDiviPixel = false,
  isForPublication = false
}: { 
  form: any;
  isForDiviPixel?: boolean;
  isForPublication?: boolean;
}) => {
  const isMobile = useMediaQuery("(max-width: 767px)");
  
  // Placeholder specific to content type
  let placeholder = "Entrez la description de votre annonce...";
  
  if (isForDiviPixel) {
    placeholder = "Entrez la description de votre page DiviPixel...";
  } else if (isForPublication) {
    placeholder = "Entrez la description de votre publication...";
  }

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

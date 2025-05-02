
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { useImageUploader } from "./use-image-uploader";
import { UploadZone } from "./upload-zone";
import { ImagesGrid } from "./images-grid";

interface ImageUploaderProps {
  form: UseFormReturn<any>;
}

const ImageUploader = ({
  form
}: ImageUploaderProps) => {
  const {
    uploadedImages,
    isUploading,
    uploadProgress,
    error,
    processingCount,
    handleFileUpload,
    removeImage,
    fileInputRef,
    cameraInputRef,
    triggerFileUpload,
    triggerCameraUpload,
    handleDragOver,
    handleDrop,
    isMobile
  } = useImageUploader(form);

  return (
    <div>
      <Label>Images</Label>
      <div
        className="mt-2 border-2 border-dashed rounded-lg p-6"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Hidden input elements for file and camera */}
        <input 
          type="file" 
          ref={fileInputRef} 
          multiple 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileUpload} 
        />
        <input 
          type="file" 
          ref={cameraInputRef} 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          onChange={handleFileUpload} 
        />
        
        <UploadZone
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          error={error}
          triggerFileUpload={triggerFileUpload}
          triggerCameraUpload={triggerCameraUpload}
          isMobile={isMobile}
        />

        {(uploadedImages.length > 0 || (isUploading && processingCount > 0)) && (
          <ImagesGrid 
            images={uploadedImages}
            onRemove={removeImage}
            processingImages={isUploading}
            processingCount={processingCount}
          />
        )}
      </div>
    </div>
  );
};

export default ImageUploader;

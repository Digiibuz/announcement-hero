
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { useNetworkAwareImageUploader } from "./use-network-aware-image-uploader";
import { UploadZone } from "./upload-zone";
import { ImageGrid } from "./image-grid";

interface NetworkAwareImageUploaderProps {
  form: UseFormReturn<any>;
}

const NetworkAwareImageUploader = ({
  form
}: NetworkAwareImageUploaderProps) => {
  const {
    uploadedImages,
    isUploading,
    uploadProgress,
    error,
    isOnline,
    networkQuality,
    processingCount,
    handleFileUpload,
    removeImage,
    fileInputRef,
    cameraInputRef,
    triggerFileUpload,
    triggerCameraUpload,
    handleDragOver,
    handleDrop,
  } = useNetworkAwareImageUploader(form);

  return (
    <div>
      <label className="font-medium text-sm">Images</label>
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
          isOnline={isOnline}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          networkQuality={networkQuality}
          error={error}
          triggerFileUpload={triggerFileUpload}
          triggerCameraUpload={triggerCameraUpload}
          isMobile={false}
        />

        {(uploadedImages.length > 0 || (isUploading && processingCount > 0)) && (
          <ImageGrid 
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

export default NetworkAwareImageUploader;

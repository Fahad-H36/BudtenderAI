"use client";

import { Button } from "@/components/ui/button";
import { Paperclip } from "lucide-react";
import { useRef } from "react";
import { useToast } from "@/components/ui/use-toast";


const Attachment = ({ onUploaded, onUploading, ...props }: { 
  onUploaded: (attachmentId: string, fileName?: string, fileType?: string, fileUrl?: string) => void;
  onUploading: (uploading: boolean) => void;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  [key: string]: unknown;
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Normalize file extension to lowercase if it's an image
    let processedFile = file;
    if (file.name.match(/\.(png|jpg|jpeg|gif|webp|PNG|JPG|JPEG|GIF|WEBP)$/i)) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const fileNameWithoutExtension = file.name.substring(0, file.name.lastIndexOf('.'));
      const newFileName = `${fileNameWithoutExtension}.${fileExtension}`;
      
      // Create a new file with the lowercase extension
      processedFile = new File([file], newFileName, { type: file.type });
    }

    // Create a local file URL for preview immediately, before upload
    let localFileUrl;
    try {
      if (processedFile.type.startsWith('image/')) {
        localFileUrl = URL.createObjectURL(processedFile);
        console.log("Created local URL for preview:", localFileUrl);
      }
    } catch (err) {
      console.error("Failed to create object URL for preview:", err);
    }

    const formData = new FormData();
    formData.append("file", processedFile);

    onUploading(true);
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload file");
      }

      const data = await response.json();
      
      // Pass file details to the parent component
      onUploaded(
        data.file, 
        processedFile.name, 
        processedFile.type,
        localFileUrl // Use the local URL created before upload
      );
      
      toast({
        description: "File uploaded successfully.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      // Revoke the object URL if upload fails
      if (localFileUrl) {
        URL.revokeObjectURL(localFileUrl);
      }
      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : "Failed to upload file",
      });
    } finally {
      onUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };


  return (
    <>
    <input
      type="file"
      ref={fileInputRef}
      style={{ display: 'none' }}
      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
      onChange={handleFileUpload}
    />
    <Button
      {...props}
      variant="secondary"
      type="button"
      onClick={handleClick}
    >
      {(
        <Paperclip className="scale-90" />
      )}
    </Button>
    </>
  );
};

export default Attachment;

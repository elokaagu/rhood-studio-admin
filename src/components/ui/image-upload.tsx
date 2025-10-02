"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  label?: string;
  required?: boolean;
  maxSize?: number; // in MB
  acceptedFormats?: string[];
  className?: string;
  bucketName?: string;
  folder?: string;
}

export function ImageUpload({
  value,
  onChange,
  label = "Image",
  required = false,
  maxSize = 5, // 5MB default
  acceptedFormats = ["image/jpeg", "image/png", "image/webp"],
  className = "",
  bucketName = "opportunities",
  folder = "images",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Generate unique filename
  const generateFileName = (originalName: string) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split(".").pop();
    return `${timestamp}-${randomString}.${extension}`;
  };

  // Upload image to Supabase Storage
  const uploadImage = useCallback(
    async (file: File) => {
      try {
        setIsUploading(true);

        // Validate file size
        if (file.size > maxSize * 1024 * 1024) {
          throw new Error(`File size must be less than ${maxSize}MB`);
        }

        // Validate file type
        if (!acceptedFormats.includes(file.type)) {
          throw new Error(`File must be one of: ${acceptedFormats.join(", ")}`);
        }

        // Generate unique filename
        const fileName = generateFileName(file.name);
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          throw error;
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from(bucketName).getPublicUrl(filePath);

        console.log("Generated public URL:", publicUrl);
        return publicUrl;
      } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [bucketName, folder, maxSize, acceptedFormats]
  );

  // Handle file selection
  const handleFileSelect = useCallback(
    async (file: File) => {
      try {
        // Create preview
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);

        // Upload image
        const imageUrl = await uploadImage(file);
        console.log("Upload successful, image URL:", imageUrl);

        onChange(imageUrl);

        // Test if the uploaded image is accessible
        const testImage = document.createElement("img");
        testImage.onload = () => {
          console.log("Image loaded successfully:", imageUrl);
          // Clean up preview URL and set to uploaded URL
          URL.revokeObjectURL(previewUrl);
          setPreview(imageUrl);
        };
        testImage.onerror = () => {
          console.error("Failed to load uploaded image:", imageUrl);
          // Keep the local preview if uploaded image fails to load
          toast({
            title: "Warning",
            description:
              "Image uploaded but preview unavailable. Image will still be saved.",
            variant: "destructive",
          });
        };
        testImage.src = imageUrl;

        toast({
          title: "Success",
          description: "Image uploaded successfully!",
        });
      } catch (error) {
        console.error("Error handling file:", error);
        toast({
          title: "Upload Failed",
          description:
            error instanceof Error ? error.message : "Failed to upload image",
          variant: "destructive",
        });
        setPreview(null);
        onChange(null);
      }
    },
    [uploadImage, onChange, toast]
  );

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Remove image
  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Trigger file input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label className="text-foreground">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      <Card
        className={`border-2 border-dashed transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="p-6">
          {preview ? (
            <div className="relative">
              <div className="relative w-full h-48 rounded-lg overflow-hidden">
                <Image
                  src={preview}
                  alt="Upload preview"
                  fill
                  className="object-cover transition-opacity duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                  loading="eager"
                  priority={true}
                  onError={(e) => {
                    console.error("Image failed to load:", preview);
                    console.error("Image error event:", e);
                  }}
                  onLoad={() => {
                    console.log(
                      "Image loaded successfully in component:",
                      preview
                    );
                  }}
                  unoptimized={true}
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleRemove}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <div className="flex flex-col items-center space-y-4">
                {isUploading ? (
                  <>
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">
                      Uploading...
                    </p>
                  </>
                ) : (
                  <>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">
                        Drop your image here, or{" "}
                        <button
                          type="button"
                          onClick={triggerFileInput}
                          className="text-primary hover:text-primary/80 underline"
                        >
                          browse
                        </button>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports:{" "}
                        {acceptedFormats.join(", ").replace("image/", "")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Max size: {maxSize}MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={triggerFileInput}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(",")}
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
}

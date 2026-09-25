"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { uploadBrandAvatar } from "@/lib/brand/upload-brand-avatar";

export function photoPromptDismissKey(userId: string) {
  return `rhood-studio-photo-prompt:${userId}`;
}

type Props = {
  userId: string;
  brandName: string;
  open: boolean;
  onUploaded: () => void;
  onDismiss: () => void;
};

export function BrandProfilePhotoDialog({
  userId,
  brandName,
  open,
  onUploaded,
  onDismiss,
}: Props) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const result = await uploadBrandAvatar(userId, file);
      if (!result.ok) {
        toast({
          title: "Upload failed",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Logo added",
        description: "DJs will see this on your opportunities and booking requests.",
      });
      onUploaded();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isUploading) onDismiss();
      }}
    >
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add your brand logo</DialogTitle>
          <DialogDescription>
            {brandName} does not have a profile photo yet. DJs see this on
            opportunities, booking requests, and your Studio profile. Square
            logo files are best.
          </DialogDescription>
        </DialogHeader>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="mx-auto flex h-28 w-28 items-center justify-center rounded-2xl border border-dashed border-brand-green/50 bg-secondary text-muted-foreground transition-colors hover:border-brand-green hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
          aria-label="Upload brand logo"
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-brand-green" />
          ) : (
            <Camera className="h-8 w-8" />
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            void handleFile(file);
          }}
        />
        <p className="text-center text-xs text-muted-foreground">
          JPEG, PNG, or WebP. Square logo files are best.
        </p>

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={onDismiss}
            disabled={isUploading}
          >
            Maybe later
          </Button>
          <Button
            type="button"
            className="bg-brand-green text-brand-black hover:bg-brand-green/90"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? "Uploading…" : "Upload logo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

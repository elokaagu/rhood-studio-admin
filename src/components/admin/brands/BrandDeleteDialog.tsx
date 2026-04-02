"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { textStyles } from "@/lib/typography";
import { Trash2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberName: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function BrandDeleteDialog({
  open,
  onOpenChange,
  memberName,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle
            className={`${textStyles.subheading.large} text-brand-white`}
          >
            Delete Brand
          </DialogTitle>
          <DialogDescription className={textStyles.body.regular}>
            Are you sure you want to delete &quot;{memberName}&quot;? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            className="text-foreground border-border hover:bg-secondary"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

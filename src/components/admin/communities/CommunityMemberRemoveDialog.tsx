"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { CommunityMemberView } from "@/lib/communities/community-detail-types";
import { Users } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: CommunityMemberView | null;
  onConfirm: () => void;
};

export function CommunityMemberRemoveDialog({
  open,
  onOpenChange,
  member,
  onConfirm,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border/50 backdrop-blur-sm shadow-2xl max-w-md">
        <AlertDialogHeader className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-brand-green/20 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-brand-green" />
            </div>
            <AlertDialogTitle className="font-ts-block ts-lg uppercase text-brand-white tracking-wide">
              Remove Member
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="font-helvetica-regular helvetica-base text-muted-foreground">
            Are you sure you want to remove{" "}
            <span className="font-helvetica-bold text-brand-white">
              {member?.user_name}
            </span>{" "}
            from this community? They will no longer have access to community
            messages and private chats.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="space-x-3">
          <AlertDialogCancel
            className="border-border/50 text-brand-white hover:bg-muted/50 hover:border-brand-green/50 font-helvetica-regular helvetica-base transition-all duration-300"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-helvetica-bold helvetica-base shadow-glow-primary transition-all duration-300"
            onClick={onConfirm}
          >
            Remove Member
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

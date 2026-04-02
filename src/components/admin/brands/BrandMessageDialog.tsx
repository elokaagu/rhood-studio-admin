"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { textStyles } from "@/lib/typography";
import type { BrandMember } from "@/lib/brands/types";
import { Mail, X } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: BrandMember | null;
  messageContent: string;
  onMessageContentChange: (v: string) => void;
  onSend: () => void;
  onCancel: () => void;
};

export function BrandMessageDialog({
  open,
  onOpenChange,
  member,
  messageContent,
  onMessageContentChange,
  onSend,
  onCancel,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-brand-black border-brand-green/20 text-foreground max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-brand-green font-bold flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Message Brand
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {member &&
              `Sending message to ${member.name} (${member.email})`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label htmlFor="message-text" className={textStyles.body.regular}>
            Message
          </Label>
          <Textarea
            id="message-text"
            placeholder="Enter your message..."
            value={messageContent}
            onChange={(e) => onMessageContentChange(e.target.value)}
            className="bg-secondary border-border text-foreground min-h-[150px] mt-2"
          />
        </div>

        <DialogFooter className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-border text-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSend}
            className="bg-brand-green text-brand-black hover:bg-brand-green/90"
            disabled={!messageContent.trim()}
          >
            <Mail className="h-4 w-4 mr-2" />
            Send Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

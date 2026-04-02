"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { textStyles } from "@/lib/typography";
import { UserPlus, X } from "lucide-react";

export function BrandInviteSection() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Invite Sent",
      description: `Invite sent to ${inviteFormData.name} (${inviteFormData.email})!`,
    });
    setInviteFormData({ name: "", email: "", message: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-brand-green text-brand-black hover:bg-brand-green/90 w-full sm:w-auto">
          <UserPlus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Invite Brand</span>
          <span className="sm:hidden">Invite</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={textStyles.subheading.large}>
            Invite New Brand
          </DialogTitle>
          <DialogDescription className={textStyles.body.regular}>
            Send an invitation to join the R/HOOD community as a brand
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleInviteSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className={textStyles.body.regular}>
              Brand Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter brand name"
              value={inviteFormData.name}
              onChange={(e) =>
                setInviteFormData({ ...inviteFormData, name: e.target.value })
              }
              className="bg-secondary border-border text-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className={textStyles.body.regular}>
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={inviteFormData.email}
              onChange={(e) =>
                setInviteFormData({ ...inviteFormData, email: e.target.value })
              }
              className="bg-secondary border-border text-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className={textStyles.body.regular}>
              Personal Message (Optional)
            </Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to the invitation..."
              value={inviteFormData.message}
              onChange={(e) =>
                setInviteFormData({
                  ...inviteFormData,
                  message: e.target.value,
                })
              }
              className="bg-secondary border-border text-foreground min-h-[100px]"
            />
          </div>

          <DialogFooter className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setInviteFormData({ name: "", email: "", message: "" });
                setOpen(false);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-brand-green text-brand-black hover:bg-brand-green/90"
              disabled={!inviteFormData.name || !inviteFormData.email}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Send Invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

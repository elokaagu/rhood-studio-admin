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
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserPlus, X } from "lucide-react";
import { upsertContactFromInvite } from "@/lib/crm/service";

export function BrandInviteSection() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const brandName = inviteFormData.name.trim();
    const email = inviteFormData.email.trim();
    if (!brandName || !email) return;

    setIsSending(true);
    try {
      const { data, error } = await (
        supabase as unknown as {
          rpc: (fn: string, args?: Record<string, unknown>) => Promise<{
            data: { code?: string; expires_at?: string | null } | null;
            error: { message?: string } | null;
          }>;
        }
      ).rpc("create_brand_invite_code", {
        p_brand_name: brandName,
        p_expires_in_days: 30,
      });

      if (error || !data?.code) {
        throw new Error(error?.message || "Failed to create an invite code.");
      }

      const response = await fetch("/api/notifications/brand-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          brandName,
          inviteCode: data.code,
          expiresAt: data.expires_at ?? null,
          message: inviteFormData.message.trim() || null,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          payload.message ||
            payload.error ||
            "Invite code was created, but the email could not be sent."
        );
      }

      const crm = await upsertContactFromInvite({
        name: brandName,
        email,
        category: "Brand",
        note: inviteFormData.message.trim() || "Invited to create a brand account.",
      });

      toast({
        title: "Invite sent",
        description: crm.ok
          ? `Emailed ${brandName} at ${email} with code ${data.code}, and added them to Launch CRM.`
          : `Emailed ${brandName} at ${email} with code ${data.code}. Launch CRM could not be updated.`,
      });
      setInviteFormData({ name: "", email: "", message: "" });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Invite failed",
        description:
          error instanceof Error
            ? error.message
            : "Could not send the brand invite.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
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
            Send an invitation to join R/HOOD For Brands. They will also appear in Launch CRM as Contacted.
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
              disabled={isSending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-brand-green text-brand-black hover:bg-brand-green/90"
              disabled={!inviteFormData.name || !inviteFormData.email || isSending}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              {isSending ? "Sending..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

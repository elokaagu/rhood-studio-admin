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

type Props = {
  brandAccountId: string;
  brandName: string;
  triggerClassName?: string;
};

function rpcUntyped(fn: string, args: Record<string, unknown>) {
  return (
    supabase as unknown as {
      rpc: (
        name: string,
        params?: Record<string, unknown>
      ) => Promise<{
        data: unknown;
        error: { message?: string } | null;
      }>;
    }
  ).rpc(fn, args);
}

export function BrandTeammateInviteDialog({
  brandAccountId,
  brandName,
  triggerClassName,
}: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const reset = () => {
    setEmail("");
    setMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    setIsSending(true);
    try {
      const linkResult = await rpcUntyped("link_brand_teammate_by_email", {
        p_brand_account_id: brandAccountId,
        p_email: trimmedEmail,
      });
      const linked =
        linkResult.data &&
        typeof linkResult.data === "object" &&
        (linkResult.data as { linked?: boolean }).linked === true;

      if (!linkResult.error && linked) {
        toast({
          title: "Teammate added",
          description: `${trimmedEmail} now shares the ${brandName} account.`,
        });
        reset();
        setOpen(false);
        return;
      }

      const linkMissing =
        !!linkResult.error &&
        /does not exist|schema cache|could not find the function/i.test(
          linkResult.error.message || ""
        );
      if (linkResult.error && !linkMissing) {
        throw new Error(linkResult.error.message);
      }

      const { data, error } = await rpcUntyped(
        "create_brand_teammate_invite_code",
        {
          p_brand_account_id: brandAccountId,
          p_expires_in_days: 30,
        }
      );
      const invite = data as { code?: string; expires_at?: string | null } | null;

      if (error || !invite?.code) {
        throw new Error(
          error?.message ||
            linkResult.error?.message ||
            "Failed to create a teammate invite. Run the brand teammate SQL in Studio if this is the first invite."
        );
      }

      const response = await fetch("/api/notifications/brand-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          brandName,
          inviteCode: invite.code,
          expiresAt: invite.expires_at ?? null,
          message: message.trim() || null,
          teammate: true,
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

      toast({
        title: "Teammate invited",
        description: `Emailed ${trimmedEmail} a code to join ${brandName}.`,
      });
      reset();
      setOpen(false);
    } catch (error) {
      toast({
        title: "Invite failed",
        description:
          error instanceof Error
            ? error.message
            : "Could not invite this teammate.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={
            triggerClassName ||
            "text-xs sm:text-sm flex-1 sm:flex-initial"
          }
        >
          <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          <span className="hidden sm:inline">Invite teammate</span>
          <span className="sm:hidden">Teammate</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={textStyles.subheading.large}>
            Invite teammate
          </DialogTitle>
          <DialogDescription className={textStyles.body.regular}>
            Give another person the same {brandName} account — listings,
            applications, and bookings stay shared. If they already have a
            login, they are added immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teammate-email" className={textStyles.body.regular}>
              Email Address
            </Label>
            <Input
              id="teammate-email"
              type="email"
              placeholder="colleague@brand.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-secondary border-border text-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teammate-message" className={textStyles.body.regular}>
              Personal Message (Optional)
            </Label>
            <Textarea
              id="teammate-message"
              placeholder="Add a note to the invitation..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-secondary border-border text-foreground min-h-[100px]"
            />
          </div>

          <DialogFooter className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
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
              disabled={!email.trim() || isSending}
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

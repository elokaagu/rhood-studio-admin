"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { portalAuthRedirectUrl } from "@/lib/portal-url";
import { textStyles } from "@/lib/typography";

export function ForgotPasswordForm({
  initialEmail,
  onBack,
}: {
  initialEmail: string;
  onBack: () => void;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const address = email.trim();
    if (!address) return;
    setSending(true);
    setError(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(address, {
      redirectTo: portalAuthRedirectUrl("/reset-password"),
    });
    setSending(false);
    // Same confirmation whether or not the account exists, so the form can't
    // be used to discover which emails are registered.
    if (resetError && /rate limit|too many/i.test(resetError.message)) {
      setError("Too many reset emails requested. Please wait a few minutes and try again.");
      return;
    }
    setSentTo(address);
  };

  if (sentTo) {
    return (
      <div className="space-y-4 text-center">
        <MailCheck className="mx-auto h-10 w-10 text-primary" />
        <p className={textStyles.body.regular}>
          If an account exists for <span className="font-medium break-all">{sentTo}</span>,
          we&apos;ve sent a link to reset your password. It can take a minute to arrive;
          check your spam folder too.
        </p>
        <Button type="button" variant="outline" className="w-full" onClick={onBack}>
          Back to sign in
        </Button>
        <button
          type="button"
          onClick={() => setSentTo(null)}
          className={`${textStyles.body.small} text-primary hover:underline`}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className={`${textStyles.body.small} text-muted-foreground`}>
        Enter the email you sign in with and we&apos;ll send you a link to choose a new
        password.
      </p>
      <div className="space-y-2">
        <Label htmlFor="reset-email" className={textStyles.body.regular}>
          Email
        </Label>
        <Input
          id="reset-email"
          type="email"
          autoComplete="username"
          placeholder="team@rhood.io"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-secondary border-border text-foreground"
          required
          autoFocus
        />
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <Button
        type="submit"
        variant="premium"
        size="lg"
        className="w-full"
        disabled={sending || !email.trim()}
      >
        {sending ? "Sending link..." : "Send reset link"}
      </Button>
      <button
        type="button"
        onClick={onBack}
        className={`block w-full text-center ${textStyles.body.small} text-primary hover:underline`}
      >
        Back to sign in
      </button>
    </form>
  );
}

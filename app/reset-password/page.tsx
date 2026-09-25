"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { textStyles } from "@/lib/typography";

const MIN_PASSWORD_LENGTH = 8;
const LINK_CHECK_TIMEOUT_MS = 5000;

type LinkState = "checking" | "ready" | "invalid";

function linkErrorFromUrl(): string | null {
  const hash = new URLSearchParams(window.location.hash.substring(1));
  const query = new URLSearchParams(window.location.search);
  const description =
    hash.get("error_description") || query.get("error_description");
  const code = hash.get("error_code") || query.get("error_code");
  if (code === "otp_expired") {
    return "This reset link has expired or has already been used.";
  }
  return description ? description.replace(/\+/g, " ") : null;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [linkState, setLinkState] = useState<LinkState>("checking");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let settled = false;
    const markReady = () => {
      settled = true;
      setLinkState("ready");
    };
    const markInvalid = (message: string) => {
      settled = true;
      setLinkError(message);
      setLinkState("invalid");
    };

    const urlError = linkErrorFromUrl();
    if (urlError) {
      markInvalid(urlError);
      return;
    }

    // The Supabase client signs the user in from the link's URL tokens and
    // emits PASSWORD_RECOVERY; PKCE links arrive as ?code= instead.
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")) {
        markReady();
      }
    });

    const check = async () => {
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          markInvalid("This reset link has expired or has already been used.");
          return;
        }
        markReady();
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) markReady();
    };
    void check();

    const timeout = window.setTimeout(() => {
      if (!settled) markInvalid("This reset link is invalid or has expired.");
    }, LINK_CHECK_TIMEOUT_MS);

    return () => {
      subscription.subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (password.length < MIN_PASSWORD_LENGTH) {
      setFormError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setFormError("The passwords don't match.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      setFormError(error.message || "Couldn't update your password. Please try again.");
      return;
    }
    window.history.replaceState(null, "", "/reset-password");
    toast({
      title: "Password updated",
      description: "You're signed in with your new password.",
    });
    router.push("/admin/dashboard");
  };

  return (
    <div className="w-full max-w-md p-4">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Image
            src="/RHOOD_Lettering_Logo.png"
            alt="R/HOOD"
            width={200}
            height={60}
            className="h-16 w-auto"
            priority
          />
        </div>
        <p className={textStyles.headline.section}>PORTAL MANAGEMENT</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className={`text-center ${textStyles.headline.card}`}>
            NEW
            <br />
            PASSWORD
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {linkState === "checking" ? (
            <div className="flex items-center justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
            </div>
          ) : linkState === "invalid" ? (
            <div className="space-y-4 text-center">
              <p className={textStyles.body.regular}>{linkError}</p>
              <p className={`${textStyles.body.small} text-muted-foreground`}>
                Request a new link from the sign-in page.
              </p>
              <Button asChild variant="premium" size="lg" className="w-full">
                <Link href="/login">Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className={textStyles.body.regular}>
                  New password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className={textStyles.body.regular}>
                  Confirm new password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                  required
                />
              </div>
              {formError ? <p className="text-sm text-red-400">{formError}</p> : null}
              <Button
                type="submit"
                variant="premium"
                size="lg"
                className="w-full"
                disabled={saving || !password || !confirm}
              >
                {saving ? "Saving..." : "Save new password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

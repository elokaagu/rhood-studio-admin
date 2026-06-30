"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { textStyles } from "@/lib/typography";
import {
  initiateCheckout,
  type BrandSubscription,
} from "@/lib/brand/subscription";
import { CreditCard, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

const STRIPE_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID ?? "";

function StatusBadge({ status }: { status: BrandSubscription["status"] | null }) {
  if (!status || status === "inactive") {
    return <Badge variant="secondary">No subscription</Badge>;
  }
  if (status === "active") {
    return (
      <Badge className="bg-brand-green/20 text-brand-green border-brand-green/30">
        Active
      </Badge>
    );
  }
  if (status === "past_due") {
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
        Past due
      </Badge>
    );
  }
  if (status === "cancelled") {
    return <Badge variant="destructive">Cancelled</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>;
}

function StatusIcon({ status }: { status: BrandSubscription["status"] | null }) {
  if (status === "active") return <CheckCircle className="h-5 w-5 text-brand-green" />;
  if (status === "past_due") return <AlertCircle className="h-5 w-5 text-yellow-400" />;
  if (status === "cancelled") return <XCircle className="h-5 w-5 text-red-500" />;
  return <CreditCard className="h-5 w-5 text-muted-foreground" />;
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface BrandSubscriptionCardProps {
  subscription: BrandSubscription | null;
  userId: string;
}

export function BrandSubscriptionCard({
  subscription,
  userId,
}: BrandSubscriptionCardProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!STRIPE_PRICE_ID) {
      toast({
        title: "Configuration error",
        description:
          "NEXT_PUBLIC_STRIPE_PRICE_ID is not set. Add it to .env.local.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const origin = window.location.origin;
      const result = await initiateCheckout(
        STRIPE_PRICE_ID,
        `${origin}/admin/brand/profile?subscribed=1`,
        `${origin}/admin/brand/profile?cancelled=1`
      );

      if (!result.ok) {
        toast({
          title: "Checkout failed",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      window.location.href = result.checkoutUrl;
    } catch {
      toast({
        title: "Checkout failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const status = subscription?.status ?? null;
  const isActive = status === "active";
  const opportunitiesRemaining = isActive
    ? Math.max(0, 1 - (subscription?.opportunities_used_this_period ?? 0))
    : 0;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className={textStyles.subheading.large}>Subscription</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Status row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon status={status} />
            <span className={textStyles.body.regular}>Plan status</span>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Period info */}
        {isActive && subscription?.current_period_end && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className={textStyles.body.regular}>Renews</span>
            </div>
            <span className={`${textStyles.body.small} text-muted-foreground`}>
              {formatDate(subscription.current_period_end)}
            </span>
          </div>
        )}

        {/* Opportunities */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className={textStyles.body.regular}>Opportunity posts remaining</span>
          <span
            className={`font-semibold ${
              isActive
                ? opportunitiesRemaining > 0
                  ? "text-brand-green"
                  : "text-muted-foreground"
                : "text-muted-foreground"
            }`}
          >
            {isActive ? `${opportunitiesRemaining} / 1` : "—"}
          </span>
        </div>

        {/* CTA */}
        {!isActive && (
          <Button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full bg-brand-green text-brand-black hover:bg-brand-green/90 font-semibold"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-black border-t-transparent" />
                Redirecting…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Subscribe to post opportunities
              </span>
            )}
          </Button>
        )}

        {status === "past_due" && (
          <p className={`${textStyles.body.small} text-yellow-400 text-center`}>
            Your last payment failed. Please update your payment method in Stripe.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Coins,
  FileSignature,
  FileText,
} from "lucide-react";
import { textStyles } from "@/lib/typography";
import { formatBookingEventDate } from "@/lib/date-utils";
import type { BrandAcceptedContract } from "@/lib/brand/types";
import { AgreementDialog } from "./AgreementDialog";

type Props = {
  contracts: BrandAcceptedContract[];
  brandName: string;
  onViewDetails: (contractId: string) => void;
  onAgreementSigned: (contractId: string, signedAt: string, signedBy: string) => void;
};

function currencySymbol(code: string) {
  if (code === "GBP") return "£";
  if (code === "USD") return "$";
  return "€";
}

export function BrandContractsList({
  contracts,
  brandName,
  onViewDetails,
  onAgreementSigned,
}: Props) {
  const [agreementContractId, setAgreementContractId] = useState<string | null>(null);
  const activeContract = contracts.find((c) => c.id === agreementContractId) ?? null;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className={textStyles.subheading.large}>Agreements</CardTitle>
          {contracts.length > 0 && (
            <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
              {contracts.length} contract{contracts.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No agreements yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Accepted booking requests will appear here for you to sign.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.map((contract) => {
              const isSigned = !!contract.agreement_signed_at;
              return (
                <div
                  key={contract.id}
                  className="relative rounded-xl border border-border bg-secondary/30 p-4 sm:p-5 hover:border-border/80 transition-colors"
                >
                  {/* Left accent bar */}
                  <div
                    className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${
                      isSigned ? "bg-brand-green" : "bg-yellow-500"
                    }`}
                  />

                  <div className="pl-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2.5">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base text-foreground truncate">
                            {contract.event_title}
                          </h3>
                          <Badge
                            variant="outline"
                            className={
                              isSigned
                                ? "border-brand-green/50 text-brand-green text-[10px] px-1.5 py-0"
                                : "border-yellow-500/50 text-yellow-400 text-[10px] px-1.5 py-0"
                            }
                          >
                            {isSigned ? "Signed" : "Awaiting signature"}
                          </Badge>
                        </div>
                        {contract.dj_profile && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            with {contract.dj_profile.dj_name}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatBookingEventDate(contract.event_date)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {contract.location}
                        </span>
                        {contract.payment_amount && (
                          <span className="flex items-center gap-1.5">
                            <Coins className="h-3.5 w-3.5" />
                            {currencySymbol(contract.payment_currency)}
                            {contract.payment_amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(contract.id)}
                        className="text-xs h-8 border-border hover:border-foreground/30"
                      >
                        View details
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setAgreementContractId(contract.id)}
                        className="text-xs h-8 bg-brand-green text-brand-black hover:bg-brand-green/90 font-semibold"
                      >
                        <FileSignature className="h-3.5 w-3.5 mr-1.5" />
                        {isSigned ? "View agreement" : "Sign"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {activeContract && (
        <AgreementDialog
          contract={activeContract}
          brandName={brandName}
          open={!!agreementContractId}
          onOpenChange={(open) => { if (!open) setAgreementContractId(null); }}
          onSigned={(contractId, signedAt, signedBy) => {
            onAgreementSigned(contractId, signedAt, signedBy);
          }}
        />
      )}
    </Card>
  );
}

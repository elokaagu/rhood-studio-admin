"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, FileSignature } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { textStyles } from "@/lib/typography";
import { buildAgreementClauses } from "@/lib/brand/agreement-template";
import { signBrandAgreement } from "@/lib/brand/sign-agreement";
import type { BrandAcceptedContract } from "@/lib/brand/types";

type Props = {
  contract: BrandAcceptedContract;
  brandName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSigned: (contractId: string, signedAt: string, signedBy: string) => void;
};

export function AgreementDialog({
  contract,
  brandName,
  open,
  onOpenChange,
  onSigned,
}: Props) {
  const { toast } = useToast();
  const [signerName, setSignerName] = useState("");
  const [isSigning, setIsSigning] = useState(false);

  const clauses = buildAgreementClauses(contract, brandName);
  const isSigned = !!contract.agreement_signed_at;

  const handleSign = async () => {
    setIsSigning(true);
    try {
      const result = await signBrandAgreement(contract.id, signerName);
      if (!result.ok) {
        toast({
          title: "Unable to sign",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Agreement signed",
        description: `Signed by ${result.signed_by}.`,
      });
      onSigned(contract.id, result.signed_at, result.signed_by);
      setSignerName("");
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className={textStyles.subheading.small}>
            Performance Agreement
          </DialogTitle>
          <DialogDescription>
            {contract.event_title} — review the terms below before signing.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-4">
            {clauses.map((clause) => (
              <div key={clause.heading}>
                <h4 className="text-sm font-semibold text-foreground">
                  {clause.heading}
                </h4>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                  {clause.body}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Separator />

        {isSigned ? (
          <div className="flex items-center gap-2 text-sm text-green-500">
            <CheckCircle className="h-4 w-4" />
            <span>
              Signed by {contract.agreement_signed_by} on{" "}
              {new Date(contract.agreement_signed_at as string).toLocaleDateString(
                "en-GB"
              )}
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="signer-name">Type your full name to sign</Label>
              <Input
                id="signer-name"
                placeholder="e.g. Jane Smith"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!isSigned && (
            <Button
              onClick={handleSign}
              disabled={isSigning || !signerName.trim()}
              className="bg-brand-green text-brand-black hover:bg-brand-green/90"
            >
              <FileSignature className="h-4 w-4 mr-2" />
              {isSigning ? "Signing..." : "Sign Agreement"}
            </Button>
          )}
          {isSigned && (
            <Badge variant="outline" className="border-green-500 text-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Signed
            </Badge>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

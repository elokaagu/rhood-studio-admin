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
import { FileSignature } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { textStyles } from "@/lib/typography";
import { buildStudioAgreementClauses } from "@/lib/brand/studio-agreement";
import { signStudioAgreement } from "@/lib/brand/sign-studio-agreement";

type Props = {
  userId: string;
  brandName: string;
  open: boolean;
  required?: boolean;
  signedAt?: string | null;
  signedBy?: string | null;
  onSigned: (signedAt: string, signedBy: string) => void;
  onOpenChange?: (open: boolean) => void;
};

export function StudioAgreementDialog({
  userId,
  brandName,
  open,
  required = false,
  signedAt = null,
  signedBy = null,
  onSigned,
  onOpenChange,
}: Props) {
  const { toast } = useToast();
  const [signerName, setSignerName] = useState("");
  const [isSigning, setIsSigning] = useState(false);
  const clauses = buildStudioAgreementClauses(brandName);

  const alreadySigned = !!signedAt;

  const handleSign = async () => {
    setIsSigning(true);
    try {
      const result = await signStudioAgreement(userId, signerName);
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
      setSignerName("");
      onSigned(result.signed_at, result.signed_by);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (required && next === false) return;
        onOpenChange?.(next);
      }}
    >
      <DialogContent
        className={`bg-card border-border max-w-[95vw] sm:max-w-2xl ${
          required ? "[&>button.absolute]:hidden" : ""
        }`}
        onPointerDownOutside={required ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={required ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader>
          <DialogTitle className={textStyles.subheading.small}>
            R/HOOD Studio Brand Agreement
          </DialogTitle>
          <DialogDescription>
            Type your full name to accept these terms and start using Studio.
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

        {alreadySigned ? (
          <p className="text-sm text-green-500">
            Signed by {signedBy} on{" "}
            {signedAt
              ? new Date(signedAt).toLocaleDateString("en-GB")
              : ""}
          </p>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="studio-signer-name">Type your full name to sign</Label>
            <Input
              id="studio-signer-name"
              placeholder="e.g. Jane Smith"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              className="bg-secondary border-border text-foreground"
            />
          </div>
        )}

        <DialogFooter>
          {!required && (
            <Button variant="outline" onClick={() => onOpenChange?.(false)}>
              Close
            </Button>
          )}
          {!alreadySigned && (
            <Button
              onClick={handleSign}
              disabled={isSigning || !signerName.trim()}
              className="bg-brand-green text-brand-black hover:bg-brand-green/90"
            >
              <FileSignature className="h-4 w-4 mr-2" />
              {isSigning ? "Signing..." : "Sign Agreement"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

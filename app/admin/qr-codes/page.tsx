"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUserProfile } from "@/lib/auth-utils";
import { loginPathWithNext } from "@/lib/auth/login-redirect";
import { supabase } from "@/integrations/supabase/client";
import {
  createQrCode,
  deleteQrCode,
  listQrCodes,
  setQrCodeActive,
  type QrCodeRow,
} from "@/lib/qr/service";
import { defaultQrDestinationUrl } from "@/lib/qr/constants";
import { renderBrandedQrPng } from "@/lib/qr/branded-qr";
import { Download, Loader2, QrCode, Plus } from "lucide-react";

export default function QrCodesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [codes, setCodes] = useState<QrCodeRow[]>([]);
  const [opportunities, setOpportunities] = useState<
    Array<{ id: string; title: string | null }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [opportunityId, setOpportunityId] = useState<string>("none");
  const [destinationUrl, setDestinationUrl] = useState(defaultQrDestinationUrl());
  const [preview, setPreview] = useState<QrCodeRow | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<QrCodeRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const profile = await getCurrentUserProfile();
    if (!profile) {
      router.push(loginPathWithNext("/admin/qr-codes"));
      return;
    }
    if (profile.role !== "admin") {
      toast({
        title: "R/HOOD team only",
        description: "QR activations are for admins.",
        variant: "destructive",
      });
      router.push("/admin/dashboard");
      return;
    }
    setIsLoading(true);
    const [codesResult, oppResult] = await Promise.all([
      listQrCodes(),
      supabase
        .from("opportunities")
        .select("id, title")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    if (!codesResult.ok) {
      toast({
        title: "Could not load QR codes",
        description: codesResult.message,
        variant: "destructive",
      });
      setCodes([]);
    } else {
      setCodes(codesResult.codes);
    }
    setOpportunities((oppResult.data as Array<{ id: string; title: string | null }>) || []);
    setIsLoading(false);
  }, [router, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!preview) {
      setPreviewDataUrl(null);
      return;
    }
    let cancelled = false;
    setPreviewDataUrl(null);
    renderBrandedQrPng(preview.shortUrl)
      .then((dataUrl) => {
        if (!cancelled) setPreviewDataUrl(dataUrl);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        toast({
          title: "Could not draw QR code",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
        setPreview(null);
      });
    return () => {
      cancelled = true;
    };
  }, [preview, toast]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await createQrCode({
      name,
      opportunityId: opportunityId === "none" ? null : opportunityId,
      destinationUrl: destinationUrl.trim() || defaultQrDestinationUrl(),
    });
    setSaving(false);
    if (!result.ok) {
      toast({ title: "Could not create QR", description: result.message, variant: "destructive" });
      return;
    }
    toast({ title: "QR code created", description: result.code.shortUrl });
    setOpen(false);
    setName("");
    setOpportunityId("none");
    setDestinationUrl(defaultQrDestinationUrl());
    setPreview(result.code);
    await load();
  };

  const downloadPng = () => {
    if (!previewDataUrl || !preview) return;
    const link = document.createElement("a");
    link.href = previewDataUrl;
    link.download = `rhood-qr-${preview.code}.png`;
    link.click();
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-blur-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={textStyles.headline.page}>
            QR CODES
          </h1>
          <p className={`${textStyles.body.small} text-muted-foreground mt-1`}>
            Generate flyer QR codes that open the R/HOOD App Store page and track scans per activation.
          </p>
        </div>
        <Button
          className="bg-brand-green text-brand-black hover:bg-brand-green/90 w-full sm:w-auto"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New QR code
        </Button>
      </div>

      {isLoading ? (
        <p className={`${textStyles.body.regular} text-muted-foreground`}>Loading…</p>
      ) : codes.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <QrCode className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className={`${textStyles.body.regular} text-muted-foreground`}>
              No QR codes yet. Create one for a flyer or activation.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {codes.map((code) => (
            <Card key={code.id} className="bg-card border-border">
              <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className={`${textStyles.subheading.small} text-foreground truncate`}>
                    {code.name}
                  </p>
                  <p className={`${textStyles.body.small} text-muted-foreground mt-0.5 break-all`}>
                    {code.shortUrl}
                  </p>
                  <p className={`${textStyles.body.small} text-muted-foreground mt-1`}>
                    {code.scanCount} scans · {code.uniqueVisitors} unique · {code.conversions} conversions
                    {!code.is_active ? " · paused" : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPreview(code)}>
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const result = await setQrCodeActive(code.id, !code.is_active);
                      if (!result.ok) {
                        toast({
                          title: "Update failed",
                          description: result.message,
                          variant: "destructive",
                        });
                        return;
                      }
                      await load();
                    }}
                  >
                    {code.is_active ? "Pause" : "Activate"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => setPendingDelete(code)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(next) => !next && !deleting && setPendingDelete(null)}
      >
        <AlertDialogContent className="bg-card border-border max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the code and its {pendingDelete?.scanCount ?? 0} recorded scans. Anyone
              who scans a printed copy will still land on the App Store, but it won&apos;t be tracked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleting}
              onClick={async (event) => {
                event.preventDefault();
                if (!pendingDelete) return;
                setDeleting(true);
                const result = await deleteQrCode(pendingDelete.id);
                setDeleting(false);
                if (!result.ok) {
                  toast({
                    title: "Could not delete",
                    description: result.message,
                    variant: "destructive",
                  });
                  return;
                }
                toast({ title: "QR code deleted", description: pendingDelete.name });
                setPendingDelete(null);
                await load();
              }}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New QR code</DialogTitle>
            <DialogDescription>
              Defaults to the App Store so flyers drive downloads. Optionally attach an opportunity for reporting.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qr-name">Activation name</Label>
              <Input
                id="qr-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ADE flyer — booth A"
                required
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Opportunity (optional)</Label>
              <Select value={opportunityId} onValueChange={setOpportunityId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="none">None</SelectItem>
                  {opportunities.map((opp) => (
                    <SelectItem key={opp.id} value={opp.id}>
                      {opp.title || "Untitled"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qr-dest">Destination URL</Label>
              <Input
                id="qr-dest"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                className="bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground">
                Default is the live R/HOOD App Store page.
              </p>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-brand-green text-brand-black hover:bg-brand-green/90"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(preview)} onOpenChange={(next) => !next && setPreview(null)}>
        <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-sm">
          {preview ? (
            <>
              <DialogHeader>
                <DialogTitle>{preview.name}</DialogTitle>
                <DialogDescription className="break-all">{preview.shortUrl}</DialogDescription>
              </DialogHeader>
              <div className="flex justify-center py-4">
                {previewDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewDataUrl}
                    alt={`QR for ${preview.name}`}
                    className="w-64 h-64 rounded-lg bg-black"
                  />
                ) : (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                )}
              </div>
              <Button
                className="w-full bg-brand-green text-brand-black hover:bg-brand-green/90"
                onClick={downloadPng}
                disabled={!previewDataUrl}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PNG
              </Button>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

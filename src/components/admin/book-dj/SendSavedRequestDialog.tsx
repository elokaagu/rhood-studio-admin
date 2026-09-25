"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useToast } from "@/hooks/use-toast";
import { sendBookingRequestsToDjs } from "@/lib/booking/create-booking-request";
import {
  deleteBookingTemplate,
  loadBookingTemplates,
  type BookingRequestTemplate,
} from "@/lib/booking/templates";
import { bookableDjDisplayName, type BookableDJ } from "@/lib/booking/bookable-dj";
import type { BrandContextForBooking, DjProfileForBooking } from "@/lib/booking/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  brandContext: BrandContextForBooking | null;
  djs: BookableDJ[];
};

function toDjProfile(dj: BookableDJ): DjProfileForBooking {
  return {
    id: dj.id,
    email: dj.email,
    dj_name: dj.dj_name,
    first_name: dj.first_name,
    last_name: dj.last_name,
    profile_image_url: dj.profile_image_url,
    city: dj.city,
    genres: dj.genres,
    bio: dj.bio,
  };
}

export function SendSavedRequestDialog({
  open,
  onOpenChange,
  userId,
  brandContext,
  djs,
}: Props) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<BookingRequestTemplate[]>([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [selectedDjIds, setSelectedDjIds] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    const next = loadBookingTemplates(userId);
    setTemplates(next);
    setTemplateId(next[0]?.id ?? "");
    setSelectedDjIds([]);
  }, [open, userId]);

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === templateId) ?? null,
    [templates, templateId]
  );

  const toggleDj = (djId: string, checked: boolean) => {
    setSelectedDjIds((prev) =>
      checked ? [...prev, djId] : prev.filter((id) => id !== djId)
    );
  };

  const handleSend = async () => {
    if (!selectedTemplate) {
      toast({
        title: "Choose a saved request",
        description: "Save a booking request first, then send it to DJs from here.",
        variant: "destructive",
      });
      return;
    }
    const chosen = djs.filter((dj) => selectedDjIds.includes(dj.id));
    if (chosen.length === 0) {
      toast({
        title: "Select DJs",
        description: "Choose at least one DJ to send this request to.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const result = await sendBookingRequestsToDjs({
        djProfiles: chosen.map(toDjProfile),
        formData: selectedTemplate.form,
        brandContext,
      });
      if (result.sent === 0) {
        toast({
          title: "Nothing sent",
          description: result.lastError || "The saved request could not be sent.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title:
          result.failed > 0
            ? `Sent to ${result.sent} DJ${result.sent === 1 ? "" : "s"}`
            : "Requests sent",
        description:
          result.failed > 0
            ? `${result.failed} could not be sent. ${result.lastError ?? ""}`.trim()
            : `Sent “${selectedTemplate.name}” to ${result.sent} DJ${
                result.sent === 1 ? "" : "s"
              }.`,
      });
      onOpenChange(false);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send a saved request</DialogTitle>
          <DialogDescription>
            Pick a request you saved earlier, then choose the DJs who should receive it.
          </DialogDescription>
        </DialogHeader>

        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No saved requests yet. Open a booking form, tick “Save as template”, and send or
            save it.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-foreground">Saved request</p>
                <Select value={templateId} onValueChange={setTemplateId}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Choose a request" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedTemplate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    deleteBookingTemplate(userId, selectedTemplate.id);
                    const next = loadBookingTemplates(userId);
                    setTemplates(next);
                    setTemplateId(next[0]?.id ?? "");
                  }}
                >
                  Delete
                </Button>
              )}
            </div>

            {selectedTemplate && (
              <p className="text-xs text-muted-foreground">
                {selectedTemplate.form.event_title}
                {selectedTemplate.form.event_date
                  ? ` · ${selectedTemplate.form.event_date}`
                  : ""}
                {selectedTemplate.form.location
                  ? ` · ${selectedTemplate.form.location}`
                  : ""}
              </p>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">DJs</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setSelectedDjIds(
                      selectedDjIds.length === djs.length ? [] : djs.map((dj) => dj.id)
                    )
                  }
                >
                  {selectedDjIds.length === djs.length ? "Clear" : "Select all"}
                </Button>
              </div>
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                {djs.map((dj) => {
                  const checked = selectedDjIds.includes(dj.id);
                  return (
                    <label
                      key={dj.id}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-secondary"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => toggleDj(dj.id, value === true)}
                      />
                      <span className="min-w-0 truncate text-sm text-foreground">
                        {bookableDjDisplayName(dj)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-brand-green text-brand-black hover:bg-brand-green/90"
            onClick={() => void handleSend()}
            disabled={isSending || templates.length === 0}
          >
            {isSending ? "Sending…" : "Send request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

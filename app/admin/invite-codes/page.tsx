"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "@/lib/auth-utils";
import {
  Plus,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Key,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/date-utils";

export default function InviteCodesPage() {
  const { toast } = useToast();
  const [inviteCodes, setInviteCodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    brandName: "",
    expiresInDays: "30",
  });

  // Generate a random invite code
  const generateInviteCode = (): string => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluding confusing chars
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const fetchInviteCodes = async () => {
    try {
      setIsLoading(true);
      const userId = await getCurrentUserId();

      const { data, error } = await supabase
        .from("invite_codes")
        .select(
          `
          *,
          created_by_profile:user_profiles!invite_codes_created_by_fkey(dj_name, first_name, last_name, brand_name),
          used_by_profile:user_profiles!invite_codes_used_by_fkey(email, first_name, last_name)
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setInviteCodes(data || []);
    } catch (error) {
      console.error("Error fetching invite codes:", error);
      toast({
        title: "Error",
        description: "Failed to load invite codes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInviteCodes();
  }, []);

  const handleGenerateCode = async () => {
    if (!formData.brandName.trim()) {
      toast({
        title: "Brand Name Required",
        description: "Please enter a brand name for this invite code.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Generate unique code
      let code = generateInviteCode();
      let attempts = 0;
      while (attempts < 10) {
        const { data: existing } = await supabase
          .from("invite_codes")
          .select("id")
          .eq("code", code)
          .single();

        if (!existing) {
          break; // Code is unique
        }
        code = generateInviteCode();
        attempts++;
      }

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(
        expiresAt.getDate() + parseInt(formData.expiresInDays)
      );

      const { data, error } = await supabase
        .from("invite_codes")
        .insert({
          code,
          brand_name: formData.brandName.trim(),
          created_by: userId,
          expires_at: expiresAt.toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Invite Code Generated",
        description: `Invite code created for ${formData.brandName}`,
      });

      setIsDialogOpen(false);
      setFormData({ brandName: "", expiresInDays: "30" });
      fetchInviteCodes();

      // Auto-copy to clipboard
      if (data?.code) {
        navigator.clipboard.writeText(data.code);
        setCopiedCode(data.code);
        setTimeout(() => setCopiedCode(null), 2000);
      }
    } catch (error: any) {
      console.error("Error generating invite code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate invite code.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
      toast({
        title: "Copied!",
        description: "Invite code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy invite code",
        variant: "destructive",
      });
    }
  };

  const handleDeactivateCode = async (codeId: string) => {
    try {
      const { error } = await supabase
        .from("invite_codes")
        .update({ is_active: false })
        .eq("id", codeId);

      if (error) {
        throw error;
      }

      toast({
        title: "Code Deactivated",
        description: "The invite code has been deactivated.",
      });

      fetchInviteCodes();
    } catch (error) {
      console.error("Error deactivating code:", error);
      toast({
        title: "Error",
        description: "Failed to deactivate invite code.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (code: any) => {
    if (code.used_by) {
      return (
        <Badge
          variant="outline"
          className="border-green-500 text-green-500 bg-transparent"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Used
        </Badge>
      );
    }

    if (!code.is_active) {
      return (
        <Badge
          variant="outline"
          className="border-gray-500 text-gray-500 bg-transparent"
        >
          <XCircle className="h-3 w-3 mr-1" />
          Inactive
        </Badge>
      }

    if (code.expires_at && new Date(code.expires_at) < new Date()) {
      return (
        <Badge
          variant="outline"
          className="border-red-500 text-red-500 bg-transparent"
        >
          <Clock className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    }

    return (
      <Badge
        variant="outline"
        className="border-primary text-primary bg-transparent"
      >
        <Clock className="h-3 w-3 mr-1" />
        Active
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white">
            INVITE CODES
          </h1>
          <p className={textStyles.body.regular}>
            Generate invite codes for brand accounts
          </p>
        </div>
        <Button
          className="bg-brand-green hover:bg-brand-green/90 text-brand-black"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Generate Code
        </Button>
      </div>

      {/* Invite Codes List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className={textStyles.body.regular}>Loading invite codes...</p>
          </div>
        ) : inviteCodes.length === 0 ? (
          <div className="text-center py-8">
            <p className={textStyles.body.regular}>
              No invite codes yet. Generate your first one!
            </p>
          </div>
        ) : (
          inviteCodes.map((code) => (
            <Card key={code.id} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`${textStyles.subheading.large} font-mono`}>
                        {code.code}
                      </h3>
                      {getStatusBadge(code)}
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        <span className="font-semibold">Brand:</span>{" "}
                        {code.brand_name}
                      </p>
                      <p>
                        <span className="font-semibold">Created:</span>{" "}
                        {formatDate(code.created_at)}
                      </p>
                      {code.expires_at && (
                        <p>
                          <span className="font-semibold">Expires:</span>{" "}
                          {formatDate(code.expires_at)}
                        </p>
                      )}
                      {code.used_by && code.used_by_profile && (
                        <p>
                          <span className="font-semibold">Used by:</span>{" "}
                          {code.used_by_profile.email}
                        </p>
                      )}
                      {code.created_by_profile && (
                        <p>
                          <span className="font-semibold">Created by:</span>{" "}
                          {code.created_by_profile.dj_name ||
                            code.created_by_profile.brand_name ||
                            `${code.created_by_profile.first_name} ${code.created_by_profile.last_name}`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyCode(code.code)}
                      disabled={copiedCode === code.code}
                    >
                      {copiedCode === code.code ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                    {!code.used_by && code.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeactivateCode(code.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Deactivate
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Generate Code Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Generate Invite Code</DialogTitle>
            <DialogDescription>
              Create a new invite code for a brand to sign up
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand Name *</Label>
              <Input
                id="brandName"
                placeholder="e.g., Nike"
                value={formData.brandName}
                onChange={(e) =>
                  setFormData({ ...formData, brandName: e.target.value })
                }
                className="bg-secondary border-border text-foreground"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresInDays">Expires In (Days)</Label>
              <Input
                id="expiresInDays"
                type="number"
                min="1"
                placeholder="30"
                value={formData.expiresInDays}
                onChange={(e) =>
                  setFormData({ ...formData, expiresInDays: e.target.value })
                }
                className="bg-secondary border-border text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateCode}
              disabled={isGenerating || !formData.brandName.trim()}
              className="bg-brand-green hover:bg-brand-green/90 text-brand-black"
            >
              {isGenerating ? "Generating..." : "Generate Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


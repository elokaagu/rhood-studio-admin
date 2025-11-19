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
  Share2,
  Info,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleShareCode = async (code: any) => {
    const shareText = `You've been invited to create a brand account on R/HOOD Portal!

Brand: ${code.brand_name}
Invite Code: ${code.code}

To create your account:
1. Go to the login page
2. Click "Create Account"
3. Toggle to "Sign up as Brand instead"
4. Enter your details and the invite code above
5. Complete your registration

The invite code expires on ${code.expires_at ? formatDate(code.expires_at) : 'the expiration date set by the admin'}.`;

    try {
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Instructions Copied!",
        description: "Share instructions copied to clipboard. You can paste this in an email or message.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy share instructions",
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
      );
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white text-lg sm:text-xl md:text-2xl">
            INVITE CODES
          </h1>
          <p className={`${textStyles.body.regular} text-sm sm:text-base`}>
            Generate invite codes for brand accounts
          </p>
        </div>
        <Button
          className="bg-brand-green hover:bg-brand-green/90 text-brand-black w-full sm:w-auto"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Generate Code
        </Button>
      </div>

      {/* Instructions */}
      <Alert className="bg-card border-border">
        <Info className="h-4 w-4" />
        <AlertTitle className="text-sm sm:text-base">How Invite Codes Work</AlertTitle>
        <AlertDescription className="mt-2 space-y-2 text-xs sm:text-sm">
          <p>
            <strong>1. Generate a code:</strong> Click &quot;Generate Code&quot; and enter the brand name. The code will be automatically copied to your clipboard.
          </p>
          <p>
            <strong>2. Share with the brand:</strong> Send the invite code to the brand contact (via email, Slack, etc.). You can use the &quot;Share&quot; button to copy ready-to-send instructions.
          </p>
          <p>
            <strong>3. Brand creates account:</strong> The brand goes to the login page, clicks &quot;Create Account&quot;, toggles to &quot;Sign up as Brand instead&quot;, and enters the invite code along with their details.
          </p>
          <p>
            <strong>4. Automatic setup:</strong> Once the brand signs up, their account is automatically configured with the brand role and brand name from the invite code.
          </p>
        </AlertDescription>
      </Alert>

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
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <h3 className={`${textStyles.subheading.large} font-mono text-base sm:text-lg break-all`}>
                        {code.code}
                      </h3>
                      {getStatusBadge(code)}
                    </div>

                    <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                      <p>
                        <span className="font-semibold">Brand:</span>{" "}
                        <span className="truncate block sm:inline">{code.brand_name}</span>
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
                          <span className="truncate block sm:inline">{code.used_by_profile.email}</span>
                        </p>
                      )}
                      {code.created_by_profile && (
                        <p>
                          <span className="font-semibold">Created by:</span>{" "}
                          <span className="truncate block sm:inline">
                            {code.created_by_profile.dj_name ||
                              code.created_by_profile.brand_name ||
                              `${code.created_by_profile.first_name} ${code.created_by_profile.last_name}`}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyCode(code.code)}
                      disabled={copiedCode === code.code}
                      className="text-xs sm:text-sm flex-1 sm:flex-initial"
                    >
                      {copiedCode === code.code ? (
                        <>
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">Copied</span>
                          <span className="sm:hidden">✓</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">Copy Code</span>
                          <span className="sm:hidden">Copy</span>
                        </>
                      )}
                    </Button>
                    {!code.used_by && code.is_active && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShareCode(code)}
                          title="Copy share instructions to clipboard"
                          className="text-xs sm:text-sm flex-1 sm:flex-initial"
                        >
                          <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">Share</span>
                          <span className="sm:hidden">Share</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 text-xs sm:text-sm flex-1 sm:flex-initial"
                          onClick={() => handleDeactivateCode(code.id)}
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">Deactivate</span>
                          <span className="sm:hidden">Deactivate</span>
                        </Button>
                      </>
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
        <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-md">
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


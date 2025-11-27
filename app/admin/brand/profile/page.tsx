"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserProfile, getCurrentUserId } from "@/lib/auth-utils";
import {
  Building2,
  Globe,
  FileText,
  Edit,
  Save,
  X,
  ExternalLink,
  Calendar,
  MapPin,
  Coins,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { textStyles } from "@/lib/typography";
import { formatDate } from "@/lib/date-utils";

interface BrandProfile {
  id: string;
  brand_name: string | null;
  brand_description: string | null;
  website: string | null;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string | null;
}

interface Contract {
  id: string;
  event_title: string;
  event_date: string;
  location: string;
  payment_amount: number | null;
  payment_currency: string;
  status: string;
  dj_profile: {
    dj_name: string;
    profile_image_url: string | null;
  } | null;
}

export default function BrandProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingContracts, setIsLoadingContracts] = useState(false);
  const [formData, setFormData] = useState({
    brand_name: "",
    brand_description: "",
    website: "",
  });

  useEffect(() => {
    const checkUserAndFetchProfile = async () => {
      const profile = await getCurrentUserProfile();
      if (!profile || profile.role !== "brand") {
        toast({
          title: "Access Denied",
          description: "This page is only available for brand accounts.",
          variant: "destructive",
        });
        router.push("/admin/dashboard");
        return;
      }
      await fetchBrandProfile();
    };
    checkUserAndFetchProfile();
  }, [router, toast]);

  const fetchBrandProfile = async () => {
    try {
      setIsLoading(true);
      const userId = await getCurrentUserId();
      if (!userId) return;

      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, brand_name, brand_description, website, first_name, last_name, email, created_at")
        .eq("id", userId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setProfile(data as BrandProfile);
        setFormData({
          brand_name: data.brand_name || "",
          brand_description: data.brand_description || "",
          website: data.website || "",
        });
      }
    } catch (error: any) {
      console.error("Error fetching brand profile:", error);
      toast({
        title: "Error",
        description: "Failed to load brand profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContracts = async () => {
    try {
      setIsLoadingContracts(true);
      const userId = await getCurrentUserId();
      if (!userId) return;

      // Fetch accepted booking requests as contracts
      const { data, error } = await supabase
        .from("booking_requests")
        .select(
          `
          id,
          event_title,
          event_date,
          location,
          payment_amount,
          payment_currency,
          status,
          dj_profile:user_profiles!booking_requests_dj_id_fkey(
            dj_name,
            profile_image_url
          )
        `
        )
        .eq("brand_id", userId)
        .eq("status", "accepted")
        .order("event_date", { ascending: false });

      if (error) {
        throw error;
      }

      setContracts((data as Contract[]) || []);
    } catch (error: any) {
      console.error("Error fetching contracts:", error);
      toast({
        title: "Error",
        description: "Failed to load contracts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingContracts(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchContracts();
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const userId = await getCurrentUserId();
      if (!userId) return;

      // Validate website URL format if provided
      if (formData.website && formData.website.trim()) {
        const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        if (!urlPattern.test(formData.website.trim())) {
          toast({
            title: "Invalid URL",
            description: "Please enter a valid website URL (e.g., https://example.com)",
            variant: "destructive",
          });
          return;
        }
        // Ensure URL has protocol
        let websiteUrl = formData.website.trim();
        if (!websiteUrl.startsWith("http://") && !websiteUrl.startsWith("https://")) {
          websiteUrl = "https://" + websiteUrl;
        }
        formData.website = websiteUrl;
      }

      const { error } = await supabase
        .from("user_profiles")
        .update({
          brand_name: formData.brand_name.trim() || null,
          brand_description: formData.brand_description.trim() || null,
          website: formData.website.trim() || null,
        })
        .eq("id", userId);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Brand profile updated successfully.",
      });

      setIsEditing(false);
      await fetchBrandProfile();
    } catch (error: any) {
      console.error("Error updating brand profile:", error);
      toast({
        title: "Error",
        description: "Failed to update brand profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        brand_name: profile.brand_name || "",
        brand_description: profile.brand_description || "",
        website: profile.website || "",
      });
    }
    setIsEditing(false);
  };

  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className={textStyles.body.regular}>Loading brand profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Unable to load brand profile. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={textStyles.headline.section}>
            BRAND PROFILE
          </h1>
          <p className={`${textStyles.body.regular} text-sm sm:text-base mt-1`}>
            Manage your brand details and view contracts
          </p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Brand Details Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className={textStyles.subheading.small}>
            Brand Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="brand_name">Brand Name</Label>
                <Input
                  id="brand_name"
                  value={formData.brand_name}
                  onChange={(e) =>
                    setFormData({ ...formData, brand_name: e.target.value })
                  }
                  placeholder="Enter your brand name"
                  className="bg-secondary border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand_description">Brand Description</Label>
                <Textarea
                  id="brand_description"
                  value={formData.brand_description}
                  onChange={(e) =>
                    setFormData({ ...formData, brand_description: e.target.value })
                  }
                  placeholder="Describe your brand..."
                  rows={6}
                  className="bg-secondary border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  placeholder="https://example.com"
                  className="bg-secondary border-border text-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  Enter your brand website URL
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Brand Name</Label>
                  <p className="text-sm font-medium text-foreground mt-1">
                    {profile.brand_name || "Not set"}
                  </p>
                </div>
              </div>

              {profile.brand_description && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">
                      {profile.brand_description}
                    </p>
                  </div>
                </div>
              )}

              {profile.website && (
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Website</Label>
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                    >
                      {profile.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Label className="text-xs text-muted-foreground">Contact</Label>
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    {profile.first_name} {profile.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Contracts Section */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className={textStyles.subheading.small}>
            Contracts & Agreements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingContracts ? (
            <div className="text-center py-8">
              <p className={textStyles.body.regular}>Loading contracts...</p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No contracts found. Accepted booking requests will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {contracts.map((contract) => (
                <Card
                  key={contract.id}
                  className="bg-secondary/50 border-border hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">
                            {contract.event_title}
                          </h3>
                          {contract.dj_profile && (
                            <p className="text-sm text-muted-foreground mt-1">
                              DJ: {contract.dj_profile.dj_name}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{formatEventDate(contract.event_date)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{contract.location}</span>
                          </div>
                          {contract.payment_amount && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Coins className="h-4 w-4" />
                              <span>
                                {contract.payment_currency === "GBP"
                                  ? "£"
                                  : contract.payment_currency === "USD"
                                  ? "$"
                                  : "€"}
                                {contract.payment_amount.toLocaleString()}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="border-green-500 text-green-500"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {contract.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/booking-requests/${contract.id}`)
                        }
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


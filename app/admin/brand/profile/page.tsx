"use client";

import React, { useState, useEffect, useReducer, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUserProfile } from "@/lib/auth-utils";
import { fetchBrandProfileForUser } from "@/lib/brand/fetch-brand-profile";
import { fetchAcceptedContractsForBrand } from "@/lib/brand/fetch-brand-contracts";
import { updateBrandProfile } from "@/lib/brand/update-brand-profile";
import {
  brandProfileFormReducer,
  createEmptyBrandProfileForm,
} from "@/lib/brand/form-reducer";
import type { BrandProfile, BrandAcceptedContract } from "@/lib/brand/types";
import { BrandProfileCard } from "@/components/admin/brand/BrandProfileCard";
import { BrandContractsList } from "@/components/admin/brand/BrandContractsList";
import { StudioAgreementDialog } from "@/components/admin/brand/StudioAgreementDialog";
import { Button } from "@/components/ui/button";

export default function BrandProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [contracts, setContracts] = useState<BrandAcceptedContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [studioAgreementOpen, setStudioAgreementOpen] = useState(false);
  const [formData, dispatch] = useReducer(
    brandProfileFormReducer,
    createEmptyBrandProfileForm()
  );

  const loadData = useCallback(async () => {
    const user = await getCurrentUserProfile();
    if (!user || user.role !== "brand") {
      toast({
        title: "Access Denied",
        description: "This page is only available for brand accounts.",
        variant: "destructive",
      });
      router.push("/admin/dashboard");
      return;
    }

    setIsLoading(true);

    const [profileRes, contractsRes] = await Promise.all([
      fetchBrandProfileForUser(user.id),
      fetchAcceptedContractsForBrand(user.id),
    ]);

    if (!profileRes.ok) {
      toast({
        title: "Error",
        description: profileRes.message,
        variant: "destructive",
      });
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setProfile(profileRes.profile);
    dispatch({ type: "HYDRATE_FROM_PROFILE", profile: profileRes.profile });

    if (contractsRes.ok) {
      setContracts(contractsRes.contracts);
    } else {
      toast({
        title: "Contracts unavailable",
        description: contractsRes.message,
        variant: "destructive",
      });
      setContracts([]);
    }

    setIsLoading(false);
  }, [router, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const result = await updateBrandProfile(profile.id, formData);
      if (!result.ok) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Brand profile updated successfully.",
      });

      setIsEditing(false);

      const refetch = await fetchBrandProfileForUser(profile.id);
      if (refetch.ok) {
        setProfile(refetch.profile);
        dispatch({ type: "HYDRATE_FROM_PROFILE", profile: refetch.profile });
      }
    } catch {
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
      dispatch({ type: "HYDRATE_FROM_PROFILE", profile });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
          </div>
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

  const brandName =
    profile.brand_name || `${profile.first_name} ${profile.last_name}`.trim();

  return (
    <div className="space-y-6 animate-blur-in">
      {/* Hero profile card — always full width */}
      <BrandProfileCard
        profile={profile}
        formData={formData}
        dispatch={dispatch}
        isEditing={isEditing}
        isSaving={isSaving}
        onEdit={() => setIsEditing(true)}
        onSave={handleSave}
        onCancel={handleCancel}
        onAvatarUploaded={(url) =>
          setProfile((prev) => (prev ? { ...prev, profile_image_url: url } : prev))
        }
      />

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="border-border text-xs"
          onClick={() => {
            try {
              window.localStorage.removeItem(`rhood-studio-tour:${profile.id}`);
            } catch {
              /* ignore */
            }
            window.dispatchEvent(new Event("rhood-start-tour"));
          }}
        >
          Show Studio guide
        </Button>
      </div>

      <BrandContractsList
        contracts={contracts}
        brandName={brandName}
        studioAgreement={{
          signedAt: profile.studio_agreement_signed_at,
          signedBy: profile.studio_agreement_signed_by,
        }}
        onViewStudioAgreement={() => setStudioAgreementOpen(true)}
        onViewDetails={(id: string) =>
          router.push(`/admin/booking-requests/${id}`)
        }
        onAgreementSigned={(contractId, signedAt, signedBy) =>
          setContracts((prev) =>
            prev.map((c) =>
              c.id === contractId
                ? { ...c, agreement_signed_at: signedAt, agreement_signed_by: signedBy }
                : c
            )
          )
        }
      />

      <StudioAgreementDialog
        userId={profile.id}
        brandName={brandName}
        open={studioAgreementOpen}
        signedAt={profile.studio_agreement_signed_at}
        signedBy={profile.studio_agreement_signed_by}
        onSigned={(signedAt, signedBy) => {
          setProfile((prev) =>
            prev
              ? {
                  ...prev,
                  studio_agreement_signed_at: signedAt,
                  studio_agreement_signed_by: signedBy,
                }
              : prev
          );
          setStudioAgreementOpen(false);
        }}
        onOpenChange={setStudioAgreementOpen}
      />
    </div>
  );
}

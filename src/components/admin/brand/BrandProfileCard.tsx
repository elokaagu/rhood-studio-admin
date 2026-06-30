"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Globe, Save, X, Edit, ExternalLink, Mail, User } from "lucide-react";
import { textStyles } from "@/lib/typography";
import type { BrandProfile, BrandProfileFormFields } from "@/lib/brand/types";
import type { BrandProfileFormAction } from "@/lib/brand/form-reducer";

type Props = {
  profile: BrandProfile;
  formData: BrandProfileFormFields;
  dispatch: React.Dispatch<BrandProfileFormAction>;
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
};

function Monogram({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div className="relative flex-shrink-0">
      <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-brand-green flex items-center justify-center shadow-lg shadow-brand-green/20">
        <span className="text-3xl sm:text-4xl font-black text-brand-black tracking-tight">
          {initials || "?"}
        </span>
      </div>
    </div>
  );
}

export function BrandProfileCard({
  profile,
  formData,
  dispatch,
  isEditing,
  isSaving,
  onEdit,
  onSave,
  onCancel,
}: Props) {
  const displayName =
    profile.brand_name ||
    `${profile.first_name} ${profile.last_name}`.trim();

  if (isEditing) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="pt-6 space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h2 className={textStyles.subheading.large}>Edit Brand Profile</h2>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand_name">Brand Name</Label>
            <Input
              id="brand_name"
              value={formData.brand_name}
              onChange={(e) =>
                dispatch({ type: "SET_FIELD", field: "brand_name", value: e.target.value })
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
                dispatch({ type: "SET_FIELD", field: "brand_description", value: e.target.value })
              }
              placeholder="Describe your brand…"
              rows={5}
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
                dispatch({ type: "SET_FIELD", field: "website", value: e.target.value })
              }
              placeholder="https://example.com"
              className="bg-secondary border-border text-foreground"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={onSave}
              disabled={isSaving}
              className="bg-brand-green text-brand-black hover:bg-brand-green/90 font-semibold"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving…" : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={onCancel} disabled={isSaving} className="border-border">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative rounded-2xl bg-card border border-border overflow-hidden">
      {/* Top accent stripe */}
      <div className="h-1.5 w-full bg-brand-green" />

      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-7">
          <Monogram name={displayName} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight truncate">
                  {displayName}
                </h1>
                {profile.brand_description && (
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {profile.brand_description}
                  </p>
                )}
              </div>
              <Button
                onClick={onEdit}
                variant="outline"
                size="sm"
                className="flex-shrink-0 border-border hover:border-brand-green hover:text-brand-green"
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2.5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5 flex-shrink-0" />
                <span>
                  {profile.first_name} {profile.last_name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{profile.email}</span>
              </div>
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-brand-green hover:text-brand-green/80 transition-colors"
                >
                  <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate max-w-[200px]">{profile.website.replace(/^https?:\/\//, "")}</span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

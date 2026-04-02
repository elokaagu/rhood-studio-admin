"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Globe,
  FileText,
  Edit,
  Save,
  X,
  ExternalLink,
} from "lucide-react";
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
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={textStyles.headline.section}>BRAND PROFILE</h1>
          <p className={`${textStyles.body.regular} text-sm sm:text-base mt-1`}>
            Manage your brand details and view contracts
          </p>
        </div>
        {!isEditing && (
          <Button onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

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
                    dispatch({
                      type: "SET_FIELD",
                      field: "brand_name",
                      value: e.target.value,
                    })
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
                    dispatch({
                      type: "SET_FIELD",
                      field: "brand_description",
                      value: e.target.value,
                    })
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
                    dispatch({
                      type: "SET_FIELD",
                      field: "website",
                      value: e.target.value,
                    })
                  }
                  placeholder="https://example.com"
                  className="bg-secondary border-border text-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  Enter your brand website URL
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={onSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={onCancel} disabled={isSaving}>
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
    </>
  );
}

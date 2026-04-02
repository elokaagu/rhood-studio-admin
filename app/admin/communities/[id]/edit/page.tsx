"use client";

import React, { useState, useEffect, useReducer, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUserProfile } from "@/lib/auth-utils";
import { fetchCommunityById } from "@/lib/communities/fetch-community-by-id";
import { updateCommunity } from "@/lib/communities/update-community";
import { canUserEditCommunity } from "@/lib/communities/permissions";
import {
  communityEditFormReducer,
  createEmptyCommunityEditForm,
} from "@/lib/communities/form-reducer";
import { COMMUNITY_LOCATION_OPTIONS } from "@/lib/communities/constants";
import type { CommunityForEdit } from "@/lib/communities/types";
import { ArrowLeft, Save } from "lucide-react";
import { textStyles } from "@/lib/typography";
import { ImageUpload } from "@/components/ui/image-upload";

export default function EditCommunityPage() {
  const params = useParams();
  const communityId = useMemo(() => {
    const raw = params?.id;
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw) && raw[0]) return raw[0];
    return null;
  }, [params]);

  const [community, setCommunity] = useState<CommunityForEdit | null>(null);
  const [formData, dispatch] = useReducer(
    communityEditFormReducer,
    createEmptyCommunityEditForm()
  );
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!communityId) {
      setLoading(false);
      setCommunity(null);
      dispatch({ type: "RESET" });
      return;
    }

    let cancelled = false;

    (async () => {
      setCommunity(null);
      dispatch({ type: "RESET" });
      setLoading(true);
      const [profile, communityRes] = await Promise.all([
        getCurrentUserProfile(),
        fetchCommunityById(communityId),
      ]);

      if (cancelled) return;

      if (!communityRes.ok) {
        toast({
          title: "Error",
          description: communityRes.message,
          variant: "destructive",
        });
        setCommunity(null);
        router.push("/admin/communities");
        setLoading(false);
        return;
      }

      if (!profile) {
        toast({
          title: "Sign in required",
          description: "Please log in to edit a community.",
          variant: "destructive",
        });
        router.push("/login");
        setLoading(false);
        return;
      }

      if (
        !canUserEditCommunity(
          profile.id,
          profile.role,
          communityRes.community.created_by
        )
      ) {
        toast({
          title: "Access denied",
          description: "You can only edit communities you created (or as admin).",
          variant: "destructive",
        });
        router.push(`/admin/communities/${communityId}`);
        // Keep loading until navigation unmounts to avoid a false "not found" flash.
        return;
      }

      setCommunity(communityRes.community);
      dispatch({ type: "HYDRATE", community: communityRes.community });
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
    // Intentionally depend only on communityId; router/toast are stable for navigation/toasts.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when route id changes
  }, [communityId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Community name is required",
        variant: "destructive",
      });
      return;
    }

    if (!communityId || !community) {
      toast({
        title: "Error",
        description: "Community not loaded",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateCommunity(communityId, formData);
      if (!result.ok) {
        toast({
          title: "Error",
          description: `Failed to update community: ${result.message}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Community updated successfully!",
      });

      router.push(`/admin/communities/${communityId}`);
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="h-96 bg-muted rounded"></div>
          </div>
          <div className="space-y-4">
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!communityId || !community) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white">
              Community Not Found
            </h1>
          </div>
        </div>
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Community not found
            </h3>
            <p className="text-muted-foreground mb-4">
              The community you&apos;re trying to edit doesn&apos;t exist or has
              been deleted.
            </p>
            <Button onClick={() => router.push("/admin/communities")}>
              Back to Communities
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-blur-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white">
              EDIT COMMUNITY
            </h1>
            <p className={textStyles.body.regular}>
              Update community information and settings
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className={textStyles.subheading.large}>
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className={textStyles.body.regular}>
                    Community Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      dispatch({ type: "PATCH", patch: { name: e.target.value } })
                    }
                    placeholder="Enter community name"
                    className="bg-secondary border-secondary-foreground/20 focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className={textStyles.body.regular}>
                    Location *
                  </Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value) =>
                      dispatch({ type: "PATCH", patch: { location: value } })
                    }
                  >
                    <SelectTrigger
                      id="location"
                      className="bg-secondary border-secondary-foreground/20 focus:border-primary"
                    >
                      <SelectValue placeholder="Select community location" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMUNITY_LOCATION_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="description"
                    className={textStyles.body.regular}
                  >
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      dispatch({
                        type: "PATCH",
                        patch: { description: e.target.value },
                      })
                    }
                    placeholder="Describe what this community is about..."
                    className="bg-secondary border-secondary-foreground/20 focus:border-primary min-h-[100px]"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className={textStyles.subheading.large}>
                  Community Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  value={formData.imageUrl || undefined}
                  onChange={(url) =>
                    dispatch({ type: "PATCH", patch: { imageUrl: url } })
                  }
                  bucketName="communities"
                  folder="images"
                  maxSize={5 * 1024 * 1024}
                  acceptedFormats={["image/jpeg", "image/png", "image/webp"]}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className={textStyles.subheading.regular}>
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  type="submit"
                  className="w-full bg-brand-green hover:bg-brand-green/90 text-brand-black"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-black mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Community
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    router.push(`/admin/communities/${communityId}`)
                  }
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className={textStyles.subheading.regular}>
                  Community Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground space-y-2">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span className="text-foreground">
                      {community.created_at
                        ? new Date(community.created_at).toLocaleDateString()
                        : "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>ID:</span>
                    <span className="text-foreground font-mono text-xs">
                      {community.id.slice(0, 8)}...
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

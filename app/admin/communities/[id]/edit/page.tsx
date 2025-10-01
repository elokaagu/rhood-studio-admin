"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save } from "lucide-react";
import { textStyles } from "@/lib/typography";
import { ImageUpload } from "@/components/ui/image-upload";

interface Community {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_by: string | null;
}

interface FormData {
  name: string;
  description: string;
  imageUrl: string | null;
}

export default function EditCommunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [community, setCommunity] = useState<Community | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    imageUrl: null,
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [communityId, setCommunityId] = useState<string | null>(null);

  // Fetch community details
  const fetchCommunity = useCallback(async () => {
    if (!communityId) return;

    try {
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .eq("id", communityId)
        .single();

      if (error) {
        console.error("Error fetching community:", error);
        toast({
          title: "Error",
          description: "Failed to fetch community details",
          variant: "destructive",
        });
        router.push("/admin/communities");
        return;
      }

      setCommunity(data);
      setFormData({
        name: data.name || "",
        description: data.description || "",
        imageUrl: data.image_url || null,
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      router.push("/admin/communities");
    } finally {
      setLoading(false);
    }
  }, [communityId, toast, router]);

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

    if (!communityId) {
      toast({
        title: "Error",
        description: "Community ID not found",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from("communities")
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          image_url: formData.imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", communityId);

      if (error) {
        console.error("Error updating community:", error);
        toast({
          title: "Error",
          description: "Failed to update community. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Community updated successfully!",
      });

      if (communityId) {
        router.push(`/admin/communities/${communityId}`);
      } else {
        router.push("/admin/communities");
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initialize params
  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params;
      setCommunityId(resolvedParams.id);
    };
    initializeParams();
  }, [params]);

  useEffect(() => {
    if (communityId) {
      fetchCommunity();
    }
  }, [communityId, fetchCommunity]);

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

  if (!community) {
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
    <div className="space-y-6">
      {/* Header */}
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
          {/* Main Form */}
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
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter community name"
                    className="bg-secondary border-secondary-foreground/20 focus:border-primary"
                    required
                  />
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
                      setFormData({ ...formData, description: e.target.value })
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
                  value={formData.imageUrl}
                  onChange={(url) =>
                    setFormData({ ...formData, imageUrl: url })
                  }
                  bucketName="communities"
                  folder="images"
                  maxSize={5 * 1024 * 1024} // 5MB
                  acceptedFormats={["image/jpeg", "image/png", "image/webp"]}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
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
                    communityId
                      ? router.push(`/admin/communities/${communityId}`)
                      : router.push("/admin/communities")
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

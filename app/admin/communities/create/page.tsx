"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, Upload } from "lucide-react";
import { textStyles } from "@/lib/typography";
import { ImageUpload } from "@/components/ui/image-upload";

interface FormData {
  name: string;
  description: string;
  imageUrl: string | null;
}

export default function CreateCommunityPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    imageUrl: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

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

    try {
      setIsSubmitting(true);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          title: "Error",
          description: "You must be logged in to create a community",
          variant: "destructive",
        });
        return;
      }

      // Create community
      const { data, error } = await supabase
        .from("communities")
        .insert([
          {
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            image_url: formData.imageUrl,
            created_by: user.id,
            member_count: 0,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creating community:", error);
        toast({
          title: "Error",
          description: "Failed to create community. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Add creator as first member
      const { error: memberError } = await supabase
        .from("community_members")
        .insert([
          {
            community_id: data.id,
            user_id: user.id,
            role: "admin",
            joined_at: new Date().toISOString(),
          },
        ]);

      if (memberError) {
        console.error("Error adding creator as member:", memberError);
        // Don't fail the whole operation for this
      }

      // Update member count
      await supabase
        .from("communities")
        .update({ member_count: 1 })
        .eq("id", data.id);

      toast({
        title: "Success",
        description: "Community created successfully!",
      });

      // Redirect to the new community
      router.push(`/admin/communities/${data.id}`);
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

  const handleSaveDraft = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Community name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          title: "Error",
          description: "You must be logged in to create a community",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("communities")
        .insert([
          {
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            image_url: formData.imageUrl,
            created_by: user.id,
            member_count: 0,
          },
        ]);

      if (error) {
        console.error("Error creating community:", error);
        toast({
          title: "Error",
          description: "Failed to create community. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Community saved as draft",
      });

      router.push("/admin/communities");
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white">
              CREATE COMMUNITY
            </h1>
            <p className={textStyles.body.regular}>
              Create a new group chat community
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
                  <Label htmlFor="name" className={textStyles.body.medium}>
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
                  <Label htmlFor="description" className={textStyles.body.medium}>
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
                  onChange={(url) => setFormData({ ...formData, imageUrl: url })}
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
                <CardTitle className={textStyles.subheading.medium}>
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Community
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                >
                  Save as Draft
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className={textStyles.subheading.medium}>
                  Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>• Choose a clear, descriptive name for your community</p>
                  <p>• Add a description to help members understand the purpose</p>
                  <p>• Upload an image to make your community more recognizable</p>
                  <p>• You'll be automatically added as the first admin member</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

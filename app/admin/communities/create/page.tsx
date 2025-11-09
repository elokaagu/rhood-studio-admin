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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COMMUNITY_LOCATION_OPTIONS = [
  "Global",
  "London",
  "Manchester",
  "Birmingham",
  "Bristol",
  "Berlin",
  "Paris",
  "New York",
  "Los Angeles",
  "Toronto",
] as const;

interface FormData {
  name: string;
  description: string;
  imageUrl: string | null;
  location: (typeof COMMUNITY_LOCATION_OPTIONS)[number];
}

export default function CreateCommunityPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    imageUrl: null,
    location: "Global",
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

    if (!formData.location) {
      toast({
        title: "Error",
        description: "Please choose a location for your community",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      console.log("Current user:", user?.id, user?.email);
      console.log("User error:", userError);

      if (userError || !user) {
        console.error("Authentication failed:", userError);
        toast({
          title: "Error",
          description: "You must be logged in to create a community",
          variant: "destructive",
        });
        return;
      }

      // Check if user exists in user_profiles table
      const { data: userProfile, error: profileError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      console.log("User profile check:", { userProfile, profileError });

      if (profileError || !userProfile) {
        console.error("User profile not found:", profileError);
        toast({
          title: "Error",
          description:
            "User profile not found. Please complete your profile first.",
          variant: "destructive",
        });
        return;
      }

      // Create community
      console.log("Creating community with data:", {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        image_url: formData.imageUrl,
        created_by: user.id,
        member_count: 0,
        location: formData.location,
      });

      const { data, error } = await supabase
        .from("communities")
        .insert([
          {
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            image_url: formData.imageUrl,
            created_by: user.id,
            member_count: 0,
            location: formData.location,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creating community:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        toast({
          title: "Error",
          description: `Failed to create community: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log("Community created successfully:", data);

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
      const { error: countError } = await supabase
        .from("communities")
        .update({ member_count: 1 })
        .eq("id", data.id);

      if (countError) {
        console.error("Error updating member count:", countError);
        // Don't fail the whole operation for this
      }

      console.log("Community fully created and configured in database");

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

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast({
          title: "Error",
          description: "You must be logged in to create a community",
          variant: "destructive",
        });
        return;
      }

      // Check if user exists in user_profiles table
      const { data: userProfile, error: profileError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (profileError || !userProfile) {
        toast({
          title: "Error",
          description:
            "User profile not found. Please complete your profile first.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("communities").insert([
        {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          image_url: formData.imageUrl,
          created_by: user.id,
          member_count: 0,
          location: formData.location,
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.back()}
              className="text-brand-white hover:bg-brand-green/10 hover:text-brand-green transition-all duration-300"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-ts-block ts-3xl uppercase text-left text-brand-white tracking-wide">
                CREATE COMMUNITY
              </h1>
              <p className="font-helvetica-regular helvetica-lg text-muted-foreground mt-2">
                Build your underground music community
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-8">
              <Card className="bg-card border-border/50 backdrop-blur-sm shadow-2xl">
                <CardHeader className="border-b border-border/30">
                  <CardTitle className="font-ts-block ts-xl uppercase text-brand-white tracking-wide">
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="font-helvetica-bold helvetica-base text-brand-white">
                      Community Name *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter your community name..."
                      className="bg-input border-border/50 focus:border-brand-green focus:ring-brand-green/20 text-brand-white placeholder:text-muted-foreground transition-all duration-300 h-12"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="location"
                      className="font-helvetica-bold helvetica-base text-brand-white"
                    >
                      Location *
                    </Label>
                    <Select
                      value={formData.location}
                      onValueChange={(value) =>
                        setFormData({ ...formData, location: value as FormData["location"] })
                      }
                    >
                      <SelectTrigger
                        id="location"
                        className="bg-input border-border/50 focus:border-brand-green focus:ring-brand-green/20 text-brand-white placeholder:text-muted-foreground transition-all duration-300 h-12"
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

                  <div className="space-y-3">
                    <Label
                      htmlFor="description"
                      className="font-helvetica-bold helvetica-base text-brand-white"
                    >
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Describe what makes your community unique..."
                      className="bg-input border-border/50 focus:border-brand-green focus:ring-brand-green/20 text-brand-white placeholder:text-muted-foreground transition-all duration-300 min-h-[120px] resize-none"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border/50 backdrop-blur-sm shadow-2xl">
                <CardHeader className="border-b border-border/30">
                  <CardTitle className="font-ts-block ts-xl uppercase text-brand-white tracking-wide">
                    Community Image
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ImageUpload
                    value={formData.imageUrl || undefined}
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
              <Card className="bg-card border-border/50 backdrop-blur-sm shadow-2xl">
                <CardHeader className="border-b border-border/30">
                  <CardTitle className="font-ts-block ts-lg uppercase text-brand-white tracking-wide">
                    Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <Button
                    type="submit"
                    className="w-full bg-brand-green hover:bg-brand-green/90 text-brand-black font-helvetica-bold helvetica-base h-12 shadow-glow-primary transition-all duration-300 hover:shadow-glow-accent"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-black mr-3"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-3" />
                        Create Community
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-border/50 text-brand-white hover:bg-brand-green/10 hover:border-brand-green hover:text-brand-green font-helvetica-regular helvetica-base h-12 transition-all duration-300"
                    onClick={handleSaveDraft}
                    disabled={isSubmitting}
                  >
                    Save as Draft
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card border-border/50 backdrop-blur-sm shadow-2xl">
                <CardHeader className="border-b border-border/30">
                  <CardTitle className="font-ts-block ts-lg uppercase text-brand-white tracking-wide">
                    Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-brand-green rounded-full mt-2 flex-shrink-0"></div>
                      <p className="font-helvetica-regular helvetica-sm text-muted-foreground">
                        Choose a clear, descriptive name that represents your community
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-brand-green rounded-full mt-2 flex-shrink-0"></div>
                      <p className="font-helvetica-regular helvetica-sm text-muted-foreground">
                        Add a compelling description to attract the right members
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-brand-green rounded-full mt-2 flex-shrink-0"></div>
                      <p className="font-helvetica-regular helvetica-sm text-muted-foreground">
                        Upload a distinctive image to make your community recognizable
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-brand-green rounded-full mt-2 flex-shrink-0"></div>
                      <p className="font-helvetica-regular helvetica-sm text-muted-foreground">
                        You&apos;ll automatically become the first admin member
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

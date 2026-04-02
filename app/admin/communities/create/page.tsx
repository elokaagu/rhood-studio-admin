"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Upload } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COMMUNITY_CREATE_LOCATION_OPTIONS,
  type CommunityCreateLocation,
} from "@/lib/communities/community-create-constants";
import {
  createCommunityWithSetup,
  type CommunityCreateMode,
} from "@/lib/communities/create-community";

type CreateFormState = {
  name: string;
  description: string;
  imageUrl: string | null;
  location: CommunityCreateLocation;
};

export default function CreateCommunityPage() {
  const [formData, setFormData] = useState<CreateFormState>({
    name: "",
    description: "",
    imageUrl: null,
    location: "Global",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return "Community name is required";
    }
    if (!formData.location) {
      return "Please choose a location for your community";
    }
    return null;
  };

  const runCreate = async (mode: CommunityCreateMode) => {
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: "Error",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createCommunityWithSetup({
        form: formData,
        mode,
      });

      if (!result.ok) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      if (mode === "publish") {
        if (result.memberSetupIssue) {
          toast({
            title: "Community created",
            description: result.memberSetupIssue,
          });
        } else {
          toast({
            title: "Success",
            description: "Community created successfully!",
          });
        }
        router.push(`/admin/communities/${result.communityId}`);
        return;
      }

      toast({
        title: "Draft saved",
        description:
          "The community is saved with no members yet. Open it from your list when you’re ready to finish setup.",
      });
      router.push("/admin/communities");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runCreate("publish");
  };

  const handleSaveDraft = () => {
    void runCreate("draft");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="space-y-8 p-6 animate-blur-in">
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
            <div className="lg:col-span-2 space-y-8">
              <Card className="bg-card border-border/50 backdrop-blur-sm shadow-2xl">
                <CardHeader className="border-b border-border/30">
                  <CardTitle className="font-ts-block ts-xl uppercase text-brand-white tracking-wide">
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor="name"
                      className="font-helvetica-bold helvetica-base text-brand-white"
                    >
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
                        setFormData({
                          ...formData,
                          location: value as CommunityCreateLocation,
                        })
                      }
                    >
                      <SelectTrigger
                        id="location"
                        className="bg-input border-border/50 focus:border-brand-green focus:ring-brand-green/20 text-brand-white placeholder:text-muted-foreground transition-all duration-300 h-12"
                      >
                        <SelectValue placeholder="Select community location" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMUNITY_CREATE_LOCATION_OPTIONS.map((option) => (
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
                    maxSize={5 * 1024 * 1024}
                    acceptedFormats={["image/jpeg", "image/png", "image/webp"]}
                  />
                </CardContent>
              </Card>
            </div>

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
                        Choose a clear, descriptive name that represents your
                        community
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
                        Upload a distinctive image to make your community
                        recognizable
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-brand-green rounded-full mt-2 flex-shrink-0"></div>
                      <p className="font-helvetica-regular helvetica-sm text-muted-foreground">
                        Create Community adds you as the first admin and opens the
                        space. Save as Draft only stores the listing (no membership
                        yet).
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

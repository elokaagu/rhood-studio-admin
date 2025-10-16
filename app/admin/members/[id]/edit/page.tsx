"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  MapPin,
  Music,
  Instagram,
  Volume2,
  FileText,
} from "lucide-react";

export default function EditMemberPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [memberId, setMemberId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [member, setMember] = useState<{
    id: string;
    name: string;
    email: string;
    location: string;
    joinDate: string;
    bio: string;
    profileImageUrl?: string;
    instagram?: string;
    soundcloud?: string;
    dj_name?: string;
    first_name?: string;
    last_name?: string;
    city?: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    dj_name: "",
    first_name: "",
    last_name: "",
    email: "",
    city: "",
    bio: "",
    instagram: "",
    soundcloud: "",
  });

  // Initialize params
  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params;
      setMemberId(resolvedParams.id as string);
    };
    initializeParams();
  }, [params]);

  const fetchMember = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", memberId as string)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        const transformedMember = {
          id: data.id,
          name:
            data.dj_name || `${data.first_name} ${data.last_name}` || "Unknown",
          email: data.email || "No email",
          location: data.city || "Unknown",
          joinDate: data.created_at
            ? (() => {
                const date = new Date(data.created_at);
                return isNaN(date.getTime())
                  ? "Unknown"
                  : date.toISOString().split("T")[0];
              })()
            : "Unknown",
          bio: data.bio || "",
          profileImageUrl: data.profile_image_url || undefined,
          instagram: data.instagram || "",
          soundcloud: data.soundcloud || "",
          dj_name: data.dj_name || "",
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          city: data.city || "",
        };

        setMember(transformedMember);
        setFormData({
          dj_name: data.dj_name || "",
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          city: data.city || "",
          bio: data.bio || "",
          instagram: data.instagram || "",
          soundcloud: data.soundcloud || "",
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching member:", error);
      toast({
        title: "Error",
        description: "Failed to load member data",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }, [memberId, toast]);

  // Fetch member data
  useEffect(() => {
    if (memberId) {
      fetchMember();
    }
  }, [memberId, fetchMember]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!memberId) return;

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from("user_profiles")
        .update({
          dj_name: formData.dj_name,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          city: formData.city,
          bio: formData.bio,
          instagram: formData.instagram,
          soundcloud: formData.soundcloud,
        })
        .eq("id", memberId);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Member profile updated successfully",
      });

      router.push(`/admin/members/${memberId}`);
    } catch (error) {
      console.error("Error updating member:", error);
      toast({
        title: "Error",
        description: "Failed to update member profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className={textStyles.body.regular}>Loading member data...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className={textStyles.headline.section}>MEMBER NOT FOUND</h1>
          <p className={textStyles.body.regular}>
            The member you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button
            onClick={() => router.push("/admin/members")}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Members
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={textStyles.headline.section}>EDIT MEMBER</h1>
          <p className={textStyles.body.regular}>
            Update {member.name}&apos;s profile information
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/members/${member.id}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className={textStyles.subheading.small}>
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16 bg-brand-green">
                  <AvatarImage
                    src={member.profileImageUrl}
                    alt={member.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-brand-black font-bold text-lg">
                    {member.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Profile image cannot be changed here
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Contact administrator for image updates
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dj_name">DJ Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dj_name"
                      name="dj_name"
                      value={formData.dj_name}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="Enter DJ name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Enter first name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Enter last name"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="city">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="Enter city"
                    />
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="pl-10 min-h-[100px]"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className={textStyles.subheading.small}>
                Social Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center">
                    <span className="absolute left-10 text-muted-foreground text-sm pointer-events-none">
                      https://instagram.com/
                    </span>
                    <Input
                      id="instagram"
                      name="instagram"
                      value={formData.instagram.replace(
                        "https://instagram.com/",
                        ""
                      )}
                      onChange={(e) => {
                        const handle = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          instagram: handle
                            ? `https://instagram.com/${handle}`
                            : "",
                        }));
                      }}
                      className="pl-40"
                      placeholder="username"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="soundcloud">SoundCloud</Label>
                <div className="relative">
                  <Volume2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center">
                    <span className="absolute left-10 text-muted-foreground text-sm pointer-events-none">
                      https://soundcloud.com/
                    </span>
                    <Input
                      id="soundcloud"
                      name="soundcloud"
                      value={formData.soundcloud.replace(
                        "https://soundcloud.com/",
                        ""
                      )}
                      onChange={(e) => {
                        const handle = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          soundcloud: handle
                            ? `https://soundcloud.com/${handle}`
                            : "",
                        }));
                      }}
                      className="pl-44"
                      placeholder="username"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Save Actions */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className={textStyles.subheading.small}>
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push(`/admin/members/${member.id}`)}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </CardContent>
          </Card>

          {/* Member Info */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className={textStyles.subheading.small}>
                Member Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2" />
                Joined {member.joinDate}
              </div>
              <div className="flex items-center text-muted-foreground">
                <Music className="h-4 w-4 mr-2" />0 gigs
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

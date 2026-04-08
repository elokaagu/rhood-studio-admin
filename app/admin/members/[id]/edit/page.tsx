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
import {
  fetchMemberCompletedGigsCount,
  fetchMemberForEdit,
  updateMemberProfile,
  type MemberEditFormState,
  type MemberEditView,
} from "@/lib/admin/members/member-edit";
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

function routeMemberId(params: { id?: string | string[] }): string | null {
  const raw = params.id;
  if (typeof raw === "string" && raw.length > 0) return raw;
  if (Array.isArray(raw) && raw[0]) return raw[0];
  return null;
}

const emptyForm: MemberEditFormState = {
  dj_name: "",
  first_name: "",
  last_name: "",
  email: "",
  city: "",
  bio: "",
  instagram: "",
  soundcloud: "",
};

export default function EditMemberPage() {
  const params = useParams<{ id: string | string[] }>();
  const memberId = routeMemberId(params);
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [member, setMember] = useState<MemberEditView | null>(null);
  const [formData, setFormData] = useState<MemberEditFormState>(emptyForm);
  const [completedGigs, setCompletedGigs] = useState<number | null>(null);

  const loadMember = useCallback(async () => {
    if (!memberId) {
      setIsLoading(false);
      setMember(null);
      return;
    }

    setIsLoading(true);
    try {
      const [profileRes, gigs] = await Promise.all([
        fetchMemberForEdit(memberId),
        fetchMemberCompletedGigsCount(memberId),
      ]);

      if (!profileRes.ok) {
        setMember(null);
        setFormData(emptyForm);
        setCompletedGigs(null);
        toast({
          title: "Error",
          description: profileRes.message,
          variant: "destructive",
        });
        return;
      }

      setMember(profileRes.member);
      setFormData(profileRes.form);
      setCompletedGigs(gigs);
    } catch {
      setMember(null);
      toast({
        title: "Error",
        description: "Failed to load member data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [memberId, toast]);

  useEffect(() => {
    loadMember();
  }, [loadMember]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: MemberEditFormState) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!memberId) return;

    setIsSaving(true);
    try {
      const result = await updateMemberProfile(memberId, formData);
      if (!result.ok) {
        toast({
          title: "Validation error",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Member profile updated successfully",
      });

      router.push(`/admin/members/${memberId}`);
    } catch {
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
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  if (!memberId || !member) {
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

  const avatarInitials =
    member.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((n: string) => n[0]?.toUpperCase() ?? "")
      .join("") || "?";

  return (
    <div className="space-y-6 animate-blur-in">
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
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className={textStyles.subheading.small}>
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16 bg-brand-green">
                  <AvatarImage
                    src={member.profileImageUrl}
                    alt={member.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-brand-black font-bold text-lg">
                    {avatarInitials}
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
                      value={formData.instagram}
                      onChange={handleInputChange}
                      className="pl-40"
                      placeholder="username"
                      autoComplete="off"
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
                      value={formData.soundcloud}
                      onChange={handleInputChange}
                      className="pl-44"
                      placeholder="username"
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
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

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className={textStyles.subheading.small}>
                Member Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2 shrink-0" />
                Joined {member.joinDateLabel}
              </div>
              <div className="flex items-center text-muted-foreground">
                <Music className="h-4 w-4 mr-2 shrink-0" />
                {completedGigs === null
                  ? "…"
                  : `${completedGigs} completed gig${completedGigs === 1 ? "" : "s"}`}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

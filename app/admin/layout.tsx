"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { UserRole } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Settings,
  LayoutDashboard,
  Briefcase,
  FileText,
  Music,
  Users,
  LogOut,
  User,
  MessageSquare,
  BarChart3,
  Key,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { textStyles } from "@/lib/typography";
import { getCurrentUserProfile, type UserRole } from "@/lib/auth-utils";

const allSidebarItems = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "brand"] as UserRole[],
  },
  {
    title: "Opportunities",
    url: "/admin/opportunities",
    icon: Briefcase,
    roles: ["admin", "brand"] as UserRole[],
  },
  {
    title: "Applications",
    url: "/admin/applications",
    icon: FileText,
    roles: ["admin", "brand"] as UserRole[],
  },
  {
    title: "Mixes",
    url: "/admin/mixes",
    icon: Music,
    roles: ["admin"] as UserRole[],
  },
  {
    title: "Members",
    url: "/admin/members",
    icon: Users,
    roles: ["admin"] as UserRole[],
  },
  {
    title: "Communities",
    url: "/admin/communities",
    icon: MessageSquare,
    roles: ["admin"] as UserRole[],
  },
  {
    title: "Analytics",
    url: "/admin/analytics",
    icon: BarChart3,
    roles: ["admin"] as UserRole[],
  },
  {
    title: "Invite Codes",
    url: "/admin/invite-codes",
    icon: Key,
    roles: ["admin"] as UserRole[],
  },
];

function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      const profile = await getCurrentUserProfile();
      setUserRole(profile?.role || "admin");
    };
    fetchUserRole();
  }, []);

  // Filter sidebar items based on user role
  const sidebarItems = allSidebarItems.filter((item) =>
    userRole ? item.roles.includes(userRole) : true
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border h-14">
        <div className="flex items-center px-4 h-full">
          <Image
            src="/rhood_logo.webp"
            alt="R/HOOD Logo"
            className="w-8 h-8 transition-opacity duration-300"
            width={32}
            height={32}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            loading="eager"
            priority={true}
          />
          {!isCollapsed && (
            <div className="ml-3">
              <h1 className="text-lg font-bold text-foreground">R/HOOD</h1>
              <p className="text-xs text-muted-foreground">Portal</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.url}
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        pathname === item.url
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && (
                        <span className={`ml-3 ${textStyles.body.regular}`}>
                          {item.title}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [userName, setUserName] = useState<string>("RHOOD TEAM");
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    first_name: "",
    last_name: "",
    dj_name: "",
  });

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          console.warn("Unable to fetch user:", authError);
          return;
        }

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("first_name, last_name, dj_name, brand_name, role")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.warn("Unable to fetch user profile:", profileError);
          // Fallback to email username
          const emailUsername = user.email?.split("@")[0] || "RHOOD TEAM";
          setUserName(emailUsername.toUpperCase());
          return;
        }

        // For brands, show brand name prominently
        if (profile?.role === "brand") {
          const brandName = profile.brand_name?.trim() || "BRAND";
          setUserName(brandName.toUpperCase());
        } else {
          // For admins/DJs, use dj_name, then first_name last_name, then email username
          const displayName =
            profile?.dj_name?.trim() ||
            [profile?.first_name, profile?.last_name]
              .map((part) => (part ? part.trim() : ""))
              .filter(Boolean)
              .join(" ") ||
            user.email?.split("@")[0] ||
            "RHOOD TEAM";
          setUserName(displayName.toUpperCase());
        }
      } catch (error) {
        console.error("Error fetching user name:", error);
        setUserName("RHOOD TEAM");
      }
    };

    fetchUserName();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Unable to fetch user");
      }

      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("first_name, last_name, dj_name")
        .eq("id", user.id)
        .single();

      if (profileError) {
        // If profile doesn't exist, create one
        const { data: newProfile, error: createError } = await supabase
          .from("user_profiles")
          .insert({
            id: user.id,
            email: user.email || "",
            first_name: "",
            last_name: "",
            dj_name: "",
            city: "",
          })
          .select("first_name, last_name, dj_name")
          .single();

        if (createError) {
          throw createError;
        }

        setProfileFormData({
          first_name: newProfile?.first_name || "",
          last_name: newProfile?.last_name || "",
          dj_name: newProfile?.dj_name || "",
        });
      } else {
        setProfileFormData({
          first_name: profile?.first_name || "",
          last_name: profile?.last_name || "",
          dj_name: profile?.dj_name || "",
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleOpenAccountSettings = () => {
    setAccountSettingsOpen(true);
    fetchUserProfile();
  };

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Unable to fetch user");
      }

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          first_name: profileFormData.first_name.trim(),
          last_name: profileFormData.last_name.trim(),
          dj_name: profileFormData.dj_name.trim(),
        })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      // Update the displayed name
      const displayName =
        profileFormData.dj_name.trim() ||
        [profileFormData.first_name, profileFormData.last_name]
          .map((part) => (part ? part.trim() : ""))
          .filter(Boolean)
          .join(" ") ||
        user.email?.split("@")[0] ||
        "RHOOD TEAM";

      setUserName(displayName.toUpperCase());

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      setAccountSettingsOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to logout. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
        });
        router.push("/login");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-background">
        <AppSidebar />

        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-8 w-8" />
              <div className="flex items-center">
                <Image
                  src="/RHOOD_Lettering_Logo.png"
                  alt="R/HOOD"
                  width={120}
                  height={36}
                  className="h-8 w-auto transition-opacity duration-300"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                  loading="eager"
                  priority={true}
                />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge
                variant="outline"
                className={`border-primary ${textStyles.headline.badge}`}
              >
                {userName}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={handleOpenAccountSettings}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 p-6">{children}</div>
        </main>
      </div>

      {/* Account Settings Dialog */}
      <Dialog open={accountSettingsOpen} onOpenChange={setAccountSettingsOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Account Settings</DialogTitle>
            <DialogDescription>
              Update your profile information. Changes will be reflected in your
              display name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dj_name">DJ Name</Label>
              <Input
                id="dj_name"
                placeholder="Your DJ name"
                value={profileFormData.dj_name}
                onChange={(e) =>
                  setProfileFormData({
                    ...profileFormData,
                    dj_name: e.target.value,
                  })
                }
                disabled={isLoadingProfile || isSavingProfile}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                placeholder="Your first name"
                value={profileFormData.first_name}
                onChange={(e) =>
                  setProfileFormData({
                    ...profileFormData,
                    first_name: e.target.value,
                  })
                }
                disabled={isLoadingProfile || isSavingProfile}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                placeholder="Your last name"
                value={profileFormData.last_name}
                onChange={(e) =>
                  setProfileFormData({
                    ...profileFormData,
                    last_name: e.target.value,
                  })
                }
                disabled={isLoadingProfile || isSavingProfile}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAccountSettingsOpen(false)}
              disabled={isSavingProfile}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={isLoadingProfile || isSavingProfile}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSavingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

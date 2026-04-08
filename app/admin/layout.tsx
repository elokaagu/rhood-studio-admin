"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  PortalUserProvider,
  usePortalUser,
} from "@/contexts/portal-user-context";
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
  Calendar,
  Coins,
  Trophy,
  Building2,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { textStyles } from "@/lib/typography";
import type { UserRole } from "@/lib/auth-utils";

const allSidebarItems = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "brand"] as UserRole[],
  },
  {
    title: "Brand Profile",
    url: "/admin/brand/profile",
    icon: Building2,
    roles: ["brand"] as UserRole[],
  },
  {
    title: "Book a DJ",
    url: "/admin/book-dj",
    icon: Calendar,
    roles: ["brand"] as UserRole[],
  },
  {
    title: "Booking Requests",
    url: "/admin/booking-requests",
    icon: Calendar,
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
    title: "DJs",
    url: "/admin/djs",
    icon: Users,
    roles: ["admin"] as UserRole[],
  },
  {
    title: "Brands",
    url: "/admin/brands",
    icon: Building2,
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
  {
    title: "Leaderboard",
    url: "/admin/leaderboard",
    icon: Trophy,
    roles: ["admin"] as UserRole[],
  },
  {
    title: "Feedback",
    url: "/admin/feedback",
    icon: MessageCircle,
    roles: ["admin", "brand", "dj"] as UserRole[],
  },
];

function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const pathname = usePathname();
  const { status, role, errorMessage, refresh } = usePortalUser();

  const sidebarItems =
    status === "ready" && role
      ? allSidebarItems.filter((item) => item.roles.indexOf(role) >= 0)
      : [];

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
            {status === "loading" ? (
              <div className="px-3 py-2">
                <p className={`text-sm text-muted-foreground ${textStyles.body.small}`}>
                  Loading...
                </p>
              </div>
            ) : status === "error" ? (
              <div className="px-3 py-2 space-y-2">
                <p className={`text-sm text-destructive ${textStyles.body.small}`}>
                  {errorMessage ?? "Could not load your account."}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => void refresh()}
                >
                  Retry
                </Button>
              </div>
            ) : !role ? (
              <div className="px-3 py-2">
                <p className={`text-sm text-muted-foreground ${textStyles.body.small}`}>
                  Your role could not be determined. Try refreshing the page, or
                  contact support if this continues.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => void refresh()}
                >
                  Retry
                </Button>
              </div>
            ) : (
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
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const {
    displayName,
    credits,
    role,
    profile,
    refresh,
    status: portalStatus,
  } = usePortalUser();
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    first_name: "",
    last_name: "",
  });

  useEffect(() => {
    if (!accountSettingsOpen) return;
    if (profile) {
      setProfileFormData({
        first_name: profile.first_name,
        last_name: profile.last_name,
      });
    } else {
      setProfileFormData({ first_name: "", last_name: "" });
    }
  }, [accountSettingsOpen, profile]);

  const handleOpenAccountSettings = () => {
    setAccountSettingsOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!profile) {
      toast({
        title: "No profile record",
        description:
          "Your account does not have a profile row yet. Contact support to finish setup.",
        variant: "destructive",
      });
      return;
    }

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
        })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      await refresh();

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
    <>
      <div className="min-h-screen w-full flex bg-background">
        <AppSidebar />

        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-3 sm:px-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <SidebarTrigger className="h-8 w-8" />
              <div className="flex items-center">
                <Image
                  src="/RHOOD_Lettering_Logo.png"
                  alt="R/HOOD"
                  width={120}
                  height={36}
                  className="h-6 sm:h-8 w-auto transition-opacity duration-300"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                  loading="eager"
                  priority={true}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Badge
                variant="outline"
                className={`border-primary ${textStyles.headline.badge} text-xs sm:text-sm px-2 sm:px-3 hidden sm:inline-flex`}
              >
                {displayName}
              </Badge>
              {role && role !== "brand" && (
                <Badge
                  variant="outline"
                  className="border-brand-green text-brand-green bg-transparent text-xs sm:text-sm px-2 sm:px-3 hidden sm:inline-flex items-center gap-1"
                >
                  <Coins className="h-3 w-3 sm:h-4 sm:w-4" />
                  {credits}
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                    <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
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
          <div className="flex-1 p-3 sm:p-4 md:p-6 animate-fade-in">{children}</div>
        </main>
      </div>

      {/* Account Settings Dialog */}
      <Dialog open={accountSettingsOpen} onOpenChange={setAccountSettingsOpen}>
        <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Account Settings</DialogTitle>
            <DialogDescription>
              Update your profile information. Changes will be reflected in your
              display name.
            </DialogDescription>
          </DialogHeader>
          {portalStatus === "ready" && !profile && (
            <p className="text-sm text-muted-foreground">
              No profile record is linked to your account. Contact support to
              complete setup; name edits are unavailable until then.
            </p>
          )}
          <div className="space-y-4 py-4">
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
                disabled={
                  portalStatus === "loading" || isSavingProfile || !profile
                }
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
                disabled={
                  portalStatus === "loading" || isSavingProfile || !profile
                }
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
              disabled={
                portalStatus === "loading" || isSavingProfile || !profile
              }
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSavingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalUserProvider>
      <SidebarProvider>
        <AdminLayoutShell>{children}</AdminLayoutShell>
      </SidebarProvider>
    </PortalUserProvider>
  );
}

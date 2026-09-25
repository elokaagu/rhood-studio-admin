"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Image from "next/image";
import { textStyles } from "@/lib/typography";
import { portalAuthRedirectUrl } from "@/lib/portal-url";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { safePortalNextPath } from "@/lib/auth/login-redirect";

function fromUntyped(table: string) {
  return (supabase as unknown as { from: (name: string) => any }).from(table);
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    inviteCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isBrandSignup, setIsBrandSignup] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const signup = params.get("signup");
    const code = params.get("code");
    const email = params.get("email");

    if (signup === "brand") {
      setIsSignUp(true);
      setIsBrandSignup(true);
    }

    if (code || email) {
      setFormData((prev) => ({
        ...prev,
        ...(email ? { email } : {}),
        ...(code ? { inviteCode: code.toUpperCase() } : {}),
      }));
    }
  }, []);

  const destinationAfterLogin = () =>
    safePortalNextPath(new URLSearchParams(window.location.search).get("next"));

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session && !/type=recovery/.test(window.location.hash)) {
        router.push(destinationAfterLogin());
      }
    };

    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        let validatedInvite: {
          id: string;
          brand_name: string | null;
          expires_at: string | null;
          invite_type?: string | null;
          brand_account_id?: string | null;
        } | null = null;

        // Validate invite code for brand signups
        if (isBrandSignup) {
          if (!formData.inviteCode) {
            toast({
              title: "Invite Code Required",
              description: "Please enter an invite code to register as a brand.",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }

          // Validate invite code (brand codes only; DJ codes are redeemed in the app)
          const code = formData.inviteCode.trim().toUpperCase();
          const inviteQuery = (columns: string) =>
            fromUntyped("invite_codes")
              .select(columns)
              .eq("code", code)
              .eq("is_active", true)
              .is("used_by", null)
              .single();

          let inviteResult = await inviteQuery(
            "id, brand_name, expires_at, invite_type, brand_account_id"
          );
          if (inviteResult.error?.message?.includes("brand_account_id")) {
            inviteResult = await inviteQuery(
              "id, brand_name, expires_at, invite_type"
            );
          }
          if (inviteResult.error?.message?.includes("invite_type")) {
            inviteResult = await inviteQuery(
              "id, brand_name, expires_at, brand_account_id"
            );
            if (inviteResult.error?.message?.includes("brand_account_id")) {
              inviteResult = await inviteQuery("id, brand_name, expires_at");
            }
          }

          if (inviteResult.error || !inviteResult.data) {
            toast({
              title: "Invalid Invite Code",
              description:
                "The invite code is invalid, expired, or has already been used.",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }

          validatedInvite = inviteResult.data as {
            id: string;
            brand_name: string | null;
            expires_at: string | null;
            invite_type?: string | null;
            brand_account_id?: string | null;
          };

          if (!validatedInvite || validatedInvite.invite_type === "dj") {
            toast({
              title: validatedInvite?.invite_type === "dj" ? "DJ invite code" : "Invalid Invite Code",
              description:
                validatedInvite?.invite_type === "dj"
                  ? "This code is for the R/HOOD DJ app, not brand Studio signup."
                  : "The invite code is invalid, expired, or has already been used.",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }

          // Check if invite code is expired
          if (
            validatedInvite.expires_at &&
            new Date(validatedInvite.expires_at) < new Date()
          ) {
            toast({
              title: "Invite Code Expired",
              description: "This invite code has expired. Please request a new one.",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
        }

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: portalAuthRedirectUrl("/auth/callback"),
          },
        });

        if (error) {
          toast({
            title: "Sign Up Failed",
            description: error.message,
            variant: "destructive",
          });
        } else if (data.user) {
          // Create user profile
          const profileData: any = {
            id: data.user.id,
            email: formData.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            dj_name: "",
            city: "",
            role: isBrandSignup ? "brand" : "admin",
          };

          // If brand signup, add brand_name from invite code
          if (isBrandSignup && validatedInvite) {
            profileData.brand_name = validatedInvite.brand_name;
            if (validatedInvite.brand_account_id) {
              profileData.brand_account_id = validatedInvite.brand_account_id;
            }

            await fromUntyped("invite_codes")
              .update({
                used_by: data.user.id,
                used_at: new Date().toISOString(),
              })
              .eq("id", validatedInvite.id);
          }

          let { error: profileError } = await supabase
            .from("user_profiles")
            .insert(profileData);

          if (
            profileError &&
            /brand_account_id/i.test(profileError.message || "")
          ) {
            const { brand_account_id: _ignored, ...withoutAccount } = profileData;
            ({ error: profileError } = await supabase
              .from("user_profiles")
              .insert(withoutAccount));
          }

          if (profileError) {
            console.error("Error creating profile:", profileError);
            toast({
              title: "Account Created",
              description:
                "Account created but profile setup failed. Please contact support.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Account Created!",
              description: isBrandSignup
                ? "Brand account created successfully! Please check your email to confirm your account."
                : "Please check your email to confirm your account.",
            });
          }

          setIsSignUp(false); // Switch back to login mode
          setIsBrandSignup(false);
          setFormData({
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            inviteCode: "",
          });
        }
      } else {
        // Sign in existing user
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive",
          });
        } else if (data.user) {
          toast({
            title: "Welcome back!",
            description: "You have been successfully logged in.",
          });
          router.push(destinationAfterLogin());
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Image
            src="/RHOOD_Lettering_Logo.png"
            alt="R/HOOD"
            width={200}
            height={60}
            className="h-16 w-auto transition-opacity duration-300"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            loading="eager"
            priority={true}
          />
        </div>
        <p className={textStyles.headline.section}>
          {isSignUp && isBrandSignup ? "R/HOOD FOR BRANDS" : "PORTAL MANAGEMENT"}
        </p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Image
              src="/rhood_logo.webp"
              alt="R/HOOD"
              width={24}
              height={24}
              className="h-6 w-6 transition-opacity duration-300"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              loading="eager"
              priority={true}
            />
            <CardTitle className={`text-center ${textStyles.headline.card}`}>
              {isForgotPassword
                ? "RESET"
                : isSignUp
                ? isBrandSignup
                  ? "BRAND"
                  : "CREATE"
                : "ADMIN"}
              <br />
              {isForgotPassword
                ? "PASSWORD"
                : isSignUp
                ? isBrandSignup
                  ? "SIGNUP"
                  : "ACCOUNT"
                : "LOGIN"}
            </CardTitle>
          </div>
          {isSignUp && isBrandSignup && (
            <div className="text-center">
              <Badge
                variant="outline"
                className={`border-primary ${textStyles.headline.badge}`}
              >
                R/HOOD FOR BRANDS
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {isForgotPassword ? (
            <ForgotPasswordForm
              initialEmail={formData.email}
              onBack={() => setIsForgotPassword(false)}
            />
          ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            autoComplete={isSignUp ? "off" : "on"}
          >
            {/* First Name and Last Name - Only show for sign up */}
            {isSignUp && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className={textStyles.body.regular}
                    >
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      name="firstName"
                      autoComplete="off"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className="bg-secondary border-border text-foreground"
                      required={isSignUp}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className={textStyles.body.regular}
                    >
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      name="lastName"
                      autoComplete="off"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="bg-secondary border-border text-foreground"
                      required={isSignUp}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className={textStyles.body.regular}>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                name={isSignUp ? "portal-email" : "email"}
                autoComplete={isSignUp ? "off" : "username"}
                placeholder="team@rhood.io"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="bg-secondary border-border text-foreground"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className={textStyles.body.regular}>
                  Password
                </Label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className={`${textStyles.body.small} text-primary hover:underline`}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type={isSignUp ? "text" : "password"}
                name={isSignUp ? "portal-password" : "password"}
                autoComplete={isSignUp ? "off" : "current-password"}
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-1p-ignore={isSignUp || undefined}
                data-lpignore={isSignUp ? "true" : undefined}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className={`bg-secondary border-border text-foreground${
                  isSignUp ? " [-webkit-text-security:disc]" : ""
                }`}
                required
              />
            </div>

            {/* Invite Code - Only for brand signup */}
            {isSignUp && isBrandSignup && (
              <div className="space-y-2">
                <Label htmlFor="inviteCode" className={textStyles.body.regular}>
                  Invite Code *
                </Label>
                <Input
                  id="inviteCode"
                  type="text"
                  placeholder="Enter your invite code"
                  value={formData.inviteCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      inviteCode: e.target.value.toUpperCase(),
                    })
                  }
                  className="bg-secondary border-border text-foreground font-mono"
                  autoComplete="off"
                  required
                />
                <p className={textStyles.body.small + " text-muted-foreground"}>
                  Enter the invite code provided by an admin
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="premium"
              size="lg"
              className="w-full mt-6"
              disabled={
                loading ||
                !formData.email ||
                !formData.password ||
                (isSignUp && (!formData.firstName || !formData.lastName)) ||
                (isSignUp && isBrandSignup && !formData.inviteCode)
              }
            >
              {loading
                ? isSignUp
                  ? "Creating account..."
                  : "Signing in..."
                : isSignUp
                ? "Create Account"
                : "Sign In"}
            </Button>
          </form>
          )}
        </CardContent>
      </Card>

      {/* Toggle between Sign In and Sign Up */}
      <div className={`text-center mt-6 space-y-2${isForgotPassword ? " hidden" : ""}`}>
        {isSignUp && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => {
                setIsBrandSignup(!isBrandSignup);
                setFormData({
                  ...formData,
                  inviteCode: "",
                });
              }}
              className={`${textStyles.body.small} text-primary hover:underline`}
            >
              {isBrandSignup
                ? "Sign up as R/HOOD Team member instead"
                : "Sign up as Brand instead"}
            </button>
          </div>
        )}
        <p className={textStyles.body.small}>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
        </p>
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setIsBrandSignup(false);
            // Clear form when switching modes
            setFormData({
              firstName: "",
              lastName: "",
              email: "",
              password: "",
              inviteCode: "",
            });
          }}
          className={`mt-2 ${textStyles.body.regular} text-primary hover:underline`}
        >
          {isSignUp ? "Sign In" : "Create Account"}
        </button>
      </div>
    </div>
  );
}

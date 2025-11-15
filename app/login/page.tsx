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

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.push("/admin/dashboard");
      }
    };

    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up new user
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          toast({
            title: "Sign Up Failed",
            description: error.message,
            variant: "destructive",
          });
        } else if (data.user) {
          toast({
            title: "Account Created!",
            description: "Please check your email to confirm your account.",
          });
          setIsSignUp(false); // Switch back to login mode
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
          router.push("/admin/dashboard");
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
        <p className={textStyles.headline.section}>PORTAL MANAGEMENT</p>
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
              {isSignUp ? "CREATE" : "ADMIN"}
              <br />
              {isSignUp ? "ACCOUNT" : "LOGIN"}
            </CardTitle>
          </div>
          <div className="text-center">
            <Badge
              variant="outline"
              className={`border-primary ${textStyles.headline.badge}`}
            >
              RHOOD TEAM ONLY
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="password" className={textStyles.body.regular}>
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="bg-secondary border-border text-foreground"
                required
              />
            </div>

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
                (isSignUp && (!formData.firstName || !formData.lastName))
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
        </CardContent>
      </Card>

      {/* Toggle between Sign In and Sign Up */}
      <div className="text-center mt-6">
        <p className={textStyles.body.small}>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
        </p>
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            // Clear form when switching modes
            setFormData({
              firstName: "",
              lastName: "",
              email: "",
              password: "",
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

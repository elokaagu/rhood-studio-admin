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
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

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
            className="h-16 w-auto"
          />
        </div>
        <p className={textStyles.headline.section}>
          R/HOOD
          <br />
          STUDIO
          <br />
          MANAGEMENT
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
              className="h-6 w-6"
            />
            <CardTitle className={`text-center ${textStyles.headline.card}`}>
              ADMIN
              <br />
              LOGIN
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
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className={textStyles.body.regular}>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@rhood.studio"
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
              disabled={loading || !formData.email || !formData.password}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

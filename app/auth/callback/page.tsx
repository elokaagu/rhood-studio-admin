"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for error in URL
        const errorParam = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        if (errorParam) {
          setError(errorDescription || errorParam);
          setTimeout(() => {
            router.push("/login?error=auth_error");
          }, 3000);
          return;
        }

        // Handle email confirmation token (in hash)
        if (typeof window !== "undefined") {
          const hashParams = new URLSearchParams(
            window.location.hash.substring(1)
          );
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          const type = hashParams.get("type");

          // If we have tokens in the hash, set the session
          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              console.error("Error setting session:", sessionError);
              setError("Failed to confirm your email. Please try again.");
              setTimeout(() => {
                router.push("/login?error=session_error");
              }, 3000);
              return;
            }

            // Success! Redirect to dashboard
            router.push("/admin/dashboard");
            return;
          }

          // Handle PKCE flow (code exchange)
          const code = searchParams.get("code");
          if (code) {
            const { error: exchangeError } =
              await supabase.auth.exchangeCodeForSession(code);

            if (exchangeError) {
              console.error("Error exchanging code:", exchangeError);
              setError("Failed to confirm your email. Please try again.");
              setTimeout(() => {
                router.push("/login?error=exchange_error");
              }, 3000);
              return;
            }

            // Success! Redirect to dashboard
            router.push("/admin/dashboard");
            return;
          }

          // If no token or code found, check if user is already authenticated
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session) {
            router.push("/admin/dashboard");
            return;
          }

          // No valid auth parameters found
          setError("Invalid confirmation link. Please try again.");
          setTimeout(() => {
            router.push("/login?error=invalid_link");
          }, 3000);
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("An unexpected error occurred. Please try again.");
        setTimeout(() => {
          router.push("/login?error=unexpected_error");
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c2cc06] mx-auto mb-4"></div>
        <p className="text-white">Confirming your account...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c2cc06] mx-auto mb-4"></div>
            <p className="text-white">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}


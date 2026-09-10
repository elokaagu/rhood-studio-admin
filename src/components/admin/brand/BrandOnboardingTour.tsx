"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { markStudioTourComplete } from "@/lib/brand/sign-studio-agreement";

export type BrandTourStep = {
  id: string;
  title: string;
  body: string;
  selector?: string;
};

export const BRAND_TOUR_STEPS: BrandTourStep[] = [
  {
    id: "welcome",
    title: "Welcome to R/HOOD Studio",
    body: "This short guide walks through how brands book DJs, post opportunities, and manage applications.",
  },
  {
    id: "dashboard",
    title: "Dashboard",
    body: "Your home for live opportunity counts, pending applications, and upcoming events.",
    selector: '[data-tour="nav-dashboard"]',
  },
  {
    id: "profile",
    title: "Brand Profile",
    body: "Add your logo, description, and website so DJs know who they are working with. Click the square logo to upload an image.",
    selector: '[data-tour="nav-brand-profile"]',
  },
  {
    id: "book-dj",
    title: "Book a DJ",
    body: "Browse DJs and send a booking request with event details. They get the request in the R/HOOD app.",
    selector: '[data-tour="nav-book-dj"]',
  },
  {
    id: "booking-requests",
    title: "Booking Requests",
    body: "Track requests you have sent, and see which DJs have accepted or declined.",
    selector: '[data-tour="nav-booking-requests"]',
  },
  {
    id: "opportunities",
    title: "Opportunities",
    body: "Post a campaign or event. DJs apply from the app. Keep listings accurate so applications stay relevant.",
    selector: '[data-tour="nav-opportunities"]',
  },
  {
    id: "applications",
    title: "Applications",
    body: "Review who applied, shortlist DJs, and move applications through to a booking.",
    selector: '[data-tour="nav-applications"]',
  },
  {
    id: "settings",
    title: "Account",
    body: "Use the gear in the top right for your name and to log out. You can replay this guide later from Brand Profile.",
    selector: '[data-tour="account-settings"]',
  },
];

type Props = {
  userId: string;
  active: boolean;
  onFinished: () => void;
};

type Spotlight = { top: number; left: number; width: number; height: number };

export function BrandOnboardingTour({ userId, active, onFinished }: Props) {
  const { setOpen, setOpenMobile, isMobile } = useSidebar();
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<Spotlight | null>(null);

  const step = BRAND_TOUR_STEPS[stepIndex];
  const isLast = stepIndex === BRAND_TOUR_STEPS.length - 1;

  const finish = useCallback(async () => {
    try {
      await markStudioTourComplete(userId);
    } catch {
      /* local complete still stands */
    }
    try {
      window.localStorage.setItem(`rhood-studio-tour:${userId}`, "done");
    } catch {
      /* ignore */
    }
    onFinished();
  }, [onFinished, userId]);

  useEffect(() => {
    if (!active) return;
    setOpen(true);
    if (isMobile) setOpenMobile(true);
  }, [active, isMobile, setOpen, setOpenMobile]);

  useEffect(() => {
    if (!active || !step) return;

    const measure = () => {
      if (!step.selector) {
        setSpotlight(null);
        return;
      }
      const el = document.querySelector(step.selector);
      if (!(el instanceof HTMLElement)) {
        setSpotlight(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      setSpotlight({
        top: rect.top - 6,
        left: rect.left - 6,
        width: rect.width + 12,
        height: rect.height + 12,
      });
    };

    measure();
    const timer = window.setTimeout(measure, 200);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active, step]);

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") void finish();
      if (event.key === "ArrowRight") {
        if (isLast) void finish();
        else setStepIndex((i) => i + 1);
      }
      if (event.key === "ArrowLeft") {
        setStepIndex((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, finish, isLast]);

  if (!active || !step) return null;

  const tooltipStyle: React.CSSProperties = spotlight
    ? {
        top: Math.min(
          Math.max(spotlight.top, 16),
          window.innerHeight - 220
        ),
        left: Math.min(spotlight.left + spotlight.width + 16, window.innerWidth - 340),
      }
    : {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };

  return (
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-label="Studio tour">
      <div className="absolute inset-0 bg-black/70" />
      {spotlight && (
        <div
          className="absolute rounded-lg ring-2 ring-brand-green shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] pointer-events-none"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
        />
      )}
      <div
        className="absolute w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-4 shadow-xl"
        style={tooltipStyle}
      >
        <p className="text-[11px] uppercase tracking-wide text-brand-green font-semibold">
          {stepIndex + 1} of {BRAND_TOUR_STEPS.length}
        </p>
        <h3 className="mt-1 text-base font-semibold text-foreground">{step.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.body}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => void finish()}>
            Skip
          </Button>
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStepIndex((i) => i - 1)}
              >
                Back
              </Button>
            )}
            <Button
              size="sm"
              className="bg-brand-green text-brand-black hover:bg-brand-green/90"
              onClick={() => {
                if (isLast) void finish();
                else setStepIndex((i) => i + 1);
              }}
            >
              {isLast ? "Done" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

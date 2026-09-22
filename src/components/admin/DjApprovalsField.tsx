"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Users } from "lucide-react";
import type { ApprovalLimitMode } from "@/lib/opportunities/approval-limit";

export function DjApprovalsField({
  mode,
  count,
  onModeChange,
  onCountChange,
}: {
  mode: ApprovalLimitMode;
  count: number;
  onModeChange: (mode: ApprovalLimitMode) => void;
  onCountChange: (count: number) => void;
}) {
  const [countText, setCountText] = useState(String(Math.max(2, count || 2)));

  useEffect(() => {
    setCountText(String(Math.max(2, count || 2)));
  }, [count]);

  const commitCount = () => {
    const parsed = Math.floor(Number(countText));
    const next = Number.isFinite(parsed) && parsed >= 2 ? parsed : 2;
    setCountText(String(next));
    if (next !== count) onCountChange(next);
  };

  return (
    <div className="space-y-3">
      <Label className="text-foreground flex items-center">
        <Users className="h-4 w-4 mr-2" />
        DJ approvals
      </Label>
      <RadioGroup
        value={mode}
        onValueChange={(value) => {
          const next = value as ApprovalLimitMode;
          onModeChange(next);
          if (next === "limited" && (!count || count < 2)) {
            onCountChange(2);
          }
        }}
        className="gap-3"
      >
        <label className="flex items-start gap-2 text-sm text-foreground cursor-pointer">
          <RadioGroupItem value="unlimited" className="mt-0.5" />
          <span>
            Unlimited
            <span className="block text-xs text-muted-foreground">
              Approve as many DJs as you want.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm text-foreground cursor-pointer">
          <RadioGroupItem value="one" className="mt-0.5" />
          <span>
            One DJ
            <span className="block text-xs text-muted-foreground">
              Only one applicant can be approved.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm text-foreground cursor-pointer">
          <RadioGroupItem value="limited" className="mt-0.5" />
          <span>
            Up to a set number
            <span className="block text-xs text-muted-foreground">
              Stop approvals once this many DJs are in.
            </span>
          </span>
        </label>
      </RadioGroup>

      {mode === "limited" && (
        <div
          className="pl-6"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            min={2}
            value={countText}
            onChange={(event) => {
              const digits = event.target.value.replace(/[^\d]/g, "");
              setCountText(digits);
              const parsed = Math.floor(Number(digits));
              if (Number.isFinite(parsed) && parsed >= 2) {
                onCountChange(parsed);
              }
            }}
            onBlur={commitCount}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === "Enter") {
                event.preventDefault();
                commitCount();
              }
            }}
            className="bg-secondary border-border text-foreground w-28"
            aria-label="Maximum number of DJs to approve"
          />
        </div>
      )}
    </div>
  );
}

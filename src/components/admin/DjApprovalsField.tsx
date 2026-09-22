"use client";

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
  return (
    <div className="space-y-3">
      <Label className="text-foreground flex items-center">
        <Users className="h-4 w-4 mr-2" />
        DJ approvals
      </Label>
      <RadioGroup
        value={mode}
        onValueChange={(value) => onModeChange(value as ApprovalLimitMode)}
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
          <span className="flex-1">
            Up to a set number
            <span className="block text-xs text-muted-foreground mb-2">
              Stop approvals once this many DJs are in.
            </span>
            {mode === "limited" && (
              <Input
                type="number"
                min={1}
                step={1}
                value={count}
                onChange={(event) =>
                  onCountChange(Math.max(1, Number(event.target.value) || 1))
                }
                className="bg-secondary border-border text-foreground w-28"
              />
            )}
          </span>
        </label>
      </RadioGroup>
    </div>
  );
}

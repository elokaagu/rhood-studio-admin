"use client";

import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  formatTimezoneLabel,
  timezoneSelectOptions,
} from "@/lib/opportunities/timezones";

export function TimezoneSelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (timeZone: string) => void;
  className?: string;
}) {
  const options = useMemo(() => timezoneSelectOptions(value), [value]);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={cn(
          "bg-secondary border-border text-foreground",
          className
        )}
      >
        <SelectValue placeholder="Select timezone" />
      </SelectTrigger>
      <SelectContent className="bg-popover border-border max-h-72">
        {options.map((tz) => (
          <SelectItem
            key={tz}
            value={tz}
            className="text-foreground hover:bg-accent"
          >
            {formatTimezoneLabel(tz)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

"use client";

import React, { useMemo, useState } from "react";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  min?: string;
  required?: boolean;
};

type TimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
};

function parseDateInput(value: string): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function formatDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateDisplay(value: string): string {
  const parsed = parseDateInput(value);
  if (!parsed) return "dd/mm/yyyy";
  const d = String(parsed.getDate()).padStart(2, "0");
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const y = parsed.getFullYear();
  return `${d}/${m}/${y}`;
}

export function RhoodDatePicker({
  value,
  onChange,
  placeholder = "dd/mm/yyyy",
  className,
  min,
}: DatePickerProps) {
  const selected = parseDateInput(value);
  const minDate = parseDateInput(min ?? "");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-between bg-secondary border-border text-foreground hover:bg-secondary/80",
            className
          )}
        >
          <span className={cn(!value && "text-muted-foreground")}>
            {value ? formatDateDisplay(value) : placeholder}
          </span>
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-card border-border text-foreground" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (!date) return;
            onChange(formatDateInput(date));
          }}
          disabled={minDate ? { before: minDate } : undefined}
          className="bg-card text-foreground"
          classNames={{
            caption_label: "text-sm font-semibold text-foreground",
            head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
            day_today: "bg-brand-green/20 text-brand-green",
            day_selected:
              "bg-brand-green text-brand-black hover:bg-brand-green/90 focus:bg-brand-green",
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function formatTimeLabel(value: string): string {
  return value || "--:--";
}

export function RhoodTimePicker({
  value,
  onChange,
  placeholder = "--:--",
  className,
}: TimePickerProps) {
  const [hour, minute] = (value || "").split(":");
  const hours = useMemo(
    () => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")),
    []
  );
  const minutes = useMemo(
    () => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")),
    []
  );
  const [open, setOpen] = useState(false);

  const selectHour = (h: string) => {
    const nextMinute = minute ?? "00";
    onChange(`${h}:${nextMinute}`);
  };

  const selectMinute = (m: string) => {
    const nextHour = hour ?? "00";
    onChange(`${nextHour}:${m}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-between bg-secondary border-border text-foreground hover:bg-secondary/80",
            className
          )}
        >
          <span className={cn(!value && "text-muted-foreground")}>
            {value ? formatTimeLabel(value) : placeholder}
          </span>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-3 bg-card border-border text-foreground" align="start">
        <div className="grid grid-cols-2 gap-2">
          <div className="max-h-56 overflow-y-auto rounded-md border border-border bg-secondary/30 p-1">
            {hours.map((h) => (
              <Button
                key={h}
                type="button"
                variant={hour === h ? "default" : "ghost"}
                className={cn(
                  "w-full justify-center mb-1",
                  hour === h && "bg-brand-green text-brand-black hover:bg-brand-green/90"
                )}
                onClick={() => selectHour(h)}
              >
                {h}
              </Button>
            ))}
          </div>
          <div className="max-h-56 overflow-y-auto rounded-md border border-border bg-secondary/30 p-1">
            {minutes.map((m) => (
              <Button
                key={m}
                type="button"
                variant={minute === m ? "default" : "ghost"}
                className={cn(
                  "w-full justify-center mb-1",
                  minute === m && "bg-brand-green text-brand-black hover:bg-brand-green/90"
                )}
                onClick={() => selectMinute(m)}
              >
                {m}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

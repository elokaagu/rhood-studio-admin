"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ALL_GENRES_LABEL,
  OPPORTUNITY_GENRES,
  isAllGenres,
} from "@/lib/opportunities/genres";
import { Plus } from "lucide-react";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
};

export function GenrePicker({ value, onChange }: Props) {
  const [custom, setCustom] = useState("");
  const allSelected = isAllGenres(value);
  const extras = value.filter(
    (genre) =>
      genre.toLowerCase() !== ALL_GENRES_LABEL.toLowerCase() &&
      !OPPORTUNITY_GENRES.some(
        (preset) => preset.toLowerCase() === genre.toLowerCase()
      )
  );
  const options = [ALL_GENRES_LABEL, ...OPPORTUNITY_GENRES, ...extras];

  const isSelected = (genre: string) =>
    genre === ALL_GENRES_LABEL ? allSelected : !allSelected && value.includes(genre);

  const toggle = (genre: string) => {
    if (genre === ALL_GENRES_LABEL) {
      onChange(allSelected ? [] : [ALL_GENRES_LABEL]);
      return;
    }
    if (allSelected) {
      onChange([genre]);
      return;
    }
    onChange(
      value.includes(genre)
        ? value.filter((item) => item !== genre)
        : [...value, genre]
    );
  };

  const addCustom = () => {
    const name = custom.trim();
    if (!name) return;
    if (name.toLowerCase() === ALL_GENRES_LABEL.toLowerCase()) {
      onChange([ALL_GENRES_LABEL]);
      setCustom("");
      return;
    }
    const match = options.find(
      (genre) => genre.toLowerCase() === name.toLowerCase()
    );
    const next = match || name;
    if (allSelected) {
      onChange([next]);
    } else if (!value.includes(next)) {
      onChange([...value, next]);
    }
    setCustom("");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map((genre) => (
          <Badge
            key={genre}
            variant={isSelected(genre) ? "default" : "outline"}
            className={`cursor-pointer transition-all duration-200 ${
              isSelected(genre)
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "border-border text-foreground hover:bg-accent"
            }`}
            onClick={() => toggle(genre)}
          >
            {genre}
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          placeholder="Add a genre"
          className="bg-secondary border-border text-foreground"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addCustom();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={addCustom}
          disabled={!custom.trim()}
          className="shrink-0"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
}

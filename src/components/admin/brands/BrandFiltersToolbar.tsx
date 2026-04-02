"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BrandsSortOption } from "@/lib/brands/types";
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

type Props = {
  searchTerm: string;
  onSearchTermChange: (v: string) => void;
  activeFilter: string;
  onActiveFilterChange: (v: string) => void;
  sortBy: BrandsSortOption;
  onSortChange: (v: BrandsSortOption) => void;
};

export function BrandFiltersToolbar({
  searchTerm,
  onSearchTermChange,
  activeFilter,
  onActiveFilterChange,
  sortBy,
  onSortChange,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-4">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search brands, locations..."
          className="pl-10 bg-secondary border-border text-foreground w-full"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:space-x-2">
        {(["all", "active", "inactive"] as const).map((key) => (
          <Button
            key={key}
            variant="outline"
            size="sm"
            className={`text-xs sm:text-sm ${
              activeFilter === key
                ? "bg-brand-green text-brand-black hover:bg-brand-green/90"
                : ""
            }`}
            onClick={() => onActiveFilterChange(key)}
          >
            {key === "all" ? "All" : key === "active" ? "Active" : "Inactive"}
          </Button>
        ))}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="min-w-[140px] text-xs sm:text-sm w-full sm:w-auto"
          >
            <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            <span className="hidden sm:inline">
              {sortBy === "date_joined_newest" && "Newest First"}
              {sortBy === "date_joined_oldest" && "Oldest First"}
              {sortBy === "last_active_newest" && "Recently Active"}
              {sortBy === "last_active_oldest" && "Least Active"}
            </span>
            <span className="sm:hidden">Sort</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-card border-border">
          <DropdownMenuItem
            onClick={() => onSortChange("date_joined_newest")}
            className="flex items-center"
          >
            <ArrowDown className="h-4 w-4 mr-2" />
            Date Joined (Newest)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onSortChange("date_joined_oldest")}
            className="flex items-center"
          >
            <ArrowUp className="h-4 w-4 mr-2" />
            Date Joined (Oldest)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onSortChange("last_active_newest")}
            className="flex items-center"
          >
            <ArrowDown className="h-4 w-4 mr-2" />
            Last Active (Recent)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onSortChange("last_active_oldest")}
            className="flex items-center"
          >
            <ArrowUp className="h-4 w-4 mr-2" />
            Last Active (Oldest)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

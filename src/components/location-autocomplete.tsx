"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2, MapPin } from "lucide-react";

interface AutocompletePrediction {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
}

interface PlaceDetailsResponse {
  formatted_address?: string;
  geometry?: {
    location?: {
      lat: number;
      lng: number;
    };
  };
}

export interface LocationSelection {
  description: string;
  formattedAddress?: string;
  placeId: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface LocationAutocompleteProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value" | "onSelect"
  > {
  value: string;
  onValueChange: (value: string) => void;
  onLocationSelect?: (selection: LocationSelection) => void;
  /**
   * Optional ISO country code (e.g. "gb") to bias/autocomplete within a region.
   */
  country?: string;
  /**
   * Debounce delay before querying the API.
   */
  debounceMs?: number;
}

const DEFAULT_DEBOUNCE = 250;

function generateSessionToken() {
  if (typeof crypto?.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export function LocationAutocomplete({
  value,
  onValueChange,
  onLocationSelect,
  placeholder,
  disabled,
  className,
  country,
  debounceMs = DEFAULT_DEBOUNCE,
  ...inputProps
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value ?? "");
  const [predictions, setPredictions] = useState<AutocompletePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionTokenRef = useRef(generateSessionToken());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value ?? "");
  }, [value]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setPredictions([]);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closeDropdown]);

  useEffect(() => {
    if (!query || query.trim().length < 3) {
      abortControllerRef.current?.abort();
      setPredictions([]);
      setLoading(false);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          input: query.trim(),
          sessionToken: sessionTokenRef.current,
        });

        if (country) {
          params.set("components", `country:${country}`);
        }

        const response = await fetch(
          `/api/places/autocomplete?${params.toString()}`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(
            data?.message || `Failed to fetch location suggestions (${response.status})`
          );
        }

        const data = await response.json();
        const fetchedPredictions =
          (data?.predictions as AutocompletePrediction[]) ?? [];

        setPredictions(fetchedPredictions);
        setIsOpen(true);
      } catch (fetchError: any) {
        if (fetchError?.name === "AbortError") {
          return;
        }

        console.error("Location autocomplete error:", fetchError);
        setError(
          fetchError?.message || "Unable to fetch location suggestions right now."
        );
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, country, debounceMs]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setQuery(nextValue);
    onValueChange(nextValue);
    setError(null);

    if (!nextValue) {
      closeDropdown();
      sessionTokenRef.current = generateSessionToken();
    }
  };

  const handlePredictionSelect = useCallback(
    async (prediction: AutocompletePrediction) => {
      const trimmedDescription = prediction.description.trim();

      const baseSelection: LocationSelection = {
        description: trimmedDescription,
        placeId: prediction.place_id,
      };

      setQuery(trimmedDescription);
      onValueChange(trimmedDescription);
      setError(null);
      closeDropdown();

      try {
        const detailsParams = new URLSearchParams({
          placeId: prediction.place_id,
          sessionToken: sessionTokenRef.current,
        });

        const response = await fetch(
          `/api/places/details?${detailsParams.toString()}`,
          {
            cache: "no-store",
          }
        );

        if (response.ok) {
          const details = (await response.json()) as PlaceDetailsResponse;
          const formattedAddress =
            details.formatted_address ?? trimmedDescription;
          const coordinates = details.geometry?.location
            ? {
                lat: details.geometry.location.lat,
                lng: details.geometry.location.lng,
              }
            : undefined;

          const normalizedAddress = formattedAddress.trim();

          const selectionWithDetails: LocationSelection = {
            ...baseSelection,
            formattedAddress: normalizedAddress,
            coordinates,
          };

          onValueChange(normalizedAddress);
          onLocationSelect?.(selectionWithDetails);
        } else {
          onLocationSelect?.(baseSelection);
        }
      } catch (detailsError) {
        console.warn("Failed to fetch place details:", detailsError);
        onLocationSelect?.(baseSelection);
      } finally {
        sessionTokenRef.current = generateSessionToken();
      }
    },
    [closeDropdown, onLocationSelect, onValueChange]
  );

  const suggestionContent = useMemo(() => {
    if (!isOpen) {
      return null;
    }

    if (loading) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Searching locations…
        </div>
      );
    }

    if (error) {
      return (
        <div className="px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      );
    }

    if (predictions.length === 0) {
      return (
        <div className="px-3 py-2 text-sm text-muted-foreground">
          No locations found. Try adjusting your search.
        </div>
      );
    }

    return (
      <ul className="max-h-60 overflow-y-auto py-1">
        {predictions.map((prediction) => (
          <li key={prediction.place_id}>
            <button
              type="button"
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none"
              onClick={() => handlePredictionSelect(prediction)}
            >
              <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="font-medium text-foreground">
                  {prediction.structured_formatting?.main_text ??
                    prediction.description}
                </span>
                {prediction.structured_formatting?.secondary_text && (
                  <span className="text-xs text-muted-foreground">
                    {prediction.structured_formatting.secondary_text}
                  </span>
                )}
                {!prediction.structured_formatting?.secondary_text && (
                  <span className="text-xs text-muted-foreground">
                    {prediction.description}
                  </span>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    );
  }, [error, handlePredictionSelect, isOpen, loading, predictions]);

  return (
    <div className="relative" ref={containerRef}>
      <Input
        value={query}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className={className}
        onFocus={() => {
          if (predictions.length > 0) {
            setIsOpen(true);
          }
        }}
        {...inputProps}
      />

      {isOpen && (
        <div
          className={cn(
            "absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-md border border-border bg-popover shadow-md"
          )}
        >
          {suggestionContent}
        </div>
      )}
    </div>
  );
}

export default LocationAutocomplete;


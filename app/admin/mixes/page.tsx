"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatDateShort } from "@/lib/date-utils";
import { supabase } from "@/integrations/supabase/client";
import { textStyles } from "@/lib/typography";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Pause,
  Download,
  Eye,
  Trash2,
  Music,
  Clock,
  Calendar,
  Star,
  Search,
  CheckCircle,
  XCircle,
  Upload,
  Plus,
  MoreVertical,
} from "lucide-react";

const formatSecondsToTimestamp = (seconds: number) => {
  if (!isFinite(seconds) || seconds <= 0) {
    return null;
  }

  const totalSeconds = Math.round(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const getAudioDurationFromUrl = (url: string) =>
  new Promise<string | null>((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }

    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.crossOrigin = "anonymous";

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("error", handleError);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      audio.src = "";
      audio.load();
    };

    const handleLoadedMetadata = () => {
      const formatted = formatSecondsToTimestamp(audio.duration);
      cleanup();
      resolve(formatted || null);
    };

    const handleError = () => {
      cleanup();
      resolve(null);
    };

    const startFallbackTimer = () => {
      timeoutId = setTimeout(() => {
        cleanup();
        resolve(null);
      }, 10000);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("error", handleError);
    startFallbackTimer();
    audio.src = url;
  });

export default function MixesPage() {
  const { toast } = useToast();
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    title: "",
    artist: "",
    genre: "",
    description: "",
    appliedFor: "",
    status: "pending",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [mixes, setMixes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [mixToDelete, setMixToDelete] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [isRefreshingArtwork, setIsRefreshingArtwork] = useState(false);

  // Fetch mixes from database
  const fetchMixes = async () => {
    try {
      const { data, error } = await supabase
        .from("mixes")
        .select(
          `
          *,
          uploader:user_profiles!mixes_uploaded_by_fkey(
            id,
            dj_name,
            first_name,
            last_name
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching mixes:", error);
        toast({
          title: "Database Error",
          description:
            "Failed to load mixes from database. Please check your connection.",
          variant: "destructive",
        });
        setMixes([]);
      } else {
        // Transform the data to ensure consistent format
        const transformedMixes = await Promise.all(
          (data || []).map(async (mix: any) => {
            let imageUrl = mix.image_url;
            let resolvedDuration = mix.duration;
            const storedArtist: string | null =
              typeof mix.artist === "string" ? mix.artist : null;
            const uploader =
              (mix as {
                uploader?: {
                  id: string;
                  dj_name?: string | null;
                  first_name?: string | null;
                  last_name?: string | null;
                };
              }).uploader || null;

            const fullName =
              uploader
                ? [uploader.first_name, uploader.last_name]
                    .map((part) =>
                      typeof part === "string" ? part.trim() : ""
                    )
                    .filter(Boolean)
                    .join(" ")
                : "";

            const resolvedArtist =
              (uploader?.dj_name ?? "").trim() ||
              fullName ||
              (storedArtist?.trim() ?? "") ||
              "Unknown Artist";

            const resolveArtworkUrl = async () => {
              try {
                const findImageFile = (
                  files:
                    | {
                        name: string;
                        id?: string;
                        updated_at?: string;
                        created_at?: string;
                        last_accessed_at?: string;
                        metadata?: any;
                      }[]
                    | null
                    | undefined
                ) => {
                  if (!files || files.length === 0) return null;
                  const imageExtensions = [
                    ".jpg",
                    ".jpeg",
                    ".png",
                    ".webp",
                    ".gif",
                  ];

                  const exactArtwork = files.find((file) =>
                    file.name.toLowerCase().startsWith("artwork")
                  );
                  if (exactArtwork) return exactArtwork;

                  return files.find((file) =>
                    imageExtensions.some((ext) =>
                      file.name.toLowerCase().endsWith(ext)
                    )
                  );
                };

                // First: look for artwork in /mixes/{mix.id}/
                if (mix.id) {
                  const { data: files, error: listError } = await supabase.storage
                    .from("mixes")
                    .list(`${mix.id}`);

                  if (!listError && files && files.length > 0) {
                    const artworkFile = findImageFile(files);
                    if (artworkFile) {
                      const {
                        data: { publicUrl },
                      } = supabase.storage
                        .from("mixes")
                        .getPublicUrl(`${mix.id}/${artworkFile.name}`);
                      return publicUrl;
                    }
                  }
                }

                // Legacy fallback: derive folder from file_url
                if (mix.file_url?.includes("/storage/v1/object/public/mixes/")) {
                  const pathMatch = mix.file_url.match(
                    /storage\/v1\/object\/public\/mixes\/(.+)\/[^/]+$/
                  );
                  const folderPath = pathMatch ? pathMatch[1] : undefined;
                  if (folderPath) {
                    const { data: files, error: legacyListError } =
                      await supabase.storage.from("mixes").list(folderPath);

                    if (!legacyListError && files && files.length > 0) {
                      const artworkFile = findImageFile(files);
                      if (artworkFile) {
                        const {
                          data: { publicUrl },
                        } = supabase.storage
                          .from("mixes")
                          .getPublicUrl(`${folderPath}/${artworkFile.name}`);
                        return publicUrl;
                      }
                    }
                  }
                }
              } catch (artworkError) {
                console.warn(
                  "Could not resolve artwork for mix",
                  mix.id,
                  artworkError
                );
              }

              return null;
            };

            const resolveDuration = async () => {
              try {
                const audioUrl = mix.file_url || mix.audioUrl;
                if (!audioUrl) return null;
                const durationString = await getAudioDurationFromUrl(audioUrl);
                if (durationString) {
                  await supabase
                    .from("mixes")
                    .update({ duration: durationString })
                    .eq("id", mix.id);
                }
                return durationString;
              } catch (durationError) {
                console.warn(
                  "Could not resolve duration for mix",
                  mix.id,
                  durationError
                );
                return null;
              }
            };

            if (!imageUrl) {
              imageUrl = await resolveArtworkUrl();

              if (imageUrl) {
                await supabase
                  .from("mixes")
                  .update({ image_url: imageUrl })
                  .eq("id", mix.id);
              }
            }

            if (!resolvedDuration) {
              resolvedDuration = await resolveDuration();
            }

            const mixWithoutUploader = { ...mix };
            delete (mixWithoutUploader as any).uploader;

            return {
              ...mixWithoutUploader,
              uploader,
              artist: resolvedArtist,
              uploadDate: mix.created_at
                ? formatDateShort(mix.created_at)
                : mix.uploadDate,
              audioUrl: mix.file_url || mix.audioUrl,
              appliedFor: mix.applied_for || mix.appliedFor,
              imageUrl,
              duration: resolvedDuration || mix.duration,
              plays: mix.plays || 0,
              rating: mix.rating || 0.0,
              originalArtist: storedArtist,
            };
          })
        );

        setMixes(transformedMixes);
      }
    } catch (error) {
      console.error("Error fetching mixes:", error);
      toast({
        title: "Database Error",
        description:
          "Failed to load mixes from database. Please check your connection.",
        variant: "destructive",
      });
      setMixes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshArtwork = async () => {
    setIsRefreshingArtwork(true);
    try {
      const { error } = await supabase
        .from("mixes")
        .update({ image_url: null })
        .neq("image_url", null);

      if (error) {
        throw error;
      }

      toast({
        title: "Artwork Reset",
        description: "Cleared stored artwork URLs. Reloading fresh images...",
      });

      await fetchMixes();
    } catch (refreshError) {
      console.error("Error refreshing artwork:", refreshError);
      toast({
        title: "Artwork Refresh Failed",
        description: "Unable to reset artwork. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshingArtwork(false);
    }
  };

  // Load mixes on component mount
  React.useEffect(() => {
    fetchMixes();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500 text-white text-xs">Approved</Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500 text-white text-xs">Rejected</Badge>
        );
      case "pending":
        return (
          <Badge className="bg-orange-500 text-white text-xs">Pending</Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500 text-white text-xs">{status}</Badge>
        );
    }
  };

  const getGenreBadge = (genre: string) => {
    return (
      <Badge
        variant="outline"
        className="border-brand-green text-brand-green bg-transparent text-xs font-bold uppercase"
      >
        {genre}
      </Badge>
    );
  };

  // Format duration to proper MM:SS or HH:MM:SS format
  const formatDuration = (duration: string) => {
    if (!duration) return "Unknown";

    // If duration is already in MM:SS or HH:MM:SS format, return as is
    if (duration.includes(":")) {
      return duration;
    }

    // If duration is in seconds, convert to MM:SS or HH:MM:SS
    const seconds = parseInt(duration);
    if (isNaN(seconds)) return duration;

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    }
  };

  const handlePlayPause = (mixId: number, audioUrl: string) => {
    if (currentlyPlaying === mixId && isPlaying) {
      // Pause current audio
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Create new audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Set up event listeners
      audio.onplay = () => {
        setIsPlaying(true);
        setCurrentlyPlaying(mixId);
      };

      audio.onpause = () => {
        setIsPlaying(false);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentlyPlaying(null);
      };

      audio.onerror = () => {
        console.error("Error playing audio");
        toast({
          title: "Audio Playback Error",
          description:
            "Unable to play audio. This is a demo with placeholder audio files.",
          variant: "destructive",
        });
      };

      // Play the audio
      audio.play().catch((error) => {
        console.error("Error playing audio:", error);
        toast({
          title: "Audio Playback Error",
          description:
            "Unable to play audio. This is a demo with placeholder audio files.",
          variant: "destructive",
        });
      });
    }
  };

  const handleDownload = (mixTitle: string, fileUrl?: string) => {
    if (!fileUrl) {
      toast({
        title: "Download Failed",
        description: "No file URL available for this mix.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a temporary anchor element to trigger download
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = `${mixTitle}.mp3`; // Default to .mp3 extension
      link.target = "_blank";

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: `Downloading mix: ${mixTitle}`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download the mix. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (mixId: number, mixTitle: string) => {
    setMixToDelete({ id: mixId, title: mixTitle });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!mixToDelete) return;

    try {
      // Delete from Supabase database
      const { error } = await supabase
        .from("mixes")
        .delete()
        .eq("id", mixToDelete.id.toString());

      if (error) {
        throw error;
      }

      // Remove from local state
      setMixes((prevMixes) =>
        prevMixes.filter((mix) => mix.id !== mixToDelete.id)
      );

      toast({
        title: "Mix Deleted",
        description: `"${mixToDelete.title}" has been deleted successfully.`,
      });
    } catch (error) {
      console.error("Error deleting mix:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete mix. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteModalOpen(false);
      setMixToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setMixToDelete(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ["audio/mpeg", "audio/wav", "audio/mp3"];
      if (
        !allowedTypes.includes(file.type) &&
        !file.name.toLowerCase().endsWith(".mp3") &&
        !file.name.toLowerCase().endsWith(".wav")
      ) {
        toast({
          title: "Invalid File Type",
          description: "Please select a valid MP3 or WAV file.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      toast({
        title: "File Selected",
        description: `${file.name} (${(file.size / 1024 / 1024).toFixed(
          2
        )} MB)`,
      });
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log("Image selection triggered:", { file, files: event.target.files });
    
    if (file) {
      console.log("File selected:", {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      });

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        console.warn("Invalid file type:", file.type);
        toast({
          title: "Invalid Image Type",
          description: "Please select a valid JPEG, PNG, or WebP image.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.warn("File too large:", file.size);
        toast({
          title: "Image Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);
      console.log("Image set in state:", file.name);
      toast({
        title: "Image Selected",
        description: `${file.name} (${(file.size / 1024 / 1024).toFixed(
          2
        )} MB)`,
      });
    } else {
      console.log("No file selected");
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    console.log("Upload form submitted:", {
      hasSelectedFile: !!selectedFile,
      hasSelectedImage: !!selectedImage,
      selectedImageName: selectedImage?.name,
      selectedImageSize: selectedImage?.size,
      selectedImageType: selectedImage?.type,
    });

    setIsUploading(true);
    try {
      // Check if mixes table exists first
      const { error: tableCheckError } = await supabase
        .from("mixes")
        .select("id")
        .limit(1);

      if (tableCheckError) {
        if (
          tableCheckError.message?.includes("relation") &&
          tableCheckError.message?.includes("does not exist")
        ) {
          toast({
            title: "Database Setup Required",
            description:
              "Mixes table doesn't exist. Please create it in Supabase dashboard first.",
            variant: "destructive",
          });
          return;
        }
        throw tableCheckError;
      }

      // First, create the mix record in the database to get its ID
      const { data: mixData, error: insertError } = await supabase
        .from("mixes")
        .insert({
          title: uploadFormData.title,
          artist: uploadFormData.artist,
          genre: uploadFormData.genre,
          description: uploadFormData.description || null,
          applied_for: uploadFormData.appliedFor || null,
          status: uploadFormData.status,
          file_url: "pending", // Temporary value, will update after upload
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          image_url: null, // Will update after upload
        })
        .select()
        .single();

      if (insertError || !mixData) {
        throw insertError || new Error("Failed to create mix record");
      }

      const mixId = mixData.id;

      // Upload audio file to Supabase Storage using mix ID
      const fileExt = selectedFile.name.split(".").pop();
      const audioPath = `${mixId}/audio.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("mixes")
        .upload(audioPath, selectedFile);

      if (uploadError) {
        // If upload fails, delete the mix record
        await supabase.from("mixes").delete().eq("id", mixId);
        throw uploadError;
      }

      // Get the public URL for the uploaded audio file
      const {
        data: { publicUrl },
      } = supabase.storage.from("mixes").getPublicUrl(audioPath);

      // Upload image file if provided, using mix ID
      let imageUrl = null;
      if (selectedImage) {
        try {
          // Get file extension from filename, or derive from MIME type
          let imageExt = selectedImage.name.split(".").pop()?.toLowerCase();
          
          // Fallback: derive extension from MIME type if filename doesn't have one
          if (!imageExt || imageExt === selectedImage.name) {
            const mimeToExt: Record<string, string> = {
              'image/jpeg': 'jpg',
              'image/jpg': 'jpg',
              'image/png': 'png',
              'image/webp': 'webp',
              'image/gif': 'gif',
            };
            imageExt = mimeToExt[selectedImage.type] || 'jpg';
          }
          
          const imagePath = `${mixId}/artwork.${imageExt}`;

          console.log("Uploading image:", {
            fileName: selectedImage.name,
            fileSize: selectedImage.size,
            fileType: selectedImage.type,
            path: imagePath,
            mixId: mixId,
          });

          const { data: uploadData, error: imageUploadError } = await supabase.storage
            .from("mixes")
            .upload(imagePath, selectedImage, {
              cacheControl: "3600",
              upsert: false,
            });

          if (imageUploadError) {
            console.error("Image upload error details:", {
              message: imageUploadError.message,
              error: imageUploadError,
              path: imagePath,
              fileName: selectedImage.name,
              fileType: selectedImage.type,
              fileSize: selectedImage.size,
            });
            
            toast({
              title: "Image Upload Failed",
              description: `Failed to upload image: ${imageUploadError.message || "Unknown error"}. Mix uploaded successfully but without artwork.`,
              variant: "destructive",
            });
          } else {
            console.log("Image uploaded successfully:", uploadData);
            
            // Get the public URL for the uploaded image
            const {
              data: { publicUrl: imagePublicUrl },
            } = supabase.storage.from("mixes").getPublicUrl(imagePath);
            
            console.log("Image public URL:", imagePublicUrl);
            imageUrl = imagePublicUrl;
          }
        } catch (imageError) {
          console.error("Unexpected error during image upload:", imageError);
          toast({
            title: "Image Upload Error",
            description: `Unexpected error: ${imageError instanceof Error ? imageError.message : "Unknown error"}. Mix uploaded successfully but without artwork.`,
            variant: "destructive",
          });
        }
      } else {
        console.log("No image selected for upload");
      }

      let formattedDuration: string | null = null;
      try {
        formattedDuration = await getAudioDurationFromUrl(publicUrl);
      } catch (durationError) {
        console.warn("Unable to determine mix duration:", durationError);
      }

      // Update mix record with the actual file URLs
      const { error: dbError } = await supabase
        .from("mixes")
        .update({
          file_url: publicUrl,
          image_url: imageUrl,
          duration: formattedDuration,
        })
        .eq("id", mixId);

      if (dbError) {
        throw dbError;
      }

      toast({
        title: "Upload Successful",
        description: `Mix "${uploadFormData.title}" has been uploaded successfully!`,
      });

      // Reset form and close modal
      setUploadFormData({
        title: "",
        artist: "",
        genre: "",
        description: "",
        appliedFor: "",
        status: "pending",
      });
      setSelectedFile(null);
      setSelectedImage(null);
      setIsUploadModalOpen(false);

      // Refresh the mixes list
      fetchMixes();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload mix. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  console.log(
    "MixesPage render - isLoading:",
    isLoading,
    "mixes count:",
    mixes.length
  );

  return (
    <div className="space-y-4 sm:space-y-6 animate-blur-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white text-lg sm:text-xl md:text-2xl">
            MIXES
          </h1>
          <p className={`${textStyles.body.regular} text-sm sm:text-base`}>
            Review and manage submitted DJ mixes
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-3 w-full sm:w-auto">
          <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-brand-green text-brand-black hover:bg-brand-green/90 w-full sm:w-auto">
                <Upload className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Upload Mix</span>
                <span className="sm:hidden">Upload</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className={textStyles.headline.card}>
                  UPLOAD NEW MIX
                </DialogTitle>
                <DialogDescription className={textStyles.body.regular}>
                  Upload a new DJ mix with metadata
                </DialogDescription>
              </DialogHeader>

            <form onSubmit={handleUploadSubmit} className="space-y-6">
              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file" className={textStyles.body.regular}>
                  Audio File (MP3 or WAV)
                </Label>
                <Input
                  id="file"
                  type="file"
                  accept=".mp3,.wav,audio/mpeg,audio/wav"
                  onChange={handleFileSelect}
                  className="bg-secondary border-border text-foreground"
                  required
                />
                {selectedFile && (
                  <p
                    className={`${textStyles.body.small} text-muted-foreground`}
                  >
                    Selected: {selectedFile.name} (
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="image" className={textStyles.body.regular}>
                  Mix Artwork (Optional)
                </Label>
                <Input
                  id="image"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={handleImageSelect}
                  className="bg-secondary border-border text-foreground"
                />
                {selectedImage && (
                  <p
                    className={`${textStyles.body.small} text-muted-foreground`}
                  >
                    Selected: {selectedImage.name} (
                    {(selectedImage.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                <p className={`${textStyles.body.small} text-muted-foreground`}>
                  Recommended: Square image, 400x400px or larger (max 5MB)
                </p>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className={textStyles.body.regular}>
                    Mix Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Underground Techno Mix #1"
                    value={uploadFormData.title}
                    onChange={(e) =>
                      setUploadFormData({
                        ...uploadFormData,
                        title: e.target.value,
                      })
                    }
                    className="bg-secondary border-border text-foreground"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="artist" className={textStyles.body.regular}>
                    Artist Name
                  </Label>
                  <Input
                    id="artist"
                    placeholder="e.g., Alex Thompson"
                    value={uploadFormData.artist}
                    onChange={(e) =>
                      setUploadFormData({
                        ...uploadFormData,
                        artist: e.target.value,
                      })
                    }
                    className="bg-secondary border-border text-foreground"
                    required
                  />
                </div>
              </div>

              {/* Genre and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="genre" className={textStyles.body.regular}>
                    Genre
                  </Label>
                  <Select
                    value={uploadFormData.genre}
                    onValueChange={(value) =>
                      setUploadFormData({ ...uploadFormData, genre: value })
                    }
                  >
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem
                        value="Techno"
                        className="text-foreground hover:bg-accent"
                      >
                        Techno
                      </SelectItem>
                      <SelectItem
                        value="House"
                        className="text-foreground hover:bg-accent"
                      >
                        House
                      </SelectItem>
                      <SelectItem
                        value="Drum & Bass"
                        className="text-foreground hover:bg-accent"
                      >
                        Drum & Bass
                      </SelectItem>
                      <SelectItem
                        value="Dubstep"
                        className="text-foreground hover:bg-accent"
                      >
                        Dubstep
                      </SelectItem>
                      <SelectItem
                        value="Trap"
                        className="text-foreground hover:bg-accent"
                      >
                        Trap
                      </SelectItem>
                      <SelectItem
                        value="Hip-Hop"
                        className="text-foreground hover:bg-accent"
                      >
                        Hip-Hop
                      </SelectItem>
                      <SelectItem
                        value="Electronic"
                        className="text-foreground hover:bg-accent"
                      >
                        Electronic
                      </SelectItem>
                      <SelectItem
                        value="Progressive"
                        className="text-foreground hover:bg-accent"
                      >
                        Progressive
                      </SelectItem>
                      <SelectItem
                        value="Trance"
                        className="text-foreground hover:bg-accent"
                      >
                        Trance
                      </SelectItem>
                      <SelectItem
                        value="Ambient"
                        className="text-foreground hover:bg-accent"
                      >
                        Ambient
                      </SelectItem>
                      <SelectItem
                        value="Breakbeat"
                        className="text-foreground hover:bg-accent"
                      >
                        Breakbeat
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className={textStyles.body.regular}>
                    Status
                  </Label>
                  <Select
                    value={uploadFormData.status}
                    onValueChange={(value) =>
                      setUploadFormData({ ...uploadFormData, status: value })
                    }
                  >
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem
                        value="pending"
                        className="text-foreground hover:bg-accent"
                      >
                        Pending
                      </SelectItem>
                      <SelectItem
                        value="approved"
                        className="text-foreground hover:bg-accent"
                      >
                        Approved
                      </SelectItem>
                      <SelectItem
                        value="rejected"
                        className="text-foreground hover:bg-accent"
                      >
                        Rejected
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Applied For */}
              <div className="space-y-2">
                <Label htmlFor="appliedFor" className={textStyles.body.regular}>
                  Applied For (Optional)
                </Label>
                <Input
                  id="appliedFor"
                  placeholder="e.g., Underground Warehouse Rave"
                  value={uploadFormData.appliedFor}
                  onChange={(e) =>
                    setUploadFormData({
                      ...uploadFormData,
                      appliedFor: e.target.value,
                    })
                  }
                  className="bg-secondary border-border text-foreground"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className={textStyles.body.regular}
                >
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe the mix, track selection, or any special notes..."
                  value={uploadFormData.description}
                  onChange={(e) =>
                    setUploadFormData({
                      ...uploadFormData,
                      description: e.target.value,
                    })
                  }
                  className="bg-secondary border-border text-foreground min-h-[100px]"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 sm:space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUploadModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-brand-green text-brand-black hover:bg-brand-green/90"
                  disabled={isUploading || !selectedFile}
                >
                  {isUploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Mix
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            onClick={handleRefreshArtwork}
            disabled={isRefreshingArtwork}
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            {isRefreshingArtwork ? "Refreshing..." : "Refresh Artwork"}
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search mixes, artists, or genres..."
            className="pl-10 bg-secondary border-border text-foreground w-full"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatusFilter("all")}
            className={`text-xs sm:text-sm transition-colors ${
              statusFilter === "all"
                ? "bg-brand-green text-brand-black hover:bg-brand-green/90"
                : "text-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatusFilter("pending")}
            className={`text-xs sm:text-sm transition-colors ${
              statusFilter === "pending"
                ? "bg-brand-green text-brand-black hover:bg-brand-green/90"
                : "text-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            Pending
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatusFilter("approved")}
            className={`text-xs sm:text-sm transition-colors ${
              statusFilter === "approved"
                ? "bg-brand-green text-brand-black hover:bg-brand-green/90"
                : "text-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            Approved
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatusFilter("rejected")}
            className={`text-xs sm:text-sm transition-colors ${
              statusFilter === "rejected"
                ? "bg-brand-green text-brand-black hover:bg-brand-green/90"
                : "text-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            Rejected
          </Button>
        </div>
      </div>

      {/* Mixes List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className={textStyles.body.regular}>Loading mixes...</p>
          </div>
        ) : mixes.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Music className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className={textStyles.subheading.large}>No mixes found</h3>
                <p
                  className={`${textStyles.body.regular} text-muted-foreground mt-2`}
                >
                  No mixes have been uploaded yet. Upload your first mix to get
                  started!
                </p>
              </div>
            </div>
          </div>
        ) : (
          mixes
            .filter((mix) => {
              if (statusFilter === "all") return true;
              return mix.status === statusFilter;
            })
            .map((mix) => (
            <Card
              key={mix.id}
              className="bg-card border-border hover:border-brand-green/30 transition-all duration-300"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:space-x-6">
                  {/* Mix Artwork with Play Button */}
                  <div className="relative group w-full sm:w-auto">
                    <div className="relative h-32 w-full sm:h-20 sm:w-20 rounded-xl overflow-hidden bg-gradient-to-br from-secondary to-muted shadow-lg">
                      {mix.image_url || mix.imageUrl ? (
                        <Image
                          src={mix.image_url || mix.imageUrl}
                          alt={`${mix.title} artwork`}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="80px"
                          placeholder="blur"
                          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWESEyMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                          loading="lazy"
                          unoptimized={true}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gradient-to-br from-brand-green/20 to-brand-green/10">
                          <Music className="h-8 w-8 text-brand-green/60" />
                        </div>
                      )}

                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-full bg-white/20 border-white/30 hover:bg-white/30 backdrop-blur-sm"
                          onClick={() =>
                            handlePlayPause(
                              mix.id,
                              mix.file_url || mix.audioUrl
                            )
                          }
                        >
                          {currentlyPlaying === mix.id && isPlaying ? (
                            <Pause className="h-5 w-5 text-white" />
                          ) : (
                            <Play className="h-5 w-5 text-white ml-0.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Mix Information */}
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`${textStyles.subheading.large} text-base sm:text-lg truncate`}
                        >
                          {mix.title}
                        </h3>
                        <p
                          className={`${textStyles.body.regular} text-muted-foreground text-xs sm:text-sm truncate`}
                        >
                          by {mix.artist}
                        </p>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{formatDuration(mix.duration)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>
                          {mix.created_at
                            ? formatDateShort(mix.created_at)
                            : mix.uploadDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 sm:space-x-3 w-full sm:w-auto">
                    {/* Genre Badge */}
                    <div className="flex-shrink-0">
                      {getGenreBadge(mix.genre)}
                    </div>

                    {/* Download Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-brand-green/10 border-brand-green/30 text-brand-green hover:bg-brand-green hover:text-brand-black transition-all duration-300 text-xs sm:text-sm flex-1 sm:flex-initial"
                      onClick={() => handleDownload(mix.title, mix.file_url)}
                    >
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Download</span>
                      <span className="sm:hidden">DL</span>
                    </Button>

                    {/* More Options */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 hover:bg-muted/50"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-card border-border shadow-lg"
                      >
                        <DropdownMenuItem
                          onClick={() => handleDelete(mix.id, mix.title)}
                          className="text-red-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Mix
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle
              className={`${textStyles.subheading.large} text-brand-white`}
            >
              Delete Mix
            </DialogTitle>
            <DialogDescription className={textStyles.body.regular}>
              Are you sure you want to delete &quot;{mixToDelete?.title}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelDelete}
              className="text-foreground border-border hover:bg-secondary"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

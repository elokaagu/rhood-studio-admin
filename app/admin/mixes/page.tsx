"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [isUploading, setIsUploading] = useState(false);
  const [mixes, setMixes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [mixToDelete, setMixToDelete] = useState<{ id: number; title: string } | null>(null);

  // Fetch mixes from database
  const fetchMixes = async () => {
    try {
      const { data, error } = await supabase
        .from("mixes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      } else {
        setMixes(data || []);
        setIsLoading(false);
        return; // Exit early if successful
      }
    } catch (error) {
      console.error("Error fetching mixes:", error);
    }

    // Fallback to demo data
    setMixes([
      {
        id: 1,
        title: "Underground Techno Mix #1",
        artist: "Alex Thompson",
        duration: "58:23",
        uploadDate: "2024-08-10",
        plays: 1247,
        rating: 4.8,
        appliedFor: "Underground Warehouse Rave",
        genre: "Techno",
        status: "approved",
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav", // Demo audio file
      },
      {
        id: 2,
        title: "Summer House Vibes",
        artist: "Maya Rodriguez",
        duration: "45:12",
        uploadDate: "2024-08-12",
        plays: 892,
        rating: 4.9,
        appliedFor: "Rooftop Summer Sessions",
        genre: "House",
        status: "pending",
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav", // Demo audio file
      },
      {
        id: 3,
        title: "Drum & Bass Energy",
        artist: "Kai Johnson",
        duration: "52:45",
        uploadDate: "2024-08-14",
        plays: 634,
        rating: 4.7,
        appliedFor: "Club Residency Audition",
        genre: "Drum & Bass",
        status: "approved",
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav", // Demo audio file
      },
      {
        id: 4,
        title: "Deep House Journey",
        artist: "Sofia Martinez",
        duration: "61:18",
        uploadDate: "2024-08-16",
        plays: 1105,
        rating: 4.6,
        appliedFor: "Rooftop Summer Sessions",
        genre: "Deep House",
        status: "rejected",
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav", // Demo audio file
      },
    ]);

    setIsLoading(false);
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

  const handleDownload = (mixTitle: string) => {
    // In a real app, this would download the actual mix file
    console.log(`Downloading mix: ${mixTitle}`);
    toast({
      title: "Download Started",
      description: `Downloading mix: ${mixTitle}`,
    });
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
        .eq("id", mixToDelete.id);

      if (error) {
        throw error;
      }

      // Remove from local state
      setMixes((prevMixes) => prevMixes.filter((mix) => mix.id !== mixToDelete.id));

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

      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const filePath = `mixes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("mixes")
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL for the uploaded file
      const {
        data: { publicUrl },
      } = supabase.storage.from("mixes").getPublicUrl(filePath);

      // Save mix metadata to database
      const { error: dbError } = await supabase.from("mixes").insert({
        title: uploadFormData.title,
        artist: uploadFormData.artist,
        genre: uploadFormData.genre,
        description: uploadFormData.description || null,
        applied_for: uploadFormData.appliedFor || null,
        status: uploadFormData.status,
        file_url: publicUrl,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        // Note: duration would need to be extracted from audio file metadata
        // For now, we'll leave it null and it can be updated later
      });

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white">
            MIXES
          </h1>
          <p className={textStyles.body.regular}>
            Review and manage submitted DJ mixes
          </p>
        </div>
        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-green text-brand-black hover:bg-brand-green/90">
              <Upload className="h-4 w-4 mr-2" />
              Upload Mix
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-2xl">
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
              <div className="flex items-center justify-end space-x-4">
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
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search mixes, artists, or genres..."
            className="pl-10 bg-secondary border-border text-foreground"
          />
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-brand-green text-brand-black hover:bg-brand-green/90"
          >
            All
          </Button>
          <Button variant="outline" size="sm">
            Pending
          </Button>
          <Button variant="outline" size="sm">
            Approved
          </Button>
          <Button variant="outline" size="sm">
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
          <div className="text-center py-8">
            <p className={textStyles.body.regular}>
              No mixes found. Upload your first mix!
            </p>
          </div>
        ) : (
          mixes.map((mix) => (
            <Card key={mix.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Play Button */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-full bg-secondary border-border hover:bg-accent"
                      onClick={() =>
                        handlePlayPause(mix.id, mix.file_url || mix.audioUrl)
                      }
                    >
                      {currentlyPlaying === mix.id && isPlaying ? (
                        <Pause className="h-4 w-4 text-foreground" />
                      ) : (
                        <Play className="h-4 w-4 text-foreground" />
                      )}
                    </Button>

                    {/* Mix Info */}
                    <div className="flex-1">
                      <h3 className={textStyles.subheading.large}>
                        {mix.title}
                      </h3>
                      <p
                        className={`${textStyles.body.regular} text-muted-foreground`}
                      >
                        by {mix.artist}
                      </p>

                      {/* Metadata Row */}
                      <div className="flex items-center space-x-6 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {mix.duration || "Unknown"}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {mix.created_at
                            ? new Date(mix.created_at).toLocaleDateString()
                            : mix.uploadDate}
                        </div>
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          {mix.plays || 0} plays
                        </div>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 mr-1" />
                          {mix.rating || 0.0}
                        </div>
                      </div>

                      {/* Applied For */}
                      <p className={`${textStyles.body.small} mt-2`}>
                        Applied for:{" "}
                        {mix.applied_for || mix.appliedFor || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Right Side - Tags and Actions */}
                  <div className="flex items-center space-x-2">
                    {getGenreBadge(mix.genre)}
                    {getStatusBadge(mix.status)}

                    {mix.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-brand-green text-brand-black hover:bg-brand-green/90"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(mix.title)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border">
                        <DropdownMenuItem
                          onClick={() => handleDelete(mix.id, mix.title)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
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
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className={`${textStyles.subheading.large} text-brand-white`}>
              Delete Mix
            </DialogTitle>
            <DialogDescription className={textStyles.body.regular}>
              Are you sure you want to delete "{mixToDelete?.title}"? This action cannot be undone.
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

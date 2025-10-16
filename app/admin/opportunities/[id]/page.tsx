"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  MapPin,
  Users,
  Edit,
  Trash2,
  ArrowLeft,
  Clock,
  CheckCircle,
  MoreVertical,
} from "lucide-react";

export default function OpportunityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const opportunityId = params.id;
  const { toast } = useToast();
  const [opportunity, setOpportunity] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [opportunityToDelete, setOpportunityToDelete] = useState<{ id: string; title: string } | null>(null);

  // Fetch opportunity from database
  const fetchOpportunity = async () => {
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .eq("id", opportunityId as string)
        .single();

      if (error) {
        // Check if it's a table doesn't exist error
        if (
          error.message?.includes("relation") &&
          error.message?.includes("does not exist")
        ) {
          console.warn("Opportunities table doesn't exist yet. Using demo data.");
          toast({
            title: "Database Setup Required",
            description:
              "Opportunities table not found. Please create it in Supabase dashboard. Using demo data for now.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else if (data) {
        // Transform the data to match the expected format
        const transformedOpportunity = {
          id: data.id,
          title: data.title,
          location: data.location,
          date: data.event_date
            ? new Date(data.event_date).toISOString().split("T")[0]
            : "Unknown",
          pay: data.payment ? `£${data.payment}` : "N/A",
          applicants: 0, // This would need to be calculated from applications
          status: data.is_active ? "active" : "draft",
          genre: data.genre,
          description: data.description,
          requirements: data.skill_level,
          additionalInfo: "", // This field might need to be added to the database
          image_url: data.image_url,
        };

        setOpportunity(transformedOpportunity);
        setIsLoading(false);
        return; // Exit early if successful
      }
    } catch (error) {
      console.error("Error fetching opportunity:", error);
      toast({
        title: "Database Error",
        description:
          "Failed to load opportunity from database. Using demo data.",
        variant: "destructive",
      });
    }

    // Fallback to demo data
    const opportunities = [
      {
        id: 1,
        title: "Underground Warehouse Rave",
        location: "East London",
        date: "2024-08-15",
        pay: "£300",
        applicants: 12,
        status: "active",
        genre: "Techno",
        description:
          "High-energy underground techno event in a converted warehouse space.",
        requirements: "Professional DJ equipment, 3+ years experience",
        additionalInfo: "Contact: events@warehouse.com",
      },
      {
        id: 2,
        title: "Rooftop Summer Sessions",
        location: "Shoreditch",
        date: "2024-08-20",
        pay: "£450",
        applicants: 8,
        status: "active",
        genre: "House",
        description: "Sunset house music sessions with panoramic city views.",
        requirements: "House music experience, own equipment preferred",
        additionalInfo: "Venue provides sound system",
      },
      {
        id: 3,
        title: "Club Residency Audition",
        location: "Camden",
        date: "2024-08-25",
        pay: "£200 + Residency",
        applicants: 15,
        status: "completed",
        genre: "Drum & Bass",
        selected: "Alex Thompson",
        description: "Weekly residency opportunity at premier London club.",
        requirements: "Drum & Bass expertise, club experience",
        additionalInfo: "Selected candidate will receive ongoing residency",
      },
    ];

    const foundOpportunity = opportunities.find(
      (opp) => opp.id === parseInt(opportunityId as string)
    );

    setOpportunity(foundOpportunity || opportunities[0]);
    setIsLoading(false);
  };

  // Load opportunity on component mount
  useEffect(() => {
    fetchOpportunity();
  }, [opportunityId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = () => {
    if (opportunity) {
      setOpportunityToDelete({ id: opportunityId as string, title: opportunity.title });
      setDeleteModalOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!opportunityToDelete) return;

    try {
      // Delete from Supabase database
      const { error } = await supabase
        .from("opportunities")
        .delete()
        .eq("id", opportunityToDelete.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Opportunity Deleted",
        description: `"${opportunityToDelete.title}" has been deleted successfully.`,
      });

      // Redirect to opportunities list
      router.push("/admin/opportunities");
    } catch (error) {
      console.error("Error deleting opportunity:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete opportunity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteModalOpen(false);
      setOpportunityToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setOpportunityToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className={textStyles.body.regular}>Loading opportunity...</p>
        </div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className={textStyles.headline.section}>OPPORTUNITY NOT FOUND</h1>
          <p className={textStyles.body.regular}>
            The opportunity you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button
            onClick={() => router.push("/admin/opportunities")}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Opportunities
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge
            variant="outline"
            className="border-gray-400 text-gray-400 bg-transparent text-xs"
          >
            <Clock className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="outline"
            className="border-gray-400 text-gray-400 bg-transparent text-xs"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "closed":
        return (
          <Badge
            variant="outline"
            className="border-gray-400 text-gray-400 bg-transparent text-xs"
          >
            <Clock className="h-3 w-3 mr-1" />
            Closed
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="border-gray-400 text-gray-400 bg-transparent text-xs"
          >
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/opportunities")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className={textStyles.headline.section}>OPPORTUNITY DETAILS</h1>
            <p className={textStyles.body.regular}>
              View and manage opportunity information
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline"
            onClick={() => router.push(`/admin/opportunities/${opportunityId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            className="text-red-600 hover:text-red-700"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Opportunity Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className={textStyles.subheading.large}>
                    {opportunity.title}
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-2">
                    {getStatusBadge(opportunity.status)}
                    <Badge
                      variant="outline"
                      className="border-brand-green text-brand-green bg-transparent text-xs font-bold uppercase"
                    >
                      {opportunity.genre}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Event Image */}
              {opportunity.image_url && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden mb-4 bg-muted">
                  <Image
                    src={opportunity.image_url}
                    alt={opportunity.title}
                    fill
                    className="object-cover transition-all duration-500 ease-in-out"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                    loading="lazy"
                    priority={true}
                    onError={(e) => {
                      console.error('Image load error in detail view:', opportunity.image_url);
                      console.error('Error event:', e);
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully in detail view:', opportunity.image_url);
                    }}
                    unoptimized={true}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  {opportunity.date}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2" />
                  {opportunity.location}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  {opportunity.pay}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className={textStyles.subheading.small}>Description</h3>
                <p className={textStyles.body.regular}>
                  {opportunity.description}
                </p>
              </div>

              {opportunity.requirements && (
                <div className="space-y-2">
                  <h3 className={textStyles.subheading.small}>Requirements</h3>
                  <p className={textStyles.body.regular}>
                    {opportunity.requirements}
                  </p>
                </div>
              )}

              {opportunity.additionalInfo && (
                <div className="space-y-2">
                  <h3 className={textStyles.subheading.small}>
                    Additional Information
                  </h3>
                  <p className={textStyles.body.regular}>
                    {opportunity.additionalInfo}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statistics */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className={textStyles.subheading.small}>
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className={textStyles.body.regular}>
                    Total Applicants
                  </span>
                </div>
                <span className={textStyles.subheading.small}>
                  {opportunity.applicants}
                </span>
              </div>

              {opportunity.selected && (
                <div className="flex items-center justify-between">
                  <span className={textStyles.body.regular}>Selected</span>
                  <span className="text-brand-green font-bold">
                    {opportunity.selected}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className={textStyles.subheading.small}>
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push(
                    `/admin/applications?opportunity=${opportunity.id}`
                  )
                }
              >
                <Users className="h-4 w-4 mr-2" />
                View Applicants
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push(`/admin/opportunities/${opportunity.id}/edit`)
                }
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Opportunity
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push(`/admin/opportunities/${opportunity.id}/schedule`)
                }
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Event
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <MoreVertical className="h-4 w-4 mr-2" />
                    More Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border">
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Opportunity
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className={`${textStyles.subheading.large} text-brand-white`}>
              Delete Opportunity
            </DialogTitle>
            <DialogDescription className={textStyles.body.regular}>
              Are you sure you want to delete &quot;{opportunityToDelete?.title}&quot;? This action cannot be undone.
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

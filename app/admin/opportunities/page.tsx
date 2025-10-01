"use client";

import React, { useState, useEffect } from "react";
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
  Plus,
  Calendar,
  MapPin,
  Users,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  MoreVertical,
} from "lucide-react";

export default function OpportunitiesPage() {
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [opportunityToDelete, setOpportunityToDelete] = useState<{ id: number; title: string } | null>(null);

  // Fetch opportunities from database
  const fetchOpportunities = async () => {
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setOpportunities(data || []);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      toast({
        title: "Error",
        description: "Failed to load opportunities. Using demo data.",
        variant: "destructive",
      });
      // Fallback to demo data
      setOpportunities([
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
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load opportunities on component mount
  useEffect(() => {
    fetchOpportunities();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (opportunityId: number, opportunityTitle: string) => {
    setOpportunityToDelete({ id: opportunityId, title: opportunityTitle });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!opportunityToDelete) return;

    try {
      // Delete from Supabase database
      const { error } = await supabase
        .from("opportunities")
        .delete()
        .eq("id", opportunityToDelete.id.toString());

      if (error) {
        throw error;
      }

      // Remove from local state
      setOpportunities((prevOpportunities) => 
        prevOpportunities.filter((opp) => opp.id !== opportunityToDelete.id)
      );

      toast({
        title: "Opportunity Deleted",
        description: `"${opportunityToDelete.title}" has been deleted successfully.`,
      });
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
        <div>
          <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white">
            OPPORTUNITIES
          </h1>
          <p className={textStyles.body.regular}>
            Manage all DJ opportunities and gigs
          </p>
        </div>
        <Button
          className="bg-brand-green hover:bg-brand-green/90 text-brand-black"
          onClick={() => (window.location.href = "/admin/create-opportunity")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Opportunity
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-foreground">
                  {
                    opportunities.filter((opp) => opp.status === "active")
                      .length
                  }
                </p>
              </div>
              <div className="h-8 w-8 bg-brand-green/20 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-brand-green" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Opportunities
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {opportunities.length}
                </p>
              </div>
              <div className="h-8 w-8 bg-brand-green/20 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-brand-green" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Closed</p>
                <p className="text-2xl font-bold text-foreground">
                  {
                    opportunities.filter(
                      (opp) =>
                        opp.status === "completed" || opp.status === "closed"
                    ).length
                  }
                </p>
              </div>
              <div className="h-8 w-8 bg-brand-green/20 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-brand-green" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className={textStyles.body.regular}>Loading opportunities...</p>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-8">
            <p className={textStyles.body.regular}>
              No opportunities found. Create your first opportunity!
            </p>
          </div>
        ) : (
          opportunities.map((opportunity) => (
            <Card key={opportunity.id} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-6">
                  {/* Image Section */}
                  {opportunity.image_url && (
                    <div className="flex-shrink-0">
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden">
                        <Image
                          src={opportunity.image_url}
                          alt={opportunity.title}
                          fill
                          className="object-cover"
                          sizes="128px"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className={`${textStyles.subheading.large} mb-2`}>
                      {opportunity.title}
                    </h3>

                    <div className="flex items-center space-x-6 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {opportunity.event_date
                          ? new Date(
                              opportunity.event_date
                            ).toLocaleDateString()
                          : opportunity.date}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {opportunity.location}
                      </div>
                      <div className="flex items-center">
                        {opportunity.payment
                          ? `£${opportunity.payment}`
                          : opportunity.pay}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {opportunity.applicants || 0} applicants
                      </div>
                      {opportunity.selected && (
                        <div className="flex items-center">
                          <span className="text-brand-green">Selected: </span>
                          <span className="text-foreground">
                            {opportunity.selected}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(
                        opportunity.is_active ? "active" : opportunity.status
                      )}
                      <Badge
                        variant="outline"
                        className="border-brand-green text-brand-green bg-transparent text-xs font-bold uppercase"
                      >
                        {opportunity.genre}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-foreground"
                        onClick={() =>
                          (window.location.href = `/admin/opportunities/${opportunity.id}`)
                        }
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <DropdownMenuItem
                            onClick={() => handleDelete(opportunity.id, opportunity.title)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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

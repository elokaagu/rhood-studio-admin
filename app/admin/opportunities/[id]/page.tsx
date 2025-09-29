"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { textStyles } from "@/lib/typography";
import {
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Edit,
  Trash2,
  ArrowLeft,
  Clock,
  CheckCircle,
} from "lucide-react";

export default function OpportunityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const opportunityId = params.id;

  // Mock data - in a real app, this would be fetched from an API
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

  const opportunity = opportunities.find(
    (opp) => opp.id === parseInt(opportunityId as string)
  );

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
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" className="text-red-600 hover:text-red-700">
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
                  <DollarSign className="h-4 w-4 mr-2" />
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
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                View Applicants
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Edit className="h-4 w-4 mr-2" />
                Edit Opportunity
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Event
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

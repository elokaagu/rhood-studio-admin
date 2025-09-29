"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { textStyles } from "@/lib/typography";
import {
  Calendar,
  MapPin,
  Music,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  User,
} from "lucide-react";

export default function ApplicationsPage() {
  const applications = [
    {
      id: 1,
      applicant: {
        name: "Alex Thompson",
        djName: "DJ AlexT",
        avatar: "/person1.jpg",
        location: "London, UK",
        genres: ["Techno", "House"],
      },
      opportunity: "Underground Warehouse Rave",
      appliedDate: "2024-01-15",
      status: "pending",
      experience: "3 years",
      portfolio: "soundcloud.com/alexthompson",
    },
    {
      id: 2,
      applicant: {
        name: "Maya Rodriguez",
        djName: "Maya R",
        avatar: "/person2.jpg",
        location: "Berlin, Germany",
        genres: ["Electronic", "Progressive"],
      },
      opportunity: "Rooftop Summer Sessions",
      appliedDate: "2024-01-18",
      status: "approved",
      experience: "5 years",
      portfolio: "soundcloud.com/mayarodriguez",
    },
    {
      id: 3,
      applicant: {
        name: "James Chen",
        djName: "JC Beats",
        avatar: "/person1.jpg",
        location: "Amsterdam, Netherlands",
        genres: ["Drum & Bass", "Dubstep"],
      },
      opportunity: "Club Residency Audition",
      appliedDate: "2024-01-20",
      status: "rejected",
      experience: "2 years",
      portfolio: "soundcloud.com/jcbeats",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`${textStyles.headline.section} text-left`}>APPLICATIONS</h1>
          <p className={textStyles.body.regular}>
            Review and manage DJ applications
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">1</p>
              </div>
              <div className="h-8 w-8 bg-brand-green/20 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-brand-green" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-foreground">1</p>
              </div>
              <div className="h-8 w-8 bg-brand-green/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-brand-green" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-foreground">1</p>
              </div>
              <div className="h-8 w-8 bg-brand-green/20 rounded-full flex items-center justify-center">
                <XCircle className="h-4 w-4 text-brand-green" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {applications.map((application) => (
          <Card key={application.id} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start space-x-4 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={application.applicant.avatar}
                        alt={application.applicant.name}
                      />
                      <AvatarFallback>
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className={textStyles.subheading.large}>
                        {application.applicant.name}
                      </h3>
                      <p className={textStyles.body.regular}>
                        {application.applicant.djName}
                      </p>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {application.applicant.location}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className={textStyles.subheading.small}>Opportunity</h4>
                      <p className={textStyles.body.regular}>
                        {application.opportunity}
                      </p>
                    </div>

                    <div>
                      <h4 className={textStyles.subheading.small}>Genres</h4>
                      <div className="flex flex-wrap gap-2">
                        {application.applicant.genres.map((genre) => (
                          <Badge
                            key={genre}
                            variant="outline"
                            className="border-brand-green text-brand-green bg-transparent text-xs font-bold uppercase"
                          >
                            <Music className="h-3 w-3 mr-1" />
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      Applied: {application.appliedDate}
                    </div>

                    <div>
                      <h4 className={textStyles.subheading.small}>Experience</h4>
                      <p className={textStyles.body.regular}>
                        {application.experience}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-3">
                  <Badge
                    variant="outline"
                    className="border-gray-400 text-gray-400 bg-transparent text-xs"
                  >
                    {getStatusIcon(application.status)}
                    <span className="ml-1">{application.status}</span>
                  </Badge>

                  <div className="flex flex-col space-y-2">
                    <Button variant="outline" size="sm" className="text-foreground">
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    {application.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-brand-green hover:text-brand-green/80"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

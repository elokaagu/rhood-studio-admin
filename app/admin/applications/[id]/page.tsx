"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
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
  ArrowLeft,
  User,
  Mail,
  ExternalLink,
} from "lucide-react";

export default function ApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id;

  // Mock data - in a real app, this would be fetched from an API
  const applications = [
    {
      id: 1,
      applicant: {
        name: "Alex Thompson",
        djName: "DJ AlexT",
        avatar: "/person1.jpg",
        location: "London, UK",
        genres: ["Techno", "House"],
        email: "alex.thompson@email.com",
        phone: "+44 7700 900123",
        bio: "Passionate techno DJ with 3+ years of experience in underground venues across London.",
      },
      opportunity: "Underground Warehouse Rave",
      opportunityId: 1,
      appliedDate: "2024-01-15",
      status: "pending",
      experience: "3 years",
      portfolio: "soundcloud.com/alexthompson",
      coverLetter:
        "I'm excited to apply for this opportunity. I have extensive experience playing techno sets in underground venues and would love to bring my energy to this event.",
      equipment: "Pioneer DDJ-1000, MacBook Pro, Audio-Technica ATH-M50x",
    },
    {
      id: 2,
      applicant: {
        name: "Maya Rodriguez",
        djName: "Maya R",
        avatar: "/person2.jpg",
        location: "Berlin, Germany",
        genres: ["Electronic", "Progressive"],
        email: "maya.rodriguez@email.com",
        phone: "+49 30 12345678",
        bio: "Electronic music producer and DJ based in Berlin, specializing in progressive house and techno.",
      },
      opportunity: "Rooftop Summer Sessions",
      opportunityId: 2,
      appliedDate: "2024-01-18",
      status: "approved",
      experience: "5 years",
      portfolio: "soundcloud.com/mayarodriguez",
      coverLetter:
        "As a Berlin-based DJ, I bring a unique perspective to house music. I'm excited about the opportunity to play at this rooftop venue.",
      equipment: "Pioneer XDJ-RX2, MacBook Air, Sennheiser HD-25",
    },
    {
      id: 3,
      applicant: {
        name: "James Chen",
        djName: "JC Beats",
        avatar: "/person1.jpg",
        location: "Amsterdam, Netherlands",
        genres: ["Drum & Bass", "Dubstep"],
        email: "james.chen@email.com",
        phone: "+31 6 12345678",
        bio: "Drum & Bass enthusiast with a passion for high-energy sets and crowd interaction.",
      },
      opportunity: "Club Residency Audition",
      opportunityId: 3,
      appliedDate: "2024-01-20",
      status: "rejected",
      experience: "2 years",
      portfolio: "soundcloud.com/jcbeats",
      coverLetter:
        "I'm applying for this residency opportunity to showcase my drum & bass skills and build a long-term relationship with the venue.",
      equipment: "Pioneer DDJ-SX3, MacBook Pro, KRK Rokit 5",
    },
  ];

  const application = applications.find(
    (app) => app.id === parseInt(applicationId as string)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge
            variant="outline"
            className="border-green-400 text-green-400 bg-transparent text-xs"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="border-red-400 text-red-400 bg-transparent text-xs"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="border-yellow-400 text-yellow-400 bg-transparent text-xs"
          >
            <Clock className="h-3 w-3 mr-1" />
            Pending
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

  if (!application) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className={textStyles.headline.section}>APPLICATION NOT FOUND</h1>
          <p className={textStyles.body.regular}>
            The application you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button
            onClick={() => router.push("/admin/applications")}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Applications
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/applications")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className={textStyles.headline.section}>APPLICATION DETAILS</h1>
            <p className={textStyles.body.regular}>
              Review application information
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(application.status)}
          {application.status === "pending" && (
            <>
              <Button
                variant="outline"
                className="text-brand-green hover:text-brand-green/80"
                onClick={() => {
                  console.log(`Approving application ${application.id}`);
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700"
                onClick={() => {
                  console.log(`Rejecting application ${application.id}`);
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Application Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant Information */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className={textStyles.subheading.small}>
                Applicant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={application.applicant.avatar}
                    alt={application.applicant.name}
                  />
                  <AvatarFallback>
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className={textStyles.subheading.large}>
                    {application.applicant.name}
                  </h3>
                  <p className={textStyles.body.regular}>
                    {application.applicant.djName}
                  </p>
                  <div className="flex items-center text-sm text-muted-foreground mt-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    {application.applicant.location}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <Mail className="h-4 w-4 mr-1" />
                    {application.applicant.email}
                  </div>
                </div>
              </div>

              <div>
                <h4 className={textStyles.subheading.small}>Bio</h4>
                <p className={textStyles.body.regular}>
                  {application.applicant.bio}
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
            </CardContent>
          </Card>

          {/* Application Details */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className={textStyles.subheading.small}>
                Application Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className={textStyles.subheading.small}>Opportunity</h4>
                <p className={textStyles.body.regular}>
                  {application.opportunity}
                </p>
              </div>

              <div>
                <h4 className={textStyles.subheading.small}>Cover Letter</h4>
                <p className={textStyles.body.regular}>
                  {application.coverLetter}
                </p>
              </div>

              <div>
                <h4 className={textStyles.subheading.small}>Equipment</h4>
                <p className={textStyles.body.regular}>
                  {application.equipment}
                </p>
              </div>

              <div>
                <h4 className={textStyles.subheading.small}>Portfolio</h4>
                <a
                  href={`https://${application.portfolio}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-brand-green hover:text-brand-green/80"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  {application.portfolio}
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Application Status */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className={textStyles.subheading.small}>
                Application Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={textStyles.body.regular}>Status</span>
                {getStatusBadge(application.status)}
              </div>

              <div className="flex items-center justify-between">
                <span className={textStyles.body.regular}>Applied Date</span>
                <span className={textStyles.subheading.small}>
                  {application.appliedDate}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className={textStyles.body.regular}>Experience</span>
                <span className={textStyles.subheading.small}>
                  {application.experience}
                </span>
              </div>
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
                    `/admin/opportunities/${application.opportunityId}`
                  )
                }
              >
                <Calendar className="h-4 w-4 mr-2" />
                View Opportunity
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  window.open(`https://${application.portfolio}`, "_blank")
                }
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Portfolio
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  (window.location.href = `mailto:${application.applicant.email}`)
                }
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

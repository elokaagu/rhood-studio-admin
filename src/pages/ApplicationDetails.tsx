import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  Calendar, 
  MapPin, 
  DollarSign, 
  Users,
  CheckCircle,
  Clock,
  Mail,
  UserCheck,
  Star,
  Instagram,
  Music
} from 'lucide-react';

const mockApplications = [
  {
    id: 1,
    opportunityId: 1,
    opportunityName: "Underground Warehouse Rave",
    opportunityDate: "2024-08-15",
    opportunityTime: "10:00 PM - 6:00 AM",
    opportunityLocation: "East London",
    opportunityVenue: "Industrial Warehouse, Hackney Wick",
    opportunityFee: "£300",
    opportunityGenre: "Techno",
    opportunityStatus: "active",
    applicant: {
      id: 1,
      name: "Alex Thompson",
      djName: "@alexbeats",
      location: "London",
      experience: "5 years",
      rating: 4.8,
      genres: ["Techno", "House"],
      profileImage: "/api/placeholder/40/40",
      applicationMessage: "I've been playing techno for 5 years and have experience with warehouse venues. I'd love to bring my high-energy sets to this event!",
      appliedDate: "2024-07-20",
      status: "pending",
      bio: "Passionate techno DJ with 5 years of experience playing at underground venues across London. Known for high-energy sets and ability to read the crowd.",
      previousGigs: [
        "Fabric London - Opening Set",
        "Printworks - Closing Set", 
        "Warehouse Project Manchester"
      ],
      mixLinks: [
        "Summer Techno Mix 2024",
        "Underground Vibes Vol. 3"
      ]
    }
  }
];

const ApplicationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const application = mockApplications.find(app => app.id === parseInt(id || ''));

  const handleSendMessage = () => {
    toast({
      title: "Message Sent",
      description: `Your message has been sent to ${application?.applicant.name}.`,
    });
  };

  const handleSelectApplicant = () => {
    toast({
      title: "Applicant Selected",
      description: `${application?.applicant.name} has been selected for this opportunity.`,
    });
  };

  if (!application) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/admin/applications')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Applications
        </Button>
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Application not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/admin/applications')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Applications
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleSendMessage}>
            <Mail className="h-4 w-4 mr-2" />
            Send Message
          </Button>
          <Button onClick={handleSelectApplicant}>
            <UserCheck className="h-4 w-4 mr-2" />
            Select Applicant
          </Button>
        </div>
      </div>

      {/* Opportunity Info */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">
                {application.opportunityName}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant={application.opportunityStatus === 'active' ? 'outline' : 'secondary'}>
                  {application.opportunityStatus === 'active' ? (
                    <><Clock className="h-3 w-3 mr-1" />Active</>
                  ) : (
                    <><CheckCircle className="h-3 w-3 mr-1" />Completed</>
                  )}
                </Badge>
                <Badge variant="outline" className="border-primary text-primary">
                  {application.opportunityGenre}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                <div>
                  <p className="font-medium text-foreground">{application.opportunityDate}</p>
                  <p className="text-sm">{application.opportunityTime}</p>
                </div>
              </div>
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2" />
                <div>
                  <p className="font-medium text-foreground">{application.opportunityVenue}</p>
                  <p className="text-sm">{application.opportunityLocation}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center text-muted-foreground">
                <DollarSign className="h-4 w-4 mr-2" />
                <p className="font-medium text-foreground">{application.opportunityFee}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applicant Profile */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Applicant Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="flex items-start space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={application.applicant.profileImage} alt={application.applicant.name} />
              <AvatarFallback>{application.applicant.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-xl font-semibold text-foreground">{application.applicant.name}</h3>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-foreground">{application.applicant.rating}</span>
                </div>
                <Badge variant="outline" className={application.applicant.status === 'pending' ? 'border-yellow-500 text-yellow-500' : 'border-green-500 text-green-500'}>
                  {application.applicant.status}
                </Badge>
              </div>
              <div className="flex items-center space-x-4 text-muted-foreground mb-3">
                <div className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {application.applicant.location}
                </div>
                <div className="flex items-center">
                  <Instagram className="h-3 w-3 mr-1" />
                  {application.applicant.djName}
                </div>
                <span>Experience: {application.applicant.experience}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {application.applicant.genres.map((genre, index) => (
                  <Badge key={index} variant="outline" className="border-primary text-primary">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Bio */}
          <div>
            <h4 className="font-semibold text-foreground mb-2">Bio</h4>
            <p className="text-muted-foreground">{application.applicant.bio}</p>
          </div>

          {/* Application Message */}
          <div>
            <h4 className="font-semibold text-foreground mb-2">Application Message</h4>
            <div className="bg-secondary/30 p-4 rounded-lg">
              <p className="text-muted-foreground italic">
                "{application.applicant.applicationMessage}"
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Applied on {application.applicant.appliedDate}
              </p>
            </div>
          </div>

          {/* Previous Gigs */}
          <div>
            <h4 className="font-semibold text-foreground mb-2">Previous Gigs</h4>
            <ul className="space-y-1">
              {application.applicant.previousGigs.map((gig, index) => (
                <li key={index} className="text-muted-foreground text-sm flex items-start">
                  <span className="text-primary mr-2">•</span>
                  {gig}
                </li>
              ))}
            </ul>
          </div>

          {/* Mix Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-2">Recent Mixes</h4>
            <div className="space-y-2">
              {application.applicant.mixLinks.map((mix, index) => (
                <div key={index} className="flex items-center text-muted-foreground">
                  <Music className="h-3 w-3 mr-2" />
                  <span className="text-sm">{mix}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplicationDetails;
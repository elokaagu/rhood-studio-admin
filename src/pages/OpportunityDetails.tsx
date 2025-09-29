import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Star,
  Instagram
} from 'lucide-react';

const mockApplicants = [
  {
    id: 1,
    opportunityId: 1,
    name: "Alex Thompson",
    djName: "@alexbeats",
    location: "London",
    experience: "5 years",
    rating: 4.8,
    genres: ["Techno", "House"],
    profileImage: "/api/placeholder/40/40",
    applicationMessage: "I've been playing techno for 5 years and have experience with warehouse venues. I'd love to bring my high-energy sets to this event!",
    status: "pending"
  },
  {
    id: 2,
    opportunityId: 1,
    name: "Maya Rodriguez",
    djName: "@mayavibes",
    location: "Manchester",
    experience: "3 years",
    rating: 4.6,
    genres: ["Techno", "Drum & Bass"],
    profileImage: "/api/placeholder/40/40",
    applicationMessage: "Underground techno is my passion. I've played at several warehouse events and always deliver unforgettable sets.",
    status: "pending"
  },
  {
    id: 3,
    opportunityId: 2,
    name: "Jamie Chen",
    djName: "@jamiedeep",
    location: "London",
    experience: "4 years",
    rating: 4.9,
    genres: ["House", "Deep House"],
    profileImage: "/api/placeholder/40/40",
    applicationMessage: "Rooftop sessions are my specialty. I know how to read the crowd and create the perfect sunset atmosphere.",
    status: "pending"
  },
  {
    id: 4,
    opportunityId: 3,
    name: "Alex Thompson",
    djName: "@alexbeats",
    location: "London",
    experience: "5 years",
    rating: 4.8,
    genres: ["Drum & Bass", "Jungle"],
    profileImage: "/api/placeholder/40/40",
    applicationMessage: "I've been playing D&B for years and have experience with large venues. This residency would be perfect for my career growth.",
    status: "selected"
  }
];

const mockGigs = [
  {
    id: 1,
    name: "Underground Warehouse Rave",
    date: "2024-08-15",
    time: "10:00 PM - 6:00 AM",
    location: "East London",
    venue: "Industrial Warehouse, Hackney Wick",
    fee: "£300",
    genre: "Techno",
    status: "active",
    applicants: 12,
    selected: null,
    description: "Join us for an intense underground techno experience in an authentic warehouse setting. This event will feature cutting-edge sound systems and immersive lighting.",
    requirements: [
      "Minimum 2 years experience in techno music",
      "Own professional DJ equipment",
      "Ability to play 2-hour sets",
      "Experience with warehouse venues preferred"
    ],
    benefits: [
      "Professional sound system (Pioneer CDJ-3000)",
      "Live streaming opportunity",
      "Photo/video content for portfolio",
      "Networking with industry professionals"
    ],
    capacity: "500 people",
    deadline: "2024-08-10"
  },
  {
    id: 2,
    name: "Rooftop Summer Sessions",
    date: "2024-08-20",
    time: "6:00 PM - 1:00 AM",
    location: "Shoreditch", 
    venue: "Sky Terrace, Shoreditch High Street",
    fee: "£450",
    genre: "House",
    status: "active",
    applicants: 8,
    selected: null,
    description: "A sophisticated rooftop experience overlooking the London skyline. Perfect for deep house and melodic techno enthusiasts.",
    requirements: [
      "Experience with sunset/rooftop sets",
      "Deep knowledge of house music",
      "Professional mixing skills",
      "Positive energy and crowd interaction"
    ],
    benefits: [
      "Stunning rooftop venue",
      "Premium sound system",
      "Professional photography",
      "VIP hospitality package",
      "Potential for residency"
    ],
    capacity: "200 people",
    deadline: "2024-08-15"
  },
  {
    id: 3,
    name: "Club Residency Audition",
    date: "2024-08-25",
    time: "9:00 PM - 3:00 AM",
    location: "Camden",
    venue: "Electric Ballroom, Camden Town",
    fee: "£200 + Residency",
    genre: "Drum & Bass",
    status: "completed",
    applicants: 15,
    selected: "Alex Thompson",
    description: "Audition for a monthly residency at one of London's most iconic venues. This is a career-defining opportunity for the right candidate.",
    requirements: [
      "Extensive drum & bass knowledge",
      "Experience with large venues (500+ capacity)",
      "Professional presentation and reliability",
      "Ability to commit to monthly residency"
    ],
    benefits: [
      "Monthly residency opportunity",
      "Industry connections",
      "Career development support",
      "Professional recording studio access"
    ],
    capacity: "800 people",
    deadline: "2024-08-20"
  }
];

const OpportunityDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messageDialog, setMessageDialog] = useState<{open: boolean, applicantId: number | null}>({
    open: false,
    applicantId: null
  });
  const [messageText, setMessageText] = useState('');
  const { toast } = useToast();

  const opportunity = mockGigs.find(gig => gig.id === parseInt(id || '0'));
  const applicantsForGig = mockApplicants.filter(applicant => applicant.opportunityId === parseInt(id || '0'));

  if (!opportunity) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/admin/opportunities')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Opportunities
          </Button>
        </div>
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Opportunity not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSendMessage = (applicantId: number) => {
    setMessageDialog({ open: true, applicantId });
  };

  const handleSelectApplicant = (applicantId: number, applicantName: string) => {
    toast({
      title: "Applicant Selected",
      description: `${applicantName} has been selected for this opportunity.`,
    });
  };

  const submitMessage = () => {
    const applicant = mockApplicants.find(a => a.id === messageDialog.applicantId);
    toast({
      title: "Message Sent",
      description: `Your message has been sent to ${applicant?.name}.`,
    });
    setMessageDialog({ open: false, applicantId: null });
    setMessageText('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/admin/opportunities')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Opportunities
          </Button>
        </div>
      </div>

      {/* Opportunity Details */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">
                {opportunity.name}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant={opportunity.status === 'active' ? 'outline' : 'secondary'}>
                  {opportunity.status === 'active' ? (
                    <><Clock className="h-3 w-3 mr-1" />Active</>
                  ) : (
                    <><CheckCircle className="h-3 w-3 mr-1" />Completed</>
                  )}
                </Badge>
                <Badge variant="outline" className="border-primary text-primary">
                  {opportunity.genre}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center text-muted-foreground">
                <Calendar className="h-5 w-5 mr-3" />
                <div>
                  <p className="font-medium text-foreground">{opportunity.date}</p>
                  <p className="text-sm">{opportunity.time}</p>
                </div>
              </div>
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-5 w-5 mr-3" />
                <div>
                  <p className="font-medium text-foreground">{opportunity.venue}</p>
                  <p className="text-sm">{opportunity.location}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center text-muted-foreground">
                <DollarSign className="h-5 w-5 mr-3" />
                <p className="font-medium text-foreground">{opportunity.fee}</p>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Users className="h-5 w-5 mr-3" />
                <div>
                  <p className="font-medium text-foreground">{opportunity.applicants} applicants</p>
                  <p className="text-sm">Capacity: {opportunity.capacity}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-foreground mb-2">Description</h3>
            <p className="text-muted-foreground">{opportunity.description}</p>
          </div>

          {/* Requirements */}
          <div>
            <h3 className="font-semibold text-foreground mb-2">Requirements</h3>
            <ul className="space-y-1">
              {opportunity.requirements.map((req, index) => (
                <li key={index} className="text-muted-foreground text-sm flex items-start">
                  <span className="text-primary mr-2">•</span>
                  {req}
                </li>
              ))}
            </ul>
          </div>

          {/* Benefits */}
          <div>
            <h3 className="font-semibold text-foreground mb-2">Benefits</h3>
            <ul className="space-y-1">
              {opportunity.benefits.map((benefit, index) => (
                <li key={index} className="text-muted-foreground text-sm flex items-start">
                  <span className="text-primary mr-2">•</span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Applicants Section */}
      {applicantsForGig.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Applicants ({applicantsForGig.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {applicantsForGig.map((applicant) => (
              <div key={applicant.id} className="bg-secondary/30 p-4 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={applicant.profileImage} alt={applicant.name} />
                      <AvatarFallback>{applicant.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-foreground">{applicant.name}</h4>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span className="text-sm text-muted-foreground">{applicant.rating}</span>
                        </div>
                        {applicant.status === 'selected' && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Selected
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {applicant.location}
                        </div>
                        <div className="flex items-center">
                          <Instagram className="h-3 w-3 mr-1" />
                          {applicant.djName}
                        </div>
                        <span>Experience: {applicant.experience}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {applicant.genres.map((genre, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground italic">
                        "{applicant.applicationMessage}"
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendMessage(applicant.id)}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Message
                    </Button>
                    {applicant.status !== 'selected' && (
                      <Button
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => handleSelectApplicant(applicant.id, applicant.name)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Select
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Message Dialog */}
      <Dialog open={messageDialog.open} onOpenChange={(open) => setMessageDialog({ open, applicantId: null })}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Send Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Type your message here..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={4}
              className="bg-secondary border-border text-foreground"
            />
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setMessageDialog({ open: false, applicantId: null })}
              >
                Cancel
              </Button>
              <Button onClick={submitMessage}>
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OpportunityDetails;
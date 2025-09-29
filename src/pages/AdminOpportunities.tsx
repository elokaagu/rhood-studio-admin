import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Eye, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Users,
  CheckCircle,
  Clock,
  X,
  Mail,
  UserCheck,
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

const AdminOpportunities = () => {
  const navigate = useNavigate();
  const [messageDialog, setMessageDialog] = useState<{open: boolean, applicantId: number | null}>({
    open: false,
    applicantId: null
  });
  const [messageText, setMessageText] = useState('');
  const { toast } = useToast();

  const handleSendMessage = (applicantId: number) => {
    setMessageDialog({ open: true, applicantId });
  };

  const handleSelectApplicant = (applicantId: number, applicantName: string) => {
    // Update the applicant status to selected
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Opportunities</h1>
          <p className="text-muted-foreground">Manage all DJ opportunities and gigs</p>
        </div>
        <Button onClick={() => navigate('/admin/create-opportunity')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Opportunity
        </Button>
      </div>

      {/* Opportunities List */}
      <div className="grid gap-4">
        {mockGigs.map((gig) => (
          <Card key={gig.id} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{gig.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {gig.date}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {gig.location}
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-3 w-3 mr-1" />
                      {gig.fee}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={gig.status === 'active' ? 'outline' : 'secondary'}>
                    {gig.status === 'active' ? (
                      <><Clock className="h-3 w-3 mr-1" />Active</>
                    ) : (
                      <><CheckCircle className="h-3 w-3 mr-1" />Completed</>
                    )}
                  </Badge>
                  <Badge variant="outline" className="border-primary text-primary">
                    {gig.genre}
                  </Badge>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center text-muted-foreground">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{gig.applicants} applicant{gig.applicants !== 1 ? 's' : ''}</span>
                  {gig.selected && (
                    <span className="ml-2 text-accent">• Selected: {gig.selected}</span>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/admin/opportunities/${gig.id}`)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Message Dialog */}
      <Dialog open={messageDialog.open} onOpenChange={(open) => setMessageDialog({ open, applicantId: null })}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Send Message to {mockApplicants.find(a => a.id === messageDialog.applicantId)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Type your message here..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="min-h-[120px]"
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setMessageDialog({ open: false, applicantId: null })}>
                Cancel
              </Button>
              <Button onClick={submitMessage} disabled={!messageText.trim()}>
                <Mail className="h-4 w-4 mr-1" />
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOpportunities;
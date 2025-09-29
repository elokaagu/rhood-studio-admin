import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Mail, 
  MapPin, 
  Calendar,
  Star,
  Music,
  Users,
  UserPlus
} from 'lucide-react';

const mockMembers = [
  {
    id: 1,
    name: "Alex Thompson",
    email: "alex@example.com",
    avatar: "/src/assets/person1.jpg",
    location: "London, UK",
    joinDate: "2024-01-15",
    genres: ["Techno", "House"],
    rating: 4.8,
    totalGigs: 12,
    status: "active",
    lastActive: "2 hours ago"
  },
  {
    id: 2,
    name: "Maya Rodriguez",
    email: "maya@example.com", 
    avatar: "/src/assets/person2.jpg",
    location: "Berlin, Germany",
    joinDate: "2024-02-03",
    genres: ["Techno", "Industrial"],
    rating: 4.9,
    totalGigs: 18,
    status: "active",
    lastActive: "1 day ago"
  },
  {
    id: 3,
    name: "Kai Johnson",
    email: "kai@example.com",
    avatar: null,
    location: "Amsterdam, Netherlands",
    joinDate: "2024-03-12",
    genres: ["Drum & Bass", "Techno"],
    rating: 4.7,
    totalGigs: 8,
    status: "active",
    lastActive: "3 hours ago"
  },
  {
    id: 4,
    name: "Sofia Martinez",
    email: "sofia@example.com",
    avatar: null,
    location: "Barcelona, Spain",
    joinDate: "2024-04-20",
    genres: ["Deep House", "Melodic Techno"],
    rating: 4.6,
    totalGigs: 15,
    status: "inactive",
    lastActive: "2 weeks ago"
  },
  {
    id: 5,
    name: "Chen Wei",
    email: "chen@example.com",
    avatar: null,
    location: "Tokyo, Japan",
    joinDate: "2024-05-08",
    genres: ["Minimal", "Ambient"],
    rating: 4.5,
    totalGigs: 6,
    status: "active",
    lastActive: "5 minutes ago"
  }
];

const AdminMembers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    message: ''
  });
  const [messageForm, setMessageForm] = useState({
    subject: '',
    message: ''
  });
  const { toast } = useToast();

  const filteredMembers = mockMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.genres.some(genre => genre.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleInviteMember = () => {
    if (!inviteForm.email) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive"
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteForm.email)) {
      toast({
        title: "Error", 
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    // Here you would typically send the invitation via API
    console.log('Inviting member:', inviteForm);
    
    toast({
      title: "Invitation Sent",
      description: `Invitation sent to ${inviteForm.email}`,
    });

    // Reset form and close dialog
    setInviteForm({ email: '', message: '' });
    setIsInviteDialogOpen(false);
  };

  const handleOpenMessage = (member: any) => {
    setSelectedMember(member);
    setIsMessageDialogOpen(true);
  };

  const handleSendMessage = () => {
    if (!messageForm.subject || !messageForm.message) {
      toast({
        title: "Error",
        description: "Subject and message are required",
        variant: "destructive"
      });
      return;
    }

    // Here you would typically send the message via API
    console.log('Sending message to:', selectedMember?.name, messageForm);
    
    toast({
      title: "Message Sent",
      description: `Message sent to ${selectedMember?.name}`,
    });

    // Reset form and close dialog
    setMessageForm({ subject: '', message: '' });
    setIsMessageDialogOpen(false);
    setSelectedMember(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Members</h1>
          <p className="text-muted-foreground">Manage R/HOOD community members</p>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Invite New Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter member's email address"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="text-foreground">Personal Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a personal message to the invitation..."
                  rows={4}
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsInviteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleInviteMember}>
                  Send Invitation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Message Dialog */}
        <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Send Message to {selectedMember?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-foreground">Subject *</Label>
                <Input
                  id="subject"
                  type="text"
                  placeholder="Enter message subject"
                  value={messageForm.subject}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="messageContent" className="text-foreground">Message *</Label>
                <Textarea
                  id="messageContent"
                  placeholder="Type your message here..."
                  rows={6}
                  value={messageForm.message}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsMessageDialogOpen(false);
                    setSelectedMember(null);
                    setMessageForm({ subject: '', message: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSendMessage}>
                  Send Message
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members, locations, or genres..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
            size="sm"
          >
            All
          </Button>
          <Button 
            variant={filterStatus === 'active' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('active')}
            size="sm"
          >
            Active
          </Button>
          <Button 
            variant={filterStatus === 'inactive' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('inactive')}
            size="sm"
          >
            Inactive
          </Button>
        </div>
      </div>

      {/* Members List */}
      <div className="grid gap-4">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar || undefined} alt={member.name} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-foreground">{member.name}</h3>
                      <div className="flex items-center text-yellow-500">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        <span className="text-xs">{member.rating}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">{member.email}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {member.location}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Joined {member.joinDate}
                      </div>
                      <div className="flex items-center">
                        <Music className="h-3 w-3 mr-1" />
                        {member.totalGigs} gigs
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="flex gap-1 justify-end mb-2 overflow-hidden">
                      {member.genres.slice(0, 2).map((genre) => (
                        <Badge key={genre} variant="outline" className="border-primary text-primary text-xs whitespace-nowrap">
                          {genre}
                        </Badge>
                      ))}
                      {member.genres.length > 2 && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          +{member.genres.length - 2}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Last active: {member.lastActive}</p>
                  </div>
                  
                  {getStatusBadge(member.status)}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleOpenMessage(member)}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No members found matching your criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminMembers;
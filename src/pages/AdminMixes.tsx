import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  Download, 
  Eye, 
  Music,
  Clock,
  Calendar,
  Star,
  Search,
  Check,
  X,
  MessageSquare
} from 'lucide-react';

const mockMixes = [
  {
    id: 1,
    title: "Underground Techno Mix #1",
    artist: "Alex Thompson",
    duration: "58:23",
    genre: "Techno",
    uploadDate: "2024-08-10",
    plays: 1247,
    rating: 4.8,
    status: "approved",
    gigApplication: "Underground Warehouse Rave"
  },
  {
    id: 2,
    title: "Summer House Vibes",
    artist: "Maya Rodriguez", 
    duration: "45:12",
    genre: "House",
    uploadDate: "2024-08-12",
    plays: 892,
    rating: 4.9,
    status: "pending",
    gigApplication: "Rooftop Summer Sessions"
  },
  {
    id: 3,
    title: "Drum & Bass Energy",
    artist: "Kai Johnson",
    duration: "52:45",
    genre: "Drum & Bass",
    uploadDate: "2024-08-14",
    plays: 634,
    rating: 4.7,
    status: "approved",
    gigApplication: "Club Residency Audition"
  },
  {
    id: 4,
    title: "Deep House Journey",
    artist: "Sofia Martinez",
    duration: "61:18",
    genre: "Deep House",
    uploadDate: "2024-08-16",
    plays: 1105,
    rating: 4.6,
    status: "rejected",
    gigApplication: "Rooftop Summer Sessions"
  }
];

const AdminMixes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [playingMix, setPlayingMix] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [mixes, setMixes] = useState(mockMixes);
  const [selectedMix, setSelectedMix] = useState<any>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();

  const filteredMixes = mixes.filter(mix => {
    const matchesSearch = mix.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mix.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mix.genre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || mix.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handlePlayPause = (mixId: number) => {
    setPlayingMix(playingMix === mixId ? null : mixId);
  };

  const handleDownload = (mix: any) => {
    // Simulate file download
    toast({
      title: "Download Started",
      description: `Downloading ${mix.title} by ${mix.artist}`,
    });
    
    // In a real app, you would download the actual file
    // const link = document.createElement('a');
    // link.href = mix.fileUrl;
    // link.download = `${mix.title}.mp3`;
    // link.click();
  };

  const handleApproveMix = (mix: any) => {
    setSelectedMix(mix);
    setIsApprovalDialogOpen(true);
  };

  const confirmApproval = () => {
    setMixes(prevMixes => 
      prevMixes.map(mix => 
        mix.id === selectedMix.id 
          ? { ...mix, status: 'approved' }
          : mix
      )
    );
    
    toast({
      title: "Mix Approved",
      description: `${selectedMix.title} has been approved`,
    });
    
    setIsApprovalDialogOpen(false);
    setSelectedMix(null);
  };

  const handleRejectMix = () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive"
      });
      return;
    }

    setMixes(prevMixes => 
      prevMixes.map(mix => 
        mix.id === selectedMix.id 
          ? { ...mix, status: 'rejected', rejectionReason }
          : mix
      )
    );
    
    toast({
      title: "Mix Rejected",
      description: `${selectedMix.title} has been rejected`,
    });
    
    setIsApprovalDialogOpen(false);
    setSelectedMix(null);
    setRejectionReason('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mixes</h1>
        <p className="text-muted-foreground">Review and manage submitted DJ mixes</p>
      </div>

      {/* Search and Filter */}
      <div className="flex space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search mixes, artists, or genres..."
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
            variant={filterStatus === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('pending')}
            size="sm"
          >
            Pending
          </Button>
          <Button 
            variant={filterStatus === 'approved' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('approved')}
            size="sm"
          >
            Approved
          </Button>
          <Button 
            variant={filterStatus === 'rejected' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('rejected')}
            size="sm"
          >
            Rejected
          </Button>
        </div>
      </div>

      {/* Mixes List */}
      <div className="grid gap-4">
        {filteredMixes.map((mix) => (
          <Card key={mix.id} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePlayPause(mix.id)}
                    className="h-10 w-10"
                  >
                    {playingMix === mix.id ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{mix.title}</h3>
                    <p className="text-sm text-muted-foreground">by {mix.artist}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {mix.duration}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {mix.uploadDate}
                      </div>
                      <div className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {mix.plays} plays
                      </div>
                      <div className="flex items-center">
                        <Star className="h-3 w-3 mr-1" />
                        {mix.rating}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="border-primary text-primary">
                    {mix.genre}
                  </Badge>
                  {getStatusBadge(mix.status)}
                  
                  {/* Approval actions for pending mixes */}
                  {mix.status === 'pending' && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleApproveMix(mix)}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownload(mix)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Applied for: <span className="text-foreground">{mix.gigApplication}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMixes.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No mixes found matching your criteria</p>
          </CardContent>
        </Card>
      )}

      {/* Mix Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Review Mix</DialogTitle>
          </DialogHeader>
          {selectedMix && (
            <div className="space-y-4">
              <div className="p-4 bg-secondary/50 rounded-lg">
                <h3 className="font-semibold text-foreground">{selectedMix.title}</h3>
                <p className="text-sm text-muted-foreground">by {selectedMix.artist}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Applied for: {selectedMix.gigApplication}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rejectionReason" className="text-foreground">
                  Rejection Reason (optional)
                </Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Provide feedback if rejecting this mix..."
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsApprovalDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleRejectMix}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button onClick={confirmApproval}>
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMixes;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';

const CreateOpportunity = () => {
  const navigate = useNavigate();
  const [newGig, setNewGig] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
    fee: '',
    genre: '',
    description: '',
    skillLevel: ''
  });

  const handleAddGig = () => {
    // In a real app, this would submit to an API
    console.log('Adding new gig:', newGig);
    navigate('/admin/opportunities');
  };

  const handleCancel = () => {
    navigate('/admin/opportunities');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-foreground leading-tight">Create New Opportunity</h1>
            <p className="text-xs text-muted-foreground leading-tight">Add a new gig for DJs to apply</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Opportunity Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="gigName" className="text-foreground">Opportunity Title</Label>
                <Input
                  id="gigName"
                  placeholder="Enter opportunity title"
                  value={newGig.name}
                  onChange={(e) => setNewGig({...newGig, name: e.target.value})}
                  className="bg-secondary border-border text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-foreground">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newGig.date}
                    onChange={(e) => setNewGig({...newGig, date: e.target.value})}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time" className="text-foreground">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newGig.time}
                    onChange={(e) => setNewGig({...newGig, time: e.target.value})}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-foreground">Location</Label>
                <Input
                  id="location"
                  placeholder="Enter location"
                  value={newGig.location}
                  onChange={(e) => setNewGig({...newGig, location: e.target.value})}
                  className="bg-secondary border-border text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fee" className="text-foreground">Fee</Label>
                  <Input
                    id="fee"
                    placeholder="£300"
                    value={newGig.fee}
                    onChange={(e) => setNewGig({...newGig, fee: e.target.value})}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Genre</Label>
                  <Select value={newGig.genre} onValueChange={(value) => setNewGig({...newGig, genre: value})}>
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {['House', 'Techno', 'Drum & Bass', 'Dubstep', 'Hip-Hop'].map((genre) => (
                        <SelectItem key={genre} value={genre} className="text-foreground hover:bg-accent">
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the gig..."
                  value={newGig.description}
                  onChange={(e) => setNewGig({...newGig, description: e.target.value})}
                  className="bg-secondary border-border text-foreground min-h-32"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleAddGig}>
                  Create Opportunity
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateOpportunity;
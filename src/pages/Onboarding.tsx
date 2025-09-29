import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music, Instagram, Cloud, MapPin, Zap } from 'lucide-react';
import rhoodLogo from '@/assets/rhood-logo.png';

const genres = [
  'House', 'Techno', 'Drum & Bass', 'Dubstep', 'Trap', 'Hip-Hop', 
  'Electronic', 'Progressive', 'Trance', 'Ambient', 'Breakbeat'
];

const cities = [
  'London', 'Berlin', 'Amsterdam', 'Barcelona', 'Paris', 'New York', 
  'Los Angeles', 'Miami', 'Toronto', 'Melbourne', 'Tokyo', 'São Paulo'
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    djName: '',
    instagramLink: '',
    soundcloudLink: '',
    city: '',
    genres: [] as string[]
  });

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate approval process
    setTimeout(() => {
      navigate('/feed');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src={rhoodLogo} alt="R/HOOD" className="h-12 w-auto" />
          </div>
          <p className="text-muted-foreground">Join the underground music scene</p>
          
          {/* Admin Access Link */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/admin/login')}
            className="text-xs text-muted-foreground hover:text-foreground mt-2"
          >
            Team Access
          </Button>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-center text-foreground">Create Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="bg-secondary border-border text-foreground"
                  required
                />
              </div>

              {/* DJ Name */}
              <div className="space-y-2">
                <Label htmlFor="djName" className="text-foreground flex items-center">
                  <Zap className="h-4 w-4 mr-2" />
                  DJ Name
                </Label>
                <Input
                  id="djName"
                  placeholder="Your DJ stage name"
                  value={formData.djName}
                  onChange={(e) => setFormData({...formData, djName: e.target.value})}
                  className="bg-secondary border-border text-foreground"
                  required
                />
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="instagram" className="text-foreground flex items-center">
                    <Instagram className="h-4 w-4 mr-2" />
                    Instagram
                  </Label>
                  <Input
                    id="instagram"
                    placeholder="@yourhandle or full URL"
                    value={formData.instagramLink}
                    onChange={(e) => setFormData({...formData, instagramLink: e.target.value})}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="soundcloud" className="text-foreground flex items-center">
                    <Cloud className="h-4 w-4 mr-2" />
                    SoundCloud
                  </Label>
                  <Input
                    id="soundcloud"
                    placeholder="Your SoundCloud URL"
                    value={formData.soundcloudLink}
                    onChange={(e) => setFormData({...formData, soundcloudLink: e.target.value})}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label className="text-foreground flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  City
                </Label>
                <Select value={formData.city} onValueChange={(value) => setFormData({...formData, city: value})}>
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Select your city" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {cities.map((city) => (
                      <SelectItem key={city} value={city} className="text-foreground hover:bg-accent">
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Genres */}
              <div className="space-y-2">
                <Label className="text-foreground flex items-center">
                  <Music className="h-4 w-4 mr-2" />
                  Your Genres
                </Label>
                <div className="flex flex-wrap gap-2">
                  {genres.map((genre) => (
                    <Badge
                      key={genre}
                      variant={selectedGenres.includes(genre) ? "default" : "outline"}
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedGenres.includes(genre) 
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                          : 'border-border text-foreground hover:bg-accent'
                      }`}
                      onClick={() => handleGenreToggle(genre)}
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                variant="premium" 
                size="lg" 
                className="w-full mt-6"
                disabled={!formData.fullName || !formData.djName || !formData.city || selectedGenres.length === 0}
              >
                Request Access
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
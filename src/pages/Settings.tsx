import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Bell, 
  Shield, 
  Palette, 
  Volume2,
  Globe,
  HelpCircle,
  LogOut,
  User,
  Mail,
  Phone
} from 'lucide-react';
import rhoodLogo from '@/assets/rhood-logo.png';

const Settings = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({
    gigUpdates: true,
    messages: true,
    marketing: false,
    sound: true
  });

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showLocation: true,
    showStats: true
  });

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center max-w-md mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <button onClick={() => navigate('/')} className="flex items-center ml-4">
            <img 
              src={rhoodLogo} 
              alt="R/HOOD Logo" 
              className="w-8 h-8 mr-2"
            />
            <h1 className="text-xl font-bold text-foreground">Settings</h1>
          </button>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-6">
        {/* Account Settings */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <User className="h-5 w-5 mr-2" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-muted-foreground mr-3" />
                <span className="text-foreground">Email</span>
              </div>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-muted-foreground mr-3" />
                <span className="text-foreground">Phone</span>
              </div>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-foreground">Gig Updates</span>
              <Switch 
                checked={notifications.gigUpdates}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({...prev, gigUpdates: checked}))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground">Messages</span>
              <Switch 
                checked={notifications.messages}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({...prev, messages: checked}))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground">Marketing</span>
              <Switch 
                checked={notifications.marketing}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({...prev, marketing: checked}))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground">Sound</span>
              <Switch 
                checked={notifications.sound}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({...prev, sound: checked}))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-foreground">Public Profile</span>
              <Switch 
                checked={privacy.profileVisible}
                onCheckedChange={(checked) => 
                  setPrivacy(prev => ({...prev, profileVisible: checked}))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground">Show Location</span>
              <Switch 
                checked={privacy.showLocation}
                onCheckedChange={(checked) => 
                  setPrivacy(prev => ({...prev, showLocation: checked}))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground">Show Stats</span>
              <Switch 
                checked={privacy.showStats}
                onCheckedChange={(checked) => 
                  setPrivacy(prev => ({...prev, showStats: checked}))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <Palette className="h-5 w-5 mr-2" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Volume2 className="h-4 w-4 text-muted-foreground mr-3" />
                <span className="text-foreground">Audio Preview</span>
              </div>
              <Button variant="outline" size="sm">
                Auto
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Globe className="h-4 w-4 text-muted-foreground mr-3" />
                <span className="text-foreground">Language</span>
              </div>
              <Button variant="outline" size="sm">
                English
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <HelpCircle className="h-5 w-5 mr-2" />
              Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="ghost" className="w-full justify-start p-0">
              Help Center
            </Button>
            <Button variant="ghost" className="w-full justify-start p-0">
              Contact Support
            </Button>
            <Button variant="ghost" className="w-full justify-start p-0">
              Terms of Service
            </Button>
            <Button variant="ghost" className="w-full justify-start p-0">
              Privacy Policy
            </Button>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="bg-card border-destructive/30">
          <CardContent className="p-4">
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => navigate('/')}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        <div className="text-center pb-8">
          <p className="text-xs text-muted-foreground">
            R/HOOD v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Music, 
  Calendar,
  DollarSign,
  MapPin,
  Settings
} from 'lucide-react';

// Import gig images
import warehouseRaveImg from '@/assets/warehouse-rave.jpg';
import rooftopSessionsImg from '@/assets/rooftop-sessions.jpg';
import clubResidencyImg from '@/assets/club-residency.jpg';
import beachFestivalImg from '@/assets/beach-festival.jpg';
import rhoodLogo from '@/assets/rhood-logo.png';

const mockNotifications = [
  {
    id: 1,
    type: 'selected',
    title: 'You got the gig!',
    gigName: 'Underground Warehouse Rave',
    message: 'Congratulations! You\'ve been selected for the Underground Warehouse Rave.',
    timeLeft: '18h 32m',
    deadline: '2024-08-12 14:00',
    fee: '£300',
    location: 'East London',
    date: '2024-08-15',
    image: warehouseRaveImg
  },
  {
    id: 2,
    type: 'pending',
    title: 'Application Under Review',
    gigName: 'Rooftop Summer Sessions',
    message: 'Your application is being reviewed by the organizers.',
    submittedAt: '2 hours ago',
    fee: '£450',
    location: 'Shoreditch',
    date: '2024-08-20',
    image: rooftopSessionsImg
  },
  {
    id: 3,
    type: 'rejected',
    title: 'Application Declined',
    gigName: 'Club Residency Audition',
    message: 'Unfortunately, they went with someone else this time. Keep applying!',
    fee: '£200 + Residency',
    location: 'Camden',
    date: '2024-08-25',
    image: clubResidencyImg
  },
  {
    id: 4,
    type: 'pending',
    title: 'Application Under Review',
    gigName: 'Beach Festival Set',
    message: 'Your application is being reviewed. You\'ll hear back within 48 hours.',
    submittedAt: '1 day ago',
    fee: '£600',
    location: 'Brighton',
    date: '2024-08-30',
    image: beachFestivalImg
  }
];

const Notifications = () => {
  const navigate = useNavigate();

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'selected':
        return <CheckCircle className="h-5 w-5 text-accent" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-primary" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Music className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'selected':
        return 'bg-accent/20 border-accent';
      case 'pending':
        return 'bg-primary/20 border-primary';
      case 'rejected':
        return 'bg-destructive/20 border-destructive';
      default:
        return 'bg-muted/20 border-muted';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate('/feed')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <button onClick={() => navigate('/')} className="flex items-center ml-4">
              <img 
                src={rhoodLogo} 
                alt="R/HOOD Logo" 
                className="w-8 h-8 mr-2"
              />
              <h1 className="text-xl font-bold text-foreground">Notifications</h1>
            </button>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="p-4 max-w-md mx-auto space-y-4">
        {mockNotifications.map((notification) => (
          <Card 
            key={notification.id} 
            className={`border ${getStatusColor(notification.type)} bg-card/50 backdrop-blur relative overflow-hidden min-h-[200px]`}
            style={{
              backgroundImage: `url(${notification.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-black/80" />
            
            <CardContent className="p-4 relative z-10">
              <div className="flex items-start space-x-3">
                <div className="mt-1">
                  {getStatusIcon(notification.type)}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{notification.title}</h3>
                    <p className="text-sm font-medium text-primary">{notification.gigName}</p>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  
                  {/* Gig Details */}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-2" />
                      <span>{notification.date}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-2" />
                      <span>{notification.location}</span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-3 w-3 mr-2" />
                      <span>{notification.fee}</span>
                    </div>
                  </div>

                  {/* Time Sensitive Info */}
                  {notification.type === 'selected' && notification.timeLeft && (
                    <div className="bg-accent/20 rounded-lg p-3 mt-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-accent">Accept within:</p>
                          <p className="text-lg font-bold text-accent">{notification.timeLeft}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" className="text-xs">
                            Decline
                          </Button>
                          <Button size="sm" variant="premium" className="text-xs">
                            Accept
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submission Time */}
                  {notification.submittedAt && (
                    <p className="text-xs text-muted-foreground">
                      Applied {notification.submittedAt}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Empty State (if no notifications) */}
        {mockNotifications.length === 0 && (
          <div className="text-center py-12">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No notifications yet</h3>
            <p className="text-muted-foreground">
              Apply to some gigs and we'll keep you updated here!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
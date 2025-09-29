import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  UserCheck, 
  Mail, 
  Star, 
  MapPin, 
  Instagram,
  Eye,
  Calendar,
  DollarSign,
  Users,
  Clock,
  CheckCircle
} from 'lucide-react';

const mockApplications = [
  {
    id: 1,
    opportunityId: 1,
    opportunityName: "Underground Warehouse Rave",
    opportunityDate: "2024-08-15",
    opportunityLocation: "East London",
    opportunityFee: "£300",
    opportunityGenre: "Techno",
    opportunityStatus: "active",
    totalApplicants: 12,
    applicant: {
      name: "Alex Thompson",
      djName: "@alexbeats",
      rating: 4.8,
      experience: "5 years",
      location: "London",
      genres: ["Techno", "House"],
      status: "pending"
    },
    appliedDate: "2024-07-20"
  },
  {
    id: 2,
    opportunityId: 2,
    opportunityName: "Rooftop Summer Sessions",
    opportunityDate: "2024-08-20",
    opportunityLocation: "Shoreditch",
    opportunityFee: "£450",
    opportunityGenre: "House",
    opportunityStatus: "active",
    totalApplicants: 8,
    applicant: {
      name: "Maya Rodriguez",
      djName: "@mayabeats",
      rating: 4.9,
      experience: "7 years",
      location: "Berlin",
      genres: ["House", "Deep House"],
      status: "pending"
    },
    appliedDate: "2024-07-22"
  },
  {
    id: 3,
    opportunityId: 3,
    opportunityName: "Club Residency Audition",
    opportunityDate: "2024-08-25",
    opportunityLocation: "Camden",
    opportunityFee: "£200 + Residency",
    opportunityGenre: "Drum & Bass",
    opportunityStatus: "completed",
    totalApplicants: 15,
    applicant: {
      name: "Kai Johnson",
      djName: "@djkai",
      rating: 4.7,
      experience: "3 years",
      location: "Amsterdam",
      genres: ["Drum & Bass", "Jungle"],
      status: "selected"
    },
    appliedDate: "2024-07-18"
  }
];

const AdminApplications = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Applications</h1>
        <p className="text-muted-foreground">Review and manage DJ applications</p>
      </div>

      {/* Applications List */}
      <div className="grid gap-4">
        {mockApplications.map((application) => (
          <Card key={application.id} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{application.opportunityName}</h3>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {application.opportunityDate}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {application.opportunityLocation}
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-3 w-3 mr-1" />
                      {application.opportunityFee}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
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

              <div className="flex justify-between items-center">
                <div className="flex items-center text-muted-foreground">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{application.totalApplicants} applicant{application.totalApplicants !== 1 ? 's' : ''}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/admin/applications/${application.id}`)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminApplications;
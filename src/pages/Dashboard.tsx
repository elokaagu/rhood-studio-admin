import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  const stats = [
    {
      title: "Active Opportunities",
      value: "12",
      change: "+3 this week"
    },
    {
      title: "Pending Applications",
      value: "47",
      change: "+12 today"
    },
    {
      title: "Total Members",
      value: "1,234",
      change: "+89 this month"
    },
    {
      title: "Submitted Mixes",
      value: "156",
      change: "+24 this week"
    }
  ];

  const recentActivity = [
    {
      type: "application",
      message: "Alex Thompson applied to Underground Warehouse Rave",
      time: "2 hours ago"
    },
    {
      type: "opportunity",
      message: "New opportunity posted: Rooftop Summer Sessions",
      time: "4 hours ago"
    },
    {
      type: "selection",
      message: "Maya Rodriguez selected for Club Residency Audition",
      time: "1 day ago"
    },
    {
      type: "member",
      message: "15 new members joined this week",
      time: "2 days ago"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to R/HOOD Studio management dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.change}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="p-3 rounded-lg bg-secondary/50">
                <div>
                  <p className="text-sm text-foreground">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Underground Warehouse Rave</p>
                  <p className="text-xs text-muted-foreground">Tomorrow, 8:00 PM</p>
                </div>
                <Badge variant="outline" className="border-primary text-primary">Techno</Badge>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Rooftop Summer Sessions</p>
                  <p className="text-xs text-muted-foreground">Aug 20, 6:00 PM</p>
                </div>
                <Badge variant="outline" className="border-primary text-primary">House</Badge>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Club Residency Audition</p>
                  <p className="text-xs text-muted-foreground">Aug 25, 9:00 PM</p>
                </div>
                <Badge variant="outline" className="border-primary text-primary">Drum & Bass</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
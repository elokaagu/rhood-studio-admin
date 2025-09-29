import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const stats = [
    {
      title: "Active Opportunities",
      value: "12",
      change: "+3 this week",
    },
    {
      title: "Pending Applications",
      value: "47",
      change: "+12 today",
    },
    {
      title: "Total Members",
      value: "1,234",
      change: "+89 this month",
    },
    {
      title: "Submitted Mixes",
      value: "156",
      change: "+24 this week",
    },
  ];

  const recentActivity = [
    {
      type: "application",
      message: "Alex Thompson applied to Underground Warehouse Rave",
      time: "2 hours ago",
    },
    {
      type: "opportunity",
      message: "New opportunity posted: Rooftop Summer Sessions",
      time: "4 hours ago",
    },
    {
      type: "selection",
      message: "Maya Rodriguez selected for Club Residency Audition",
      time: "1 day ago",
    },
    {
      type: "member",
      message: "15 new members joined this week",
      time: "2 days ago",
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "application":
        return "📝";
      case "opportunity":
        return "🎯";
      case "selection":
        return "✅";
      case "member":
        return "👥";
      default:
        return "📌";
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "application":
        return "bg-blue-100 text-blue-800";
      case "opportunity":
        return "bg-green-100 text-green-800";
      case "selection":
        return "bg-purple-100 text-purple-800";
      case "member":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground font-headline text-xl">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="text-lg">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{activity.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.time}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={`text-xs ${getActivityColor(activity.type)}`}
                >
                  {activity.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

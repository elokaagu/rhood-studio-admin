export interface MonthlyData {
  monthKey: string;
  month: string;
  signups: number;
  applications: number;
}

export interface LocationData {
  location: string;
  count: number;
}

export interface AgeData {
  ageRange: string;
  count: number;
}

export interface TopUser {
  id: string;
  name: string;
  rating: number;
  gigs: number;
  status: string;
}

export interface TopUsersData {
  mostActive: TopUser[];
  highestRating: TopUser[];
  upAndComing: TopUser[];
  leastActive: TopUser[];
}

export interface AnalyticsDashboardData {
  currentMonthSignups: number;
  brandApplications: number;
  dailyActiveUsers: number;
  minutesPerUser: number;
  monthlySignups: MonthlyData[];
  locationData: LocationData[];
  ageData: AgeData[];
  topUsers: TopUsersData;
}

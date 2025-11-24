"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/date-utils";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserProfile, getCurrentUserId } from "@/lib/auth-utils";
import {
  Coins,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Filter,
  Download,
  CheckCircle,
  Rocket,
  Star,
  Gift,
  Sparkles,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
  user_profile?: {
    dj_name: string | null;
    brand_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

export default function CreditTransactionsPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const profile = await getCurrentUserProfile();
      setUserProfile(profile);
    };
    fetchUserProfile();
  }, []);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const userId = await getCurrentUserId();
      if (!userId) {
        setIsLoading(false);
        return;
      }

      // Build query with proper RLS filtering - filter at database level
      // @ts-ignore - credit_transactions table may not be in types yet
      let query = (supabase as any).from("credit_transactions").select("*");

      // Non-admins can only see their own transactions (RLS will also enforce this)
      // But we filter at query level to be explicit and improve performance
      if (userProfile?.role !== "admin") {
        query = query.eq("user_id", userId);
      }

      // Apply transaction type filter at database level
      if (filterType !== "all") {
        if (filterType === "earned") {
          query = query.gt("amount", 0);
        } else if (filterType === "spent") {
          query = query.lt("amount", 0);
        } else {
          query = query.eq("transaction_type", filterType);
        }
      }

      // Execute query with ordering and limit
      const { data: transactionsData, error: transactionsError } = await query
        .order("created_at", { ascending: false })
        .limit(100);

      if (transactionsError) {
        // If table doesn't exist, show empty state
        if (
          transactionsError.code === "42P01" || 
          transactionsError.message?.includes("does not exist") ||
          transactionsError.message?.includes("permission denied")
        ) {
          console.warn("Credit transactions table does not exist or access denied. Migration may not have been run.", transactionsError);
          toast({
            title: "Migration Required",
            description: "Credit transactions table does not exist or you don't have permission. Please run the credits system migration (20250114000000_create_credits_system.sql) in Supabase.",
            variant: "destructive",
          });
          setTransactions([]);
          setIsLoading(false);
          return;
        }
        throw transactionsError;
      }

      if (!transactionsData || transactionsData.length === 0) {
        setTransactions([]);
        setIsLoading(false);
        return;
      }

      // Fetch user profiles for admin view
      const userIds = [...new Set(transactionsData.map((t: any) => t.user_id))] as string[];
      let userProfilesMap: Record<string, any> = {};

      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("user_profiles")
          .select("id, dj_name, brand_name, first_name, last_name, email")
          .in("id", userIds);

        if (profilesError) {
          console.warn("Error fetching user profiles:", profilesError);
          // Continue without profiles - not critical
        } else if (profilesData) {
          profilesData.forEach((profile: any) => {
            userProfilesMap[profile.id] = profile;
          });
        }
      }

      // Combine transactions with user profiles
      const transactionsWithProfiles = transactionsData.map((transaction: any) => ({
        ...transaction,
        user_profile: userProfilesMap[transaction.user_id] || null,
      }));

      setTransactions(transactionsWithProfiles as CreditTransaction[]);
    } catch (error: any) {
      // Log the error in a way that's visible in console
      const errorInfo = {
        message: error?.message || "Unknown error",
        code: error?.code || "No code",
        details: error?.details || "No details",
        hint: error?.hint || "No hint",
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
      };
      
      console.error("Error fetching transactions:", errorInfo);
      console.error("Full error object:", error);
      
      // Try to get more details from the error
      if (error?.message) {
        console.error("Error message:", error.message);
      }
      if (error?.code) {
        console.error("Error code:", error.code);
      }
      if (error?.details) {
        console.error("Error details:", error.details);
      }
      
      // Provide more helpful error message based on error type
      let errorMessage = "Failed to load credit transactions. Please try again.";
      let errorTitle = "Error";
      
      if (error?.code === "42P01" || error?.message?.includes("does not exist")) {
        errorTitle = "Migration Required";
        errorMessage = "Credit transactions table does not exist. Please run the credits system migration (20250114000000_create_credits_system.sql) in Supabase.";
      } else if (error?.code === "42501" || error?.message?.includes("permission denied")) {
        errorTitle = "Permission Denied";
        errorMessage = "You don't have permission to view credit transactions. Please contact an administrator.";
      } else if (error?.message) {
        errorMessage = `${error.message}${error?.code ? ` (Code: ${error.code})` : ""}`;
      } else if (error?.code) {
        errorMessage = `Database error occurred. Code: ${error.code}`;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile) {
      fetchTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, userProfile]);

  const getTransactionIcon = (type: string, amount: number) => {
    if (amount > 0) {
      switch (type) {
        case "gig_completed":
          return <CheckCircle className="h-5 w-5 text-green-500" />;
        case "rating_received":
          return <Star className="h-5 w-5 text-yellow-500" />;
        case "endorsement":
          return <Gift className="h-5 w-5 text-purple-500" />;
        case "streak_bonus":
          return <Sparkles className="h-5 w-5 text-blue-500" />;
        default:
          return <TrendingUp className="h-5 w-5 text-green-500" />;
      }
    } else {
      switch (type) {
        case "boost_used":
          return <Rocket className="h-5 w-5 text-orange-500" />;
        default:
          return <TrendingDown className="h-5 w-5 text-red-500" />;
      }
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      gig_completed: "Gig Completed",
      rating_received: "Rating Received",
      boost_used: "Boost Used",
      manual_adjustment: "Manual Adjustment",
      endorsement: "Brand Endorsement",
      streak_bonus: "Streak Bonus",
    };
    return labels[type] || type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getDisplayName = (transaction: CreditTransaction) => {
    if (!transaction.user_profile || userProfile?.role === "admin") {
      return "Your Account";
    }
    return (
      transaction.user_profile.dj_name ||
      transaction.user_profile.brand_name ||
      `${transaction.user_profile.first_name || ""} ${transaction.user_profile.last_name || ""}`.trim() ||
      transaction.user_profile.email
    );
  };

  const totalEarned = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalSpent = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netCredits = totalEarned - totalSpent;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`${textStyles.headline.section} text-xl sm:text-2xl md:text-3xl`}>
            Credit Transactions
          </h1>
          <p className={`${textStyles.body.regular} text-sm sm:text-base mt-1`}>
            View your credit transaction history
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="earned">Earned Only</SelectItem>
              <SelectItem value="spent">Spent Only</SelectItem>
              <SelectItem value="gig_completed">Gig Completed</SelectItem>
              <SelectItem value="rating_received">Rating Received</SelectItem>
              <SelectItem value="boost_used">Boost Used</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className={`${textStyles.subheading.small} flex items-center gap-2`}>
              <TrendingUp className="h-4 w-4 text-green-500" />
              Total Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-brand-green" />
              <span className={`${textStyles.subheading.large} text-brand-green`}>
                +{totalEarned}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className={`${textStyles.subheading.small} flex items-center gap-2`}>
              <TrendingDown className="h-4 w-4 text-red-500" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-red-500" />
              <span className={`${textStyles.subheading.large} text-red-500`}>
                -{totalSpent}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className={`${textStyles.subheading.small} flex items-center gap-2`}>
              <Coins className="h-4 w-4 text-brand-green" />
              Net Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-brand-green" />
              <span className={`${textStyles.subheading.large} ${netCredits >= 0 ? "text-brand-green" : "text-red-500"}`}>
                {netCredits >= 0 ? "+" : ""}{netCredits}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className={textStyles.subheading.small}>
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className={textStyles.body.regular}>Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className={textStyles.body.regular}>
                No transactions found.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getTransactionIcon(
                        transaction.transaction_type,
                        transaction.amount
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`${textStyles.subheading.small} truncate`}>
                          {getTransactionTypeLabel(transaction.transaction_type)}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {transaction.transaction_type}
                        </Badge>
                      </div>
                      {transaction.description && (
                        <p className={`${textStyles.body.small} text-muted-foreground truncate`}>
                          {transaction.description}
                        </p>
                      )}
                      <p className={`${textStyles.body.small} text-muted-foreground`}>
                        {formatDate(transaction.created_at)}
                      </p>
                      {userProfile?.role === "admin" && transaction.user_profile && (
                        <p className={`${textStyles.body.small} text-muted-foreground`}>
                          User: {getDisplayName(transaction)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`${textStyles.subheading.regular} font-bold ${
                        transaction.amount > 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {transaction.amount > 0 ? "+" : ""}
                      {transaction.amount}
                    </span>
                    <Coins
                      className={`h-5 w-5 ${
                        transaction.amount > 0 ? "text-green-500" : "text-red-500"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


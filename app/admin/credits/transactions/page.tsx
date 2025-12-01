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
  ArrowRight,
  Download,
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
  const [retryCount, setRetryCount] = useState(0);
  const [schemaCacheError, setSchemaCacheError] = useState(false);

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

      // Build query to fetch ALL transactions (ledger view)
      // @ts-ignore - credit_transactions table may not be in types yet
      let query = (supabase as any).from("credit_transactions").select("*");

      // Show all transactions - no user filtering for ledger view
      // Note: RLS policies will still enforce permissions

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

      // Execute query with ordering and limit (increased for ledger view)
      const { data: transactionsData, error: transactionsError } = await query
        .order("created_at", { ascending: false })
        .limit(500); // Increased limit for comprehensive ledger view

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

      // Fetch user profiles for ALL transactions in ledger view
      const userIds = [...new Set(transactionsData.map((t: any) => t.user_id))] as string[];
      let userProfilesMap: Record<string, any> = {};

      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("user_profiles")
          .select("id, dj_name, brand_name, first_name, last_name, email, role")
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

      // Combine transactions with user profiles for ledger view
      const transactionsWithProfiles = transactionsData.map((transaction: any) => ({
        ...transaction,
        user_profile: userProfilesMap[transaction.user_id] || null,
      }));

      setTransactions(transactionsWithProfiles as CreditTransaction[]);
      setSchemaCacheError(false); // Clear error state on success
      setRetryCount(0); // Reset retry count
    } catch (error: any) {
      // Log the error in a way that's visible in console
      // Handle cases where error might be null, undefined, or have unexpected structure
      let errorMessage = "Unknown error";
      let errorCode: string | undefined;
      let errorDetails: string | undefined;
      let errorHint: string | undefined;
      
      if (error) {
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error instanceof Error) {
          errorMessage = error.message || "Unknown error";
          errorCode = (error as any).code;
          errorDetails = (error as any).details;
          errorHint = (error as any).hint;
        } else if (typeof error === 'object') {
          errorMessage = error.message || error.toString() || "Unknown error";
          errorCode = error.code;
          errorDetails = error.details;
          errorHint = error.hint;
        }
      }
      
      // Safe stringify for logging
      let errorString = "No error details available";
      try {
        if (error) {
          if (typeof error === 'string') {
            errorString = error;
          } else if (error instanceof Error) {
            errorString = error.stack || error.message || String(error);
          } else {
            // Try JSON.stringify, but catch if it fails (e.g., circular references)
            try {
              errorString = JSON.stringify(error, null, 2);
            } catch (stringifyError) {
              errorString = String(error) || "Could not serialize error";
            }
          }
        }
      } catch (e) {
        errorString = "Error occurred while processing error: " + String(e);
      }
      
      const errorInfo = {
        message: errorMessage,
        code: errorCode || "No code",
        details: errorDetails || "No details",
        hint: errorHint || "No hint",
        rawError: errorString
      };
      
      console.error("Error fetching transactions:", errorInfo);
      if (error) {
        console.error("Full error object:", error);
      }
      
      // Provide more helpful error message based on error type
      let userErrorMessage = errorMessage || "Failed to load credit transactions. Please try again.";
      let errorTitle = "Error";
      
      // Check if error string contains schema cache indicators (even if error object is empty)
      const errorStringLower = JSON.stringify(error || {}).toLowerCase();
      const isSchemaCacheError = 
        errorCode === "PGRST205" || 
        errorCode === "PGRST" ||
        errorMessage?.toLowerCase().includes("pgrst205") || 
        errorMessage?.toLowerCase().includes("schema cache") ||
        errorMessage?.toLowerCase().includes("could not find the table") ||
        (errorMessage?.toLowerCase().includes("credit_transactions") && errorMessage?.toLowerCase().includes("schema cache")) ||
        errorStringLower.includes("pgrst205") ||
        errorStringLower.includes("schema cache") ||
        errorDetails?.toLowerCase().includes("schema cache") ||
        errorHint?.toLowerCase().includes("schema cache");
      
      if (isSchemaCacheError) {
        setSchemaCacheError(true);
        errorTitle = "Schema Cache Needs Refresh";
        userErrorMessage = "The credit_transactions table exists but Supabase hasn't refreshed its cache yet. ";
        
        if (retryCount < 3) {
          // Auto-retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, retryCount), 8000); // Max 8 seconds
          userErrorMessage += `Retrying in ${delay / 1000} seconds... (Attempt ${retryCount + 1}/3)`;
          
          setTimeout(() => {
            setRetryCount(retryCount + 1);
            fetchTransactions();
          }, delay);
          
          // Don't show toast for auto-retries
          return;
        } else {
          userErrorMessage += "Please: 1) Run FIX_SCHEMA_CACHE_PGRST205.sql in Supabase SQL Editor, or 2) Go to Supabase Dashboard → Settings → API → Refresh Schema Cache, then click 'Retry' below.";
        }
      } else if (errorCode === "42P01" || errorMessage?.includes("does not exist") || (errorMessage?.includes("relation") && errorMessage?.includes("does not exist"))) {
        errorTitle = "Migration Required";
        userErrorMessage = "Credit transactions table does not exist. Please run RUN_ALL_CREDITS_MIGRATIONS.sql in Supabase SQL Editor first.";
      } else if (errorCode === "42501" || errorMessage?.toLowerCase().includes("permission denied")) {
        errorTitle = "Permission Denied";
        userErrorMessage = "You don't have permission to view credit transactions. Please contact an administrator.";
      } else if (errorMessage && errorMessage !== "Unknown error") {
        userErrorMessage = `${errorMessage}${errorCode ? ` (Code: ${errorCode})` : ""}`;
      } else if (errorCode) {
        userErrorMessage = `Database error occurred. Code: ${errorCode}`;
      }
      
      // Only show toast if it's not a schema cache error being auto-retried
      // (isSchemaCacheError is already defined above)
      if (!isSchemaCacheError || retryCount >= 3) {
        toast({
          title: errorTitle,
          description: userErrorMessage,
          variant: "destructive",
        });
      }
      
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
    if (!transaction.user_profile) {
      return "Unknown User";
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
            Credit Transactions Ledger
          </h1>
          <p className={`${textStyles.body.regular} text-sm sm:text-base mt-1`}>
            Complete ledger of all credit transactions in the system
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
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
            <CardTitle className={textStyles.subheading.small}>
              System Total Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`${textStyles.subheading.large} text-brand-green`}>
                +{totalEarned.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className={textStyles.subheading.small}>
              System Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`${textStyles.subheading.large} text-red-500`}>
                -{totalSpent.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className={textStyles.subheading.small}>
              System Net Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`${textStyles.subheading.large} ${netCredits >= 0 ? "text-brand-green" : "text-red-500"}`}>
                {netCredits >= 0 ? "+" : ""}{netCredits.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className={textStyles.subheading.small}>
            Transaction Ledger
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className={textStyles.body.regular}>Loading transactions...</p>
            </div>
          ) : schemaCacheError && retryCount >= 3 ? (
            <div className="text-center py-8 space-y-4">
              <p className={`${textStyles.body.regular} text-red-500 mb-4`}>
                Schema cache error detected. Please refresh the schema cache in Supabase.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
                <Button
                  onClick={() => {
                    setRetryCount(0);
                    setSchemaCacheError(false);
                    fetchTransactions();
                  }}
                  variant="default"
                >
                  Retry
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                >
                  Refresh Page
                </Button>
              </div>
              <p className={`${textStyles.body.small} text-muted-foreground mt-4`}>
                Run FIX_SCHEMA_CACHE_PGRST205.sql in Supabase SQL Editor, or go to Dashboard → Settings → API → Refresh Schema Cache
              </p>
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
                      {transaction.user_profile && (
                        <p className={`${textStyles.body.small} text-muted-foreground`}>
                          User: {getDisplayName(transaction)}
                          {transaction.user_profile.email && (
                            <span className="text-muted-foreground/70"> • {transaction.user_profile.email}</span>
                          )}
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


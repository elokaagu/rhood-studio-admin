"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/date-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getCreditTransactionsPage,
} from "@/lib/credits/get-credit-transactions";
import type { CreditFilterType, CreditTransaction } from "@/lib/credits/types";

const PAGE_SIZE = 100;

export default function CreditTransactionsPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<CreditFilterType>("all");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    const result = await getCreditTransactionsPage({
      filter: filterType,
      page,
      pageSize: PAGE_SIZE,
    });

    if (!result.ok) {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
      setTransactions([]);
      setHasMore(false);
      setIsLoading(false);
      return;
    }

    setTransactions(result.data.rows);
    setHasMore(result.data.hasMore);
    setIsLoading(false);
  }, [filterType, page, toast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    setPage(0);
  }, [filterType]);

  const summary = useMemo(() => {
    const loadedEarned = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const loadedSpent = transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return {
      loadedEarned,
      loadedSpent,
      loadedNet: loadedEarned - loadedSpent,
    };
  }, [transactions]);

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      gig_completed: "Gig Completed",
      rating_received: "Rating Received",
      boost_used: "Boost Used",
      manual_adjustment: "Manual Adjustment",
      endorsement: "Brand Endorsement",
      streak_bonus: "Streak Bonus",
    };
    return (
      labels[type] ||
      type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    );
  };

  const getDisplayName = (transaction: CreditTransaction) => {
    if (!transaction.user_profile) return "Unknown User";
    return (
      transaction.user_profile.dj_name ||
      transaction.user_profile.brand_name ||
      `${transaction.user_profile.first_name || ""} ${
        transaction.user_profile.last_name || ""
      }`.trim() ||
      transaction.user_profile.email
    );
  };

  return (
    <div className="space-y-6 animate-blur-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`${textStyles.headline.section} text-xl sm:text-2xl md:text-3xl`}>
            Credit Transactions Ledger
          </h1>
          <p className={`${textStyles.body.regular} text-sm sm:text-base mt-1`}>
            Ledger view of loaded transactions. Use pagination for more.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={filterType}
            onValueChange={(v) => setFilterType(v as CreditFilterType)}
          >
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className={textStyles.subheading.small}>Loaded Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <span className={`${textStyles.subheading.large} text-brand-green`}>
              +{summary.loadedEarned.toLocaleString()}
            </span>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className={textStyles.subheading.small}>Loaded Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <span className={`${textStyles.subheading.large} text-red-500`}>
              -{summary.loadedSpent.toLocaleString()}
            </span>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className={textStyles.subheading.small}>Loaded Net</CardTitle>
          </CardHeader>
          <CardContent>
            <span
              className={`${textStyles.subheading.large} ${
                summary.loadedNet >= 0 ? "text-brand-green" : "text-red-500"
              }`}
            >
              {summary.loadedNet >= 0 ? "+" : ""}
              {summary.loadedNet.toLocaleString()}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className={textStyles.subheading.small}>Transaction Ledger</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={isLoading || page === 0}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">Page {page + 1}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={isLoading || !hasMore}
            >
              Next
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className={textStyles.body.regular}>No transactions found.</p>
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
                            <span className="text-muted-foreground/70">
                              {" "}
                              • {transaction.user_profile.email}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`${textStyles.subheading.regular} font-bold ${
                        transaction.amount > 0 ? "text-green-500" : "text-red-500"
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

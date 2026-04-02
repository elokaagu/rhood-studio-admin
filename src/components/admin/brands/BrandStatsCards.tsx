"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { textStyles } from "@/lib/typography";
import type { BrandsAggregateStats } from "@/lib/brands/types";
import { Building2, Briefcase, FileText, Clock } from "lucide-react";

type Props = {
  stats: BrandsAggregateStats;
};

export function BrandStatsCards({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${textStyles.body.small} text-muted-foreground`}>
                Total Brands
              </p>
              <p className={`${textStyles.headline.section} text-foreground mt-1`}>
                {stats.totalBrands}
              </p>
            </div>
            <Building2 className="h-8 w-8 text-brand-green opacity-50" />
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${textStyles.body.small} text-muted-foreground`}>
                Opportunities
              </p>
              <p className={`${textStyles.headline.section} text-foreground mt-1`}>
                {stats.totalOpportunities}
              </p>
            </div>
            <Briefcase className="h-8 w-8 text-brand-green opacity-50" />
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${textStyles.body.small} text-muted-foreground`}>
                Applications
              </p>
              <p className={`${textStyles.headline.section} text-foreground mt-1`}>
                {stats.totalApplications}
              </p>
            </div>
            <FileText className="h-8 w-8 text-brand-green opacity-50" />
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${textStyles.body.small} text-muted-foreground`}>
                Pending
              </p>
              <p className={`${textStyles.headline.section} text-foreground mt-1`}>
                {stats.totalPending}
              </p>
            </div>
            <Clock className="h-8 w-8 text-brand-green opacity-50" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

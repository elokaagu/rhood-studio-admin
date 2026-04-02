"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Coins,
  CheckCircle,
} from "lucide-react";
import { textStyles } from "@/lib/typography";
import { formatBookingEventDate } from "@/lib/date-utils";
import type { BrandAcceptedContract } from "@/lib/brand/types";

type Props = {
  contracts: BrandAcceptedContract[];
  onViewDetails: (contractId: string) => void;
};

export function BrandContractsList({ contracts, onViewDetails }: Props) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className={textStyles.subheading.small}>Agreements</CardTitle>
      </CardHeader>
      <CardContent>
        {contracts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No contracts found. Accepted booking requests will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {contracts.map((contract) => (
              <Card
                key={contract.id}
                className="bg-secondary/50 border-border hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg text-foreground">
                          {contract.event_title}
                        </h3>
                        {contract.dj_profile && (
                          <p className="text-sm text-muted-foreground mt-1">
                            DJ: {contract.dj_profile.dj_name}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{formatBookingEventDate(contract.event_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{contract.location}</span>
                        </div>
                        {contract.payment_amount && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Coins className="h-4 w-4" />
                            <span>
                              {contract.payment_currency === "GBP"
                                ? "£"
                                : contract.payment_currency === "USD"
                                  ? "$"
                                  : "€"}
                              {contract.payment_amount.toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-green-500 text-green-500"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {contract.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetails(contract.id)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

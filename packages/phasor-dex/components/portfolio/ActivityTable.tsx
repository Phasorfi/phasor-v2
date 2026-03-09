"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PortfolioTransaction } from "@/types";
import { ActivityRow, ActivityCard } from "./ActivityRow";

interface ActivityTableProps {
  transactions: PortfolioTransaction[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export function ActivityTable({
  transactions,
  isLoading,
  hasMore,
  onLoadMore,
}: ActivityTableProps) {
  if (isLoading && transactions.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading transactions...</div>
        </div>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">No transactions found</div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <Card className="hidden md:block overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">
                Time
              </th>
              <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">
                Type
              </th>
              <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">
                Amount
              </th>
              <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">
                Value
              </th>
              <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">
                Transaction
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(transaction => (
              <ActivityRow key={transaction.id} transaction={transaction} />
            ))}
          </tbody>
        </table>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden">
        {transactions.map(transaction => (
          <ActivityCard key={transaction.id} transaction={transaction} />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
            {isLoading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}

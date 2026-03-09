"use client";

import { Card } from "@/components/ui/card";
import { PortfolioToken } from "@/types";
import { TokenRow } from "./TokenRow";

interface TokensTableProps {
  tokens: PortfolioToken[];
  isLoading?: boolean;
}

export function TokensTable({ tokens, isLoading }: TokensTableProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading tokens...</div>
        </div>
      </Card>
    );
  }

  if (tokens.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">No tokens found</div>
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
                Token
              </th>
              <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">
                Price
              </th>
              <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">
                24h Change
              </th>
              <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">
                Balance
              </th>
              <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">
                Value
              </th>
              <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">
                Allocation
              </th>
            </tr>
          </thead>
          <tbody>
            {tokens.map(token => (
              <TokenRow key={token.token.address} token={token} />
            ))}
          </tbody>
        </table>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden">
        {tokens.map(token => (
          <TokenRow key={token.token.address} token={token} />
        ))}
      </div>
    </div>
  );
}

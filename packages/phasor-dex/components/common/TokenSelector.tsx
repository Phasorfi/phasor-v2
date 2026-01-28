"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { Search, AlertTriangle, Plus } from "lucide-react";
import { isAddress } from "viem";
import { Token } from "@/types";
import { DEFAULT_TOKENS, NATIVE_TOKEN } from "@/config";
import { useTokenListStore } from "@/lib/store";
import { useTokenBalances, useImportToken } from "@/hooks";
import { formatTokenAmount, cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface TokenSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  selectedToken?: Token | null;
  otherToken?: Token | null;
}

function TokenRow({
  token,
  onSelect,
  disabled,
  balance,
}: {
  token: Token;
  onSelect: (token: Token) => void;
  disabled: boolean;
  balance: bigint;
}) {
  return (
    <button
      onClick={() => onSelect(token)}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200",
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-surface-4 cursor-pointer"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-4 flex items-center justify-center overflow-hidden">
          {token.logoURI ? (
            <Image
              src={token.logoURI}
              alt={token.symbol}
              width={40}
              height={40}
              className="object-cover"
            />
          ) : (
            <span className="text-lg font-bold text-phasor-500">
              {token.symbol.charAt(0)}
            </span>
          )}
        </div>
        <div className="text-left">
          <p className="font-medium">{token.symbol}</p>
          <p className="text-sm text-muted-foreground">{token.name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium">
          {formatTokenAmount(balance, token.decimals, 4)}
        </p>
      </div>
    </button>
  );
}

function ImportTokenWarning({
  token,
  onImport,
  onCancel,
}: {
  token: Token;
  onImport: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="border border-yellow-500/20 bg-yellow-500/5 rounded-xl p-4 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <h4 className="font-semibold text-sm">Unknown Token</h4>
          <p className="text-sm text-muted-foreground">
            This token is not on the default token list. Anyone can create a token with any name, including fake versions of existing tokens.
          </p>
          <div className="bg-surface-3 rounded-lg p-3 space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Address:</span>
              <span className="text-foreground">{token.address.slice(0, 6)}...{token.address.slice(-4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span className="text-foreground">{token.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Symbol:</span>
              <span className="text-foreground">{token.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Decimals:</span>
              <span className="text-foreground">{token.decimals}</span>
            </div>
          </div>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
            ⚠️ Interact at your own risk
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={onImport}
          className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
        >
          <Plus className="h-4 w-4 mr-1" />
          Import Token
        </Button>
      </div>
    </div>
  );
}

export function TokenSelector({
  open,
  onClose,
  onSelect,
  selectedToken,
  otherToken,
}: TokenSelectorProps) {
  const [search, setSearch] = useState("");
  const [showImportWarning, setShowImportWarning] = useState(false);
  const { customTokens, addCustomToken } = useTokenListStore();

  // Combine default tokens with custom tokens
  const allTokens = useMemo(() => {
    return [NATIVE_TOKEN, ...DEFAULT_TOKENS, ...customTokens];
  }, [customTokens]);

  // Debug: log all tokens when component mounts or tokens change
  useEffect(() => {
    console.log('[TokenSelector] All tokens:', {
      count: allTokens.length,
      tokens: allTokens.map(t => ({ symbol: t.symbol, address: t.address })),
    });
  }, [allTokens]);

  // Filter tokens based on search
  const filteredTokens = useMemo(() => {
    if (!search) return allTokens;
    const searchLower = search.toLowerCase();
    const filtered = allTokens.filter(
      (token) =>
        token.symbol.toLowerCase().includes(searchLower) ||
        token.name.toLowerCase().includes(searchLower) ||
        token.address.toLowerCase() === searchLower
    );
    
    console.log('[TokenSelector] Filtered tokens:', {
      search: searchLower,
      count: filtered.length,
      tokens: filtered.map(t => ({ symbol: t.symbol, address: t.address })),
    });
    
    return filtered;
  }, [allTokens, search]);

  // Fetch all balances using multicall - only when modal is open
  const balances = useTokenBalances(filteredTokens, open);

  // Sort tokens by balance (non-zero first, then by amount descending)
  const sortedTokens = useMemo(() => {
    return [...filteredTokens].sort((a, b) => {
      const balanceA = balances.get(a.address) ?? BigInt(0);
      const balanceB = balances.get(b.address) ?? BigInt(0);

      // Both have zero balance - maintain order
      if (balanceA === BigInt(0) && balanceB === BigInt(0)) return 0;

      // Non-zero balances come first
      if (balanceA > BigInt(0) && balanceB === BigInt(0)) return -1;
      if (balanceA === BigInt(0) && balanceB > BigInt(0)) return 1;

      // Sort by amount descending
      if (balanceA > balanceB) return -1;
      if (balanceA < balanceB) return 1;
      return 0;
    });
  }, [filteredTokens, balances]);

  // Check if search input is a valid address not in the list
  const isValidAddressNotInList = useMemo(() => {
    if (!search) return false;
    if (!isAddress(search)) return false;

    const searchLower = search.toLowerCase();
    const exists = allTokens.some(
      (token) => token.address.toLowerCase() === searchLower
    );
    
    console.log('[TokenSelector] Address check:', {
      search: searchLower,
      isValid: true,
      existsInList: exists,
      shouldImport: !exists,
    });
    
    return !exists;
  }, [search, allTokens]);

  // Fetch token data from blockchain if it's an unknown address
  const { token: importedToken, isLoading: isImporting, error: importError } = useImportToken(
    isValidAddressNotInList ? search : ""
  );

  const handleSelect = (token: Token) => {
    onSelect(token);
    onClose();
    setSearch("");
    setShowImportWarning(false);
  };

  const handleImportToken = () => {
    if (!importedToken) return;

    // Add to custom tokens
    addCustomToken(importedToken);

    // Select the token
    handleSelect(importedToken);
  };

  const handleCancelImport = () => {
    setShowImportWarning(false);
    setSearch("");
  };

  // Show import warning when we have a valid imported token
  const shouldShowImportWarning = showImportWarning && importedToken && !importError;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        setSearch("");
        setShowImportWarning(false);
      }
      onClose();
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select a token</DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by name or paste address"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowImportWarning(false);
            }}
            className="pl-10"
          />
        </div>

        {/* Import Warning */}
        {shouldShowImportWarning ? (
          <ImportTokenWarning
            token={importedToken}
            onImport={handleImportToken}
            onCancel={handleCancelImport}
          />
        ) : (
          <>
            {/* Token List */}
            <div className="border-t border-surface-4 pt-4 max-h-[300px] overflow-y-auto space-y-1">
              {sortedTokens.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  {isImporting ? (
                    <>
                      <Skeleton className="h-12 w-12 rounded-full mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        Loading token data...
                      </p>
                    </>
                  ) : importError ? (
                    <>
                      <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
                      <p className="text-sm text-destructive">{importError}</p>
                    </>
                  ) : importedToken ? (
                    <>
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Token found onchain
                        </p>
                        <Button
                          onClick={() => setShowImportWarning(true)}
                          className="w-full"
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Import {importedToken.symbol}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No tokens found</p>
                  )}
                </div>
              ) : (
                sortedTokens.map((token) => {
                  const balance = balances.get(token.address) ?? BigInt(0);
                  return (
                    <TokenRow
                      key={token.address}
                      token={token}
                      onSelect={handleSelect}
                      disabled={selectedToken?.address === token.address}
                      balance={balance}
                    />
                  );
                })
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

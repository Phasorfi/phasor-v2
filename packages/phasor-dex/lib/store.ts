import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Token, TransactionSettings } from "@/types";
import { DEX_SETTINGS } from "@/config";

// ============================================
// SETTINGS STORE
// ============================================

interface SettingsState {
  slippageTolerance: number;
  deadline: number;
  setSlippageTolerance: (value: number) => void;
  setDeadline: (value: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      slippageTolerance: DEX_SETTINGS.DEFAULT_SLIPPAGE,
      deadline: DEX_SETTINGS.DEFAULT_DEADLINE,
      setSlippageTolerance: (value) => set({ slippageTolerance: value }),
      setDeadline: (value) => set({ deadline: value }),
    }),
    {
      name: "phasor-settings",
    }
  )
);

// ============================================
// TOKEN LIST STORE
// ============================================

interface TokenListState {
  customTokens: Token[];
  addCustomToken: (token: Token) => void;
  removeCustomToken: (address: string) => void;
}

export const useTokenListStore = create<TokenListState>()(
  persist(
    (set) => ({
      customTokens: [],
      addCustomToken: (token) =>
        set((state) => ({
          customTokens: [...state.customTokens, token],
        })),
      removeCustomToken: (address) =>
        set((state) => ({
          customTokens: state.customTokens.filter(
            (t) => t.address.toLowerCase() !== address.toLowerCase()
          ),
        })),
    }),
    {
      name: "phasor-tokens",
    }
  )
);

// ============================================
// RECENT TRANSACTIONS STORE
// ============================================

export interface Transaction {
  hash: string;
  type: "swap" | "add_liquidity" | "remove_liquidity" | "approve";
  summary: string;
  timestamp: number;
  status: "pending" | "confirmed" | "failed";
}

interface TransactionState {
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, "timestamp" | "status">) => void;
  updateTransaction: (hash: string, status: Transaction["status"]) => void;
  clearTransactions: () => void;
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set) => ({
      transactions: [],
      addTransaction: (tx) =>
        set((state) => ({
          transactions: [
            {
              ...tx,
              timestamp: Date.now(),
              status: "pending" as const,
            },
            ...state.transactions.slice(0, 49), // Keep last 50
          ],
        })),
      updateTransaction: (hash, status) =>
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.hash === hash ? { ...tx, status } : tx
          ),
        })),
      clearTransactions: () => set({ transactions: [] }),
    }),
    {
      name: "phasor-transactions",
    }
  )
);

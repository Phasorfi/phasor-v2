// MISO Auction ABI (shared interface for Crowdsale, DutchAuction, BatchAuction, HyperbolicAuction)
// Source: packages/miso-fork/contracts/auctions/

export const MISO_AUCTION_ABI = [
  // Base information
  {
    inputs: [],
    name: "getBaseInformation",
    outputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "tokenSupply", type: "uint256" },
      { internalType: "uint256", name: "startTime", type: "uint256" },
      { internalType: "uint256", name: "endTime", type: "uint256" },
      { internalType: "bool", name: "finalized", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalTokens",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // Token / payment
  {
    inputs: [],
    name: "auctionToken",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "paymentCurrency",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "wallet",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },

  // Status
  {
    inputs: [],
    name: "auctionSuccessful",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "auctionEnded",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "finalized",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "tokenPrice",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // Market status (commitments total)
  {
    inputs: [],
    name: "commitmentsTotal",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // Crowdsale-specific
  {
    inputs: [],
    name: "goal",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "rate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // ve-gating
  {
    inputs: [],
    name: "votingEscrow",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "minVeBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // Per-user views
  {
    inputs: [{ internalType: "address", name: "_user", type: "address" }],
    name: "commitments",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_user", type: "address" }],
    name: "claimed",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_user", type: "address" }],
    name: "tokensClaimable",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // Write functions
  {
    inputs: [
      { internalType: "address", name: "_beneficiary", type: "address" },
      { internalType: "bool", name: "_revertOnFailure", type: "bool" },
    ],
    name: "commitEth",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_amount", type: "uint256" },
      { internalType: "bool", name: "_revertOnFailure", type: "bool" },
    ],
    name: "commitTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_beneficiary", type: "address" }],
    name: "withdrawTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "finalize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "cancelAuction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "addr", type: "address" },
      { indexed: false, internalType: "uint256", name: "commitment", type: "uint256" },
    ],
    name: "AddedCommitment",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [],
    name: "AuctionFinalized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [],
    name: "AuctionCancelled",
    type: "event",
  },
] as const;

// Backward-compatible alias
export const FAIR_LAUNCH_ABI = MISO_AUCTION_ABI;

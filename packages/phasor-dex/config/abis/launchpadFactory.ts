// MISOMarket ABI (MISO fork - auction factory)
// Source: packages/miso-fork/contracts/MISOMarket.sol

export const MISO_MARKET_ABI = [
  // View functions
  {
    inputs: [],
    name: "getMarkets",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "numberOfAuctions",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_auction", type: "address" }],
    name: "getMarketTemplateId",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_templateId", type: "uint256" }],
    name: "getAuctionTemplate",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "auctionTemplateId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "owner", type: "address" },
      { indexed: true, internalType: "address", name: "addr", type: "address" },
      { indexed: true, internalType: "address", name: "marketTemplate", type: "address" },
    ],
    name: "MarketCreated",
    type: "event",
  },
] as const;

// Backward-compatible alias
export const LAUNCHPAD_FACTORY_ABI = MISO_MARKET_ABI;

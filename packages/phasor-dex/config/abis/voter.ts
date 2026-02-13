// Voter ABI - Gauge voting and emissions distribution
// Source: packages/velodrome-fork/contracts/Voter.sol

export const VOTER_ABI = [
  // Pool registry
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "pools",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "length",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalWeight",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // Gauge mappings
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "gauges",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "poolForGauge",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "isGauge",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "isAlive",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },

  // Weights
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "weights",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // Per-NFT voting state
  {
    inputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "address", name: "", type: "address" },
    ],
    name: "votes",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "usedWeights",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "lastVoted",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // Reward contract mappings
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "gaugeToFees",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "gaugeToIncentive",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },

  // Epoch timing
  {
    inputs: [{ internalType: "uint256", name: "_timestamp", type: "uint256" }],
    name: "epochStart",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_timestamp", type: "uint256" }],
    name: "epochNext",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_timestamp", type: "uint256" }],
    name: "epochVoteStart",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_timestamp", type: "uint256" }],
    name: "epochVoteEnd",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },

  // Whitelisting
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "isWhitelistedToken",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "isWhitelistedNFT",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },

  // Claimable (per gauge)
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "claimable",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // Write functions - Voting
  {
    inputs: [
      { internalType: "uint256", name: "_tokenId", type: "uint256" },
      { internalType: "address[]", name: "_poolVote", type: "address[]" },
      { internalType: "uint256[]", name: "_weights", type: "uint256[]" },
    ],
    name: "vote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_tokenId", type: "uint256" }],
    name: "reset",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_tokenId", type: "uint256" }],
    name: "poke",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // Write functions - Claiming
  {
    inputs: [{ internalType: "address[]", name: "_gauges", type: "address[]" }],
    name: "claimRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address[]", name: "_fees", type: "address[]" },
      { internalType: "address[][]", name: "_tokens", type: "address[][]" },
      { internalType: "uint256", name: "_tokenId", type: "uint256" },
    ],
    name: "claimFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address[]", name: "_incentives", type: "address[]" },
      { internalType: "address[][]", name: "_tokens", type: "address[][]" },
      { internalType: "uint256", name: "_tokenId", type: "uint256" },
    ],
    name: "claimIncentives",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "_voter", type: "address" },
      { indexed: true, internalType: "address", name: "_pool", type: "address" },
      { indexed: true, internalType: "uint256", name: "_tokenId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "_weight", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "_totalWeight", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "_timestamp", type: "uint256" },
    ],
    name: "Voted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "_voter", type: "address" },
      { indexed: true, internalType: "address", name: "_pool", type: "address" },
      { indexed: true, internalType: "uint256", name: "_tokenId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "_weight", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "_totalWeight", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "_timestamp", type: "uint256" },
    ],
    name: "Abstained",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "_sender", type: "address" },
      { indexed: true, internalType: "address", name: "_gauge", type: "address" },
      { indexed: false, internalType: "uint256", name: "_amount", type: "uint256" },
    ],
    name: "DistributeReward",
    type: "event",
  },
] as const;

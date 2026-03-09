// RewardsDistributor ABI - Rebase rewards for veNFT holders
// Source: packages/velodrome-fork/contracts/RewardsDistributor.sol

export const REWARDS_DISTRIBUTOR_ABI = [
  // View functions
  {
    inputs: [{ internalType: "uint256", name: "_tokenId", type: "uint256" }],
    name: "claimable",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "ve",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "lastTokenTime",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "startTime",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "tokenLastBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // Write functions
  {
    inputs: [{ internalType: "uint256", name: "_tokenId", type: "uint256" }],
    name: "claim",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256[]", name: "_tokenIds", type: "uint256[]" }],
    name: "claimMany",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },

  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "_tokenId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "epochStart", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "weekCursor", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "Claimed",
    type: "event",
  },
] as const;

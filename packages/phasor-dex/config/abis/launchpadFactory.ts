// LaunchpadFactory ABI
// Source: packages/phasor-contracts/contracts/launchpad/LaunchpadFactory.sol

export const LAUNCHPAD_FACTORY_ABI = [
  // Immutable state
  {
    inputs: [],
    name: "uniswapFactory",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "uniswapRouter",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "weth",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },

  // Config
  {
    inputs: [],
    name: "fairLaunchTemplate",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "platformFeeRecipient",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "platformFeeBps",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "defaultLiquidityBps",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // View functions
  {
    inputs: [],
    name: "getAllLaunches",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "creator", type: "address" }],
    name: "getLaunchesByCreator",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "launchCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "index", type: "uint256" }],
    name: "getLaunchAt",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "launch", type: "address" }],
    name: "isLaunch",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "allLaunches",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },

  // Write functions
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "saleToken", type: "address" },
          { internalType: "address", name: "paymentToken", type: "address" },
          { internalType: "uint256", name: "totalTokens", type: "uint256" },
          { internalType: "uint256", name: "tokensForLiquidity", type: "uint256" },
          { internalType: "uint256", name: "startTime", type: "uint256" },
          { internalType: "uint256", name: "endTime", type: "uint256" },
          { internalType: "uint256", name: "softCap", type: "uint256" },
          { internalType: "uint256", name: "hardCap", type: "uint256" },
          { internalType: "uint256", name: "vestingDuration", type: "uint256" },
          { internalType: "uint256", name: "vestingCliff", type: "uint256" },
          { internalType: "uint256", name: "liquidityBps", type: "uint256" },
        ],
        internalType: "struct LaunchpadFactory.CreateLaunchParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "createFairLaunch",
    outputs: [{ internalType: "address", name: "launch", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },

  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "launch", type: "address" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: true, internalType: "address", name: "saleToken", type: "address" },
      { indexed: false, internalType: "address", name: "paymentToken", type: "address" },
      { indexed: false, internalType: "uint256", name: "totalTokens", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "startTime", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "endTime", type: "uint256" },
    ],
    name: "LaunchCreated",
    type: "event",
  },
] as const;

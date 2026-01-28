import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts/index'

// Monad Testnet - Factory address
export const FACTORY_ADDRESS = '0xa513e6e4b8f2a923d98304ec87f64353c4d5c853'

// WMON (Wrapped MON) - Reference token for pricing
export const REFERENCE_TOKEN = '0x0165878a594ca255338adfa4d48449f69242eb8f'

// Stable token pairs for USD pricing (WMON-USDC, WMON-USDT)
// These pairs are used to calculate Bundle.ethPrice for USD pricing
export const STABLE_TOKEN_PAIRS: string[] = [
  '0x9056ecce1a1c2cfcbbce122aee988a47a2690cbc', // WMON-USDC
  '0x1c002e94d86f30dd138d08692040c461cdbd2c7a', // WMON-USDT
]

// Token whitelist - from tokenlist.json
// Tokens that should contribute to tracked volume and liquidity
export const WHITELIST: string[] = [
  '0x0165878a594ca255338adfa4d48449f69242eb8f', // WMON - Wrapped Monad
  '0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0', // USDC
  '0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9', // USDT
  '0xdc64a140aa3e981100a9beca4e685f962f0cf6c9', // WBTC
  '0x5fc8d32690cc91d4c39d9d3abcbd16989f875707', // WETH
  '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512', // SOL
  '0x5fbdb2315678afecb367f032d93f642f64180aa3', // FOLKS
]

// Stablecoins for USD pricing
export const STABLECOINS = [
  '0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0', // USDC
  '0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9', // USDT
]

// minimum liquidity required to count towards tracked volume for pairs with small # of Lps
export const MINIMUM_USD_THRESHOLD_NEW_PAIRS = BigDecimal.fromString('10000')

// minimum liquidity for price to get tracked
export const MINIMUM_LIQUIDITY_THRESHOLD_ETH = BigDecimal.fromString('100000')

export class TokenDefinition {
  address: Address
  symbol: string
  name: string
  decimals: BigInt
}

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = [
  {
    address: Address.fromString('0x0165878a594ca255338adfa4d48449f69242eb8f'),
    symbol: 'WMON',
    name: 'Wrapped Monad',
    decimals: BigInt.fromI32(18),
  },
]

export const SKIP_TOTAL_SUPPLY: string[] = []

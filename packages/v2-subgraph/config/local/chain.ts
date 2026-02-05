import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts/index'

// Monad Testnet - Factory address
export const FACTORY_ADDRESS = '0xa85233c63b9ee964add6f2cffe00fd84eb32338f'

// WMON (Wrapped MON) - Reference token for pricing
export const REFERENCE_TOKEN = '0x59b670e9fa9d0a427751af201d676719a970857b'

// Stable token pairs for USD pricing (WMON-USDC, WMON-USDT)
// These pairs are used to calculate Bundle.ethPrice for USD pricing
export const STABLE_TOKEN_PAIRS: string[] = [
  '0xa09c47571c1a04fedd30b13fd5db9aa021c4c2fe', // WMON-USDC
  '0xf1aaa954fa6ff61bab8b9d0ea6bc0b2d130a873d', // WMON-USDT
]

// Token whitelist - from tokenlist.json
// Tokens that should contribute to tracked volume and liquidity
export const WHITELIST: string[] = [
  '0x59b670e9fa9d0a427751af201d676719a970857b', // WMON - Wrapped Monad
  '0x9a9f2ccfde556a7e9ff0848998aa4a0cfd8863ae', // USDC
  '0x68b1d87f95878fe05b998f19b66f4baba5de1aed', // USDT
  '0x3aa5ebb10dc797cac828524e59a333d0a371443c', // WBTC
  '0xc6e7df5e7b4f2a278906862b61205850344d4e7d', // WETH
  '0x0b306bf915c4d645ff596e518faf3f9669b97016', // SOL
  '0x0165878a594ca255338adfa4d48449f69242eb8f', // FOLKS
]

// Stablecoins for USD pricing
export const STABLECOINS = [
  '0x9a9f2ccfde556a7e9ff0848998aa4a0cfd8863ae', // USDC
  '0x68b1d87f95878fe05b998f19b66f4baba5de1aed', // USDT
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
    address: Address.fromString('0x59b670e9fa9d0a427751af201d676719a970857b'),
    symbol: 'WMON',
    name: 'Wrapped Monad',
    decimals: BigInt.fromI32(18),
  },
]

export const SKIP_TOTAL_SUPPLY: string[] = []

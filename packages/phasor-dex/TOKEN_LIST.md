# Token List Guide

Phasor DEX uses the [Token Lists](https://tokenlists.org/) standard for managing supported tokens. This makes it easy to add, update, or remove tokens without changing any code.

## Token List Location

The token list is located at:
```
packages/phasor-dex/public/tokenlist.json
```

## Adding a New Token

To add a new token to your DEX, simply add a new entry to the `tokens` array in `tokenlist.json`:

```json
{
  "chainId": 10143,
  "address": "0x1234567890abcdef1234567890abcdef12345678",
  "name": "My Token",
  "symbol": "MTK",
  "decimals": 18,
  "logoURI": "/tokens/mtk.svg",
  "tags": ["custom"]
}
```

### Required Fields

- **chainId**: The chain ID where the token is deployed (10143 for Monad testnet)
- **address**: The token's contract address (must be a valid Ethereum address)
- **name**: Full name of the token
- **symbol**: Token ticker symbol (usually 3-5 characters)
- **decimals**: Number of decimals (usually 18 for ERC20 tokens)

### Optional Fields

- **logoURI**: Path to the token's logo image (relative to `/public/` or absolute URL)
- **tags**: Array of tag identifiers (e.g., `["stablecoin"]`, `["wrapped"]`, `["test"]`)

## Token Tags

Tags help categorize tokens. You can define custom tags in the `tags` section:

```json
{
  "tags": {
    "myCustomTag": {
      "name": "My Custom Tag",
      "description": "Description of what this tag means"
    }
  }
}
```

Available tags in the default list:
- `stablecoin` - Tokens pegged to a stable asset
- `wrapped` - Wrapped native tokens
- `test` - Test tokens for development

## Example: Adding USDT

```json
{
  "chainId": 10143,
  "address": "0x5c74c94173F05dA1720953407cbb920F3DF9f887",
  "name": "Tether USD",
  "symbol": "USDT",
  "decimals": 6,
  "logoURI": "/tokens/usdt.svg",
  "tags": ["stablecoin"]
}
```

## Token List Schema

The complete token list follows this structure:

```json
{
  "name": "List Name",
  "timestamp": "2025-12-24T00:00:00.000Z",
  "version": {
    "major": 1,
    "minor": 0,
    "patch": 0
  },
  "tags": {
    "tagName": {
      "name": "Tag Display Name",
      "description": "Tag description"
    }
  },
  "logoURI": "https://example.com/logo.png",
  "keywords": ["keyword1", "keyword2"],
  "tokens": [
    // Token entries here
  ]
}
```

## Automatic Updates

When you run `./deploy.sh`, the script automatically updates:
- TKN1 address
- TKN2 address
- Timestamp

Other tokens remain unchanged unless you manually edit them.

## Multi-Chain Support

The token list supports multiple chains. Tokens are filtered by chain ID automatically based on the connected network.

To add a token for a different chain, just change the `chainId`:

```json
{
  "chainId": 1,  // Ethereum mainnet
  "address": "0x...",
  "name": "My Token on Mainnet",
  "symbol": "MTK",
  "decimals": 18
}
```

## Adding Token Logos

1. Add your token logo to `packages/phasor-dex/public/tokens/`
2. Use the format: `symbol.svg` (e.g., `usdc.svg`, `usdt.svg`)
3. Reference it in the token list: `"logoURI": "/tokens/symbol.svg"`

Supported formats: SVG (recommended), PNG, JPG

## Best Practices

1. **Verify Addresses**: Always double-check token contract addresses before adding them
2. **Use Lowercase**: Token addresses should be in checksum format or lowercase
3. **Test First**: Add test tokens to verify they work before adding production tokens
4. **Version Updates**: Increment the version number when making changes:
   - `patch`: Bug fixes or minor corrections
   - `minor`: Adding new tokens
   - `major`: Breaking changes to the list structure

## Validation

The frontend automatically validates tokens:
- Filters by current chain ID
- Converts addresses to proper format
- Handles missing optional fields

## Token List Standard

For more information about the token list standard, see:
- https://tokenlists.org/
- https://uniswap.org/blog/token-lists

## Programmatic Access

The token list is loaded in `packages/phasor-dex/config/chains.ts`:

```typescript
import tokenList from "@/public/tokenlist.json";

export const DEFAULT_TOKENS = tokenList.tokens
  .filter((token) => token.chainId === monad.id)
  .map((token) => ({
    address: token.address as Address,
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    logoURI: token.logoURI,
    tags: token.tags,
  }));
```

## Troubleshooting

### Token Not Showing Up

1. Check the `chainId` matches your current network
2. Verify the address is valid
3. Restart the dev server to reload the JSON file
4. Check browser console for errors

### Logo Not Displaying

1. Ensure the logo file exists in `/public/tokens/`
2. Check the `logoURI` path is correct
3. Verify the file format is supported (SVG, PNG, JPG)
4. Try using an absolute URL instead of a relative path

### Invalid Address Error

Make sure the address:
- Starts with `0x`
- Is exactly 42 characters long
- Contains only valid hex characters (0-9, a-f, A-F)

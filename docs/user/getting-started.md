# Getting Started

This guide will help you set up your wallet and connect to Phasor DEX on Monad.

## Prerequisites

Before you begin, you'll need:

- A Web3 wallet (MetaMask recommended)
- MON tokens for gas fees
- Tokens to swap or provide as liquidity

## Step 1: Install a Web3 Wallet

We recommend **MetaMask**, the most widely used Ethereum wallet that works seamlessly with Monad.

1. Visit [metamask.io](https://metamask.io)
2. Download the browser extension for Chrome, Firefox, or Brave
3. Follow the setup wizard to create a new wallet
4. **Important:** Securely store your seed phrase offline

## Step 2: Add Monad Network

Phasor DEX runs on the Monad blockchain. You'll need to add this network to your wallet.

### Automatic Setup
When you visit Phasor DEX and connect your wallet, you may be prompted to add the Monad network automatically. Simply approve the request.

### Manual Setup
If automatic setup doesn't work, add Monad manually:

1. Open MetaMask and click the network dropdown
2. Select "Add Network" → "Add a network manually"
3. Enter the following details:

| Field | Value |
|-------|-------|
| Network Name | Monad Testnet |
| RPC URL | `https://testnet-rpc.monad.xyz` |
| Chain ID | `10143` |
| Currency Symbol | `MON` |
| Block Explorer | `https://testnet.monadexplorer.com` |

<!-- TODO: Update RPC URL and explorer once mainnet is live -->

4. Click "Save" to add the network

## Step 3: Get MON Tokens

You'll need MON tokens to pay for transaction fees (gas) on Monad.

### Testnet Faucet
For testnet, you can get free MON from the faucet:

1. Visit the Monad Testnet Faucet
2. Enter your wallet address
3. Complete any verification steps
4. Receive testnet MON

<!-- TODO: Add faucet link once available -->

### Bridging Assets
To bring assets from other chains:

<!-- TODO: Document bridge options once available -->

## Step 4: Connect to Phasor DEX

1. Visit [Phasor DEX](https://app.phasor.xyz) <!-- TODO: Update URL -->
2. Click "Connect Wallet" in the top right corner
3. Select MetaMask (or your preferred wallet)
4. Approve the connection request in your wallet
5. Ensure you're connected to Monad network

Once connected, you'll see your wallet address displayed and your MON balance.

## Step 5: Get Tokens to Trade

To start trading on Phasor DEX, you'll need tokens. Here are your options:

### Wrap MON to WMON
WMON (Wrapped MON) is the ERC-20 version of the native MON token, required for certain operations:

1. Go to the Swap page
2. Select MON as the input token
3. Select WMON as the output token
4. Enter the amount and confirm

### Trade for Other Tokens
With MON or WMON, you can swap for any available token:
- USDC — USD stablecoin
- USDT — Tether stablecoin
- WETH — Wrapped Ethereum
- WBTC — Wrapped Bitcoin
- And more...

## Understanding Transaction Confirmations

When you perform actions on Phasor DEX, you'll need to:

1. **Approve tokens** (one-time per token) — Allows the DEX to access your tokens
2. **Confirm the transaction** — Execute the actual swap or liquidity operation
3. **Wait for confirmation** — Usually just a few seconds on Monad

Your wallet will prompt you for each step. Review the details carefully before confirming.

## Safety Tips

- **Verify URLs** — Always ensure you're on the official Phasor DEX website
- **Check token addresses** — Verify tokens using the official token list
- **Start small** — Test with small amounts first when using new features
- **Understand slippage** — Set appropriate slippage tolerance for your trades
- **Secure your wallet** — Never share your seed phrase or private keys

## What's Next?

Now that you're set up, explore Phasor DEX:

- **[Make your first swap](swap.md)** — Learn how to exchange tokens
- **[Explore liquidity pools](pools.md)** — See available trading pairs
- **[Provide liquidity](liquidity.md)** — Start earning trading fees
- **[Track your portfolio](portfolio.md)** — Monitor your positions

---

## Troubleshooting

### Wallet Won't Connect
- Ensure MetaMask is unlocked
- Try refreshing the page
- Check that you're on the correct network

### Transaction Stuck or Failed
- Check that you have enough MON for gas
- Try increasing gas price in your wallet
- Wait and retry if the network is congested

### Wrong Network
- Open MetaMask and switch to Monad network
- The site should prompt you to switch automatically

### Token Not Showing
- Check that you've added the token to your wallet
- Verify the correct token address from our token list
- Refresh your wallet balance

Need more help? Join our Discord community for support.

<!-- TODO: Add Discord link -->

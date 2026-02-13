# Contracts & Security

## Deployed Contracts

Phasor DEX is currently deployed on **Monad Testnet** (chain ID 10143). Contract addresses will be updated for mainnet.

| Contract | Description | Address |
|----------|-------------|---------|
| PHASOR | Native governance token | 0x5772BDEF68FfD33E67cA82637D2afF03661f9b11 |
| PoolFactory | Creates volatile and stable trading pools | 0x103e714f52bebF7f95A8d79abc5838d5b23d6f8b |
| Router | Handles swaps and liquidity operations | 0x7de75500c99C13Da96AFf36554cE7316853715b0 |
| VotingEscrow | vePHASOR lock contract (veNFT) | 0xdba565f8050e50f0D4B552DCc6F3F753561b0EB0 |
| Voter | Gauge voting and emission distribution | 0x697d6463E6dffD0e08C4e1A51e7E4f1e977B8112 |
| Minter | PHASOR emissions controller | 0x3E20d5855c54484D4071A535AB8241937BCA70e9 |
| RewardsDistributor | Rebase distribution to vePHASOR holders | 0x37E6681Cdf4070a349Af23a7a89E760d07f50fFF |
| VelodromeLauncher | Token sale launchpad | 0x9eBEaa7B2E35c8a15874578522c36B779E46cBB8 |

## Code Heritage & Audits

Phasor is built on **Velodrome V2**, one of the most battle-tested and widely-used DEX protocols in DeFi. The Velodrome V2 codebase has been extensively audited and deployed across multiple chains.

### Phasor-Specific Additions

The following features are custom Phasor code built on top of the Velodrome V2 base:

| Feature | Description |
|---------|-------------|
| **Gauge Time Multiplier** | 1x to 3x reward multiplier over 90 days of continuous staking |
| **VelodromeLauncher** | Token sale launchpad with ve-gated participation and automatic LP creation |
| **Token Branding** | PHASOR token (renamed from VELO) |

## Open Source

All Phasor smart contracts are open source and verified on the block explorer.

<!-- TODO: Add GitHub link and block explorer links -->

## Security Best Practices

When interacting with Phasor DEX or any DeFi protocol:

- **Verify the URL** — Always confirm you're on the official Phasor DEX website before connecting your wallet
- **Check contract addresses** — Before approving or interacting with a contract, verify the address matches this page
- **Start small** — Test with small amounts when using new features for the first time
- **Protect your keys** — Never share your seed phrase or private keys with anyone. Phasor will never ask for them.
- **Review approvals** — Periodically check and revoke unnecessary token approvals
- **Use the official token list** — Be cautious of tokens not on the Phasor token list. Scam tokens can appear in any permissionless DEX.

---

**Next:** [Glossary](glossary.md) | [FAQ](faq.md)

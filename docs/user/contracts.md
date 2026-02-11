# Contracts & Security

## Deployed Contracts

Phasor DEX is currently deployed on **Monad Testnet** (chain ID 10143). Contract addresses will be updated for mainnet.

| Contract | Description | Address |
|----------|-------------|---------|
| PHASOR | Native governance token | *TBD* |
| PoolFactory | Creates volatile and stable trading pools | *TBD* |
| Router | Handles swaps and liquidity operations | *TBD* |
| VotingEscrow | vePHASOR lock contract (veNFT) | *TBD* |
| Voter | Gauge voting and emission distribution | *TBD* |
| Minter | PHASOR emissions controller | *TBD* |
| RewardsDistributor | Rebase distribution to vePHASOR holders | *TBD* |
| VelodromeLauncher | Token sale launchpad | *TBD* |

<!-- TODO: Fill with actual deployed addresses -->

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

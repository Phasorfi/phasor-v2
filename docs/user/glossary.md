# Glossary

| Term | Definition |
|------|-----------|
| **AMM** | Automated Market Maker — a smart contract that holds token reserves and enables trading without order books. |
| **APR** | Annual Percentage Rate — estimated yearly return from staking rewards and/or trading fees. |
| **Base Token** | The token used for payment in a launchpad sale (e.g., USDC, WMON). |
| **Epoch** | A 1-week period in the Phasor protocol. Emissions are distributed and votes are tallied at the start of each epoch (Thursday 00:00 UTC). |
| **Gauge** | A smart contract where LP tokens are staked to earn PHASOR emission rewards. Each pool has its own gauge. |
| **Hard Cap** | The maximum amount a launchpad sale can raise. No more contributions are accepted after this is reached. |
| **Impermanent Loss** | The difference in value between holding tokens in your wallet vs providing them as liquidity in a pool. Occurs when token prices diverge. |
| **LP Token** | A token you receive when you add liquidity to a pool, representing your share of that pool's reserves. |
| **Liquidity Pool** | A smart contract holding reserves of two tokens that enables trading between them. |
| **MON** | The native token of the Monad blockchain, used for gas fees. |
| **PHASOR** | The native governance and rewards token of Phasor DEX. Can be locked to create vePHASOR. |
| **Rebase** | Additional PHASOR distributed to vePHASOR holders each epoch to protect against dilution from emissions. |
| **Slippage** | The difference between the expected price and the actual execution price of a trade. |
| **Soft Cap** | The minimum amount a launchpad sale must raise to succeed. If not reached, all contributions are refunded. |
| **Stable Pool** | A pool type optimized for tokens that should trade near 1:1 (e.g., USDC/USDT). Uses a StableSwap curve with a 0.05% fee. |
| **Time Multiplier** | A Phasor-exclusive feature where staking rewards increase from 1x to 3x over 90 days of continuous staking in a gauge. Resets on withdrawal. |
| **TVL** | Total Value Locked — the combined USD value of all tokens deposited in a pool or across the protocol. |
| **ve(3,3)** | Vote-escrow tokenomics model combining Curve's veToken locking with (3,3) game theory — everyone benefits when participants lock rather than sell. |
| **Ve-gating** | A requirement to hold a vePHASOR NFT in order to participate in certain protocol features, such as launchpad sales. |
| **veNFT** | An ERC-721 NFT representing your locked PHASOR tokens and the voting power they carry. |
| **vePHASOR** | Vote-escrowed PHASOR — the voting power obtained by locking PHASOR tokens in the Voting Escrow contract. |
| **Volatile Pool** | A standard AMM pool using the x × y = k constant product formula. Charges a 0.30% trading fee. |
| **Voting Escrow** | The smart contract where PHASOR is locked to create vePHASOR and receive a veNFT. |
| **WMON** | Wrapped MON — the ERC-20 version of native MON. Required for smart contract interactions since native tokens can't be used directly in AMM pools. |

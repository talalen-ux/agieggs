# AGI.Pets contracts

Three contracts, compiled with Solidity 0.8.24 and OpenZeppelin 5.0.2.

| Contract | What it does |
|---|---|
| `AGIToken` | Fixed 100,000,000 AGI ERC-20 (no mint function). 2.5% tax only on DEX pair trades, sent to the treasury. Notifies the egg contract when AGI is sent to it. |
| `AGIEgg` | The egg, as an ERC-721 NFT. Capped supply (5,000). Mint by choosing a design and paying in AGI or ETH, **or** send AGI/ETH straight to the contract from any wallet to get an egg without connecting to the site. Hatching stays closed ("coming soon") until the owner opens it. |
| `ComputeTreasury` | Receives the tax and egg proceeds. Converts AGI into compute credits (10 per AGI). Pays GPU providers against EIP-712 receipts signed by the orchestrator. |

See [AUDIT.md](./AUDIT.md) for the security review.

## Getting an egg without connecting

1. Send at least one egg's price in AGI or ETH to the `AGIEgg` address.
2. The contract mints one egg per full price (up to 10 per send) to the
   sending address and refunds the remainder in the same transaction.
3. If the amount is below the price, eggs are sold out, or the sender
   cannot hold NFTs, the transfer reverts and nothing is taken.

Direct sends get a random design. Send from a wallet you control, not
from an exchange.

## Commands

```bash
cd contracts
npm install
npm run build   # compile (uses the bundled solc-js, no download needed)
npm test        # 36 tests incl. randomized property tests
```

Static analysis:

```bash
pip install slither-analyzer
npx hardhat compile --force
slither . --hardhat-ignore-compile --filter-paths "node_modules|src/test" --exclude-dependencies
```

## Deploying

Local dry run (deploys, wires, and does one direct AGI send and one ETH send):

```bash
npx hardhat run scripts/deploy.js
```

Real network:

```bash
RPC_URL=https://... DEPLOYER_KEY=0x... ORCHESTRATOR=0x... \
AGI_HOLDER=0x... PRICE_AGI=500 PRICE_ETH=0.01 MIN_HOLD=500 \
npx hardhat run scripts/deploy.js --network target
```

The addresses are written to `deployments/target.json`. Then set on the
site (Vercel environment variables):

```
NEXT_PUBLIC_EGG_CONTRACT=<AGIEgg address>
NEXT_PUBLIC_CHAIN_NAME=<e.g. Base>
NEXT_PUBLIC_EGG_PRICE_AGI=500
NEXT_PUBLIC_EGG_PRICE_ETH=0.01
```

Until `NEXT_PUBLIC_EGG_CONTRACT` is set, the site says the address is
published at launch and shows no address.

Egg images: on-chain metadata points to
`https://agieggs.vercel.app/api/egg-image/<design>`, where `<design>` is the
egg's position in `lib/eggs.ts`. New designs must be appended to the end of
that list, then `setDesignCount` raised on-chain.

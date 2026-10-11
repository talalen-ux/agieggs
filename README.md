# AGI.Pets

A living AI companion protocol: choose an egg, contribute AGI, hatch it, and
earn compute credits as your pet grows.

This repo holds the Next.js site and app, and the Solidity contracts
(`contracts/`).

## What's in here

```
app/                Next.js 14 App Router
  page.tsx          Landing page
  choose/           Discover: the egg collection with family filters
  eggs/             Chamber: egg details, buy/withdraw AGI, hatch,
                    convert credits, and "send directly" (no connection)
  evolve/ brain/    Evolution and intelligence panels
  chat/ arena/      Chat with your pet, social arena
  api/              App endpoints, plus /api/egg-image/<design> for NFT art
components/         Egg, Nav, HowItWorksMotion, DirectSend, ...
lib/                App state engine (simulated economy for the MVP)
  eggs.ts           Egg catalog; list position = on-chain design number
  economics.ts      Holding rule, earn rates, credit conversion
public/eggs/        Source sheets and single-egg images (single/)
scripts/            slice_eggs.py cuts sheets into clean single eggs
contracts/          AGIToken, AGIEgg (ERC-721), ComputeTreasury
                    with tests and a security review (AUDIT.md)
```

## The flow

| Step | What happens |
|---|---|
| Choose your egg | Browse the collection on Discover and open one in the Chamber. |
| Contribute AGI | Hold at least $25 of AGI to be eligible to hatch. |
| Hatch | The egg is an ERC-721 NFT. What hatches is coming soon. |
| Earn compute credits | Your pet earns AGI through chat, training and the arena; convert it to compute credits. |

Eggs can also be obtained without connecting to the site: send AGI or ETH
straight to the egg contract from any wallet. See `contracts/README.md`.

## Running the site

```bash
npm install
cp .env.example .env.local   # optional: ANTHROPIC_API_KEY for the pet's chat
npm run dev
```

Without an API key, the pet replies with a local fallback. The app's economy
is simulated server-side for the MVP; state is stored in `data/state.json`
(gitignored, delete it to reset).

## Contracts

```bash
cd contracts && npm install && npm test
```

36 tests pass, including randomized property tests. See
`contracts/README.md` for deployment and `contracts/AUDIT.md` for the
security review. Not yet deployed to a live network.

## Fixed numbers

- **100,000,000** AGI, minted once; no mint function exists.
- **5,000** eggs maximum (immutable in the contract).
- **2.5%** tax on DEX trades only, routed to the compute treasury (a constant).

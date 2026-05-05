# AGI.Pets

A living AI companion protocol where intelligence evolves alongside economic commitment.

> Buy AGI → Earn Eggs → Reach USD Threshold → Hatch → Train → Upgrade → Consume more AGI.

This repo is the MVP. It runs the entire core loop end-to-end as a Next.js
app, with Claude wired in as the pet brain and a set of Solidity sketches
showing the on-chain shape.

## What's in here

```
app/                Next.js 14 App Router
  page.tsx          Home — your pet lives here
  eggs/             Egg Chamber (buy/sell AGI, hatch)
  evolve/           Evolution screen (band check + train)
  brain/            Intelligence panel (traits, skills, memory)
  chat/             iMessage-style chat with your pet
  arena/            Social arena (spar with other pets)
  api/              State-mutating endpoints
components/         Pet3D, Nav, Stat, StateProvider
lib/                Game state engine
  economics.ts      Tax, egg accrual, band/degradation rules
  pet.ts            Mint, traits, evolution, training
  ai.ts             Claude SDK wrapper, system-prompt builder
  storage.ts        File-backed state for the MVP
contracts/          Solidity sketches (AGIToken, EggVault, PetNFT, …)
```

## Running it

```bash
npm install
cp .env.example .env.local        # add your ANTHROPIC_API_KEY
npm run dev
```

Then open <http://localhost:3000>.

The pet has a working brain even without a key — `lib/ai.ts` falls back to a
deterministic stub so the demo flow is uninterrupted. Add `ANTHROPIC_API_KEY`
to get the real personality-conditioned chat with prompt caching enabled.

State persists to `data/state.json` (gitignored). Delete that file to reset.

## The core loop, mechanically

| Step | Where | What happens |
|---|---|---|
| Buy AGI | `app/eggs` | 2.5% routes to compute treasury. Tiny price drift to discourage whale dumps. |
| Earn eggs | passive | While your USD-denominated holdings stay in-band, eggs accrue at 0.4 / $·day, capped 3/day, capped 5 pending per wallet. |
| Hatch | `app/eggs` | Burns 1 egg fragment, mints a pet with seeded traits + name. Hard-capped at 5,000 pets. |
| Train | `app/evolve` | Burns 10 AGI to the GPU pool. +XP, +intelligence. |
| Evolve | `app/evolve` | `canEvolve()` checks: USD ≥ stage band, XP ≥ stage requirement, not degraded. |
| Chat | `app/chat` | Claude turn with cached system prompt: stage, intelligence, 5-axis personality, last 8 memories, degraded flag. |
| Decay | automatic | If holdings drop below the *current* stage's band → degraded mode → can't train, throttled brain, memory still decays. |
| Spar | `app/arena` | Logistic XP roll based on intelligence delta. |

## Scarcity & anti-dump, in three numbers

- **100,000,000** AGI cap — fixed. No inflation.
- **5,000** pets, ever. Egg accrual stops once minted hits the cap.
- **In-band only** — eggs only accrue while you sit inside your committed
  USD band. Drop out and your pet degrades. You can always sell, but the
  protocol stops rewarding you the moment you stop committing.

## On-chain layer (sketches)

See `contracts/README.md` for the wiring diagram. The Next.js app simulates
the same invariants the contracts enforce, so you can swap the persistence
layer for an EVM RPC + viem and the rest of the app stays the same.

## Roadmap stubs

The MVP omits, on purpose, the stuff that needs production care:
- Actual on-chain deployment + Hardhat tests
- IPFS memory anchor pinning
- PinLink GPU integration in the treasury claim flow
- Multi-agent / DAO formation logic at the AGI stage
- WebGL pet renderer (current is CSS-only)

These are scoped, not handwaved. The interfaces in `lib/` and `contracts/`
already match the production shape.

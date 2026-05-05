# Contracts

Sketches of the on-chain layer for AGI.Pets. They compile against
OpenZeppelin v5 + Chainlink, but are illustrative — not audited, not deployed.

| Contract | Role |
|---|---|
| `AGIToken.sol` | Fixed-supply (100M) ERC-20. 2.5% buy/sell tax routed to the compute treasury. |
| `EggVault.sol` | Soulbound egg accrual gated by USD-denominated holdings (Chainlink price feed). Burns 1 egg per pet mint. |
| `PetNFT.sol` | ERC-721 with stage, traits, XP, intelligence score, and a memory hash pointer. Hard-capped at 5,000. |
| `EvolutionEngine.sol` | The "band" enforcer. `canEvolve()` validates USD holdings via oracle + XP requirement. |
| `ComputeTreasury.sol` | Receives the tax. Pays whitelisted GPU providers (PinLink etc.) against orchestrator-signed receipts. |
| `IntelligenceRegistry.sol` | On-chain permissions: skill bitmap, compute priority, degraded-mode throttle, memory anchor. |

## Wiring

```
                    ┌─────────────┐
        buy/sell →  │  AGIToken   │ ── tax ──▶ ComputeTreasury ── pays GPU providers
                    └─────────────┘
                          ▲
                          │ balanceOf()
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
   ┌────────────┐  consumeEgg()       ┌──────────────────┐
   │ EggVault   │ ◀────────────────── │     PetNFT       │
   │ (oracle)   │                     │  (stage/traits)  │
   └────────────┘                     └──────────────────┘
                                              ▲
                                              │ advanceStage()
                                              │
                                      ┌────────────────────┐
                                      │ EvolutionEngine    │── reads ▶ Chainlink
                                      └────────────────────┘
                                              │ setSkills() / throttle()
                                              ▼
                                      ┌────────────────────┐
                                      │ IntelligenceReg.   │ ◀── orchestrator reads
                                      └────────────────────┘
```

The orchestrator is the off-chain AI worker. Before serving any inference
for a pet it reads `IntelligenceRegistry.perms(petId)` to check skills,
priority, and degraded state. This is what the Next.js MVP simulates.

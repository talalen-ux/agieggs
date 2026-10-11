# AGI.Pets smart contracts: security review

**Scope:** `src/AGIToken.sol`, `src/AGIEgg.sol`, `src/ComputeTreasury.sol`
(test helpers in `src/test/` are out of scope).
**Compiler:** Solidity 0.8.24, optimizer on (200 runs), OpenZeppelin Contracts 5.0.2.
**Method:** line-by-line manual review, Slither 0.11.6 static analysis (102
detectors), and a Hardhat test suite of 36 tests, including randomized
property tests.

> This is an internal review written alongside the code, not an independent
> audit. Before mainnet with real funds, have a third-party firm audit
> these contracts (see *Before mainnet* below).

## Summary

| ID | Title | Severity | Status |
|---|---|---|---|
| M-01 | Owner could tax any wallet by flagging it as a DEX pair | Medium | Fixed (`lockPairs`) |
| M-02 | Direct sends from exchange accounts mint the egg to the exchange | Medium | Acknowledged, warned in UI |
| L-01 | Image URI could break the JSON metadata | Low | Fixed |
| L-02 | Credits written after an external call | Low | Fixed |
| L-03 | Price change between signing and execution | Low | Mitigated by design |
| L-04 | Hatch holding check can be met with a flash loan | Low | Acknowledged |
| I-01 | Random design uses block data | Info | Acknowledged |
| I-02 | Owner privileges (centralization) | Info | Recommendations below |
| I-03 | Renouncing ownership while paused freezes minting | Info | Acknowledged |
| I-04 | Old treasury stays tax-exempt after `setTreasury` | Info | Acknowledged |

No critical or high-severity issues were found in the current code. Slither
reports 6 informational results, all covered below (I-01, the payout deadline
using `block.timestamp`, and loops bounded at 10 iterations).

### Previous sketches

The earlier files (`EggVault`, `PetNFT`, `EvolutionEngine`,
`IntelligenceRegistry`, and earlier versions of `AGIToken` and
`ComputeTreasury`) were design sketches that had never been compiled or
tested. They have been replaced. Notable defects they had:

- **ComputeTreasury** verified payouts with raw `ecrecover` over a hash
  without the chain id, accepted malleable (high-s) signatures and did not
  validate `v`. Signatures could be replayed on another chain. Fixed:
  EIP-712 typed data (chain id and contract in the domain) with
  OpenZeppelin `ECDSA.recover`.
- **PetNFT** used `blockhash(block.number - 1)` for traits and depended on the
  fragment vault, which no longer exists in the product.
- **EggVault** implemented the retired fragment accrual system.

## Findings

### M-01: Owner could tax any wallet by flagging it as a DEX pair. Fixed.

`AGIToken` applies the 2.5% tax to transfers that touch an address in
`isPair`. The owner could add any ordinary wallet to that list and every
transfer to or from it would be taxed.

**Fix:** `lockPairs()` irreversibly freezes the pair list. After it is
called, `setPair` reverts with `PairsAreLocked`. Call it right after liquidity
pools are created. Until then, the risk remains and depends on the owner key
(see I-02).

### M-02: Direct sends from exchange accounts. Acknowledged.

When AGI or ETH is sent straight to `AGIEgg`, the egg is minted to the
sending address. Exchanges withdraw from shared hot wallets, so a user
sending directly from an exchange would have the egg minted to the
exchange's address. A contract cannot tell an exchange wallet from a personal
one.

**Mitigation:** The site warns users to send only from a wallet they control.
Senders that are contracts unable to hold NFTs are protected: `_safeMint`
reverts and the whole transfer is undone, so their funds return (tested).

### L-01: Image URI could break JSON metadata. Fixed.

`tokenURI` builds JSON on-chain and inserts `imageBaseURI` verbatim. A `"` or
`\` in it would produce invalid metadata. The constructor and
`setImageBaseURI` now reject both characters (`InvalidURI`).

### L-02: Credits written after an external call. Fixed.

`ComputeTreasury.convertToCredits` updated `creditsOf` after
`safeTransferFrom`. It was already `nonReentrant` and the token is trusted, so
this was not exploitable, but it is now checks-effects-interactions.

### L-03: Price change between signing and execution. Mitigated by design.

The owner can change prices. Buyers are protected in every path:

- `mintWithAGI` takes `maxCost` and reverts with `CostAboveMax` if the price
  rose.
- `mintWithETH` cannot spend more than `msg.value`. The excess is refunded.
- Direct sends never take more than was sent. Whole eggs are minted and the
  rest is refunded, or the transfer reverts if not even one egg is covered.

### L-04: Hatch holding check can be met with a flash loan. Acknowledged.

`hatch` checks `agi.balanceOf(msg.sender) >= minHoldToHatch`. Someone could
borrow AGI for one transaction to pass it. Hatching only flips a state flag
and grants no funds, so the impact is limited to bypassing the holding rule
once per egg. If that rule becomes economically important, replace it with a
time-weighted or staked balance.

### I-01: Random design uses block data. Acknowledged.

Direct sends pick a design from `prevrandao`, timestamp, recipient and mint
count. Validators can influence this. Designs are purely cosmetic and carry no
rarity or economic difference, so this is acceptable. Do not attach value
differences to designs without switching to a VRF.

### I-02: Owner privileges.

The owner of each contract can:

- **AGIToken:** change the tax recipient, set pairs (until locked), set tax
  exemptions and receiver hooks.
- **AGIEgg:** change prices, the proceeds recipient, the hatch rule, the image
  URI, add designs, open hatching, and pause.
- **ComputeTreasury:** whitelist providers, change the payout signer, and
  withdraw the treasury's AGI and ETH.

What the owner **cannot** do: mint AGI (supply is fixed at 100M with no mint
function), change the 2.5% tax rate (a constant), exceed the egg supply cap
(immutable), reduce the design range, or take funds from users' wallets.

**Recommendation:** use a multisig (for example Safe) as owner of all three
contracts. Put parameter changes behind a timelock, and keep the orchestrator
key in a hardware security module.

### I-03: Renouncing ownership while paused freezes minting. Acknowledged.

`renounceOwnership` is inherited. If it is called while `AGIEgg` is paused,
minting can never resume. Only renounce after unpausing, if at all.

### I-04: Old treasury stays tax-exempt. Acknowledged.

`AGIToken.setTreasury` marks the new treasury exempt but does not remove the
old one. Call `setTaxExempt(old, false)` if needed.

## What the tests prove

`npm test` runs 36 tests (all passing):

- **AGIToken:** fixed supply with no mint function; no tax on wallet
  transfers; exactly 2.5% on pair buys and sells; exemptions; owner-only
  admin; pair lock; zero-address and non-contract hook rejection; a bad hook
  reverts the transfer; two-step ownership.
- **AGIEgg, connected minting:** chosen design minted; exact AGI to treasury;
  `maxCost` protection; design, quantity and allowance checks; ETH minting
  with refund; methods can be disabled.
- **AGIEgg, direct AGI send:** one egg for the exact price; whole eggs and a
  refund; cap of 10 per send; reverts below price with no funds taken;
  paused; contract senders that cannot hold NFTs get their AGI back; only
  the token can call the hook; `transferFrom` mints to the token owner, not
  the spender.
- **AGIEgg, direct ETH send:** mint, forward to treasury, refund; reverts
  below price and when disabled; contract senders get their ETH back.
- **Supply cap:** a direct send mints only what is left and refunds the rest,
  then sells out.
- **Reentrancy:** a malicious NFT receiver trying to mint again during minting
  is blocked.
- **Hatching:** closed by default; owner-only; holding requirement; once per
  egg.
- **Metadata:** valid base64 JSON with name, image and attributes.
- **ComputeTreasury:** 10 credits per AGI; EIP-712 payout once per batch;
  replay, expiry, wrong signer, wrong provider and non-provider all rejected;
  owner-only withdrawals.
- **Property tests:** 200 random AGI sends and 150 random ETH sends across
  three users, near and past the supply cap. After every send: the egg
  contract holds zero AGI and zero ETH, the treasury received exactly the
  price of the eggs minted, the sender lost exactly that amount (AGI), and the
  mint count matches.

## Before mainnet

1. An independent audit by a third-party firm.
2. Deploy to a testnet with the real parameters and run through every path,
   including direct sends from MetaMask and a hardware wallet.
3. Transfer ownership of all three contracts to a multisig, with a timelock
   for parameter changes.
4. Call `lockPairs()` once the liquidity pairs exist.
5. Verify the source on the block explorer.
6. Set `NEXT_PUBLIC_EGG_CONTRACT` (and chain/prices) on the site only after
   the contract is verified.

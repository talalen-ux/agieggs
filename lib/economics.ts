import type { GameEvent, GameState, Pet, Wallet } from "./types";
import { STAGE_ORDER, STAGE_USD_THRESHOLD } from "./types";

// === Tokenomics constants =================================================
// Tax routed to the compute treasury on every buy/sell. Pays for GPU/inference.
export const TAX_BPS = 250; // 2.5%
// Eggs accrue at this rate per dollar-day of *committed* AGI value, capped to
// keep whales from dominating supply (the "stay within the band" rule).
export const EGG_RATE_PER_USD_DAY = 0.4;
export const EGG_DAILY_CAP_PER_WALLET = 3;
// You can't keep accruing past the pet cap minus already-minted pets.
export const MAX_PENDING_EGGS = 5;

export function holdingsUsd(state: GameState): number {
  return state.wallet.agi * state.supply.agiPriceUsd;
}

export function currentStageThresholdUsd(pet: Pet): number {
  return STAGE_USD_THRESHOLD[pet.stage];
}

export function nextStage(pet: Pet) {
  const idx = STAGE_ORDER.indexOf(pet.stage);
  if (idx === -1 || idx === STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

export function nextStageThresholdUsd(pet: Pet): number | null {
  const ns = nextStage(pet);
  return ns ? STAGE_USD_THRESHOLD[ns] : null;
}

export function evolutionProgress(state: GameState, pet: Pet): number {
  const target = nextStageThresholdUsd(pet);
  if (target === null) return 1;
  if (target === 0) return 1;
  return Math.min(1, holdingsUsd(state) / target);
}

// Apply the band-based degradation rules. Mutates pets in place.
export function reconcileDegradation(state: GameState): GameEvent[] {
  const usd = holdingsUsd(state);
  const events: GameEvent[] = [];
  for (const pet of state.pets) {
    const required = currentStageThresholdUsd(pet);
    const shouldDegrade = usd < required;
    if (shouldDegrade && !pet.degraded) {
      pet.degraded = true;
      events.push({
        id: `evt_${Date.now()}_${pet.id}_d`,
        ts: Date.now(),
        kind: "degrade",
        text: `${pet.name} entered degraded mode — holdings ($${usd.toFixed(2)}) fell below the $${required} band for ${pet.stage}.`,
      });
    } else if (!shouldDegrade && pet.degraded) {
      pet.degraded = false;
      events.push({
        id: `evt_${Date.now()}_${pet.id}_r`,
        ts: Date.now(),
        kind: "restore",
        text: `${pet.name} restored to full autonomy. Compute priority returned.`,
      });
    }
  }
  return events;
}

// Egg accrual: rewards stickiness, capped per day, only while in-band.
export function accrueEggs(state: GameState): GameEvent[] {
  const now = Date.now();
  const wallet = state.wallet;
  const elapsedMs = Math.max(0, now - wallet.lastAccrualAt);
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
  if (elapsedDays <= 0) return [];

  const usd = holdingsUsd(state);
  // No accrual while degraded or below the smallest entry band.
  if (usd < STAGE_USD_THRESHOLD.hatchling) {
    wallet.lastAccrualAt = now;
    return [];
  }

  const remainingPetSlots = Math.max(
    0,
    state.supply.petCap - state.supply.petsMinted,
  );
  if (remainingPetSlots <= 0) {
    wallet.lastAccrualAt = now;
    return [];
  }

  const raw = usd * EGG_RATE_PER_USD_DAY * elapsedDays;
  const cappedDaily = Math.min(raw, EGG_DAILY_CAP_PER_WALLET * elapsedDays);
  const cappedTotal = Math.min(
    cappedDaily,
    MAX_PENDING_EGGS - wallet.eggs,
    remainingPetSlots,
  );
  if (cappedTotal <= 0) {
    wallet.lastAccrualAt = now;
    return [];
  }
  wallet.eggs += cappedTotal;
  wallet.lastAccrualAt = now;
  return [
    {
      id: `evt_${now}_egg`,
      ts: now,
      kind: "egg",
      text: `+${cappedTotal.toFixed(2)} egg fragments accrued from your committed band.`,
    },
  ];
}

export function applyTax(grossAgi: number): { net: number; tax: number } {
  const tax = (grossAgi * TAX_BPS) / 10_000;
  return { net: grossAgi - tax, tax };
}

export function buyAgi(
  state: GameState,
  usdAmount: number,
): GameEvent[] {
  if (usdAmount <= 0) throw new Error("Amount must be positive.");
  const grossAgi = usdAmount / state.supply.agiPriceUsd;
  const { net, tax } = applyTax(grossAgi);
  state.wallet.agi += net;
  state.wallet.lifetimeBuy += net;
  state.supply.computeTreasury += tax;
  // Slight upward price drift to make whales hesitate. 1bp per $100 simulated.
  state.supply.agiPriceUsd *= 1 + Math.min(0.01, usdAmount / 1_000_000);
  return [
    {
      id: `evt_${Date.now()}_buy`,
      ts: Date.now(),
      kind: "buy",
      text: `Bought ${net.toFixed(2)} AGI for $${usdAmount.toFixed(2)}. ${tax.toFixed(2)} AGI routed to compute treasury.`,
    },
  ];
}

export function sellAgi(
  state: GameState,
  agiAmount: number,
): GameEvent[] {
  if (agiAmount <= 0) throw new Error("Amount must be positive.");
  if (agiAmount > state.wallet.agi) throw new Error("Insufficient AGI.");
  const { net, tax } = applyTax(agiAmount);
  state.wallet.agi -= agiAmount;
  state.supply.computeTreasury += tax;
  state.supply.agiPriceUsd *= 1 - Math.min(0.005, agiAmount / 5_000_000);
  return [
    {
      id: `evt_${Date.now()}_sell`,
      ts: Date.now(),
      kind: "sell",
      text: `Sold ${agiAmount.toFixed(2)} AGI → $${(net * state.supply.agiPriceUsd).toFixed(2)}. ${tax.toFixed(2)} AGI taxed.`,
    },
  ];
}

export function tick(wallet: Wallet) {
  // Hook for future timed effects (memory decay, intelligence drift). Kept
  // separate so storage layer can call it on every load without economic risk.
  void wallet;
}

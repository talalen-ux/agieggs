import type { GameEvent, GameState, Pet, Wallet } from "./types";
import { STAGE_ORDER, STAGE_USD_THRESHOLD } from "./types";

// === Tokenomics constants =================================================
// Tax routed to the compute treasury on every buy/sell. Pays for GPU/inference.
export const TAX_BPS = 250; // 2.5%

// How many committed USD you need held to be eligible to hatch.
export const HATCH_HOLDINGS_USD = STAGE_USD_THRESHOLD.hatchling;

// Earn rates — AGI the pet earns from activities. Tunable from one place.
export const EARN = {
  chatTurn: 0.25,
  training: 10,
  arenaWin: 20,
  arenaLoss: 5,
  evolve: 50,
};

// Credits per earned AGI at conversion time. A round, friendly rate.
export const CREDIT_RATE = 10;

export function holdingsUsd(state: GameState): number {
  return state.wallet.agi * state.supply.agiPriceUsd;
}

export function earnedUsd(state: GameState): number {
  return state.wallet.earnedAgi * state.supply.agiPriceUsd;
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

// Band-based degradation — kept from the original design because it still
// matters once a pet is hatched (its earning rate should reflect the owner's
// ongoing commitment).
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

export function applyTax(grossAgi: number): { net: number; tax: number } {
  const tax = (grossAgi * TAX_BPS) / 10_000;
  return { net: grossAgi - tax, tax };
}

export function buyAgi(state: GameState, usdAmount: number): GameEvent[] {
  if (usdAmount <= 0) throw new Error("Amount must be positive.");
  const grossAgi = usdAmount / state.supply.agiPriceUsd;
  const { net, tax } = applyTax(grossAgi);
  state.wallet.agi += net;
  state.wallet.lifetimeBuy += net;
  state.supply.computeTreasury += tax;
  // Tiny upward drift as commitment flows in.
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

export function sellAgi(state: GameState, agiAmount: number): GameEvent[] {
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

/** The pet earns AGI from an activity. Degraded pets earn at 25% rate. */
export function earn(
  state: GameState,
  pet: Pet,
  amount: number,
  reason: string,
): GameEvent[] {
  const rate = pet.degraded ? 0.25 : 1;
  const net = amount * rate;
  state.wallet.earnedAgi += net;
  return [
    {
      id: `evt_${Date.now()}_earn`,
      ts: Date.now(),
      kind: "earn",
      text: `${pet.name} earned ${net.toFixed(2)} AGI · ${reason}${pet.degraded ? " (throttled)" : ""}.`,
    },
  ];
}

/** Convert earned AGI into credits at CREDIT_RATE. */
export function convertToCredits(
  state: GameState,
  agiAmount: number,
): GameEvent[] {
  if (agiAmount <= 0) throw new Error("Amount must be positive.");
  if (agiAmount > state.wallet.earnedAgi)
    throw new Error("Not that much earned AGI.");
  state.wallet.earnedAgi -= agiAmount;
  const credits = agiAmount * CREDIT_RATE;
  state.wallet.credits += credits;
  return [
    {
      id: `evt_${Date.now()}_convert`,
      ts: Date.now(),
      kind: "convert",
      text: `Converted ${agiAmount.toFixed(2)} earned AGI → ${credits.toFixed(0)} credits.`,
    },
  ];
}

export function tick(wallet: Wallet) {
  void wallet;
}

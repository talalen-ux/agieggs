import { fail, mutate, ok, readJson } from "@/lib/api";
import { EARN } from "@/lib/economics";

export const dynamic = "force-dynamic";

// Arena spar — roll outcome, award XP + AGI. Degraded pets still earn
// but at a reduced rate (handled below).
export async function POST(req: Request) {
  const body = await readJson(req);
  const petId = String(body.petId ?? "");
  const opponentId = String(body.opponentId ?? "");
  if (!petId || !opponentId) return fail("petId and opponentId required");

  try {
    const { state, result } = await mutate((s) => {
      const pet = s.pets.find((p) => p.id === petId);
      if (!pet) throw new Error("Pet not found.");
      const opp = s.others.find((o) => o.id === opponentId);
      if (!opp) throw new Error("Opponent not found.");

      const delta = pet.intelligence - opp.intelligence;
      const winChance = 1 / (1 + Math.exp(-delta / 120));
      const won = Math.random() < winChance;
      const xp = won ? 35 : 12;
      pet.experience += xp;

      const baseEarn = won ? EARN.arenaWin : EARN.arenaLoss;
      const earned = baseEarn * (pet.degraded ? 0.25 : 1);
      s.wallet.earnedAgi += earned;

      const text = won
        ? `${pet.name} out-thought ${opp.name} (${opp.ownerHandle}). +${xp} XP · +${earned.toFixed(2)} AGI.`
        : `${pet.name} sparred with ${opp.name} and lost gracefully. +${xp} XP · +${earned.toFixed(2)} AGI.`;
      s.events.unshift({
        id: `evt_${Date.now()}_social`,
        ts: Date.now(),
        kind: "social",
        text,
      });
      return { won, xp, earned };
    });
    return ok({ state, ...result });
  } catch (e) {
    return fail((e as Error).message);
  }
}

import { fail, mutate, ok, readJson } from "@/lib/api";

export const dynamic = "force-dynamic";

// "Send your pet to interact" — simulates the Social Arena. Cheap demo:
// roll an outcome based on intelligence delta, mint an event, nudge XP.
export async function POST(req: Request) {
  const body = await readJson(req);
  const petId = String(body.petId ?? "");
  const opponentId = String(body.opponentId ?? "");
  if (!petId || !opponentId) return fail("petId and opponentId required");

  try {
    const { state, result } = await mutate((s) => {
      const pet = s.pets.find((p) => p.id === petId);
      if (!pet) throw new Error("Pet not found.");
      if (pet.degraded) throw new Error("Degraded pets cannot enter the arena.");
      const opp = s.others.find((o) => o.id === opponentId);
      if (!opp) throw new Error("Opponent not found.");

      const delta = pet.intelligence - opp.intelligence;
      const winChance = 1 / (1 + Math.exp(-delta / 120));
      const won = Math.random() < winChance;
      const xp = won ? 35 : 12;
      pet.experience += xp;

      const text = won
        ? `${pet.name} out-thought ${opp.name} (${opp.ownerHandle}). +${xp} XP.`
        : `${pet.name} sparred with ${opp.name} and lost gracefully. +${xp} XP.`;
      s.events.unshift({
        id: `evt_${Date.now()}_social`,
        ts: Date.now(),
        kind: "social",
        text,
      });
      return { won, xp };
    });
    return ok({ state, ...result });
  } catch (e) {
    return fail((e as Error).message);
  }
}

import { fail, mutate, ok, readJson } from "@/lib/api";
import { petReply } from "@/lib/ai";
import { compressMemoryIfNeeded } from "@/lib/pet";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await readJson(req);
  const petId = String(body.petId ?? "");
  const message = String(body.message ?? "").trim();
  if (!petId) return fail("petId required");
  if (!message) return fail("message required");
  if (message.length > 2000) return fail("message too long");

  try {
    const { state, result } = await mutate(async (s) => {
      const pet = s.pets.find((p) => p.id === petId);
      if (!pet) throw new Error("Pet not found.");

      const history = pet.conversation.slice(-12);
      const reply = await petReply(pet, message, history);

      const ts = Date.now();
      pet.conversation.push({ role: "user", content: message, ts });
      pet.conversation.push({ role: "pet", content: reply.text, ts: ts + 1 });
      if (pet.conversation.length > 60)
        pet.conversation = pet.conversation.slice(-60);
      pet.lastSeenAt = ts;
      if (reply.memory) {
        pet.memory.push({
          id: `mem_${ts}`,
          ts,
          summary: reply.memory.summary,
          salience: reply.memory.salience,
        });
      }
      compressMemoryIfNeeded(pet);
      return { reply: reply.text };
    });
    return ok({ state, reply: result.reply });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}

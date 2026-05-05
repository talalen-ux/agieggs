"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "@/components/StateProvider";
import { Pet3D } from "@/components/Pet3D";

export default function ChatPage() {
  const { state, call } = useGame();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pet = state?.pets[0];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [pet?.conversation.length]);

  if (!state) return null;
  if (!pet) {
    return (
      <div className="pt-20 text-center">
        <div className="kbd">chat</div>
        <h1 className="text-2xl mt-3">Nothing to talk to yet.</h1>
        <p className="text-white/50 mt-3">Hatch an egg first.</p>
      </div>
    );
  }

  const messages = pet.conversation;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    setError(null);
    const r = await call("/api/chat", { petId: pet!.id, message: input });
    if (!r.ok) setError(r.error ?? "failed");
    else setInput("");
    setSending(false);
  }

  return (
    <div className="grid lg:grid-cols-[280px,1fr] gap-6 pt-6 min-h-[70vh]">
      <aside className="glass p-5 flex flex-col items-center gap-4 h-fit lg:sticky lg:top-24">
        <Pet3D pet={pet} size={180} />
        <div className="text-center">
          <div className="text-lg font-semibold">{pet.name}</div>
          <div className="kbd">{pet.stage} · int {pet.intelligence}</div>
          {pet.degraded && (
            <div className="text-xs text-glow-rose mt-2">degraded · responses throttled</div>
          )}
        </div>
        <div className="text-xs text-white/40 text-center leading-relaxed">
          Personality seeded at egg. Memory persists across sessions.
        </div>
      </aside>

      <div className="glass-strong flex flex-col overflow-hidden">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-5 space-y-3 max-h-[60vh]"
        >
          {messages.length === 0 && (
            <div className="text-center text-white/40 text-sm pt-10">
              say something to {pet.name}.
            </div>
          )}
          {messages.map((m, i) => (
            <Bubble
              key={i}
              role={m.role}
              text={m.content}
            />
          ))}
          {sending && <Bubble role="pet" text="…" pulsing />}
        </div>
        <form
          onSubmit={send}
          className="border-t border-white/5 p-3 flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`message ${pet.name}…`}
            disabled={sending || pet.degraded}
            maxLength={2000}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={sending || !input.trim() || pet.degraded}
          >
            send
          </button>
        </form>
        {error && (
          <div className="px-4 pb-3 text-xs text-glow-rose">{error}</div>
        )}
      </div>
    </div>
  );
}

function Bubble({
  role,
  text,
  pulsing,
}: {
  role: "user" | "pet";
  text: string;
  pulsing?: boolean;
}) {
  const mine = role === "user";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${
          mine
            ? "bg-glow-violet/30 text-white rounded-br-md"
            : "bg-white/5 text-white/90 rounded-bl-md"
        } ${pulsing ? "animate-pulse_glow" : ""}`}
      >
        {text}
      </div>
    </div>
  );
}

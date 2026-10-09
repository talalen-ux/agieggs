"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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

  if (!state) return <div className="pad-x py-20 body-mute">Loading…</div>;

  if (!pet) {
    return (
      <section className="pad-x max-shell section-sm">
        <div className="eyebrow-mute mb-4">Chat</div>
        <h1 className="h-section">Nothing to talk to.</h1>
        <p className="text-ink-mute mt-5">Hatch an egg first.</p>
        <Link href="/eggs" className="btn btn-primary btn-xl mt-6">
          Go to Egg Chamber
        </Link>
      </section>
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
    <section className="pad-x max-shell section-sm">
      <div className="eyebrow-mute mb-4">Chat</div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6 min-h-[72vh]">
        <aside className="card p-6 h-fit lg:sticky lg:top-24">
          <div className="flex flex-col items-center gap-5">
            <Pet3D pet={pet} size={180} />
            <div className="text-center">
              <div className="text-[20px] font-semibold tracking-tight">
                {pet.name}
              </div>
              <div className="eyebrow-mute mt-1">
                {pet.stage} · int {pet.intelligence}
              </div>
              {pet.degraded && (
                <div className="mt-3 inline-block px-3 py-1 text-[11px] font-semibold uppercase tracking-widest bg-ink text-white rounded-full">
                  degraded
                </div>
              )}
            </div>
            <div className="rule w-full pt-4 text-[12px] text-ink-mute leading-relaxed">
              Personality seeded at egg. Memory persists across sessions.
              Responses throttle in degraded mode.
            </div>
          </div>
        </aside>

        <div className="card flex flex-col overflow-hidden">
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-3 max-h-[62vh]"
          >
            {messages.length === 0 && (
              <div className="text-center text-ink-mute text-sm pt-16">
                Say something to {pet.name}.
              </div>
            )}
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role} text={m.content} />
            ))}
            {sending && <Bubble role="pet" text="…" pulsing />}
          </div>
          <form
            onSubmit={send}
            className="rule p-3 flex gap-2 bg-surface-soft/60"
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
            <div className="px-5 pb-3 text-[12px] text-ink">{error}</div>
          )}
        </div>
      </div>
    </section>
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
        className={`max-w-[76%] px-4 py-2.5 text-[14px] leading-relaxed ${
          mine ? "bubble-mine" : "bubble-pet"
        } ${pulsing ? "animate-pulse_soft" : ""}`}
      >
        {text}
      </div>
    </div>
  );
}

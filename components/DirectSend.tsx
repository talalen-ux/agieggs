"use client";

import { useState } from "react";

/**
 * "Send directly" — get an egg NFT without connecting a wallet to the site.
 *
 * The address comes from deployment config only. If it is missing or not a
 * valid address we show that it is published at launch: we never render a
 * placeholder address someone could send funds to.
 */

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

const CONTRACT = process.env.NEXT_PUBLIC_EGG_CONTRACT ?? "";
const CHAIN = process.env.NEXT_PUBLIC_CHAIN_NAME ?? "";
const PRICE_AGI = process.env.NEXT_PUBLIC_EGG_PRICE_AGI ?? "";
const PRICE_ETH = process.env.NEXT_PUBLIC_EGG_PRICE_ETH ?? "";

export function DirectSend() {
  const live = ADDRESS_RE.test(CONTRACT);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(CONTRACT);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="rule mt-16 pt-10" aria-labelledby="direct-send-h">
      <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 items-start">
        <div className="max-w-md">
          <div className="eyebrow-mute">Prefer not to connect?</div>
          <h2 id="direct-send-h" className="h-sub mt-3">
            Send funds directly to get an egg
          </h2>
          <p className="body-mute mt-4">
            Every egg is an ERC-721 NFT. Instead of connecting a wallet to this
            site, you can send AGI or ETH straight to the egg contract from any
            wallet you control. The contract mints your egg to the address you
            sent from.
          </p>
        </div>

        <div className="card p-6">
          <div className="eyebrow-mute">Egg contract{CHAIN ? ` · ${CHAIN}` : ""}</div>
          {live ? (
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <code className="mono text-[13px] break-all bg-surface-soft rounded-lg px-3 py-2">
                {CONTRACT}
              </code>
              <button type="button" onClick={copy} className="btn" aria-live="polite">
                {copied ? "Copied" : "Copy address"}
              </button>
            </div>
          ) : (
            <p className="mt-3 text-[15px] font-medium">
              The contract address will be published here at launch.
            </p>
          )}

          {(PRICE_AGI || PRICE_ETH) && live && (
            <dl className="mt-5 grid grid-cols-2 gap-4 text-[14px]">
              {PRICE_AGI && (
                <div>
                  <dt className="eyebrow-mute">Price in AGI</dt>
                  <dd className="mono mt-1">{PRICE_AGI} AGI</dd>
                </div>
              )}
              {PRICE_ETH && (
                <div>
                  <dt className="eyebrow-mute">Price in ETH</dt>
                  <dd className="mono mt-1">{PRICE_ETH} ETH</dd>
                </div>
              )}
            </dl>
          )}

          <ol className="mt-6 space-y-3 text-[14px] leading-relaxed">
            <li className="flex gap-3">
              <span className="mono text-ink-mute">01</span>
              <span>Send at least the price of one egg in AGI or ETH to the address above.</span>
            </li>
            <li className="flex gap-3">
              <span className="mono text-ink-mute">02</span>
              <span>
                You receive one egg per full price, up to 10 per send. Anything above
                whole eggs is refunded in the same transaction.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mono text-ink-mute">03</span>
              <span>
                The design is assigned at random. To pick a specific design, use the
                connected option above.
              </span>
            </li>
          </ol>

          <div className="mt-6 rounded-xl border border-hair p-4 text-[13px] leading-relaxed">
            <div className="font-semibold">Before you send</div>
            <ul className="mt-2 space-y-1.5 text-ink-mute list-disc pl-4">
              <li>
                Send from a wallet you control. Do not send from an exchange account:
                the egg would go to the exchange&apos;s address, not to you.
              </li>
              <li>
                If you send less than one egg&apos;s price, or the eggs are sold out,
                the transfer fails and nothing is taken (you only pay network fees).
              </li>
              <li>Only send on the network listed with the contract address.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

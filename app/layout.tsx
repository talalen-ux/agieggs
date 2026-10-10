import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { StateProvider } from "@/components/StateProvider";

export const metadata: Metadata = {
  title: "AGI.Pets — a new form of life",
  description:
    "Choose an egg, contribute AGI, hatch, and earn compute credits as your pet grows. 100,000,000 AGI, 5,000 pets ever.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <StateProvider>
          <Nav />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
        </StateProvider>
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="rule mt-24 py-10 pad-x max-shell w-full">
      <div className="flex flex-wrap items-center justify-between gap-4 text-[13px] text-ink-mute">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink">AGI.Pets</span>
          <span>·</span>
          <span>100,000,000 AGI · 5,000 pets ever</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/choose" className="hover:text-ink">Discover</a>
          <a href="/#how" className="hover:text-ink">How it works</a>
          <a href="/eggs" className="hover:text-ink">App</a>
        </div>
      </div>
    </footer>
  );
}

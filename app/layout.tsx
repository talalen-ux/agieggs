import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { StateProvider } from "@/components/StateProvider";

export const metadata: Metadata = {
  title: "AGI.Pets — intelligence, scarce by commitment",
  description:
    "A living AI companion protocol. 100,000,000 AGI. 5,000 pets. Ever.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans">
        <StateProvider>
          <Nav />
          <main className="flex-1 w-full">{children}</main>
          <footer className="full-bleed max-w-[1400px] w-full mx-auto py-6">
            <div className="hairline pt-5 flex flex-wrap items-center justify-between gap-3 eyebrow-mute">
              <span>AGI.Pets · fixed 100,000,000 AGI · hard-cap 5,000 pets</span>
              <span>v0.1 · MVP</span>
            </div>
          </footer>
        </StateProvider>
      </body>
    </html>
  );
}

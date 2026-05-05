import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { StateProvider } from "@/components/StateProvider";

export const metadata: Metadata = {
  title: "AGI.Pets — intelligence as economic commitment",
  description:
    "A living AI companion protocol. Buy AGI, earn eggs, hatch a pet, and evolve it into autonomy.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <StateProvider>
          <div className="min-h-screen flex flex-col">
            <Nav />
            <main className="flex-1 container-pad max-w-6xl w-full mx-auto">
              {children}
            </main>
            <footer className="container-pad max-w-6xl w-full mx-auto text-xs text-white/30">
              <div className="hairline pt-4">
                AGI.Pets · 100,000,000 cap · 5,000 pets max · MVP
              </div>
            </footer>
          </div>
        </StateProvider>
      </body>
    </html>
  );
}

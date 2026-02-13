import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { Sidebar, StatsPanel } from "@/components/layout";
import { AuroraBackground } from "@/components/ui/aurora-background";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Phasor | Decentralized Exchange on Monad",
  description:
    "Swap tokens, provide liquidity, and earn on the fastest DEX on Monad.",
  keywords: ["DEX", "Monad", "DeFi", "Swap", "Liquidity", "AMM"],
  openGraph: {
    title: "Phasor | Decentralized Exchange on Monad",
    description:
      "Swap tokens, provide liquidity, and earn on the fastest DEX on Monad.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen font-sans antialiased">
        <Providers>
          <AuroraBackground>
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content */}
            <main className="lg:ml-[240px] pt-16 lg:pt-0 min-h-screen">
              {children}
            </main>

            {/* Stats Panel */}
            <StatsPanel />
          </AuroraBackground>
        </Providers>
      </body>
    </html>
  );
}

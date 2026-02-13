import { SwapCard } from "@/components/swap";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6 lg:p-8">
      {/* Header Section - Top Left */}
      <div className="mb-4">
        <span className="text-[#614bdf] text-xs font-mono">// SWAP</span>
        <h1 className="text-base font-display font-medium text-white leading-none">
          Swap at the Speed of Light
        </h1>
      </div>

      {/* Swap Card - Centered horizontally, above center vertically */}
      <div className="flex-1 flex items-center justify-center -mt-40">
        <SwapCard />
      </div>
    </div>
  );
}

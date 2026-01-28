"use client";

import { cn } from "@/lib/utils";

interface AuroraBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

export function AuroraBackground({ children, className }: AuroraBackgroundProps) {
  return (
    <div className={cn("relative min-h-screen w-full overflow-hidden bg-[#08080f]", className)}>
      {/* Cosmic Smooth Waves - slow, spacey, organic */}
      <div className="space-wave-container">
        <svg viewBox="0 0 1400 800" preserveAspectRatio="none">
          {/* Blue wave - smooth bezier curve */}
          <path
            className="wave-path-1"
            d="M-100,400 C100,300 300,500 500,400 S700,300 900,400 S1100,500 1300,400 S1500,300 1700,400"
          />
          {/* Yellow/amber wave - offset phase */}
          <path
            className="wave-path-2"
            d="M-100,420 C150,520 350,320 550,420 S750,520 950,420 S1150,320 1350,420 S1550,520 1750,420"
          />
          {/* Deep blue wave - larger, slower */}
          <path
            className="wave-path-3"
            d="M-100,380 C200,280 400,480 600,380 S800,280 1000,380 S1200,480 1400,380 S1600,280 1800,380"
          />
          {/* Gold accent wave */}
          <path
            className="wave-path-4"
            d="M-100,440 C50,340 250,540 450,440 S650,340 850,440 S1050,540 1250,440 S1450,340 1650,440"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

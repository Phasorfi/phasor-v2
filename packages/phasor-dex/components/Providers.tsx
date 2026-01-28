"use client";

import React from "react";
import Image from "next/image";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme, AvatarComponent } from "@rainbow-me/rainbowkit";
import { ApolloProvider } from "@apollo/client/react";
import { Toaster } from "sonner";
import { config } from "@/config";
import { apolloClient } from "@/lib/apollo-client";

import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      // Cache data for 30 seconds to reduce RPC calls
      staleTime: 30_000,
      // Keep unused data in cache for 5 minutes
      gcTime: 5 * 60 * 1000,
    },
  },
});

// Custom RainbowKit theme matching Phasor grayscale branding
const phasorTheme = darkTheme({
  accentColor: "hsl(0, 0%, 75%)", // --primary: light gray
  accentColorForeground: "hsl(0, 0%, 10%)", // --primary-foreground
  borderRadius: "small", // minimal border radius
  fontStack: "rounded", // will be overridden with custom fonts
  overlayBlur: "small",
});

// Override additional theme properties for grayscale scheme
const customTheme = {
  ...phasorTheme,
  colors: {
    ...phasorTheme.colors,
    accentColor: "hsl(0, 0%, 75%)", // --primary
    accentColorForeground: "hsl(0, 0%, 10%)", // --primary-foreground
    actionButtonBorder: "hsl(0, 0%, 25%)", // --border
    actionButtonBorderMobile: "hsl(0, 0%, 25%)",
    actionButtonSecondaryBackground: "hsl(0, 0%, 15%)", // --secondary
    closeButton: "hsl(0, 0%, 50%)", // --muted-foreground
    closeButtonBackground: "hsl(0, 0%, 15%)", // --secondary
    connectButtonBackground: "hsl(0, 0%, 10%)", // --card
    connectButtonBackgroundError: "hsl(0, 84%, 60%)", // red for errors
    connectButtonInnerBackground: "hsl(0, 0%, 15%)", // --secondary
    connectButtonText: "hsl(0, 0%, 85%)", // --foreground
    connectButtonTextError: "hsl(0, 84%, 60%)",
    connectionIndicator: "hsl(142, 76%, 36%)", // green
    downloadBottomCardBackground: "hsl(0, 0%, 10%)",
    downloadTopCardBackground: "hsl(0, 0%, 7%)", // --background
    error: "hsl(0, 84%, 60%)", // red
    generalBorder: "hsl(0, 0%, 25%)", // --border
    generalBorderDim: "hsl(0, 0%, 20%)",
    menuItemBackground: "hsl(0, 0%, 15%)", // --secondary
    modalBackdrop: "rgba(0, 0, 0, 0.5)",
    modalBackground: "hsl(0, 0%, 10%)", // --card
    modalBorder: "hsl(0, 0%, 25%)", // --border
    modalText: "hsl(0, 0%, 85%)", // --foreground
    modalTextDim: "hsl(0, 0%, 50%)", // --muted-foreground
    modalTextSecondary: "hsl(0, 0%, 50%)",
    profileAction: "hsl(0, 0%, 15%)", // --secondary
    profileActionHover: "hsl(0, 0%, 20%)", // --muted
    profileForeground: "hsl(0, 0%, 10%)", // --card
    selectedOptionBorder: "hsl(0, 0%, 75%)", // --primary
    standby: "hsl(0, 0%, 50%)",
  },
  fonts: {
    body: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  radii: {
    actionButton: "0.25rem", // --radius
    connectButton: "0.25rem",
    menuButton: "0.25rem",
    modal: "0.25rem",
    modalMobile: "0.25rem",
  },
  shadows: {
    ...phasorTheme.shadows,
    connectButton: "0 1px 3px rgba(0, 0, 0, 0.1)",
    dialog: "0 4px 6px rgba(0, 0, 0, 0.1)",
    profileDetailsAction: "0 1px 2px rgba(0, 0, 0, 0.05)",
    selectedOption: "0 0 0 1px hsl(0, 0%, 75%)",
    selectedWallet: "0 0 0 1px hsl(0, 0%, 75%)",
    walletLogo: "0 1px 2px rgba(0, 0, 0, 0.05)",
  },
};

// Custom avatar component using Phasor logo
const CustomAvatar: AvatarComponent = ({ size }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
      }}
    >
      <Image
        src="/avatar.svg"
        alt="Account Avatar"
        width={size}
        height={size}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ApolloProvider client={apolloClient}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={customTheme}
            modalSize="compact"
            avatar={CustomAvatar}
            appInfo={{
              appName: "Phasor",
              learnMoreUrl: "https://phasor.exchange",
            }}
          >
            {children}
            <Toaster
              position="bottom-right"
              theme="dark"
              toastOptions={{
                style: {
                  background: 'hsl(240 10% 6%)',
                  border: '1px solid hsl(240 5% 18%)',
                  color: 'hsl(0 0% 98%)',
                },
              }}
            />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ApolloProvider>
  );
}

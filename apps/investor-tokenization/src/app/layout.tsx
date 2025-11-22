import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";

import { ReactQueryClientProvider } from "@/components/tw-blocks/providers/ReactQueryClientProvider";
import { TrustlessWorkProvider } from "@/components/tw-blocks/providers/TrustlessWork";
import { Toaster } from "sonner";
import { Header } from "@/components/shared/Header";
import { EscrowProvider } from "@/components/tw-blocks/providers/EscrowProvider";
import { WalletProvider } from "@/components/tw-blocks/wallet-kit/WalletProvider";
import { ReactNode } from "react";
import { FloatingDockDemo } from "@/components/shared/Navbar";
// Use these imports to wrap your application (<ReactQueryClientProvider>, <TrustlessWorkProvider>, <WalletProvider> y <EscrowProvider>)

const Exo2 = localFont({
  src: "./fonts/Exo2.ttf",
  variable: "---exo-2",
  weight: "100 900",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Investor Tokenization",
  description: "Investor Tokenization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          Exo2.variable,
          "antialiased dark",
          spaceGrotesk.className,
        )}
      >
        <ReactQueryClientProvider>
          <TrustlessWorkProvider>
            <WalletProvider>
              <EscrowProvider>
                <div className="relative flex min-h-screen w-full">
                  <div className="flex-1 flex flex-col w-full">
                    <div className="container mx-auto">
                      <Header />

                      {children}
                    </div>
                  </div>
                </div>

                {/* Floating bottom-centered dock (mobile-like navbar) */}
                <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center pointer-events-none mb-2">
                  <div className="pointer-events-auto">
                    <FloatingDockDemo />
                  </div>
                </div>

                <Toaster position="top-right" richColors />
              </EscrowProvider>
            </WalletProvider>
          </TrustlessWorkProvider>
        </ReactQueryClientProvider>
      </body>
    </html>
  );
}

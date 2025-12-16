import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReactQueryClientProvider } from "@tokenization/tw-blocks-shared/src/providers/ReactQueryClientProvider";
import { TrustlessWorkProvider } from "@tokenization/tw-blocks-shared/src/providers/TrustlessWork";
import { EscrowProvider } from "@tokenization/tw-blocks-shared/src/providers/EscrowProvider";
import { EscrowDialogsProvider } from "@tokenization/tw-blocks-shared/src/providers/EscrowDialogsProvider";
import { EscrowAmountProvider } from "@tokenization/tw-blocks-shared/src/providers/EscrowAmountProvider";
import { Toaster } from "@tokenization/ui/sonner";
import { WalletProvider } from "@tokenization/tw-blocks-shared/src/wallet-kit/WalletProvider";
import type { ReactNode } from "react";
import { Header } from "@/components/shared/Header";
import { Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import { cn } from "@/lib/utils";

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
  title: "Backoffice Tokenization",
  description: "Backoffice Tokenization",
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
          spaceGrotesk.className
        )}
      >
        <ReactQueryClientProvider>
          <TrustlessWorkProvider>
            <WalletProvider>
              <EscrowProvider>
                <EscrowDialogsProvider>
                  <EscrowAmountProvider>
                    <div className="relative flex min-h-screen w-full">
                      <div className="flex-1 flex flex-col w-full">
                        <div className="container mx-auto">
                          <Header />

                          {children}
                        </div>
                      </div>
                    </div>

                    <Toaster position="top-right" richColors />
                  </EscrowAmountProvider>
                </EscrowDialogsProvider>
              </EscrowProvider>
            </WalletProvider>
          </TrustlessWorkProvider>
        </ReactQueryClientProvider>
      </body>
    </html>
  );
}

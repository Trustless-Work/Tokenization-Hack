import type { Metadata } from "next";
import "./globals.css";
import { Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import { cn } from "@/lib/utils";
import { ReactQueryClientProvider } from "@/components/tw-blocks/providers/ReactQueryClientProvider";
import { TrustlessWorkProvider } from "@/components/tw-blocks/providers/TrustlessWork";
import { EscrowProvider } from "@/components/tw-blocks/providers/EscrowProvider";
import { EscrowDialogsProvider } from "@/components/tw-blocks/providers/EscrowDialogsProvider";
import { EscrowAmountProvider } from "@/components/tw-blocks/providers/EscrowAmountProvider";
import { Toaster } from "sonner";
import { WalletProvider } from "@/components/tw-blocks/wallet-kit/WalletProvider";
import { Header } from "@/components/shared/Header";

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
  title: "Project Updates Tokenization",
  description: "Project Updates Tokenization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
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

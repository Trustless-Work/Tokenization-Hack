"use client";

import * as React from "react";
import { useUserInvestments } from "./hooks/useUserInvestments.hook";
import { useWalletContext } from "@tokenization/tw-blocks-shared/src/wallet-kit/WalletProvider";
import { InvestmentCard } from "./components/InvestmentCard";
import { Card } from "@tokenization/ui/card";
import { Button } from "@tokenization/ui/button";
import { Wallet, TrendingUp, DollarSign } from "lucide-react";
import { useWallet } from "@tokenization/tw-blocks-shared/src/wallet-kit/useWallet";

export const InvestmentsView = () => {
  const { walletAddress } = useWalletContext();
  const { handleConnect } = useWallet();

  const {
    data: investments,
    isLoading,
    isError,
    error,
  } = useUserInvestments();

  // Show connect wallet message
  if (!walletAddress) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-2xl font-bold">My Investments</h2>
          <p className="text-muted-foreground">
            Connect your wallet to view your investments and track your portfolio.
          </p>
          <Button onClick={handleConnect} size="lg">
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-2xl font-bold">My Investments</h2>
          <p className="text-muted-foreground">Loading your investments...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-2xl font-bold">My Investments</h2>
          <p className="text-destructive">
            Error loading investments: {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  const investmentList = investments ?? [];

  // Calculate summary statistics
  const totalInvested = React.useMemo(() => {
    return investmentList.reduce((sum, inv) => {
      // Estimate investment based on token balance
      // This is a simplified calculation - you may want to track actual investment amounts
      return sum + parseFloat(inv.tokenBalance || "0");
    }, 0);
  }, [investmentList]);

  const activeInvestments = investmentList.filter((inv) => inv.escrow.isActive).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">My Investments</h2>
          <p className="text-muted-foreground">
            View your current investments, expected revenue, and investment details.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Investments</p>
                <p className="text-2xl font-bold">{investmentList.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Wallet className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Investments</p>
                <p className="text-2xl font-bold">{activeInvestments}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <DollarSign className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Total Tokens Owned</p>
                <p className="text-2xl font-bold">
                  {totalInvested.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 7,
                  })}
                </p>
                {totalInvested > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Across {investmentList.length} investment{investmentList.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Investments List */}
        {investmentList.length === 0 ? (
          <Card className="p-12 text-center">
            <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Investments Yet</h3>
            <p className="text-muted-foreground">
              You don't have any investments yet. Start investing in projects to see them here.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {investmentList.map((investment) => (
              <InvestmentCard
                key={investment.escrow.contractId}
                escrow={investment.escrow}
                tokenBalance={investment.tokenBalance}
                tokenFactory={investment.tokenFactory}
                tokenName={investment.tokenName}
                tokenSymbol={investment.tokenSymbol}
                tokenDecimals={investment.tokenDecimals}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};



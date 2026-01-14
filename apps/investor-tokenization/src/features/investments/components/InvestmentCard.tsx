"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@tokenization/ui/card";
import { Badge } from "@tokenization/ui/badge";
import { BalanceProgressBar } from "@tokenization/tw-blocks-shared/src/escrows/indicators/balance-progress/bar/BalanceProgress";
import {
  formatCurrency,
  formatTimestamp,
  formatAddress,
} from "@tokenization/tw-blocks-shared/src/helpers/format.helper";
import { GetEscrowsFromIndexerResponse } from "@trustless-work/escrow/types";
import { MultiReleaseMilestone } from "@trustless-work/escrow";
import { Calendar, Wallet, ExternalLink } from "lucide-react";
import Link from "next/link";

type InvestmentCardProps = {
  escrow: GetEscrowsFromIndexerResponse;
  tokenBalance: string;
  tokenFactory?: string;
  tokenName?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
};

export const InvestmentCard = ({
  escrow,
  tokenBalance,
  tokenFactory,
  tokenName,
  tokenSymbol,
  tokenDecimals = 7,
}: InvestmentCardProps) => {
  const isMultiRelease = escrow.type === "multi-release";
  const milestones = (escrow.milestones || []) as MultiReleaseMilestone[];

  const totalAmount =
    isMultiRelease && milestones
      ? milestones.reduce((acc, milestone) => acc + Number(milestone.amount), 0)
      : Number(escrow.amount || 0);

  const currency = escrow.trustline?.symbol || "USDC";
  const rawBalance = parseFloat(tokenBalance || "0");

  // Format balance using token decimals (similar to Stellar Expert)
  const formattedBalance = rawBalance / Math.pow(10, tokenDecimals);
  const displaySymbol = tokenSymbol || "TOKEN";

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl font-bold line-clamp-2">
            {escrow.title || "Untitled Investment"}
          </CardTitle>
          {escrow.isActive !== undefined && (
            <Badge variant={escrow.isActive ? "default" : "secondary"}>
              {escrow.isActive ? "Active" : "Inactive"}
            </Badge>
          )}
        </div>
        {escrow.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {escrow.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Token Balance - Stellar Expert Style Display */}
        <div
          className={`rounded-xl border-2 p-6 ${
            formattedBalance > 0
              ? "bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20"
              : "bg-muted border-border"
          }`}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet
                  className={`w-5 h-5 ${formattedBalance > 0 ? "text-primary" : "text-muted-foreground"}`}
                />
                <div>
                  <p
                    className={`text-sm font-medium uppercase tracking-wide ${
                      formattedBalance > 0
                        ? "text-muted-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {tokenName || "Token"} Balance
                  </p>
                  {tokenSymbol && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {displaySymbol}
                    </p>
                  )}
                </div>
              </div>
              {tokenFactory && (
                <Link
                  href={`https://stellar.expert/explorer/testnet/contract/${tokenFactory}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <p
                className={`text-3xl font-bold ${
                  formattedBalance > 0
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {formattedBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: tokenDecimals,
                })}
              </p>
              {tokenSymbol && (
                <span className="text-lg text-muted-foreground font-medium">
                  {displaySymbol}
                </span>
              )}
            </div>
            {formattedBalance > 0 ? (
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  Raw balance: {rawBalance.toLocaleString()}
                </p>
                {tokenFactory && (
                  <Link
                    href={`https://stellar.expert/explorer/testnet/contract/${tokenFactory}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    View on Stellar Expert
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                No tokens owned yet
              </p>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {escrow.contractId && (
          <BalanceProgressBar
            contractId={escrow.contractId}
            target={totalAmount}
            currency={currency}
          />
        )}

        {/* Milestones Progress */}
        {isMultiRelease && milestones && milestones.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Milestones</p>
            <div className="space-y-1">
              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-muted-foreground line-clamp-1">
                    {milestone.description || `Milestone ${index + 1}`}
                  </span>
                  <Badge
                    variant={
                      milestone.status === "completed" ||
                      milestone.status === "approved"
                        ? "default"
                        : milestone.status === "in_progress"
                          ? "secondary"
                          : "outline"
                    }
                    className="ml-2"
                  >
                    {milestone.status || "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Created
            </span>
            <span>{formatTimestamp(escrow.createdAt)}</span>
          </div>
          {escrow.contractId && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Contract ID</span>
              <span className="font-mono">
                {formatAddress(escrow.contractId)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

"use client";

import { BalanceProgressBar } from "@tokenization/tw-blocks-shared/src/escrows/indicators/balance-progress/bar/BalanceProgress";
import { Button } from "@tokenization/ui/button";
import {
  formatCurrency,
  formatTimestamp,
} from "@tokenization/tw-blocks-shared/src/helpers/format.helper";
import type {
  GetEscrowsFromIndexerResponse as Escrow,
  MultiReleaseMilestone,
} from "@trustless-work/escrow/types";
import Link from "next/link";
import { useProjectTokenBalances } from "@/features/investments/hooks/useProjectTokenBalances.hook";
import { Wallet, ExternalLink } from "lucide-react";

export const DummyContent = ({
  details,
  tokenFactory,
}: {
  details?: Escrow;
  tokenFactory?: string;
}) => {
  const { data: tokenBalances } = useProjectTokenBalances();
  const escrowId = details?.contractId;
  const tokenBalanceInfo = escrowId ? tokenBalances?.[escrowId] : undefined;
  const rawBalance = parseFloat(tokenBalanceInfo?.balance || "0");
  const tokenDecimals = tokenBalanceInfo?.tokenDecimals || 7;
  const formattedBalance = rawBalance / Math.pow(10, tokenDecimals);
  const tokenSymbol = tokenBalanceInfo?.tokenSymbol || "TOKEN";
  const tokenName = tokenBalanceInfo?.tokenName;
  const milestones = (details?.milestones || []) as MultiReleaseMilestone[];

  const totalAmount = milestones.reduce(
    (acc, milestone) => acc + Number(milestone.amount),
    0
  );

  return (
    <div className="space-y-6">
      {/* User Token Balance - Stellar Expert Style Display */}
      {formattedBalance > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border-2 border-green-500/20 p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Wallet className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-green-700 dark:text-green-400 font-semibold mb-1">
                  {tokenName ? `${tokenName} Balance` : "Your Investment"}
                </p>
                {tokenSymbol && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {tokenSymbol}
                  </p>
                )}
              </div>
            </div>
            {tokenBalanceInfo?.tokenFactory && (
              <Link
                href={`https://stellar.expert/explorer/testnet/contract/${tokenBalanceInfo.tokenFactory}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
            )}
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <p className="text-3xl font-bold text-green-900 dark:text-green-100">
              {formattedBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: tokenDecimals,
              })}
            </p>
            {tokenSymbol && (
              <span className="text-lg text-green-700 dark:text-green-400 font-medium">
                {tokenSymbol}
              </span>
            )}
          </div>
          {tokenBalanceInfo?.tokenFactory && (
            <div className="flex items-center justify-between pt-2 border-t border-green-500/20">
              <p className="text-xs text-green-600 dark:text-green-400">
                Raw: {rawBalance.toLocaleString()}
              </p>
              <Link
                href={`https://stellar.expert/explorer/testnet/contract/${tokenBalanceInfo.tokenFactory}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-700 dark:text-green-300 hover:underline flex items-center gap-1"
              >
                View on Stellar Expert
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {totalAmount !== undefined && (
          <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-800 p-6">
            <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
              Total Amount
            </p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {formatCurrency(totalAmount, details?.trustline?.name ?? "USDC")}
            </p>
          </div>
        )}

        {details?.balance !== undefined && (
          <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-800 p-6">
            <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
              Current Balance
            </p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {details.balance}
            </p>
          </div>
        )}
      </div>

      <BalanceProgressBar
        contractId={details?.contractId ?? ""}
        target={totalAmount}
        currency={details?.trustline?.name ?? "USDC"}
      />

      {/* Metadata */}
      {details?.createdAt && (
        <div className="text-sm text-neutral-500 dark:text-neutral-400">
          <p>
            <strong>Created:</strong> {formatTimestamp(details.createdAt)}
          </p>
        </div>
      )}

      {details?.contractId && (
        <div className="text-sm text-neutral-500 dark:text-neutral-400">
          <p>
            <strong>Contract ID:</strong> {details.contractId}
          </p>
        </div>
      )}

      {tokenFactory && (
        <div className="text-sm text-neutral-500 dark:text-neutral-400">
          <p>
            <strong>Token Address:</strong> {tokenFactory}
          </p>
          <div className="mt-2">
            <Link
              href={`https://stellar.expert/explorer/testnet/contract/${tokenFactory}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                View Contract
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Milestones Section - EMPHASIZED */}
      {milestones.length > 0 && (
        <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-700">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-6">
            Milestones
          </h2>

          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className="rounded-2xl border-2 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-neutral-800/50 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white font-semibold text-sm">
                      {index + 1}
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                      {milestone.description}
                    </h3>
                  </div>
                  {milestone.status && (
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 uppercase">
                      {milestone.status}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {milestone.amount !== undefined && (
                    <div className="bg-white dark:bg-neutral-700/50 rounded-lg p-4">
                      <p className="text-xs uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                        Amount
                      </p>
                      <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                        {milestone.amount}
                      </p>
                    </div>
                  )}

                  {milestone.receiver && (
                    <div className="bg-white dark:bg-neutral-700/50 rounded-lg p-4">
                      <p className="text-xs uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                        Receiver
                      </p>
                      <p className="text-sm font-mono text-neutral-900 dark:text-white break-all">
                        {milestone.receiver}
                      </p>
                    </div>
                  )}
                </div>

                {milestone.evidence && (
                  <div className="mt-4 pt-4 border-t border-blue-100 dark:border-blue-900">
                    <p className="text-xs uppercase text-neutral-500 dark:text-neutral-400 mb-2">
                      Evidence
                    </p>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line">
                      {milestone.evidence}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

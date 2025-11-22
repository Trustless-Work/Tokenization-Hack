"use client";

import { BalanceProgressBar } from "@/components/tw-blocks/escrows/indicators/balance-progress/bar/BalanceProgress";
import {
  formatCurrency,
  formatTimestamp,
} from "@/components/tw-blocks/helpers/format.helper";
import type {
  GetEscrowsFromIndexerResponse as Escrow,
  MultiReleaseMilestone,
} from "@trustless-work/escrow/types";

export const DummyContent = ({ details }: { details?: Escrow }) => {
  const milestones = (details?.milestones || []) as MultiReleaseMilestone[];

  const totalAmount = milestones.reduce(
    (acc, milestone) => acc + Number(milestone.amount),
    0
  );

  return (
    <div className="space-y-6">
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
          <p>Created: {formatTimestamp(details.createdAt)}</p>
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

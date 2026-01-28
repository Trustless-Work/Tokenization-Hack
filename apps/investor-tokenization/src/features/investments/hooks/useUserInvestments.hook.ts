import { useQuery } from "@tanstack/react-query";
import { useWalletContext } from "@tokenization/tw-blocks-shared/src/wallet-kit/WalletProvider";
import { useGetEscrowFromIndexerByContractIds } from "@trustless-work/escrow";
import type { GetEscrowsFromIndexerResponse } from "@trustless-work/escrow/types";
import { InvestmentService } from "../services/investment.service";

// Project data from ProjectList - includes tokenFactory addresses
const PROJECT_DATA = [
  {
    escrowId: "CCZHTYVLK6R2QMIFBTEN65ZVCSFBD3L5TXYCZJT5WTXE63ABYXBBCSEB",
    tokenSale: "CC2AGB3AW5IITDIPEZGVX6XT5RTDIVINRZL7F6KZPIHEWN2GRXL5CRCT",
    tokenFactory: "CDJTII2GR2FY6Q4NDJGZI7NW2SHQ7GR5Y2H7B7Q253PTZZAZZ25TFYYU",
  },
  {
    escrowId: "CD775STBXITO4GNNIS7GO3KV6SYMFNBQXW536SWXOPUOO36Z64N3XBFI",
    tokenFactory: "CCEFVY5PCQEO7KSNS52DUXOFXU7PXMQ4GPT25S5ZDYZQPWA74XXY5Y5N",
    tokenSale: "CD64ILP3SXCCY67QIVPCOVUX5Z5Q42CMKU7LK4RNAPCWD5QGBS6G7LPA",
  },
];

export type UserInvestment = {
  escrow: GetEscrowsFromIndexerResponse;
  tokenBalance: string;
  tokenFactory: string;
  tokenSale: string;
  tokenName?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
};

/**
 * Hook to fetch user investments by checking token balances
 * Returns escrows where the user has a token balance > 0
 */
export const useUserInvestments = () => {
  const { walletAddress } = useWalletContext();
  const { getEscrowByContractIds } = useGetEscrowFromIndexerByContractIds();
  const investmentService = new InvestmentService();

  return useQuery<UserInvestment[]>({
    queryKey: ["user-investments", walletAddress],
    queryFn: async () => {
      if (!walletAddress) {
        return [];
      }

      // Get all escrows
      const escrowIds = PROJECT_DATA.map((p) => p.escrowId);
      const escrowsResult = await getEscrowByContractIds({
        contractIds: escrowIds,
        validateOnChain: true,
      });

      // Handle both single object and array responses
      const escrows = Array.isArray(escrowsResult)
        ? escrowsResult
        : escrowsResult
          ? [escrowsResult]
          : [];

      if (!escrows || escrows.length === 0) {
        return [];
      }

      // Check token balances for each escrow
      const investments: UserInvestment[] = [];

      // Process escrows in parallel with Promise.allSettled for better performance
      const balanceChecks = await Promise.allSettled(
        escrows.map(async (escrow) => {
          const projectData = PROJECT_DATA.find(
            (p) => p.escrowId === escrow.contractId,
          );

          if (!projectData?.tokenFactory) {
            return {
              escrow,
              hasBalance: false,
              tokenBalance: "0",
              tokenFactory: "",
              tokenSale: "",
            };
          }

          try {
            // Check token balance and metadata in parallel
            const [balanceResponse, metadataResponse] = await Promise.all([
              investmentService.getTokenBalance({
                tokenFactoryAddress: projectData.tokenFactory,
                address: walletAddress,
              }),
              investmentService.getTokenMetadata({
                tokenFactoryAddress: projectData.tokenFactory,
              }).catch(() => ({
                success: false,
                name: undefined,
                symbol: undefined,
                decimals: 7,
              })),
            ]);

            const balance = balanceResponse.success
              ? parseFloat(balanceResponse.balance || "0")
              : 0;

            const hasBalance = balance > 0;

            return {
              escrow,
              hasBalance,
              tokenBalance: balanceResponse.balance || "0",
              tokenFactory: projectData.tokenFactory,
              tokenSale: projectData.tokenSale,
              tokenName: metadataResponse.success ? metadataResponse.name : undefined,
              tokenSymbol: metadataResponse.success ? metadataResponse.symbol : undefined,
              tokenDecimals: metadataResponse.success ? metadataResponse.decimals : 7,
            };
          } catch (error) {
            // If balance check fails, log but don't throw
            console.warn(
              `Failed to check balance for escrow ${escrow.contractId}:`,
              error,
            );
            return {
              escrow,
              hasBalance: false,
              tokenBalance: "0",
              tokenFactory: projectData.tokenFactory,
              tokenSale: projectData.tokenSale,
              tokenName: undefined,
              tokenSymbol: undefined,
              tokenDecimals: 7,
            };
          }
        }),
      );

      // Filter to only escrows with balance > 0
      balanceChecks.forEach((result) => {
        if (
          result.status === "fulfilled" &&
          result.value.hasBalance &&
          result.value.tokenFactory &&
          result.value.tokenSale
        ) {
          investments.push({
            escrow: result.value.escrow,
            tokenBalance: result.value.tokenBalance,
            tokenFactory: result.value.tokenFactory,
            tokenSale: result.value.tokenSale,
            tokenName: result.value.tokenName,
            tokenSymbol: result.value.tokenSymbol,
            tokenDecimals: result.value.tokenDecimals,
          });
        }
      });

      return investments;
    },
    enabled: Boolean(walletAddress),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};


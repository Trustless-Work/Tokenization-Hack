import { useQuery } from "@tanstack/react-query";
import { useWalletContext } from "@tokenization/tw-blocks-shared/src/wallet-kit/WalletProvider";
import { useGetEscrowFromIndexerByContractIds } from "@trustless-work/escrow";
import type { GetEscrowsFromIndexerResponse } from "@trustless-work/escrow/types";
import { InvestmentService } from "../services/investment.service";

// Project data from ProjectList - includes tokenFactory addresses
const PROJECT_DATA = [
  {
    escrowId: "CBDLIY7HAJ73E6SPAOOKZFCJH3C4H6YBWATWQTON5Z7MY5JRVIIW7LQW",
    tokenSale: "CAL7JK6HOQOW5KU7VKASIZ2RF4GFVQTZJAI7EHCX7VXTAXQ2B27QIEZL",
    tokenFactory: "CDARBSD3OVSVUJWZV4W5HA66QDHY6A3YEH5EQGZPYFGS4DPDYW2UXWX3",
  },
  {
    escrowId: "CC6Y3XYVB4PSPVX4XED2K4GXKPBPS4EAKTZC3BIGEPAE4V2FKMBGEQXY",
    tokenSale: "CBFTQZ3NATN6Y7PKYWGCF7OH6JOFTWUMYAJQDCBPSKGPWWQ7N23RTSNK",
    tokenFactory: "CDARBSD3OVSVUJWZV4W5HA66QDHY6A3YEH5EQGZPYFGS4DPDYW2UXWX3",
  },
  {
    escrowId: "CDB6F6FLFM3VOGNU3FWETULM4QVPWNSJCZQNVQLWU6B4XYVOZVI3YD6X",
    tokenSale: "CA5DPVX6YWUYUASZOQK3WJYDWHYEMRHGCOQGQTDUSDJLB6EQNDRS3FOG",
    tokenFactory: "CDARBSD3OVSVUJWZV4W5HA66QDHY6A3YEH5EQGZPYFGS4DPDYW2UXWX3",
  },
  {
    escrowId: "CDEDNEQEXSUYTAKHT7VS47F2VKSN4PWENXU5U7SXVPEGXLVD3U7LIZI3",
    tokenSale: "CB4XSZUQF2TF7OYOZY55CICXBNAL6RIZOJP7TITFA2PKCSZBHYSSRSNY",
    tokenFactory: "CDARBSD3OVSVUJWZV4W5HA66QDHY6A3YEH5EQGZPYFGS4DPDYW2UXWX3",
  },
  {
    escrowId: "CAO6ZONKBYQGE7E3OIPJTMSE2J2PKNROSXGGC3VQOO7JF2LXY47XG6QV",
    tokenSale: "CDWR6Q4D46V62EW3XUDXM4H2GSDIPUZY7U67OXYEFKPUMCOIDP6VZTP3",
    tokenFactory: "CDARBSD3OVSVUJWZV4W5HA66QDHY6A3YEH5EQGZPYFGS4DPDYW2UXWX3",
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


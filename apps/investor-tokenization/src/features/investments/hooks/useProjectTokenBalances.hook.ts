import { useQuery } from "@tanstack/react-query";
import { useWalletContext } from "@/components/tw-blocks/wallet-kit/WalletProvider";
import { InvestmentService } from "../services/investment.service";

export type ProjectTokenBalanceInfo = {
  escrowId: string;
  tokenFactory: string;
  balance: string;
  tokenName?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
};

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

/**
 * Hook to fetch token balances and metadata for all projects
 * Returns a map of escrowId -> token balance info
 */
export const useProjectTokenBalances = () => {
  const { walletAddress } = useWalletContext();
  const investmentService = new InvestmentService();

  return useQuery<Record<string, ProjectTokenBalanceInfo>>({
    queryKey: ["project-token-balances", walletAddress],
    queryFn: async () => {
      if (!walletAddress) {
        return {};
      }

      // Check token balances and metadata for all projects in parallel
      const balanceChecks = await Promise.allSettled(
        PROJECT_DATA.map(async (project) => {
          try {
            const [balanceResponse, metadataResponse] = await Promise.all([
              investmentService.getTokenBalance({
                tokenFactoryAddress: project.tokenFactory,
                address: walletAddress,
              }),
              investmentService.getTokenMetadata({
                tokenFactoryAddress: project.tokenFactory,
              }).catch(() => ({
                success: false,
                name: undefined,
                symbol: undefined,
                decimals: 7,
              })),
            ]);

            const balance = balanceResponse.success
              ? balanceResponse.balance || "0"
              : "0";

            return {
              escrowId: project.escrowId,
              tokenFactory: project.tokenFactory,
              balance,
              tokenName: metadataResponse.success ? metadataResponse.name : undefined,
              tokenSymbol: metadataResponse.success ? metadataResponse.symbol : undefined,
              tokenDecimals: metadataResponse.success ? metadataResponse.decimals : 7,
            };
          } catch (error) {
            console.warn(
              `Failed to check balance for project ${project.escrowId}:`,
              error,
            );
            return {
              escrowId: project.escrowId,
              tokenFactory: project.tokenFactory,
              balance: "0",
              tokenName: undefined,
              tokenSymbol: undefined,
              tokenDecimals: 7,
            };
          }
        }),
      );

      // Build a map of escrowId -> balance info
      const balancesMap: Record<string, ProjectTokenBalanceInfo> = {};
      balanceChecks.forEach((result) => {
        if (result.status === "fulfilled") {
          balancesMap[result.value.escrowId] = result.value;
        }
      });

      return balancesMap;
    },
    enabled: Boolean(walletAddress),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};


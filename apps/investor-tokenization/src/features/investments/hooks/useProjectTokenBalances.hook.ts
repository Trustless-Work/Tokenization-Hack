import { useQuery } from "@tanstack/react-query";
import { useWalletContext } from "@tokenization/tw-blocks-shared/src/wallet-kit/WalletProvider";
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


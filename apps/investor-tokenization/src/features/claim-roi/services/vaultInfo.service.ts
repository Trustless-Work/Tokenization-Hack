// src/features/claim-roi/services/vaultInfo.service.ts
import { getTokenBalance } from "./getTokenBalance";
import { VAULT_CONFIG } from "../config/vaultConfig";

export async function getVaultInfo(vaultId: string, userAddress: string) {
  const config = VAULT_CONFIG[vaultId];
  if (!config) throw new Error(`Vault not found: ${vaultId}`);

  const { price, tokenAddress, usdcAddress, enabled } = config;

  // 1) Vault USDC balance
  const vaultUsdcBalance = await getTokenBalance(
    usdcAddress,   // USDC token contract
    vaultId,       // vault contract address (C…)
    userAddress    // real user address for simulation
  );

  // 2) User participation token balance
  const userTokenBalance = await getTokenBalance(
    tokenAddress,  // participation token contract
    userAddress,   // user account
    userAddress    // real user address
  );

  // 3) ROI formula
  const claimableRoi =
    userTokenBalance > 0 ? (userTokenBalance * (100 + price)) / 100 : 0;

  return {
    enabled,
    price,
    tokenAddress,
    usdcAddress,
    vaultUsdcBalance,
    userTokenBalance,
    claimableRoi,
  };
}

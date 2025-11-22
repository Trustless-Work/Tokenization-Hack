/**
 * Vault Contract Error Codes
 * These match the ContractError enum in the Rust smart contract
 */
export enum VaultContractError {
  AdminNotFound = 1,
  OnlyAdminCanChangeAvailability = 2,
  ExchangeIsCurrentlyDisabled = 3,
  BeneficiaryHasNoTokensToClaim = 4,
  VaultDoesNotHaveEnoughUSDC = 5,
}

/**
 * Error messages mapping for vault contract errors
 */
const ERROR_MESSAGES: Record<VaultContractError, string> = {
  [VaultContractError.AdminNotFound]: "Admin not found",
  [VaultContractError.OnlyAdminCanChangeAvailability]:
    "Only admin can change availability",
  [VaultContractError.ExchangeIsCurrentlyDisabled]:
    "Exchange is currently disabled",
  [VaultContractError.BeneficiaryHasNoTokensToClaim]:
    "Beneficiary has no tokens to claim",
  [VaultContractError.VaultDoesNotHaveEnoughUSDC]:
    "Vault does not have enough USDC",
};

/**
 * Extracts and maps contract error codes to user-friendly messages
 */
export function extractContractError(error: unknown): {
  message: string;
  details: string;
} {
  const errorString =
    error instanceof Error ? error.message : String(error);

  // Try to extract error code from Soroban error response
  const errorCodeMatch = errorString.match(/Error\(Contract, #(\d+)\)/);

  if (errorCodeMatch) {
    const errorCode = parseInt(errorCodeMatch[1], 10);

    if (errorCode in ERROR_MESSAGES) {
      return {
        message: "Contract Error",
        details: ERROR_MESSAGES[errorCode as VaultContractError],
      };
    }
  }

  // Generic error response if no specific error code found
  return {
    message: "Contract Error",
    details: errorString,
  };
}
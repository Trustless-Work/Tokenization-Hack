use core::fmt;
use soroban_sdk::contracterror;

#[derive(Debug, Copy, Clone, PartialEq)]
#[contracterror]
pub enum ContractError {
    AdminNotFound = 1,
    OnlyAdminCanChangeAvailability = 2,
    ExchangeIsCurrentlyDisabled = 3,
    BeneficiaryHasNoTokensToClaim = 4,
    VaultDoesNotHaveEnoughUSDC = 5,
}

impl fmt::Display for ContractError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ContractError::AdminNotFound => write!(f, "Admin not found"),
            ContractError::OnlyAdminCanChangeAvailability => {
                write!(f, "Only admin can change availability")
            }
            ContractError::ExchangeIsCurrentlyDisabled => {
                write!(f, "Exchange is currently disabled")
            }
            ContractError::BeneficiaryHasNoTokensToClaim => {
                write!(f, "Beneficiary has no tokens to claim")
            }
            ContractError::VaultDoesNotHaveEnoughUSDC => {
                write!(f, "Vault does not have enough USDC")
            }
        }
    }
}
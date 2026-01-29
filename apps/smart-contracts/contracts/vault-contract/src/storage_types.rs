use soroban_sdk::contracttype;

/// Typed storage keys for the vault contract.
/// Using an enum instead of raw strings improves type safety and readability.
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    /// The admin address that can enable/disable the vault
    Admin,
    /// Whether claiming is currently enabled
    Enabled,
    /// The ROI percentage (e.g., 5 means 5% return)
    RoiPercentage,
    /// The participation token contract address
    TokenAddress,
    /// The USDC stablecoin contract address
    UsdcAddress,
    /// Total tokens that have been redeemed through the vault
    TotalTokensRedeemed,
}

use soroban_sdk::{contracttype, Address, Env};

/// Event emitted when a beneficiary successfully claims their ROI.
/// This enables indexers and explorers to track claim activity.
#[contracttype]
#[derive(Clone, Debug)]
pub struct ClaimEvent {
    /// The address that claimed the ROI
    pub beneficiary: Address,
    /// Amount of participation tokens redeemed
    pub tokens_redeemed: i128,
    /// Amount of USDC received (including ROI)
    pub usdc_received: i128,
    /// The ROI percentage at the time of claim
    pub roi_percentage: i128,
}

/// Event emitted when the vault availability is changed by admin.
#[contracttype]
#[derive(Clone, Debug)]
pub struct AvailabilityChangedEvent {
    /// The admin who made the change
    pub admin: Address,
    /// The new enabled status
    pub enabled: bool,
}

/// Helper functions for publishing events
pub mod events {
    use super::*;
    use soroban_sdk::symbol_short;

    /// Publishes a ClaimEvent to the blockchain event log.
    pub fn emit_claim(env: &Env, event: ClaimEvent) {
        env.events()
            .publish((symbol_short!("claim"),), event);
    }

    /// Publishes an AvailabilityChangedEvent to the blockchain event log.
    pub fn emit_availability_changed(env: &Env, event: AvailabilityChangedEvent) {
        env.events()
            .publish((symbol_short!("avail"),), event);
    }
}

#![no_std]

mod error;
mod events;
mod storage_types;
mod vault;

pub use crate::error::ContractError;
pub use crate::events::{AvailabilityChangedEvent, ClaimEvent};
pub use crate::storage_types::DataKey;
pub use crate::vault::{ClaimPreview, VaultContract, VaultOverview};

#[cfg(test)]
mod test;

#![no_std]

mod error;
mod vault;

pub use crate::error::ContractError;
pub use crate::vault::VaultContract;

#[cfg(test)]
mod test;
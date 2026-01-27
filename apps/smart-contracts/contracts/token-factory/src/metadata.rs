use soroban_sdk::{Address, Env, String};
use soroban_token_sdk::{metadata::TokenMetadata, TokenUtils};

use crate::storage_types::DataKey;

// Standard metadata (name, symbol, decimals) via TokenUtils
pub fn read_decimal(e: &Env) -> u32 {
    let util = TokenUtils::new(e);
    util.metadata().get_metadata().decimal
}

pub fn read_name(e: &Env) -> String {
    let util = TokenUtils::new(e);
    util.metadata().get_metadata().name
}

pub fn read_symbol(e: &Env) -> String {
    let util = TokenUtils::new(e);
    util.metadata().get_metadata().symbol
}

pub fn write_metadata(e: &Env, metadata: TokenMetadata) {
    let util = TokenUtils::new(e);
    util.metadata().set_metadata(&metadata);
}

// Immutable metadata (escrow_id, mint_authority) - set only once at initialization
pub fn read_escrow_id(e: &Env) -> String {
    let key = DataKey::EscrowId;
    e.storage()
        .instance()
        .get(&key)
        .expect("Escrow ID not initialized")
}

pub fn write_escrow_id(e: &Env, escrow_id: &String) {
    let key = DataKey::EscrowId;
    // Check if already set (immutable - can only be set once)
    if e.storage().instance().has(&key) {
        panic!("Escrow ID already set - cannot modify");
    }
    e.storage().instance().set(&key, escrow_id);
}

pub fn read_mint_authority(e: &Env) -> Address {
    let key = DataKey::MintAuthority;
    e.storage()
        .instance()
        .get(&key)
        .expect("Mint authority not initialized")
}

pub fn write_mint_authority(e: &Env, mint_authority: &Address) {
    let key = DataKey::MintAuthority;
    // Check if already set (immutable - can only be set once)
    if e.storage().instance().has(&key) {
        panic!("Mint authority already set - cannot modify");
    }
    e.storage().instance().set(&key, mint_authority);
}
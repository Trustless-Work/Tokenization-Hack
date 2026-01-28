//! T-REX-aligned Soroban Fungible Token implementation.
//! This contract implements the standard Soroban token interface with immutable
//! metadata including escrow_id and mint_authority set at initialization.
use crate::allowance::{read_allowance, spend_allowance, write_allowance};
use crate::balance::{read_balance, receive_balance, spend_balance};
use crate::metadata::{
    read_decimal, read_escrow_id, read_mint_authority, read_name, read_symbol,
    write_escrow_id, write_mint_authority, write_metadata,
};
use crate::storage_types::{INSTANCE_BUMP_AMOUNT, INSTANCE_LIFETIME_THRESHOLD};
use soroban_sdk::{
    contract, contractimpl, token::TokenInterface, Address, Env, MuxedAddress, String,
};
use soroban_token_sdk::events;
use soroban_token_sdk::metadata::TokenMetadata;

fn check_nonnegative_amount(amount: i128) {
    if amount < 0 {
        panic!("negative amount is not allowed: {}", amount)
    }
}

#[contract]
pub struct Token;

#[contractimpl]
impl Token {
    /// Initialize the token with immutable metadata.
    /// This function is called during contract deployment (constructor).
    /// All metadata is immutable after initialization.
    ///
    /// # Arguments
    /// * `name` - Token name
    /// * `symbol` - Token symbol
    /// * `escrow_id` - Escrow contract ID (as String)
    /// * `decimal` - Token decimals (default: 7, max: 18)
    /// * `mint_authority` - Address authorized to mint tokens (Token Sale contract)
    pub fn __constructor(
        e: Env,
        name: String,
        symbol: String,
        escrow_id: String,
        decimal: u32,
        mint_authority: Address,
    ) {
        if decimal > 18 {
            panic!("Decimal must not be greater than 18");
        }

        // Write standard metadata (name, symbol, decimals)
        write_metadata(
            &e,
            TokenMetadata {
                decimal,
                name: name.clone(),
                symbol: symbol.clone(),
            },
        );

        // Write immutable metadata (escrow_id, mint_authority)
        // These functions will panic if called twice (immutability enforced)
        write_escrow_id(&e, &escrow_id);
        write_mint_authority(&e, &mint_authority);
    }

    /// Mint new tokens. Only the mint_authority (Token Sale contract) can mint.
    /// This function enforces that only the mint_authority set at initialization can mint.
    pub fn mint(e: Env, to: Address, amount: i128) {
        check_nonnegative_amount(amount);

        // CRITICAL: Only mint_authority can mint (never deployer, never open mint)
        let mint_authority = read_mint_authority(&e);
        mint_authority.require_auth();

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        receive_balance(&e, to.clone(), amount);
        events::MintWithAmountOnly { to, amount }.publish(&e);
    }
}

#[contractimpl]
impl TokenInterface for Token {
    fn allowance(e: Env, from: Address, spender: Address) -> i128 {
        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        read_allowance(&e, from, spender).amount
    }

    fn approve(e: Env, from: Address, spender: Address, amount: i128, expiration_ledger: u32) {
        from.require_auth();

        check_nonnegative_amount(amount);

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        write_allowance(&e, from.clone(), spender.clone(), amount, expiration_ledger);
        events::Approve {
            from,
            spender,
            amount,
            expiration_ledger,
        }
        .publish(&e);
    }

    fn balance(e: Env, id: Address) -> i128 {
        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        read_balance(&e, id)
    }

    fn transfer(e: Env, from: Address, to_muxed: MuxedAddress, amount: i128) {
        from.require_auth();

        check_nonnegative_amount(amount);

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        spend_balance(&e, from.clone(), amount);
        let to: Address = to_muxed.address();
        receive_balance(&e, to.clone(), amount);
        events::Transfer {
            from,
            to,
            to_muxed_id: to_muxed.id(),
            amount,
        }
        .publish(&e);
    }

    fn transfer_from(e: Env, spender: Address, from: Address, to: Address, amount: i128) {
        spender.require_auth();

        check_nonnegative_amount(amount);

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        spend_allowance(&e, from.clone(), spender, amount);
        spend_balance(&e, from.clone(), amount);
        receive_balance(&e, to.clone(), amount);
        events::Transfer {
            from,
            to,
            // `transfer_from` does not support muxed destination.
            to_muxed_id: None,
            amount,
        }
        .publish(&e);
    }

    fn burn(e: Env, from: Address, amount: i128) {
        from.require_auth();

        check_nonnegative_amount(amount);

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        spend_balance(&e, from.clone(), amount);
        events::Burn { from, amount }.publish(&e);
    }

    fn burn_from(e: Env, spender: Address, from: Address, amount: i128) {
        spender.require_auth();

        check_nonnegative_amount(amount);

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        spend_allowance(&e, from.clone(), spender, amount);
        spend_balance(&e, from.clone(), amount);
        events::Burn { from, amount }.publish(&e);
    }

    fn decimals(e: Env) -> u32 {
        read_decimal(&e)
    }

    fn name(e: Env) -> String {
        read_name(&e)
    }

    fn symbol(e: Env) -> String {
        read_symbol(&e)
    }
}

// Additional getters for T-REX-aligned metadata
#[contractimpl]
impl Token {
    /// Get the escrow contract ID associated with this token.
    /// This is immutable metadata set at initialization.
    pub fn escrow_id(e: Env) -> String {
        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        read_escrow_id(&e)
    }
}
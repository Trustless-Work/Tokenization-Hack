#![cfg(test)]
extern crate std;

use crate::error::ContractError;
use crate::vault::{VaultContract, VaultContractClient};
use soroban_sdk::{testutils::Address as _, testutils::Events as _, token, Address, Env, String};
use soroban_token_contract::{Token as FactoryToken, TokenClient as FactoryTokenClient};
use token::Client as TokenClient;
use token::StellarAssetClient as TokenAdminClient;

fn create_usdc_token<'a>(e: &Env, admin: &Address) -> (TokenClient<'a>, TokenAdminClient<'a>) {
    let sac = e.register_stellar_asset_contract_v2(admin.clone());
    (
        TokenClient::new(e, &sac.address()),
        TokenAdminClient::new(e, &sac.address()),
    )
}

fn create_token_factory<'a>(e: &Env, admin: &Address) -> FactoryTokenClient<'a> {
    let token_contract = e.register(
        FactoryToken,
        (
            admin,
            7_u32,
            String::from_str(e, "TestToken"),
            String::from_str(e, "TST"),
        ),
    );
    FactoryTokenClient::new(e, &token_contract)
}

fn create_vault<'a>(
    e: &Env,
    admin: &Address,
    enabled: bool,
    roi_percentage: i128,
    token: &Address,
    usdc: &Address,
) -> VaultContractClient<'a> {
    let contract_id = e.register(
        VaultContract,
        (
            admin.clone(),
            enabled,
            roi_percentage,
            token.clone(),
            usdc.clone(),
        ),
    );
    VaultContractClient::new(e, &contract_id)
}

// ============ Original Tests (Updated) ============

#[test]
fn test_vault_deployment_and_availability() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (usdc_client, _usdc_admin) = create_usdc_token(&env, &admin);

    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, false, 10, &token.address, &usdc_client.address);

    vault.availability_for_exchange(&admin, &true);

    vault.availability_for_exchange(&admin, &false);
}

#[test]
fn test_claim_success() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);

    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 2, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &100);

    // roi_percentage = 2 means 2% premium -> rate = 1.02
    // 100 tokens * 1.02 = 102 USDC
    usdc_admin.mint(&vault.address, &300);

    assert_eq!(token.balance(&beneficiary), 100);
    assert_eq!(usdc_client.balance(&beneficiary), 0);
    assert_eq!(usdc_client.balance(&vault.address), 300);

    vault.claim(&beneficiary);

    assert_eq!(token.balance(&beneficiary), 0);
    assert_eq!(token.balance(&vault.address), 100);
    assert_eq!(usdc_client.balance(&beneficiary), 102);
    assert_eq!(usdc_client.balance(&vault.address), 198);
}

#[test]
fn test_claim_when_disabled() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, _usdc_admin) = create_usdc_token(&env, &admin);

    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, false, 10, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &100);

    let result = vault.try_claim(&beneficiary);
    assert_eq!(result, Err(Ok(ContractError::ExchangeIsCurrentlyDisabled)));
}

#[test]
fn test_claim_insufficient_vault_balance() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);

    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 5, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &100);

    // roi_percentage = 5 means 5% premium -> rate = 1.05
    // 100 tokens * 1.05 = 105 USDC, but vault only has 100
    usdc_admin.mint(&vault.address, &100);

    let result = vault.try_claim(&beneficiary);
    assert_eq!(result, Err(Ok(ContractError::VaultDoesNotHaveEnoughUSDC)));
}

#[test]
fn test_claim_no_tokens() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, _usdc_admin) = create_usdc_token(&env, &admin);

    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 10, &token.address, &usdc_client.address);

    let result = vault.try_claim(&beneficiary);
    assert_eq!(result, Err(Ok(ContractError::BeneficiaryHasNoTokensToClaim)));
}

#[test]
fn test_claim_with_6_percent_premium() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);

    let token = create_token_factory(&env, &token_admin);

    // roi_percentage = 6 means 6% premium -> rate = 1.06
    let vault = create_vault(&env, &admin, true, 6, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &100);

    // 100 tokens * 1.06 = 106 USDC
    usdc_admin.mint(&vault.address, &200);

    vault.claim(&beneficiary);

    assert_eq!(token.balance(&beneficiary), 0);
    assert_eq!(token.balance(&vault.address), 100);
    assert_eq!(usdc_client.balance(&beneficiary), 106);
    assert_eq!(usdc_client.balance(&vault.address), 94);
}

// ============ New Getter Function Tests ============

#[test]
fn test_get_admin() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (usdc_client, _usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 10, &token.address, &usdc_client.address);

    assert_eq!(vault.get_admin(), admin);
}

#[test]
fn test_is_enabled() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (usdc_client, _usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    // Test with enabled = false
    let vault_disabled = create_vault(&env, &admin, false, 10, &token.address, &usdc_client.address);
    assert_eq!(vault_disabled.is_enabled(), false);

    // Test with enabled = true
    let vault_enabled = create_vault(&env, &admin, true, 10, &token.address, &usdc_client.address);
    assert_eq!(vault_enabled.is_enabled(), true);

    // Test toggling
    vault_disabled.availability_for_exchange(&admin, &true);
    assert_eq!(vault_disabled.is_enabled(), true);
}

#[test]
fn test_get_roi_percentage() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (usdc_client, _usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 15, &token.address, &usdc_client.address);

    assert_eq!(vault.get_roi_percentage(), 15);
}

#[test]
fn test_get_token_address() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (usdc_client, _usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 10, &token.address, &usdc_client.address);

    assert_eq!(vault.get_token_address(), token.address);
}

#[test]
fn test_get_usdc_address() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (usdc_client, _usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 10, &token.address, &usdc_client.address);

    assert_eq!(vault.get_usdc_address(), usdc_client.address);
}

#[test]
fn test_get_vault_usdc_balance() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 10, &token.address, &usdc_client.address);

    // Initially zero
    assert_eq!(vault.get_vault_usdc_balance(), 0);

    // After minting
    usdc_admin.mint(&vault.address, &500);
    assert_eq!(vault.get_vault_usdc_balance(), 500);
}

#[test]
fn test_get_total_tokens_redeemed() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary1 = Address::generate(&env);
    let beneficiary2 = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 5, &token.address, &usdc_client.address);

    // Initially zero
    assert_eq!(vault.get_total_tokens_redeemed(), 0);

    // Mint tokens and USDC
    token.mint(&beneficiary1, &100);
    token.mint(&beneficiary2, &200);
    usdc_admin.mint(&vault.address, &1000);

    // First claim
    vault.claim(&beneficiary1);
    assert_eq!(vault.get_total_tokens_redeemed(), 100);

    // Second claim
    vault.claim(&beneficiary2);
    assert_eq!(vault.get_total_tokens_redeemed(), 300);
}

// ============ Preview Function Tests ============

#[test]
fn test_preview_claim_basic() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    // 10% ROI
    let vault = create_vault(&env, &admin, true, 10, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &100);
    usdc_admin.mint(&vault.address, &500);

    let preview = vault.preview_claim(&beneficiary);

    assert_eq!(preview.token_balance, 100);
    assert_eq!(preview.usdc_amount, 110); // 100 * 1.10 = 110
    assert_eq!(preview.roi_amount, 10); // 110 - 100 = 10
    assert_eq!(preview.vault_has_sufficient_balance, true);
    assert_eq!(preview.claim_enabled, true);
}

#[test]
fn test_preview_claim_insufficient_balance() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    // 50% ROI
    let vault = create_vault(&env, &admin, true, 50, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &100);
    usdc_admin.mint(&vault.address, &100); // Only 100 USDC, but needs 150

    let preview = vault.preview_claim(&beneficiary);

    assert_eq!(preview.token_balance, 100);
    assert_eq!(preview.usdc_amount, 150); // 100 * 1.50 = 150
    assert_eq!(preview.roi_amount, 50);
    assert_eq!(preview.vault_has_sufficient_balance, false); // Not enough!
    assert_eq!(preview.claim_enabled, true);
}

#[test]
fn test_preview_claim_disabled_vault() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    // Vault is disabled
    let vault = create_vault(&env, &admin, false, 10, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &100);
    usdc_admin.mint(&vault.address, &500);

    let preview = vault.preview_claim(&beneficiary);

    assert_eq!(preview.token_balance, 100);
    assert_eq!(preview.usdc_amount, 110);
    assert_eq!(preview.claim_enabled, false); // Disabled!
}

#[test]
fn test_preview_claim_zero_tokens() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, _usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 10, &token.address, &usdc_client.address);

    // Beneficiary has no tokens
    let preview = vault.preview_claim(&beneficiary);

    assert_eq!(preview.token_balance, 0);
    assert_eq!(preview.usdc_amount, 0);
    assert_eq!(preview.roi_amount, 0);
}

// ============ Vault Overview Tests ============

#[test]
fn test_get_vault_overview() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 25, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &100);
    usdc_admin.mint(&vault.address, &1000);

    let overview = vault.get_vault_overview();

    assert_eq!(overview.admin, admin);
    assert_eq!(overview.enabled, true);
    assert_eq!(overview.roi_percentage, 25);
    assert_eq!(overview.token_address, token.address);
    assert_eq!(overview.usdc_address, usdc_client.address);
    assert_eq!(overview.vault_usdc_balance, 1000);
    assert_eq!(overview.total_tokens_redeemed, 0);
}

#[test]
fn test_vault_overview_after_claim() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 10, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &100);
    usdc_admin.mint(&vault.address, &500);

    // Claim: 100 tokens -> 110 USDC
    vault.claim(&beneficiary);

    let overview = vault.get_vault_overview();

    assert_eq!(overview.vault_usdc_balance, 390); // 500 - 110 = 390
    assert_eq!(overview.total_tokens_redeemed, 100);
}

// ============ Event Emission Tests ============

#[test]
fn test_claim_emits_event() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 5, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &100);
    usdc_admin.mint(&vault.address, &200);

    vault.claim(&beneficiary);

    // Verify event was emitted
    let events = env.events().all();
    assert!(!events.is_empty(), "Expected claim event to be emitted");
}

#[test]
fn test_availability_change_emits_event() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (usdc_client, _usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, false, 10, &token.address, &usdc_client.address);

    vault.availability_for_exchange(&admin, &true);

    // Verify event was emitted
    let events = env.events().all();
    assert!(
        !events.is_empty(),
        "Expected availability changed event to be emitted"
    );
}

// ============ Edge Case Tests ============

#[test]
fn test_multiple_claims_different_beneficiaries() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary1 = Address::generate(&env);
    let beneficiary2 = Address::generate(&env);
    let beneficiary3 = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 10, &token.address, &usdc_client.address);

    // Mint different amounts
    token.mint(&beneficiary1, &100);
    token.mint(&beneficiary2, &200);
    token.mint(&beneficiary3, &50);
    usdc_admin.mint(&vault.address, &1000);

    // Claims
    vault.claim(&beneficiary1); // 110 USDC
    vault.claim(&beneficiary2); // 220 USDC
    vault.claim(&beneficiary3); // 55 USDC

    assert_eq!(usdc_client.balance(&beneficiary1), 110);
    assert_eq!(usdc_client.balance(&beneficiary2), 220);
    assert_eq!(usdc_client.balance(&beneficiary3), 55);
    assert_eq!(vault.get_total_tokens_redeemed(), 350);
    assert_eq!(vault.get_vault_usdc_balance(), 615); // 1000 - 385 = 615
}

#[test]
fn test_high_roi_percentage() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    // 100% ROI (doubling)
    let vault = create_vault(&env, &admin, true, 100, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &100);
    usdc_admin.mint(&vault.address, &500);

    let preview = vault.preview_claim(&beneficiary);
    assert_eq!(preview.usdc_amount, 200); // 100 * 2.0 = 200
    assert_eq!(preview.roi_amount, 100);

    vault.claim(&beneficiary);
    assert_eq!(usdc_client.balance(&beneficiary), 200);
}

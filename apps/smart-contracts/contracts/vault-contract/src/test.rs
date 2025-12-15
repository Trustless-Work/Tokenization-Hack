#![cfg(test)]
extern crate std;

use crate::error::ContractError;
use crate::vault::{VaultContract, VaultContractClient};
use soroban_sdk::{testutils::Address as _, token, Address, Env, String};
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
    price: i128,
    token: &Address,
    usdc: &Address,
) -> VaultContractClient<'a> {
    let contract_id = e.register(
        VaultContract,
        (admin.clone(), enabled, price, token.clone(), usdc.clone()),
    );
    VaultContractClient::new(e, &contract_id)
}

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

    // price = 2 means 2% premium -> rate = 1.02
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

    // price = 5 means 5% premium -> rate = 1.05
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

    // price = 6 means 6% premium -> rate = 1.06
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